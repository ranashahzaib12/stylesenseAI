const express = require("express");
const axios = require("axios");
const Joi = require("joi");
const { optionalAuth } = require("../middleware/auth");
const {
  addTryOnFeedback,
  getTryOnStatus,
  predictTryOnFit,
  retrainTryOnModel,
} = require("../services/tryOnModelService");

const MODAL_URL = (process.env.TRYON_MODAL_URL || "").replace(/\/+$/, "");
const MODAL_API_KEY = (process.env.TRYON_API_KEY || "").trim();

const generateSchema = Joi.object({
  personBase64: Joi.string().min(1).required(),
  garmentBase64: Joi.string().min(1).required(),
  category: Joi.string()
    .valid("upper_body", "lower_body", "dresses")
    .default("upper_body"),
  seed: Joi.number().integer().default(42),
  numInferenceSteps: Joi.number().integer().min(10).max(40).default(40),
  imageScale: Joi.number().min(0.5).max(3.0).default(2.5),
  enableRefinement: Joi.boolean().default(true),
});

const router = express.Router();

function requireMlAdmin(req, res, next) {
  const adminKey = process.env.ML_ADMIN_KEY;
  if (!adminKey) return next();
  const provided = req.headers["x-ml-admin-key"];
  if (provided === adminKey) return next();
  return res.status(403).json({ error: "Missing or invalid ML admin key." });
}

const fitSchema = Joi.object({
  x: Joi.number().min(0).max(100).optional(),
  y: Joi.number().min(0).max(100).optional(),
  width: Joi.number().min(0).max(100).optional(),
  length: Joi.number().min(0).max(100).optional(),
  sleeve: Joi.number().min(0).max(100).optional(),
  neckline: Joi.number().min(0).max(100).optional(),
  opacity: Joi.number().min(0).max(100).optional(),
}).default({});

const contextSchema = Joi.object({
  occasion: Joi.string().trim().max(60).allow("").optional(),
  styles: Joi.array().items(Joi.string().trim().max(60)).default([]),
  imageMeta: Joi.object({
    width: Joi.number().positive().max(12000).optional(),
    height: Joi.number().positive().max(12000).optional(),
  }).default({}).unknown(true),
  weatherContext: Joi.object({
    temperature: Joi.number().min(-60).max(80).optional(),
    condition: Joi.string().trim().max(60).optional(),
  }).default({}).unknown(true),
}).default({}).unknown(true);

const predictSchema = Joi.object({
  outfitId: Joi.string().trim().required(),
  context: contextSchema,
  baselineFit: fitSchema,
});

const feedbackSchema = Joi.object({
  outfitId: Joi.string().trim().required(),
  context: contextSchema,
  baselineFit: fitSchema,
  finalFit: fitSchema.required(),
  qualityScore: Joi.number().min(1).max(5).default(4),
  useAsTraining: Joi.boolean().default(true),
  wasApplied: Joi.boolean().default(true),
  metadata: Joi.object().default({}),
});

router.get("/status", (_req, res) => {
  return res.json(getTryOnStatus());
});

router.post("/predict", optionalAuth, (req, res) => {
  const { error, value } = predictSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: "Invalid try-on prediction payload.",
      details: error.details.map((item) => item.message),
    });
  }
  const result = predictTryOnFit(value);
  return res.json({ ...result, requestedBy: req.user ? req.user.uid : "guest" });
});

router.post("/feedback", optionalAuth, (req, res) => {
  const { error, value } = feedbackSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: "Invalid try-on feedback payload.",
      details: error.details.map((item) => item.message),
    });
  }
  const result = addTryOnFeedback(value, req.user);
  return res.status(201).json(result);
});

router.post("/train", requireMlAdmin, (_req, res) => {
  const result = retrainTryOnModel();
  return res.json({ ok: true, ...result });
});

// Sync proxy to Modal GPU endpoint — 10-minute timeout
router.post(
  "/generate",
  express.json({ limit: "20mb" }),
  async (req, res) => {
    if (!MODAL_URL) {
      return res.status(503).json({
        error: "Try-on service is not configured (TRYON_MODAL_URL missing).",
      });
    }

    const { error, value } = generateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Invalid generate payload.",
        details: error.details.map((d) => d.message),
      });
    }

    const headers = { "Content-Type": "application/json" };
    if (MODAL_API_KEY) headers["x-tryon-api-key"] = MODAL_API_KEY;

    try {
      const response = await axios.post(`${MODAL_URL}/tryon`, value, {
        headers,
        timeout: 600000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      return res.json(response.data);
    } catch (err) {
      if (err.response) {
        const bodyText =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data?.detail || err.response.data?.message || "";
        const raw = String(bodyText).trim();
        const firstLine = raw
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith("File ") && !l.startsWith("Traceback"));
        const detail = firstLine
          ? firstLine.slice(0, 300)
          : `Try-on service returned error ${err.response.status}.`;
        return res.status(502).json({ error: detail });
      }
      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        return res.status(504).json({ error: "Try-on timed out. The model may still be loading." });
      }
      return res.status(502).json({ error: "Could not reach try-on service." });
    }
  },
);

// SSE streaming proxy — sends synthetic stage events while Modal processes
router.post(
  "/generate-stream",
  async (req, res) => {
    if (!MODAL_URL) {
      res.status(503).json({ error: "Try-on service is not configured." });
      return;
    }

    const { error, value } = generateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({ error: "Invalid payload.", details: error.details.map((d) => d.message) });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const timers = [
      setTimeout(() => send({ stage: "parsing",    message: "Parsing body pose…" }),       1500),
      setTimeout(() => send({ stage: "masking",    message: "Creating clothing mask…" }),   5000),
      setTimeout(() => send({ stage: "generating", message: "Generating try-on…" }),        9000),
      setTimeout(() => send({ stage: "refining",   message: "Refining details…" }),        22000),
      setTimeout(() => send({ stage: "finishing",  message: "Almost done…" }),             29000),
    ];
    const clearTimers = () => timers.forEach(clearTimeout);

    const headers = { "Content-Type": "application/json" };
    if (MODAL_API_KEY) headers["x-tryon-api-key"] = MODAL_API_KEY;

    try {
      const response = await axios.post(`${MODAL_URL}/tryon`, value, {
        headers,
        timeout: 600000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      clearTimers();
      send({ stage: "done", imageBase64: response.data.imageBase64 });
      res.end();
    } catch (err) {
      clearTimers();
      let message = "Could not reach try-on service.";
      if (err.response) {
        const bodyText =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data?.detail || err.response.data?.message || "";
        const firstLine = String(bodyText)
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith("File ") && !l.startsWith("Traceback"));
        if (firstLine) message = firstLine.slice(0, 300);
      } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        message = "Try-on timed out. The model may still be loading — please retry.";
      }
      send({ stage: "error", message });
      res.end();
    }
  },
);

// Proxy to Modal's garment category detector
router.post(
  "/detect-category",
  async (req, res) => {
    if (!MODAL_URL) return res.json({ category: "upper_body", confidence: 0 });

    const garmentBase64 = req.body?.garmentBase64;
    if (!garmentBase64) return res.status(400).json({ error: "garmentBase64 required" });

    const headers = { "Content-Type": "application/json" };
    if (MODAL_API_KEY) headers["x-tryon-api-key"] = MODAL_API_KEY;

    try {
      const response = await axios.post(
        `${MODAL_URL}/detect-category`,
        { garmentBase64 },
        { headers, timeout: 30000 },
      );
      return res.json(response.data);
    } catch {
      return res.json({ category: "upper_body", confidence: 0 });
    }
  },
);

module.exports = router;
