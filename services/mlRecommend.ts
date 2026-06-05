/**
 * ML recommendation engine — parameters extracted from outfit_finder_model.pkl
 * Pipeline: TF-IDF → TruncatedSVD (LSA) → KMeans cluster bonus → cosine similarity
 */
import modelParams from '../data/modelParams.json';

interface ShirtRecord {
  id: number;
  name: string;
  style: string;
  color: string;
  pattern: string;
  fabric: string;
  fit: string;
  occasion: string;
  description: string;
  image_url: string;
  cluster: number;
  gender?: 'Men' | 'Women';
}

interface ModelData {
  vocabulary: Record<string, number>;
  idf: number[];
  svd_components: number[][];
  kmeans_centers: number[][];
  lsa_matrix_norm: number[][];
  cluster_bonus: number;
  shirts: ShirtRecord[];
}

export interface MLResult {
  rank: number;
  id: number;
  name: string;
  style: string;
  color: string;
  pattern: string;
  fabric: string;
  fit: string;
  occasion: string;
  description: string;
  imageUrl: string;
  category: string;
  score: number;
  lsaScore: number;
  clusterBonus: number;
  cluster: number;
}

export interface ShirtCatalogItem {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  gender?: 'Men' | 'Women';
  style: string;
  color: string;
  pattern: string;
  fabric: string;
  fit: string;
  occasion: string;
  description: string;
  cluster: number;
}

const m = modelParams as unknown as ModelData;
const COLD_FABRICS = ['flannel', 'wool', 'velvet', 'fleece'];

// Color synonym map — query term → canonical colors it matches
const COLOR_SYNONYMS: Record<string, string[]> = {
  red: ['red', 'crimson', 'scarlet', 'maroon', 'burgundy', 'wine'],
  blue: ['blue', 'navy', 'cobalt', 'royal', 'indigo', 'teal', 'cyan', 'mint'],
  green: ['green', 'olive', 'forest', 'sage', 'emerald', 'teal', 'mint'],
  black: ['black', 'dark', 'charcoal', 'onyx'],
  white: ['white', 'cream', 'ivory', 'off-white', 'snow'],
  grey: ['grey', 'gray', 'melange', 'ash', 'slate'],
  gray: ['grey', 'gray', 'melange', 'ash', 'slate'],
  beige: ['beige', 'cream', 'taupe', 'sand', 'khaki'],
  brown: ['brown', 'tan', 'camel', 'chocolate', 'mocha'],
  burgundy: ['burgundy', 'wine', 'maroon', 'dark red', 'red'],
  navy: ['navy', 'navy blue', 'dark blue'],
  teal: ['teal', 'teal mint', 'cyan', 'turquoise'],
};

// Attribute-based scoring: direct keyword matching against shirt fields.
// This is the primary relevance signal for specific queries like "red shirt" or "casual linen".
function attributeScore(shirt: ShirtRecord, queryTokens: string[]): number {
  const colorField = shirt.color.toLowerCase();
  const nameField = shirt.name.toLowerCase();
  const styleField = shirt.style.toLowerCase();
  const patternField = shirt.pattern.toLowerCase();
  const fabricField = shirt.fabric.toLowerCase();
  const occasionField = shirt.occasion.toLowerCase();
  const descField = shirt.description.toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 2) continue;

    // Color matching (highest weight) — expand via synonym map
    const colorCandidates = COLOR_SYNONYMS[token] ?? [token];
    const colorMatched = colorCandidates.some(c => colorField.includes(c));
    if (colorMatched) score += 5;

    // Name (important: catches "tartan", "flannel", "oxford", etc.)
    if (nameField.includes(token)) score += 3;

    // Style/pattern/fabric (medium)
    if (styleField.includes(token)) score += 2;
    if (patternField.includes(token)) score += 2;
    if (fabricField.includes(token)) score += 2;

    // Occasion / description (supporting)
    if (occasionField.includes(token)) score += 1;
    if (descField.includes(token)) score += 0.5;
  }
  return score;
}

// ─── TF-IDF Vectorization ──────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  // Match sklearn default token_pattern: r"(?u)\b\w\w+\b" (2+ char words)
  // Strip unicode combining marks (accent stripping)
  const normalized = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return normalized.match(/\b\w{2,}\b/g) || [];
}

function buildNgrams(tokens: string[]): string[] {
  const out: string[] = [];
  // Unigrams (n=1)
  for (const t of tokens) out.push(t);
  // Bigrams (n=2)
  for (let i = 0; i < tokens.length - 1; i++) out.push(tokens[i] + ' ' + tokens[i + 1]);
  return out;
}

function tfidfVectorize(query: string): Float64Array {
  const tokens = tokenize(query);
  const grams = buildNgrams(tokens);

  // Count term frequencies
  const tf = new Map<number, number>();
  for (const g of grams) {
    const idx = m.vocabulary[g];
    if (idx !== undefined) tf.set(idx, (tf.get(idx) ?? 0) + 1);
  }

  // Sublinear TF scaling: 1 + log(count), then multiply by stored IDF
  const vec = new Float64Array(m.idf.length);
  for (const [idx, count] of tf) {
    vec[idx] = (1 + Math.log(count)) * m.idf[idx];
  }

  // L2 normalize (sklearn TfidfVectorizer default norm='l2')
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < vec.length; i++) vec[i] /= norm;

  return vec;
}

// ─── SVD Projection ───────────────────────────────────────────────────────────

function svdTransform(vec: Float64Array): Float64Array {
  // svd_components is V^T (n_components × n_features)
  // result[i] = dot(vec, V^T[i]) = X @ V for the i-th component
  const comps = m.svd_components;
  const out = new Float64Array(comps.length);
  for (let i = 0; i < comps.length; i++) {
    let dot = 0;
    const row = comps[i];
    for (let j = 0; j < vec.length; j++) dot += vec[j] * row[j];
    out[i] = dot;
  }
  return out;
}

// ─── L2 Normalize ─────────────────────────────────────────────────────────────

function l2Normalize(vec: Float64Array): Float64Array {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  const out = new Float64Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

// ─── KMeans Cluster Prediction ────────────────────────────────────────────────

function kmeansPredict(vec: Float64Array): number {
  const centers = m.kmeans_centers;
  let best = 0;
  let bestDist = Infinity;
  for (let c = 0; c < centers.length; c++) {
    let d = 0;
    for (let i = 0; i < vec.length; i++) {
      const diff = vec[i] - centers[c][i];
      d += diff * diff;
    }
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// ─── Cosine Similarity Against All Shirts ─────────────────────────────────────

function cosineScores(queryNorm: Float64Array): Float64Array {
  // Both query and stored embeddings are L2-normalized → dot product = cosine sim
  const mat = m.lsa_matrix_norm;
  const scores = new Float64Array(mat.length);
  for (let i = 0; i < mat.length; i++) {
    let dot = 0;
    const row = mat[i];
    for (let j = 0; j < queryNorm.length; j++) dot += queryNorm[j] * row[j];
    scores[i] = dot;
  }
  return scores;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Recommend shirts via a hybrid scorer:
 * 1. Attribute matching (color, name, style, fabric…) — primary signal
 * 2. TF-IDF → SVD (LSA) cosine similarity — semantic fallback
 * 3. KMeans cluster bonus — tiebreaker
 *
 * Weights: if any shirt gets attribute score > 0 → 70% attribute / 30% LSA.
 * If nothing matches attribute keywords → pure LSA (semantic mode).
 */
export function mlRecommend(query: string, topK = 3): MLResult[] {
  const q = query.trim().toLowerCase() || 'casual shirt';
  const queryTokens = tokenize(q);

  // ── LSA pipeline ──────────────────────────────────────────────────────────
  const queryTfidf = tfidfVectorize(q);
  const queryLsa = svdTransform(queryTfidf);
  const queryLsaN = l2Normalize(queryLsa);
  const lsaScores = cosineScores(queryLsaN);
  const queryCluster = kmeansPredict(queryLsaN);

  // ── Attribute scores ──────────────────────────────────────────────────────
  const attrScores = m.shirts.map(s => attributeScore(s, queryTokens));
  const maxAttr = Math.max(...attrScores);

  // Decide mix: if attributes signal anything, weight them heavily
  const useAttr = maxAttr > 0;
  const attrWeight = useAttr ? 0.70 : 0.0;
  const lsaWeight  = useAttr ? 0.30 : 1.0;

  // Normalize attribute scores to [0,1] so they're on the same scale as LSA cosines
  const attrNorm = attrScores.map(s => maxAttr > 0 ? s / maxAttr : 0);

  // ── Final hybrid score ────────────────────────────────────────────────────
  const finalScores = new Float64Array(m.shirts.length);
  for (let i = 0; i < m.shirts.length; i++) {
    const clusterBonus = m.shirts[i].cluster === queryCluster ? m.cluster_bonus : 0;
    finalScores[i] = (attrNorm[i] * attrWeight) + (lsaScores[i] * lsaWeight) + clusterBonus;
  }

  const indices = Array.from({ length: m.shirts.length }, (_, i) => i)
    .sort((a, b) => finalScores[b] - finalScores[a])
    .slice(0, topK);

  return indices.map((idx, rank) => {
    const s = m.shirts[idx];
    const isCold = COLD_FABRICS.some(f => s.fabric.toLowerCase().includes(f));
    const bonus = s.cluster === queryCluster ? m.cluster_bonus : 0;
    return {
      rank: rank + 1,
      id: s.id,
      name: s.name,
      style: s.style,
      color: s.color,
      pattern: s.pattern,
      fabric: s.fabric,
      fit: s.fit,
      occasion: s.occasion,
      description: s.description,
      imageUrl: s.image_url,
      category: isCold ? 'Cold' : 'Any',
      score: finalScores[idx],
      lsaScore: lsaScores[idx],
      clusterBonus: bonus,
      cluster: s.cluster,
    };
  });
}

/** Returns the full 30-shirt catalog from the ML model data. */
export function getShirtCatalog(): ShirtCatalogItem[] {
  return m.shirts.map(s => ({
    id: s.id,
    name: s.name,
    category: COLD_FABRICS.some(f => s.fabric.toLowerCase().includes(f)) ? 'Cold' : 'Any',
    imageUrl: s.image_url,
    gender: s.gender,
    style: s.style,
    color: s.color,
    pattern: s.pattern,
    fabric: s.fabric,
    fit: s.fit,
    occasion: s.occasion,
    description: s.description,
    cluster: s.cluster,
  }));
}
