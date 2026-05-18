const fs = require("fs");
const path = require("path");
const { randomUUID: uuidv4 } = require("crypto");
const { outfitCatalog } = require("../data/outfits");

const MODEL_FILE = path.join(__dirname, "../../data/tryon-model.json");
const FEEDBACK_FILE = path.join(__dirname, "../../data/tryon-feedback.json");

const TARGET_KEYS = ["x", "y", "width", "length", "sleeve", "neckline", "opacity"];

const DEFAULT_BASELINE_FIT = {
  x: 50, y: 50, width: 48, length: 44, sleeve: 50, neckline: 32, opacity: 76,
};

const FIT_BOUNDS = {
  x: [20, 80], y: [22, 80], width: [24, 88], length: [24, 82],
  sleeve: [5, 95], neckline: [20, 85], opacity: [20, 100],
};

const OUTFIT_PRIORS = {
  "OF-1001": { width: -2, length: -2 },
  "OF-1002": { width: 4, length: 3, sleeve: 6, opacity: -4 },
  "OF-1003": { width: 2, length: 1, sleeve: 8 },
  "OF-1004": { width: 3, length: 2, sleeve: 5, opacity: -3 },
  "OF-1005": { width: -1, length: 4, opacity: -5 },
  "OF-1006": { width: -3, length: -1, sleeve: 7, opacity: -2 },
  "OF-1007": { width: 5, length: 5, sleeve: 9, opacity: -8 },
  "OF-1008": { width: -4, length: 3, sleeve: -2, opacity: -6 },
  "OF-1009": { width: 2, length: 5, sleeve: 4, opacity: -7 },
  "OF-1010": { width: -1, length: -1, sleeve: 3, opacity: -3 },
};

const OCCASION_FEATURES = [
  "casual", "office", "formal", "party", "date",
  "gym", "travel", "wedding", "beach", "college",
];

const STYLE_FEATURES = [
  "minimal", "smart-casual", "streetwear", "classic", "elegant",
  "sporty", "boho", "utility", "glam", "resort", "traditional", "edgy",
];

const OUTFIT_FEATURES = outfitCatalog.map((item) => item.id);

const FEATURE_NAMES = [
  "bias", "aspectRatio", "isPortrait", "imageHeightNorm", "temperatureNorm", "rainFlag",
  ...OCCASION_FEATURES.map((item) => `occasion:${item}`),
  ...STYLE_FEATURES.map((item) => `style:${item}`),
  ...OUTFIT_FEATURES.map((item) => `outfit:${item}`),
];

const DEFAULT_MODEL = {
  version: "tryon-online-linear-v1",
  featureNames: FEATURE_NAMES,
  targetKeys: TARGET_KEYS,
  learningRate: 0.018,
  l2: 0.0008,
  sampleCount: 0,
  updatedAt: null,
  lastTrainedAt: null,
  weights: Object.fromEntries(
    TARGET_KEYS.map((target) => [target, FEATURE_NAMES.map(() => 0)]),
  ),
};

let cachedModel = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toLower(value) {
  return String(value || "").trim().toLowerCase();
}

function ensureStores() {
  const modelDir = path.dirname(MODEL_FILE);
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  if (!fs.existsSync(MODEL_FILE)) {
    fs.writeFileSync(MODEL_FILE, JSON.stringify(DEFAULT_MODEL, null, 2), "utf8");
  }
  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, "[]", "utf8");
  }
}

function safeReadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function sanitizeLoadedModel(rawModel) {
  if (!rawModel || typeof rawModel !== "object") return null;
  const featureNames = Array.isArray(rawModel.featureNames) ? rawModel.featureNames : FEATURE_NAMES;
  if (featureNames.length !== FEATURE_NAMES.length) return null;
  const weights = {};
  for (const target of TARGET_KEYS) {
    const source = Array.isArray(rawModel.weights?.[target])
      ? rawModel.weights[target]
      : FEATURE_NAMES.map(() => 0);
    if (source.length !== FEATURE_NAMES.length) return null;
    weights[target] = source.map((item) => Number(item) || 0);
  }
  return {
    ...DEFAULT_MODEL, ...rawModel,
    featureNames: FEATURE_NAMES, targetKeys: TARGET_KEYS,
    learningRate: Number(rawModel.learningRate || DEFAULT_MODEL.learningRate),
    l2: Number(rawModel.l2 || DEFAULT_MODEL.l2),
    sampleCount: Math.max(0, Number(rawModel.sampleCount || 0)),
    weights,
  };
}

function readModelFromDisk() {
  ensureStores();
  const loaded = safeReadJson(MODEL_FILE, null);
  const sanitized = sanitizeLoadedModel(loaded);
  return sanitized || { ...DEFAULT_MODEL };
}

function writeModel(model) {
  model.updatedAt = new Date().toISOString();
  fs.writeFileSync(MODEL_FILE, JSON.stringify(model, null, 2), "utf8");
}

function getModel() {
  if (!cachedModel) cachedModel = readModelFromDisk();
  return cachedModel;
}

function resetModelCache() {
  cachedModel = null;
}

function readTryOnFeedback() {
  ensureStores();
  const items = safeReadJson(FEEDBACK_FILE, []);
  return Array.isArray(items) ? items : [];
}

function writeTryOnFeedback(items) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(items, null, 2), "utf8");
}

function sanitizeFit(fit = {}, fallback = DEFAULT_BASELINE_FIT) {
  const normalized = {};
  for (const key of TARGET_KEYS) {
    const [min, max] = FIT_BOUNDS[key];
    const raw = Number(fit[key]);
    const fallbackValue = Number(fallback[key]);
    const value = Number.isFinite(raw) ? raw : fallbackValue;
    normalized[key] = clamp(value, min, max);
  }
  return normalized;
}

function buildBaseFit(outfitId, baselineFit = DEFAULT_BASELINE_FIT) {
  const baseline = sanitizeFit(baselineFit, DEFAULT_BASELINE_FIT);
  const prior = OUTFIT_PRIORS[outfitId] || {};
  const merged = {};
  for (const key of TARGET_KEYS) {
    const [min, max] = FIT_BOUNDS[key];
    merged[key] = clamp(baseline[key] + Number(prior[key] || 0), min, max);
  }
  return merged;
}

function buildFeatureVector({ outfitId, context = {} }) {
  const styles = Array.isArray(context.styles) ? context.styles.map(toLower) : [];
  const styleSet = new Set(styles);
  const occasion = toLower(context.occasion);
  const imageWidth = Number(context.imageMeta?.width || 0);
  const imageHeight = Number(context.imageMeta?.height || 0);
  const hasImage = imageWidth > 0 && imageHeight > 0;
  const aspectRatio = hasImage ? clamp(imageWidth / imageHeight, 0.4, 2.3) : 0.75;
  const isPortrait = hasImage && imageHeight >= imageWidth ? 1 : 0;
  const imageHeightNorm = hasImage ? clamp(imageHeight / 1200, 0, 2) : 0;
  const temp = Number(context.weatherContext?.temperature);
  const temperatureNorm = Number.isFinite(temp) ? clamp(temp / 40, -1, 1.5) : 0;
  const rainFlag = toLower(context.weatherContext?.condition) === "rainy" ? 1 : 0;

  const vector = [1, aspectRatio, isPortrait, imageHeightNorm, temperatureNorm, rainFlag];
  for (const item of OCCASION_FEATURES) vector.push(item === occasion ? 1 : 0);
  for (const item of STYLE_FEATURES) vector.push(styleSet.has(item) ? 1 : 0);
  for (const item of OUTFIT_FEATURES) vector.push(item === outfitId ? 1 : 0);
  return vector;
}

function dotProduct(weights, values) {
  let total = 0;
  for (let i = 0; i < values.length; i++) {
    total += Number(weights[i] || 0) * Number(values[i] || 0);
  }
  return total;
}

function predictWithModel(model, { outfitId, context = {}, baselineFit = {} }) {
  const features = buildFeatureVector({ outfitId, context });
  const baseFit = buildBaseFit(outfitId, baselineFit);
  const predictedFit = {};
  const deltaByTarget = {};

  for (const target of TARGET_KEYS) {
    const delta = dotProduct(model.weights[target] || [], features);
    const [min, max] = FIT_BOUNDS[target];
    const value = clamp(baseFit[target] + delta, min, max);
    predictedFit[target] = Number(value.toFixed(2));
    deltaByTarget[target] = Number(delta.toFixed(3));
  }

  const topSignals = FEATURE_NAMES.map((featureName, index) => ({
    feature: featureName,
    influence: Number((model.weights.width[index] || 0) * Number(features[index] || 0)),
  }))
    .filter((item) => Math.abs(item.influence) > 0.005)
    .sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence))
    .slice(0, 3)
    .map((item) => ({ feature: item.feature, influence: Number(item.influence.toFixed(3)) }));

  return {
    predictedFit, baseFit, deltaByTarget, topSignals,
    confidence: Number(clamp(model.sampleCount / 50, 0.18, 0.98).toFixed(2)),
  };
}

function trainOnSample(model, sample) {
  const input = { outfitId: sample.outfitId, context: sample.context, baselineFit: sample.baselineFit };
  const prediction = predictWithModel(model, input);
  const features = buildFeatureVector(input);
  const finalFit = sanitizeFit(sample.finalFit, prediction.baseFit);
  const qualityWeight = clamp(Number(sample.qualityScore || 4) / 5, 0.2, 1);
  const learningRate = Number(model.learningRate || DEFAULT_MODEL.learningRate) * qualityWeight;
  const l2 = Number(model.l2 || DEFAULT_MODEL.l2);
  let totalLoss = 0;

  for (const target of TARGET_KEYS) {
    const targetDelta = finalFit[target] - prediction.baseFit[target];
    const predictedDelta = prediction.deltaByTarget[target];
    const error = targetDelta - predictedDelta;
    totalLoss += error * error;
    const targetWeights = model.weights[target];
    for (let i = 0; i < features.length; i++) {
      const current = Number(targetWeights[i] || 0);
      targetWeights[i] = current * (1 - learningRate * l2) + learningRate * error * features[i];
    }
  }

  model.sampleCount += 1;
  model.lastTrainedAt = new Date().toISOString();
  return {
    learningRate: Number(learningRate.toFixed(5)),
    rmse: Number(Math.sqrt(totalLoss / TARGET_KEYS.length).toFixed(4)),
    sampleCount: model.sampleCount,
  };
}

function summarizeModel(model) {
  return {
    version: model.version,
    sampleCount: model.sampleCount,
    featureCount: FEATURE_NAMES.length,
    targetCount: TARGET_KEYS.length,
    learningRate: model.learningRate,
    l2: model.l2,
    updatedAt: model.updatedAt,
    lastTrainedAt: model.lastTrainedAt,
  };
}

function predictTryOnFit(payload) {
  const model = getModel();
  const result = predictWithModel(model, payload);
  return {
    model: summarizeModel(model),
    predictedFit: result.predictedFit,
    baseFit: result.baseFit,
    confidence: result.confidence,
    topSignals: result.topSignals,
  };
}

function addTryOnFeedback(payload, user) {
  const model = getModel();
  const entry = {
    id: uuidv4(),
    outfitId: payload.outfitId,
    context: payload.context || {},
    baselineFit: sanitizeFit(payload.baselineFit || {}, DEFAULT_BASELINE_FIT),
    finalFit: sanitizeFit(payload.finalFit || {}, DEFAULT_BASELINE_FIT),
    qualityScore: clamp(Number(payload.qualityScore || 4), 1, 5),
    useAsTraining: payload.useAsTraining !== false,
    wasApplied: payload.wasApplied !== false,
    metadata: payload.metadata || {},
    createdAt: new Date().toISOString(),
    user: user ? { uid: user.uid, email: user.email || null } : { uid: "anonymous", email: null },
  };

  const items = readTryOnFeedback();
  items.unshift(entry);
  writeTryOnFeedback(items.slice(0, 12000));

  let training = { trained: false, sampleCount: model.sampleCount };
  if (entry.useAsTraining) {
    const trainResult = trainOnSample(model, entry);
    writeModel(model);
    training = { trained: true, ...trainResult };
  }

  return { entry, training, model: summarizeModel(model) };
}

function retrainTryOnModel() {
  const freshModel = {
    ...DEFAULT_MODEL,
    weights: Object.fromEntries(
      TARGET_KEYS.map((target) => [target, FEATURE_NAMES.map(() => 0)]),
    ),
    sampleCount: 0,
    lastTrainedAt: null,
    updatedAt: null,
  };

  const items = readTryOnFeedback().filter((item) => item.useAsTraining !== false);
  const ordered = [...items].reverse();
  let aggregateRmse = 0;
  for (const item of ordered) {
    const result = trainOnSample(freshModel, item);
    aggregateRmse += result.rmse;
  }
  writeModel(freshModel);
  cachedModel = freshModel;
  return {
    model: summarizeModel(freshModel),
    trainedSamples: ordered.length,
    avgRmse: ordered.length > 0 ? Number((aggregateRmse / ordered.length).toFixed(4)) : 0,
  };
}

function getTryOnStatus() {
  const model = getModel();
  const feedbackItems = readTryOnFeedback();
  const trainableCount = feedbackItems.filter((item) => item.useAsTraining !== false).length;
  return {
    service: "stylesense-tryon-ai",
    timestamp: new Date().toISOString(),
    model: summarizeModel(model),
    feedbackCount: feedbackItems.length,
    trainableFeedbackCount: trainableCount,
    lastFeedbackAt: feedbackItems[0]?.createdAt || null,
  };
}

module.exports = {
  addTryOnFeedback,
  getTryOnStatus,
  predictTryOnFit,
  readTryOnFeedback,
  resetModelCache,
  retrainTryOnModel,
};
