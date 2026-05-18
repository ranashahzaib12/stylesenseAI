from __future__ import annotations

import base64
import io
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Literal

import modal
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
APP_NAME   = "stylesense-tryon"
OOTD_REPO  = "levihsu/OOTDiffusion"
CACHE_DIR  = Path("/cache")
OOTD_PATH  = CACHE_DIR / "OOTDiffusion"   # model weights + copied code (volume)
OOTD_CODE  = Path("/opt/OOTDiffusion")    # cloned repo code (image layer)

# ---------------------------------------------------------------------------
# Modal image — OOTDiffusion stack
# ---------------------------------------------------------------------------
app          = modal.App(APP_NAME)
cache_volume = modal.Volume.from_name("stylesense-ootd-cache", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "git", "libgl1-mesa-glx", "libglib2.0-0",
        "libsm6", "libxext6", "libxrender-dev",
    )
    .run_commands(
        "pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cu118",
        "pip install onnxruntime==1.16.2",
        "git clone https://github.com/levihsu/OOTDiffusion.git /opt/OOTDiffusion",
        "pip install -r /opt/OOTDiffusion/requirements.txt 2>/dev/null || true",
    )
    .pip_install(
        "accelerate==0.25.0",
        "diffusers==0.25.0",
        "einops==0.7.0",
        "fastapi==0.115.6",
        "huggingface-hub==0.21.3",
        "numpy==1.26.4",
        "opencv-python-headless==4.10.0.84",
        "pillow==10.4.0",
        "pydantic==2.10.3",
        "python-multipart==0.0.20",
        "scipy==1.11.1",
        "transformers==4.36.2",
        "uvicorn==0.34.0",
    )
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class TryOnRequest(BaseModel):
    personBase64:  str = Field(..., min_length=1)
    garmentBase64: str = Field(..., min_length=1)
    category: Literal["upper_body", "lower_body", "dresses"] = "upper_body"
    seed: int = 42
    numInferenceSteps: int = Field(default=40, ge=10, le=40)
    imageScale: float = Field(default=2.5, ge=0.5, le=3.0)
    enableRefinement: bool = True  # post-process via SD+ControlNet for sharper material/buttons


class DetectCategoryRequest(BaseModel):
    garmentBase64: str = Field(..., min_length=1)


class TryOnResponse(BaseModel):
    imageBase64: str
    message: str = "ok"


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------
def _decode_data_url(value: str) -> Image.Image:
    raw = str(value or "").strip()
    if not raw:
        raise ValueError("missing image payload")
    if raw.startswith("data:") and "," in raw:
        raw = raw.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(raw))).convert("RGB")


def _encode_data_url(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


# ---------------------------------------------------------------------------
# Volume helpers
# ---------------------------------------------------------------------------
def _is_real_file(path: Path) -> bool:
    """True only for an accessible, non-empty file (follows symlinks)."""
    try:
        return path.is_file() and path.stat().st_size > 0
    except OSError:
        return False


def _remove_dangling_symlinks(directory: Path) -> int:
    """Recursively remove dangling symlinks. Returns count removed."""
    if not directory.is_dir():
        return 0
    removed = 0
    try:
        for child in list(directory.iterdir()):
            if child.is_symlink() and not child.exists():
                child.unlink()
                removed += 1
            elif child.is_dir() and not child.is_symlink():
                removed += _remove_dangling_symlinks(child)
    except Exception:
        pass
    return removed


# ---------------------------------------------------------------------------
# OOTDiffusion setup
# ---------------------------------------------------------------------------
def _patch_diffusers() -> None:
    """Inject CaptionProjection into diffusers.models.embeddings if absent."""
    import diffusers.models.embeddings as _emb
    if hasattr(_emb, "CaptionProjection"):
        return

    import torch.nn as nn

    class CaptionProjection(nn.Module):
        def __init__(self, in_features: int, hidden_size: int, num_tokens: int = 120):
            super().__init__()
            self.linear_1 = nn.Linear(in_features, hidden_size, bias=True)
            self.act = nn.GELU(approximate="tanh")
            self.linear_2 = nn.Linear(hidden_size, hidden_size, bias=True)

        def forward(self, caption, seq_len=None, mask=None):
            x = self.linear_1(caption)
            x = self.act(x)
            x = self.linear_2(x)
            return x

    _emb.CaptionProjection = CaptionProjection


def _find_ootd_checkpoint_dir(checkpoint_root: Path) -> Path | None:
    if not checkpoint_root.exists():
        return None
    preferred = checkpoint_root / "ootd_hd" / "checkpoint-36000"
    if (preferred / "unet_garm").exists() or (preferred / "unet_vton").exists():
        return preferred
    fallback = checkpoint_root / "checkpoint-36000"
    if (fallback / "unet_garm").exists() or (fallback / "unet_vton").exists():
        return fallback
    for unet_dir in checkpoint_root.rglob("unet_garm"):
        if (unet_dir / "config.json").exists():
            return unet_dir.parent
    for unet_dir in checkpoint_root.rglob("unet_vton"):
        if (unet_dir / "config.json").exists():
            return unet_dir.parent
    if (checkpoint_root / "config.json").exists():
        return checkpoint_root
    return None


def _patch_inference_checkpoint_paths() -> None:
    target = OOTD_PATH / "ootd" / "inference_ootd_hd.py"
    if not target.exists():
        return
    checkpoint_root = OOTD_PATH / "checkpoints" / "ootd"
    checkpoint_dir = _find_ootd_checkpoint_dir(checkpoint_root)
    if not checkpoint_dir:
        return

    vit_path = None
    for candidate in [
        OOTD_PATH / "checkpoints" / "clip-vit-large-patch14",
        OOTD_CODE / "checkpoints" / "clip-vit-large-patch14",
    ]:
        if candidate.is_dir() and any(candidate.iterdir()):
            vit_path = candidate
            break

    original = target.read_text(encoding="utf-8")
    updated = original
    replacements = {
        "VAE_PATH": str(checkpoint_root),
        "UNET_PATH": str(checkpoint_dir),
        "MODEL_PATH": str(checkpoint_root),
        "VIT_PATH": str(vit_path) if vit_path else "openai/clip-vit-large-patch14",
    }
    for name, value in replacements.items():
        updated = re.sub(rf"^{name}\s*=.*$", f'{name} = "{value}"', updated, flags=re.M)
    if updated != original:
        target.write_text(updated, encoding="utf-8")
        cache_volume.commit()


def _set_sys_path_order(preferred: list[str]) -> None:
    for p in preferred:
        while p in sys.path:
            sys.path.remove(p)
    sys.path[:0] = preferred


def _purge_modules(prefixes: list[str]) -> None:
    for name in list(sys.modules):
        if any(name == prefix or name.startswith(prefix + ".") for prefix in prefixes):
            sys.modules.pop(name, None)


def _snapshot_download_real(patterns: list[str], repo_id: str = OOTD_REPO, local_dir: str | None = None) -> None:
    """Download files as actual copies (not symlinks) into OOTD_PATH (or local_dir)."""
    from huggingface_hub import snapshot_download
    dest = local_dir or str(OOTD_PATH)
    Path(dest).mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=repo_id,
        local_dir=dest,
        local_dir_use_symlinks=False,
        allow_patterns=patterns,
    )


def _setup_ootd() -> None:
    """Ensure all OOTDiffusion weights and source code are in the volume."""
    import shutil as _shutil

    _patch_diffusers()
    cache_volume.reload()

    dangling = _remove_dangling_symlinks(OOTD_PATH)
    if dangling:
        cache_volume.commit()
        cache_volume.reload()

    needs_commit = False

    if not _is_real_file(OOTD_PATH / "checkpoints" / "humanparsing" / "parsing_atr.onnx"):
        _snapshot_download_real([
            "checkpoints/humanparsing/**",
            "checkpoints/openpose/**",
        ])
        needs_commit = True

    unet_dir = OOTD_PATH / "checkpoints" / "ootd"
    unet_ok = any(
        _is_real_file(p)
        for p in unet_dir.rglob("*.safetensors")
    ) if unet_dir.is_dir() else False
    if not unet_ok:
        _snapshot_download_real(["checkpoints/ootd/**"])
        needs_commit = True

    vit_local = OOTD_PATH / "checkpoints" / "clip-vit-large-patch14"
    if not vit_local.is_dir() or not any(vit_local.iterdir()):
        _snapshot_download_real(["checkpoints/clip-vit-large-patch14/**"])
        if not vit_local.is_dir() or not any(vit_local.iterdir()):
            _snapshot_download_real(
                ["*.json", "*.txt", "*.safetensors", "*.bin", "*.model"],
                repo_id="openai/clip-vit-large-patch14",
                local_dir=str(vit_local),
            )
        needs_commit = True

    if needs_commit:
        cache_volume.commit()
        needs_commit = False

    for src_name in ["preprocess", "ootd"]:
        dst = OOTD_PATH / src_name
        if not dst.exists():
            _shutil.copytree(str(OOTD_CODE / src_name), str(dst))
            needs_commit = True

    if needs_commit:
        cache_volume.commit()

    _patch_inference_checkpoint_paths()

    _set_sys_path_order([
        str(OOTD_PATH),
        str(OOTD_CODE),
        str(OOTD_CODE / "run"),
    ])


# ---------------------------------------------------------------------------
# Garment cleaning
# ---------------------------------------------------------------------------
def _clean_garment(garment: Image.Image) -> Image.Image:
    """If garment shows a person, extract only the clothing region."""
    import numpy as np
    import cv2
    import onnxruntime as ort

    onnx_path = None
    for candidate in [
        OOTD_PATH / "checkpoints" / "humanparsing" / "parsing_atr.onnx",
        OOTD_CODE / "checkpoints" / "humanparsing" / "parsing_atr.onnx",
    ]:
        if _is_real_file(candidate):
            onnx_path = str(candidate)
            break
    if not onnx_path:
        return garment

    try:
        sess = ort.InferenceSession(onnx_path, providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
        img = garment.convert("RGB").resize((384, 512), Image.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = (arr - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        inp = arr.transpose(2, 0, 1)[np.newaxis].astype(np.float32)
        parse = sess.run(None, {sess.get_inputs()[0].name: inp})[0][0].argmax(0)

        PERSON = {2, 11, 12, 13, 14, 15}
        person_frac = sum((parse == c).sum() for c in PERSON) / parse.size
        if person_frac < 0.08:
            return garment

        CLOTHING = {4, 5, 6, 7, 8, 9, 10, 16, 17}
        cloth_mask = np.zeros_like(parse, dtype=np.uint8)
        for cid in CLOTHING:
            cloth_mask |= (parse == cid).astype(np.uint8)
        cloth_mask = cv2.dilate(cloth_mask, np.ones((5, 5), np.uint8), iterations=3)

        gw, gh = garment.size
        mask_pil = Image.fromarray(cloth_mask * 255, "L").resize((gw, gh), Image.BILINEAR)
        white = Image.new("RGB", (gw, gh), (255, 255, 255))
        white.paste(garment.convert("RGB"), mask=mask_pil)
        return white
    except Exception:
        return garment


# ---------------------------------------------------------------------------
# Module-level singletons — loaded once per container, reused across requests
# ---------------------------------------------------------------------------
_models: dict = {}
_person_cache: dict = {}
_PERSON_CACHE_MAX = 8


def _get_models() -> dict:
    """Load all inference models once and cache them for the container lifetime."""
    if _models:
        return _models

    _setup_ootd()
    _purge_modules(["preprocess", "ootd", "pipelines_ootd", "utils_ootd"])

    from preprocess.humanparsing.run_parsing import Parsing   # type: ignore
    from preprocess.openpose.run_openpose import OpenPose     # type: ignore
    from utils_ootd import get_mask_location                  # type: ignore
    from ootd.inference_ootd_hd import OOTDiffusionHD         # type: ignore

    _models["parsing"]           = Parsing(gpu_id=0)
    _models["openpose"]          = OpenPose(gpu_id=0)
    _models["ootd"]              = OOTDiffusionHD(gpu_id=0)
    _models["get_mask_location"] = get_mask_location
    return _models


# ---------------------------------------------------------------------------
# Refinement pass — SD 1.5 + ControlNet-canny img2img
# ---------------------------------------------------------------------------
_REFINER_CACHE: dict = {}

_REFINE_PROMPTS = {
    "upper_body": "clean studio photograph of a person wearing a crisp wrinkle-free cotton dress shirt, sharp button placket with evenly-spaced buttons, fine matte cotton weave, smooth flat fabric, accurate buttoned collar, professional product photography, sharp focus, high detail",
    "lower_body": "clean studio photograph of a person wearing flat smooth cotton pants, matte fabric, crisp seam detail, accurate stitching, professional product photography, sharp focus, high detail",
    "dresses":    "clean studio photograph of a person wearing a smooth flat cotton dress, matte fabric, crisp seam detail, accurate hem, professional product photography, sharp focus, high detail",
}
_REFINE_NEGATIVE = (
    "satin, silk, glossy, shiny, sheen, lustrous, plastic, wet look, "
    "wrinkles, creases, folds, crumpled, rumpled, "
    "oversaturated, overexposed, blurry, soft focus, low quality, "
    "distorted, deformed, melted, smudged, "
    "extra buttons, missing buttons, double collar, open collar, deep V-neck, asymmetric collar"
)


def _get_refiner():
    """Lazy-load SD 1.5 + ControlNet-canny img2img pipeline."""
    if _REFINER_CACHE.get("pipe") is not None:
        return _REFINER_CACHE["pipe"]

    import torch
    from diffusers import (
        StableDiffusionControlNetImg2ImgPipeline,
        ControlNetModel,
        DPMSolverMultistepScheduler,
    )
    from huggingface_hub import snapshot_download

    sd_dir   = OOTD_PATH / "checkpoints" / "stable-diffusion-v1-5"
    cnet_dir = OOTD_PATH / "checkpoints" / "control_v11p_sd15_canny"

    if not sd_dir.is_dir() or not any(sd_dir.glob("**/*.safetensors")):
        snapshot_download(
            repo_id="runwayml/stable-diffusion-v1-5",
            local_dir=str(sd_dir),
            local_dir_use_symlinks=False,
            allow_patterns=["*.json", "*.txt", "tokenizer/**", "feature_extractor/**",
                            "scheduler/**", "text_encoder/*.safetensors",
                            "unet/*.safetensors", "vae/*.safetensors"],
        )
        cache_volume.commit()

    if not cnet_dir.is_dir() or not any(cnet_dir.glob("*.safetensors")):
        snapshot_download(
            repo_id="lllyasviel/control_v11p_sd15_canny",
            local_dir=str(cnet_dir),
            local_dir_use_symlinks=False,
            allow_patterns=["*.json", "*.safetensors"],
        )
        cache_volume.commit()

    controlnet = ControlNetModel.from_pretrained(str(cnet_dir), torch_dtype=torch.float16)
    pipe = StableDiffusionControlNetImg2ImgPipeline.from_pretrained(
        str(sd_dir),
        controlnet=controlnet,
        torch_dtype=torch.float16,
        safety_checker=None,
        requires_safety_checker=False,
    ).to("cuda")
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    pipe.set_progress_bar_config(disable=True)
    _REFINER_CACHE["pipe"] = pipe
    return pipe


def _refine_garment_region(
    result_img: Image.Image,
    garment_mask: Image.Image,
    category: str,
    seed: int,
) -> Image.Image:
    """Run SD+ControlNet img2img on result, composite back through mask."""
    import cv2
    import numpy as np
    import torch

    pipe = _get_refiner()

    arr  = np.array(result_img.convert("RGB"))
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    canny_pil = Image.fromarray(np.stack([edges]*3, axis=-1))

    prompt = _REFINE_PROMPTS.get(category, _REFINE_PROMPTS["upper_body"])
    generator = torch.Generator("cuda").manual_seed(int(seed))

    refined = pipe(
        prompt=prompt,
        negative_prompt=_REFINE_NEGATIVE,
        image=result_img,
        control_image=canny_pil,
        strength=0.45,
        guidance_scale=8.0,
        controlnet_conditioning_scale=0.75,
        num_inference_steps=25,
        generator=generator,
    ).images[0]

    mask_arr = np.array(garment_mask.convert("L"))
    mask_arr = cv2.GaussianBlur(mask_arr, (21, 21), 0)
    soft_mask = Image.fromarray(mask_arr, "L")

    return Image.composite(refined, result_img, soft_mask)


# ---------------------------------------------------------------------------
# Core inference
# ---------------------------------------------------------------------------
def _fit_to_canvas(img: Image.Image, w: int = 768, h: int = 1024) -> Image.Image:
    """Scale-to-cover then center-crop to (w, h)."""
    src_w, src_h = img.size
    scale = max(w / src_w, h / src_h)
    new_w = round(src_w * scale)
    new_h = round(src_h * scale)
    img = img.convert("RGB").resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - w) // 2
    top = (new_h - h) // 2
    return img.crop((left, top, left + w, top + h))


def _run_inference(request: TryOnRequest) -> str:
    import hashlib
    import numpy as np

    m = _get_models()
    parsing_model     = m["parsing"]
    openpose_model    = m["openpose"]
    ootd              = m["ootd"]
    get_mask_location = m["get_mask_location"]

    person_img  = _fit_to_canvas(_decode_data_url(request.personBase64))
    garment_img = _fit_to_canvas(_clean_garment(_decode_data_url(request.garmentBase64)))

    person_hash = hashlib.sha256(request.personBase64[:4096].encode()).hexdigest()[:16]
    if person_hash in _person_cache:
        cached = _person_cache[person_hash]
        model_parse = cached["parse"]
        keypoints   = cached["keypoints"]
    else:
        person_small = person_img.resize((384, 512))
        try:
            keypoints = openpose_model(np.array(person_small))
        except (ValueError, Exception):
            keypoints = {"pose_keypoints_2d": [0.0] * 36}
        model_parse, _ = parsing_model(person_small)

        if len(_person_cache) >= _PERSON_CACHE_MAX:
            _person_cache.pop(next(iter(_person_cache)))
        _person_cache[person_hash] = {"parse": model_parse, "keypoints": keypoints}

    mask, mask_gray = get_mask_location("hd", request.category, model_parse, keypoints)
    mask      = mask.resize((768, 1024), Image.NEAREST)
    mask_gray = mask_gray.resize((768, 1024), Image.NEAREST)

    import cv2
    parse_768 = np.array(model_parse.resize((768, 1024), Image.NEAREST))

    if request.category == "upper_body":
        garment_classes = [4, 7, 14, 15]
    elif request.category == "dresses":
        garment_classes = [4, 5, 6, 7, 14, 15]
    else:
        garment_classes = None

    if garment_classes:
        region = np.isin(parse_768, garment_classes).astype(np.uint8) * 255
        region = cv2.dilate(region, np.ones((20, 20), np.uint8), iterations=2)
        head_area = (parse_768 == 11).astype(np.uint8) * 255
        head_area = cv2.dilate(head_area, np.ones((25, 25), np.uint8), iterations=2)
        region = np.where(head_area > 0, 0, region).astype(np.uint8)
        combined = np.clip(np.array(mask).astype(int) + region.astype(int), 0, 255).astype(np.uint8)
        mask     = Image.fromarray(combined, "L")
        mask_gray = Image.fromarray(np.where(combined > 0, 127, 0).astype(np.uint8), "L")

    masked_person = Image.composite(mask_gray, person_img, mask)

    category_map = {"upper_body": "upperbody", "lower_body": "lowerbody", "dresses": "dress"}
    model_category = category_map.get(request.category, "upperbody")

    images = ootd(
        model_type="hd",
        category=model_category,
        image_garm=garment_img,
        image_vton=masked_person,
        mask=mask,
        image_ori=person_img,
        num_samples=1,
        num_steps=request.numInferenceSteps,
        image_scale=request.imageScale,
        seed=request.seed,
    )

    final_img = images[0]
    if request.enableRefinement:
        try:
            final_img = _refine_garment_region(final_img, mask, request.category, request.seed)
        except Exception as exc:
            print(f"[refine] skipped: {exc}")

    return _encode_data_url(final_img)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
api = FastAPI(title="StyleSense Try-On API", version="6.0.0")
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@api.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "6.0.0"}


@api.post("/detect-category")
def detect_category(request: DetectCategoryRequest) -> dict:
    """Classify garment image as upper_body / lower_body / dresses using ATR ONNX."""
    import numpy as np
    import onnxruntime as ort

    onnx_path = None
    for candidate in [
        OOTD_PATH / "checkpoints" / "humanparsing" / "parsing_atr.onnx",
        OOTD_CODE / "checkpoints" / "humanparsing" / "parsing_atr.onnx",
    ]:
        if _is_real_file(candidate):
            onnx_path = str(candidate)
            break

    if not onnx_path:
        return {"category": "upper_body", "confidence": 0.0, "reason": "onnx_unavailable"}

    try:
        img = _decode_data_url(request.garmentBase64).convert("RGB").resize((384, 512), Image.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = (arr - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        inp = arr.transpose(2, 0, 1)[np.newaxis].astype(np.float32)

        sess = ort.InferenceSession(onnx_path, providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
        parse = sess.run(None, {sess.get_inputs()[0].name: inp})[0][0].argmax(0)

        total = float(parse.size)
        upper = sum(int((parse == c).sum()) for c in [5, 7]) / total
        dress = int((parse == 6).sum()) / total
        lower = sum(int((parse == c).sum()) for c in [9, 10, 12]) / total

        if dress > 0.12 or (dress > 0.06 and dress > upper and dress > lower):
            return {"category": "dresses",    "confidence": round(dress, 3)}
        if lower > upper * 1.4 and lower > 0.08:
            return {"category": "lower_body", "confidence": round(lower, 3)}
        return {"category": "upper_body",     "confidence": round(max(upper, 0.05), 3)}
    except Exception as exc:
        return {"category": "upper_body", "confidence": 0.0, "error": str(exc)[:120]}


@api.get("/debug/volume")
def debug_volume() -> dict:
    """Inspect volume and image file state — for debugging only."""
    cache_volume.reload()

    def check(path: str) -> dict:
        p = Path(path)
        try:
            return {
                "real": _is_real_file(p),
                "symlink": p.is_symlink(),
                "exists": p.exists(),
                "size": p.stat().st_size if p.exists() and p.is_file() else None,
            }
        except Exception as exc:
            return {"real": False, "error": str(exc)}

    return {
        "volume_atr":        check(f"{OOTD_PATH}/checkpoints/humanparsing/parsing_atr.onnx"),
        "volume_pose":       check(f"{OOTD_PATH}/checkpoints/openpose/ckpts/body_pose_model.pth"),
        "volume_preprocess": {"exists": (OOTD_PATH / "preprocess").is_dir()},
        "volume_ootd_src":   {"exists": (OOTD_PATH / "ootd").is_dir()},
        "volume_unet_ok":    any(
            _is_real_file(p)
            for p in (OOTD_PATH / "checkpoints" / "ootd").rglob("*.safetensors")
        ) if (OOTD_PATH / "checkpoints" / "ootd").is_dir() else False,
        "dangling_count": sum(
            1 for p in OOTD_PATH.rglob("*")
            if p.is_symlink() and not p.exists()
        ) if OOTD_PATH.exists() else 0,
        "sys_path": sys.path[:6],
    }


@api.post("/tryon", response_model=TryOnResponse)
def try_on(request: TryOnRequest, http_request: Request) -> TryOnResponse:
    key = os.environ.get("TRYON_API_KEY", "").strip()
    if key:
        provided = (
            http_request.headers.get("x-tryon-api-key", "").strip()
            or http_request.headers.get("authorization", "").replace("Bearer ", "").strip()
        )
        if provided != key:
            raise HTTPException(status_code=401, detail="Invalid API key")

    try:
        image_data = _run_inference(request)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)[:400]) from exc

    return TryOnResponse(imageBase64=image_data)


# ---------------------------------------------------------------------------
# Modal entrypoint
# ---------------------------------------------------------------------------
@app.function(
    image=image,
    gpu="A10G",
    timeout=60 * 30,
    volumes={"/cache": cache_volume},
)
@modal.asgi_app()
def web() -> FastAPI:
    return api
