import type { Outfit } from '../types';

/**
 * Fetches outfit recommendations from a real product API.
 * Calls the Fake Store API for both men's and women's clothing,
 * combines them, filters out non-apparel items, and transforms the data
 * into the application's Outfit format.
 */
export const fetchRecommendations = async (): Promise<Outfit[]> => {
    try {
        const [womensResponse, mensResponse] = await Promise.all([
            fetch(`https://fakestoreapi.com/products/category/women's clothing?limit=12`),
            fetch(`https://fakestoreapi.com/products/category/men's clothing?limit=12`)
        ]);

        if (!womensResponse.ok || !mensResponse.ok) {
            throw new Error('Failed to fetch recommendations from the product API.');
        }

        const womensProducts = await womensResponse.json();
        const mensProducts = await mensResponse.json();

        const allProducts = [
            ...womensProducts.map((p: any) => ({ ...p, gender: 'Women' })),
            ...mensProducts.map((p: any) => ({ ...p, gender: 'Men' })),
        ];

        const NON_APPAREL_KEYWORDS = ['backpack', 'bag', 'bracelet', 'ring', 'necklace', 'earrings'];

        const outfits: Outfit[] = allProducts
            .filter((product: any) => {
                const title = product.title.toLowerCase();
                return product.image && !NON_APPAREL_KEYWORDS.some(keyword => title.includes(keyword));
            })
            .map((product: any) => ({
                id: product.id,
                name: product.title,
                category: product.title.toLowerCase().includes('jacket') || product.title.toLowerCase().includes('rain') ? 'Cold' : 'Any',
                imageUrl: product.image,
                gender: product.gender,
            }));

        return outfits;
    } catch (error) {
        console.error("API call to fetch recommendations failed:", error);
        return [
            { id: 101, name: 'Classic White Tee', category: 'Any', imageUrl: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg', gender: 'Women' },
            { id: 102, name: 'Denim Jacket', category: 'Cold', imageUrl: 'https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_.jpg', gender: 'Men' },
            { id: 103, name: 'Floral Summer Dress', category: 'Any', imageUrl: 'https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_.jpg', gender: 'Women' },
            { id: 104, name: 'Casual Slim Fit Shirt', category: 'Any', imageUrl: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg', gender: 'Men' },
        ];
    }
};


// ---------------------------------------------------------------------------
// AR Virtual Try-On — powered by OOTDiffusion on Modal A10G GPU
// ---------------------------------------------------------------------------

// VITE_MODAL_URL: call Modal directly (production — bypasses any proxy timeout limits).
// VITE_BACKEND_URL: Express backend proxy URL (dev, leave empty to use Vite's /api proxy).
// In dev with no VITE_MODAL_URL, Vite proxies /api → http://localhost:8787 automatically.
const MODAL_URL = (process.env.VITE_MODAL_URL || '').replace(/\/+$/, '');
const BACKEND_URL = (process.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

type TryOnCategory = 'upper_body' | 'lower_body' | 'dresses';

function normalizeError(error: unknown): string {
    const err = error as (Error & { name?: string }) | null;
    const name = String(err?.name || '');
    const msg = String(err?.message || error || '');

    // AbortController fires a DOMException with name 'AbortError'
    if (name === 'AbortError' || msg.toLowerCase().includes('abort')) {
        return 'Generation timed out (>11 min). The GPU may be cold-starting — please retry.';
    }
    if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('TimeoutError')) {
        return 'Generation timed out (>11 min). The GPU may be cold-starting — please retry.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED') || msg.includes('fetch')) {
        return 'Could not reach the try-on service. Please check your connection and retry.';
    }
    return msg || 'Virtual try-on failed. Please retry.';
}

/**
 * Performs a virtual try-on using OOTDiffusion on Modal's A10G GPU.
 *
 * When VITE_MODAL_URL is set (production), calls Modal directly.
 * Otherwise proxies through the local Express backend at /api/tryon/generate
 * (which Vite dev-server forwards to http://localhost:8787).
 *
 * @param personImageDataUrl - Base64 data URL of the person's photo.
 * @param garmentDataUrl     - Base64 data URL of the garment image.
 * @param category           - Garment category detected by detectGarmentCategory().
 * @returns Base64 data URL of the generated try-on image.
 */
export const performVitonHDTryOn = async (
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
    // 11-minute timeout — covers Modal cold start (~90s) + inference (~65s)
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
            } catch { /* ignore JSON parse error on error body */ }
            throw new Error(detail);
        }

        const data = await response.json();
        const imageBase64 = data?.imageBase64;

        if (!imageBase64) {
            throw new Error('Try-on service returned no image.');
        }

        return imageBase64;

    } catch (error) {
        clearTimeout(timeoutId);
        throw new Error(normalizeError(error));
    }
};


/**
 * Detects the garment category (upper_body / lower_body / dresses)
 * using Modal's ATR ONNX body-parsing model.
 * Returns 'upper_body' as safe fallback on any error.
 *
 * @param garmentDataUrl - Base64 data URL of the garment image.
 */
export const detectGarmentCategory = async (
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
