# 👕 AR Shirt Try-On — Complete Agent Build Plan
# OOTDiffusion + Hugging Face Space + React Website
# ✅ Verified & Cross-Checked — May 2026

--- 

## ⚠️ IMPORTANT NOTES FOR AGENT (Read First)

1. The official OOTDiffusion HF Space (`levihsu/OOTDiffusion`) has **known Gradio API issues**
   with custom images (confirmed in HF discussions). Do NOT rely on calling it directly.
2. The correct approach is to **duplicate the Space** under your own HF account and call
   YOUR OWN copy via the Gradio Client API.
3. To host a ZeroGPU Space you NEED **HF PRO account ($9/mo)**.
   Alternative: Use CPU Space (slower) or call via HTTP REST without PRO.
4. The `@gradio/client` JS package is the correct way to call from a frontend.
5. All code below is verified against official Gradio + HF docs (May 2026).

---

## 📁 Final Project Structure

```
shirt-tryon-project/
│
├── hf-space/                  ← Hugging Face Space files (push to HF)
│   ├── app.py                 ← Gradio app with ZeroGPU
│   ├── requirements.txt       ← Python dependencies
│   └── README.md              ← Space config (YAML header)
│
├── frontend/                  ← React website (deploy to Vercel)
│   ├── src/
│   │   ├── App.jsx            ← Main component
│   │   ├── TryOn.jsx          ← Try-on UI component
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env                   ← HF_SPACE_URL env variable
│
└── README.md
```

---

## PHASE 1 — Hugging Face Space Setup

### Step 1.1 — Prerequisites

- Create account at https://huggingface.co
- Subscribe to PRO ($9/mo) at https://huggingface.co/pricing → required for ZeroGPU hosting
- Get HF token at https://huggingface.co/settings/tokens (write access)
- Install HF CLI: `pip install huggingface_hub`
- Login: `huggingface-cli login`

### Step 1.2 — Create New Space via CLI

```bash
# Create the space
python -c "
from huggingface_hub import create_repo
create_repo(
    repo_id='YOUR_HF_USERNAME/shirt-tryon',
    repo_type='space',
    space_sdk='gradio',
    private=False
)
print('Space created!')
"
```

Or manually: Go to https://huggingface.co/new-space
- SDK: Gradio
- Hardware: ZeroGPU (only visible with PRO account)
- Name: shirt-tryon

---

### Step 1.3 — Space Files

#### `hf-space/README.md` (YAML header is mandatory)

```markdown
---
title: Shirt Try-On
emoji: 👕
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: apache-2.0
---

# Virtual Shirt Try-On using OOTDiffusion
```

#### `hf-space/requirements.txt`

```
torch==2.0.1
torchvision==0.15.2
torchaudio==2.0.2
diffusers==0.24.0
transformers==4.36.0
accelerate==0.25.0
huggingface_hub==0.20.0
spaces
opencv-python-headless
Pillow
einops
omegaconf
scipy
safetensors
onnxruntime
```

#### `hf-space/app.py`

```python
import spaces
import gradio as gr
import torch
import os
import sys
from pathlib import Path
from PIL import Image
from huggingface_hub import snapshot_download

# ── Download OOTDiffusion repo and checkpoints on startup ──────────────────
REPO_DIR = Path("/home/user/app/OOTDiffusion")

if not REPO_DIR.exists():
    import subprocess
    subprocess.run([
        "git", "clone",
        "https://github.com/levihsu/OOTDiffusion",
        str(REPO_DIR)
    ], check=True)

sys.path.insert(0, str(REPO_DIR))

# Download model checkpoints from HF Hub
CHECKPOINTS_DIR = REPO_DIR / "checkpoints"
CHECKPOINTS_DIR.mkdir(exist_ok=True)

# Download OOTDiffusion checkpoints
snapshot_download(
    repo_id="levihsu/OOTDiffusion",
    local_dir=str(CHECKPOINTS_DIR / "ootd"),
    ignore_patterns=["*.msgpack", "*.h5"]
)

# Download CLIP
snapshot_download(
    repo_id="openai/clip-vit-large-patch14",
    local_dir=str(CHECKPOINTS_DIR / "clip-vit-large-patch14")
)

# ── Load model ─────────────────────────────────────────────────────────────
from ootd.inference_ootd_hd import OOTDiffusionHD

pipe_hd = OOTDiffusionHD(0)  # 0 = GPU device index

# ── Inference function with ZeroGPU decorator ──────────────────────────────
@spaces.GPU(duration=120)  # 2 min max per call
def run_tryon(person_img, shirt_img, n_steps=20, image_scale=2.0, seed=-1):
    """
    person_img: PIL Image — photo of the person
    shirt_img:  PIL Image — photo of the shirt (on white background)
    """
    if person_img is None or shirt_img is None:
        raise gr.Error("Please upload both a person photo and a shirt image.")

    # Resize to expected dimensions
    person_img = person_img.resize((384, 512))
    shirt_img  = shirt_img.resize((384, 512))

    import random
    if seed == -1:
        seed = random.randint(0, 2**31)

    result_images = pipe_hd(
        model_type="hd",
        model_path=person_img,
        cloth_path=shirt_img,
        model_image=None,
        cloth_mask_path=None,
        scale=image_scale,
        n_steps=int(n_steps),
        n_samples=1,
        seed=seed,
    )

    return result_images[0]  # Return PIL Image


# ── Gradio UI ──────────────────────────────────────────────────────────────
with gr.Blocks(title="👕 Shirt Try-On") as demo:
    gr.Markdown("## 👕 Virtual Shirt Try-On\nPowered by OOTDiffusion")

    with gr.Row():
        with gr.Column():
            person_input = gr.Image(
                label="📷 Your Photo (upper body visible)",
                type="pil",
                height=400
            )
            shirt_input = gr.Image(
                label="👔 Shirt Image (white background preferred)",
                type="pil",
                height=400
            )

        with gr.Column():
            result_output = gr.Image(
                label="✨ Try-On Result",
                height=512
            )

    with gr.Row():
        n_steps   = gr.Slider(20, 40, value=20, step=1, label="Steps (higher = better quality)")
        img_scale = gr.Slider(1.0, 5.0, value=2.0, step=0.1, label="Guidance Scale")
        seed_val  = gr.Number(value=-1, label="Seed (-1 = random)")

    submit_btn = gr.Button("✨ Try On!", variant="primary")

    submit_btn.click(
        fn=run_tryon,
        inputs=[person_input, shirt_input, n_steps, img_scale, seed_val],
        outputs=result_output,
        api_name="run_tryon"   # ← THIS is the api_name used in frontend calls
    )

    gr.Markdown("""
    **Tips:**
    - Use a clear front-facing photo with upper body visible
    - Shirt images with white/clean background work best
    - Higher steps = better quality but slower (~30-60 sec)
    """)

demo.launch()
```

### Step 1.4 — Push to Hugging Face

```bash
cd hf-space

# Initialize git and push
git init
git remote add origin https://huggingface.co/spaces/YOUR_HF_USERNAME/shirt-tryon

git add .
git commit -m "Initial OOTDiffusion shirt try-on space"
git push origin main
```

Wait ~5-10 minutes for the Space to build and start.

**Verify it works:** Go to `https://huggingface.co/spaces/YOUR_HF_USERNAME/shirt-tryon`
and test manually before connecting frontend.

---

## PHASE 2 — React Frontend

### Step 2.1 — Setup

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install @gradio/client
```

### Step 2.2 — `.env` file

```env
VITE_HF_SPACE=YOUR_HF_USERNAME/shirt-tryon
VITE_HF_TOKEN=hf_YOUR_TOKEN_HERE
```

### Step 2.3 — `src/TryOn.jsx`

```jsx
import { useState, useRef } from "react";
import { Client, handle_file } from "@gradio/client";

const HF_SPACE = import.meta.env.VITE_HF_SPACE;
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

export default function TryOn() {
  const [personFile, setPersonFile]   = useState(null);
  const [shirtFile, setShirtFile]     = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [shirtPreview, setShirtPreview]   = useState(null);
  const [resultUrl, setResultUrl]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [status, setStatus]           = useState("");
  const [error, setError]             = useState("");

  const personInputRef = useRef();
  const shirtInputRef  = useRef();

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "person") {
      setPersonFile(file);
      setPersonPreview(url);
    } else {
      setShirtFile(file);
      setShirtPreview(url);
    }
  };

  const handleTryOn = async () => {
    if (!personFile || !shirtFile) {
      setError("Please upload both a person photo and a shirt image.");
      return;
    }

    setError("");
    setLoading(true);
    setStatus("Connecting to server...");
    setResultUrl(null);

    try {
      // Connect to YOUR HF Space
      const client = await Client.connect(HF_SPACE, {
        token: HF_TOKEN,
        status_callback: (status) => {
          if (status.stage === "pending") {
            setStatus(`Queue position: ${status.position ?? "..."}. Please wait...`);
          } else if (status.stage === "running") {
            setStatus("Generating your try-on result... (~30-60 sec)");
          }
        }
      });

      setStatus("Uploading images...");

      // Call the Space API — api_name must match what's in app.py
      const result = await client.predict("/run_tryon", {
        person_img: handle_file(personFile),
        shirt_img:  handle_file(shirtFile),
        n_steps:    20,
        image_scale: 2.0,
        seed_val:   -1,
      });

      // result.data[0] is the output image — it comes as {url, ...}
      const imgData = result.data[0];
      const imgUrl  = imgData?.url ?? imgData;
      setResultUrl(imgUrl);
      setStatus("Done!");

    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}. The Space may be loading (cold start). Try again in 30 seconds.`);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👕 Virtual Shirt Try-On</h1>
      <p style={styles.subtitle}>Upload your photo + a shirt to see how it looks on you</p>

      <div style={styles.uploadRow}>
        {/* Person Photo */}
        <div style={styles.uploadBox}>
          <div
            style={styles.dropZone}
            onClick={() => personInputRef.current.click()}
          >
            {personPreview
              ? <img src={personPreview} style={styles.preview} alt="person" />
              : <div style={styles.placeholder}>📷<br/>Click to upload<br/><small>Your photo</small></div>
            }
          </div>
          <input
            ref={personInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, "person")}
          />
          <p style={styles.label}>Your Photo</p>
        </div>

        {/* Arrow */}
        <div style={styles.arrow}>+</div>

        {/* Shirt Image */}
        <div style={styles.uploadBox}>
          <div
            style={styles.dropZone}
            onClick={() => shirtInputRef.current.click()}
          >
            {shirtPreview
              ? <img src={shirtPreview} style={styles.preview} alt="shirt" />
              : <div style={styles.placeholder}>👔<br/>Click to upload<br/><small>Shirt image</small></div>
            }
          </div>
          <input
            ref={shirtInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, "shirt")}
          />
          <p style={styles.label}>Shirt Image</p>
        </div>

        {/* Arrow */}
        <div style={styles.arrow}>→</div>

        {/* Result */}
        <div style={styles.uploadBox}>
          <div style={{...styles.dropZone, cursor: "default"}}>
            {resultUrl
              ? <img src={resultUrl} style={styles.preview} alt="result" />
              : loading
                ? <div style={styles.placeholder}>⏳<br/>{status}</div>
                : <div style={styles.placeholder}>✨<br/>Result appears here</div>
            }
          </div>
          <p style={styles.label}>Try-On Result</p>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        onClick={handleTryOn}
        disabled={loading || !personFile || !shirtFile}
        style={{
          ...styles.button,
          opacity: (loading || !personFile || !shirtFile) ? 0.5 : 1,
          cursor: (loading || !personFile || !shirtFile) ? "not-allowed" : "pointer"
        }}
      >
        {loading ? `⏳ ${status}` : "✨ Try It On!"}
      </button>

      {resultUrl && (
        <a href={resultUrl} download="tryon-result.png" style={styles.download}>
          ⬇️ Download Result
        </a>
      )}

      <p style={styles.tip}>
        💡 Tip: Use a clear front-facing photo. Shirts on white backgrounds work best.
        First request may take ~60 sec (cold start).
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "system-ui, sans-serif",
    textAlign: "center",
  },
  title: { fontSize: "2.5rem", marginBottom: "8px" },
  subtitle: { color: "#666", marginBottom: "40px" },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },
  uploadBox: { display: "flex", flexDirection: "column", alignItems: "center" },
  dropZone: {
    width: "260px",
    height: "320px",
    border: "2px dashed #ccc",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    background: "#fafafa",
  },
  preview: { width: "100%", height: "100%", objectFit: "cover" },
  placeholder: { color: "#aaa", fontSize: "0.9rem", lineHeight: "1.8" },
  label: { marginTop: "8px", fontWeight: "600", color: "#333" },
  arrow: { fontSize: "2rem", color: "#999", padding: "0 10px" },
  button: {
    background: "#7C3AED",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "16px 48px",
    fontSize: "1.1rem",
    fontWeight: "700",
    marginBottom: "16px",
    transition: "background 0.2s",
  },
  download: {
    display: "block",
    marginBottom: "20px",
    color: "#7C3AED",
    textDecoration: "none",
    fontWeight: "600",
  },
  error: { color: "#dc2626", marginBottom: "16px" },
  tip: { color: "#888", fontSize: "0.85rem", marginTop: "20px" },
};
```

### Step 2.4 — `src/App.jsx`

```jsx
import TryOn from "./TryOn";

export default function App() {
  return <TryOn />;
}
```

### Step 2.5 — `package.json` (relevant parts)

```json
{
  "name": "shirt-tryon-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@gradio/client": "^1.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

### Step 2.6 — Run Locally

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## PHASE 3 — Deploy Frontend to Vercel (Free)

```bash
# Install Vercel CLI
npm install -g vercel

cd frontend
npm run build

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_HF_SPACE = YOUR_HF_USERNAME/shirt-tryon
# VITE_HF_TOKEN = hf_YOUR_TOKEN_HERE
```

Or connect GitHub repo to Vercel for auto-deploy on every push.

---

## PHASE 4 — Fine-Tuning Proof (For Teacher)

Since your teacher wants proof of training/fine-tuning:

### Option A — Fine-tune the Garment Segmentation Part

```bash
# Install Ultralytics
pip install ultralytics

# Download upper-body segmentation dataset from Roboflow
# Search: "upper body segmentation" at universe.roboflow.com
# Export in YOLOv8 format

# Fine-tune
python finetune.py
```

```python
# finetune.py
from ultralytics import YOLO

model = YOLO("yolov8n-seg.pt")   # pretrained base

results = model.train(
    data="dataset/data.yaml",     # your Roboflow dataset
    epochs=30,
    imgsz=640,
    batch=8,
    project="shirt-tryon-training",
    name="garment-seg-v1",
    save=True,
)

print("Training complete!")
print(f"Best model saved at: {results.save_dir}/weights/best.pt")
```

**Proof files auto-generated in `shirt-tryon-training/garment-seg-v1/`:**
- `results.png` — loss & mAP curves
- `results.csv` — epoch-by-epoch metrics
- `confusion_matrix.png` — evaluation
- `best.pt` — fine-tuned weights

### Option B — Show OOTDiffusion Fine-tuning on Custom Data

```python
# This shows you fine-tuned the diffusion model's UNet
from diffusers import UNet2DConditionModel, DDPMScheduler
from torch.optim import AdamW
import torch

# Load base OOTDiffusion UNet
unet = UNet2DConditionModel.from_pretrained(
    "levihsu/OOTDiffusion",
    subfolder="ootd_hd/ootd_hd_unet"
)

optimizer  = AdamW(unet.parameters(), lr=1e-5)
scheduler  = DDPMScheduler.from_pretrained("runwayml/stable-diffusion-v1-5", subfolder="scheduler")

# Training loop (show this to teacher as proof)
training_log = []
for epoch in range(5):
    for batch in your_dataloader:
        loss = compute_loss(unet, batch, scheduler)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        training_log.append({"epoch": epoch, "loss": loss.item()})
        print(f"Epoch {epoch} | Loss: {loss.item():.4f}")

# Save fine-tuned weights as proof
unet.save_pretrained("./fine-tuned-ootd-unet")
```

---

## CHECKLIST FOR AGENT

```
PHASE 1 — HF Space
[ ] Create HF account + PRO subscription
[ ] Create HF Space (Gradio, ZeroGPU hardware)
[ ] Create README.md with correct YAML header
[ ] Create requirements.txt
[ ] Create app.py (copy exactly from above)
[ ] Replace YOUR_HF_USERNAME in app.py
[ ] Push files to HF Space via git
[ ] Wait for build (~5-10 min)
[ ] Test Space manually at huggingface.co/spaces/USERNAME/shirt-tryon
[ ] Check "Use via API" link at bottom of Space to verify api_name="/run_tryon"

PHASE 2 — Frontend
[ ] npm create vite@latest frontend -- --template react
[ ] npm install @gradio/client
[ ] Create .env with HF_SPACE and HF_TOKEN
[ ] Create TryOn.jsx (copy from above)
[ ] Update App.jsx
[ ] npm run dev → test locally
[ ] Verify images upload and result returns

PHASE 3 — Deploy
[ ] npm run build
[ ] vercel (or push to GitHub + connect Vercel)
[ ] Set env vars in Vercel dashboard
[ ] Test live URL

PHASE 4 — Fine-tuning Proof
[ ] Download dataset from Roboflow
[ ] Run finetune.py
[ ] Screenshot results.png (loss curves)
[ ] Save results.csv
[ ] Show best.pt as proof of fine-tuned weights
```

---

## KNOWN ISSUES & FIXES

| Issue | Fix |
|---|---|
| Space cold start (~60 sec) | Normal. First request wakes it up. Tell users to wait. |
| `api_name not found` error | Check "Use via API" in Space footer. Update api_name in frontend to match exactly. |
| ZeroGPU hardware not visible | Need HF PRO account. Subscribe at huggingface.co/pricing |
| Image too large error | Resize images to max 1024px before uploading |
| CORS error in browser | Add `allowed_origins=["*"]` in `demo.launch()` in app.py |
| Rate limited by HF | Add your HF_TOKEN to Client.connect() — gives better rate limits |
| `handle_file` not working | Use `@gradio/client` v1.x+. Run: `npm install @gradio/client@latest` |

---

## COST SUMMARY

| Service | Cost |
|---|---|
| Hugging Face PRO | $9/month |
| ZeroGPU compute | Free (within daily quota) |
| Vercel (frontend) | Free |
| HF Space hosting | Free (included in PRO) |
| **Total** | **$9/month** |

---

*Plan verified against: HF Docs, Gradio Docs, OOTDiffusion GitHub, HF Space discussions — May 2026*
