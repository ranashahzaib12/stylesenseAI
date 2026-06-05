import type { Outfit } from '../types';
import { getShirtCatalog } from './mlRecommend';
import { generateAIEnhancedTryOn, classifyGarmentCategory } from './geminiService';

/**
 * Returns the shirt catalog sourced from the ML model (outfit_finder_model.pkl).
 * No external API call — data is embedded from the trained model parameters.
 */
export const fetchRecommendations = async (): Promise<Outfit[]> => {
  return getShirtCatalog();
};


// ---------------------------------------------------------------------------
// AR Virtual Try-On — powered by OpenAI gpt-image-1
// ---------------------------------------------------------------------------
// The original OOTDiffusion / Modal A10G GPU implementation is preserved in
// the comment block at the bottom of this file. To restore it:
//   1. Uncomment the "Legacy Modal implementation" section below.
//   2. Set VITE_MODAL_URL in .env.local.
//   3. Swap the function bodies back.
// ---------------------------------------------------------------------------

export type TryOnCategory = 'upper_body' | 'lower_body' | 'dresses';

function normalizeError(error: unknown): string {
    const err = error as (Error & { name?: string }) | null;
    const name = String(err?.name || '');
    const msg = String(err?.message || error || '');

    if (name === 'AbortError' || msg.toLowerCase().includes('abort')) {
        return 'Generation timed out. Please try again.';
    }
    if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('TimeoutError')) {
        return 'Generation timed out. Please try again.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED') || msg.includes('fetch')) {
        return 'Could not reach the try-on service. Please check your connection and retry.';
    }
    return msg || 'Virtual try-on failed. Please retry.';
}

/**
 * Performs virtual try-on using OpenAI gpt-image-1.
 * Accepts an optional garmentName for a more precise prompt.
 */
export const performVitonHDTryOn = async (
    personImageDataUrl: string,
    garmentDataUrl: string,
    _category: TryOnCategory = 'upper_body',
    garmentName = 'clothing garment',
): Promise<string> => {
    try {
        return await generateAIEnhancedTryOn(personImageDataUrl, garmentDataUrl, garmentName);
    } catch (error) {
        throw new Error(normalizeError(error));
    }
};

/**
 * Classifies a garment image into upper_body / lower_body / dresses
 * using GPT-4o-mini vision. Falls back to 'upper_body' on any error.
 */
export const detectGarmentCategory = async (
    garmentDataUrl: string,
): Promise<TryOnCategory> => {
    return classifyGarmentCategory(garmentDataUrl);
};


// ---------------------------------------------------------------------------
// Legacy: Original OOTDiffusion implementation via Modal A10G GPU
// To restore: set VITE_MODAL_URL in .env.local and swap the function bodies.
// ---------------------------------------------------------------------------
/*
const MODAL_URL = (process.env.VITE_MODAL_URL || '').replace(/\/+$/, '');
const BACKEND_URL = (process.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

export const performVitonHDTryOn_Modal = async (
    personImageDataUrl: string,
    garmentDataUrl: string,
    category: TryOnCategory = 'upper_body',
): Promise<string> => {
    const endpoint = MODAL_URL
        ? `${MODAL_URL}/tryon`
        : `${BACKEND_URL}/api/tryon/generate`;

    const payload = {
        personBase64: personImageDataUrl,
        garmentBase64: garmentDataUrl,
        category,
        numInferenceSteps: 40,
        imageScale: 2.5,
        seed: 42,
        enableRefinement: true,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 660_000);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let detail = `Try-on service returned error ${response.status}`;
            try {
                const body = await response.json();
                if (typeof body?.detail === 'string' && body.detail.trim()) detail = body.detail.slice(0, 300);
                else if (typeof body?.error === 'string' && body.error.trim()) detail = body.error.slice(0, 300);
            } catch { }
            throw new Error(detail);
        }

        const data = await response.json();
        const imageBase64 = data?.imageBase64;

        if (!imageBase64) throw new Error('Try-on service returned no image.');
        return imageBase64;

    } catch (error) {
        clearTimeout(timeoutId);
        throw new Error(normalizeError(error));
    }
};

export const detectGarmentCategory_Modal = async (
    garmentDataUrl: string,
): Promise<TryOnCategory> => {
    try {
        const endpoint = MODAL_URL
            ? `${MODAL_URL}/detect-category`
            : `${BACKEND_URL}/api/tryon/detect-category`;

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 25_000);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ garmentBase64: garmentDataUrl }),
            signal: controller.signal,
        });

        clearTimeout(tid);

        if (!response.ok) return 'upper_body';
        const data = await response.json();
        const cat = data?.category;
        if (cat === 'lower_body' || cat === 'dresses' || cat === 'upper_body') return cat;
        return 'upper_body';
    } catch {
        return 'upper_body';
    }
};
*/
