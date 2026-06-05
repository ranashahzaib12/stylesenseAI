import OpenAI from 'openai';
import type { Outfit } from '../types';
import { mlRecommend } from './mlRecommend';

// ─── Shared helpers ────────────────────────────────────────────────────────────

const fetchImageAsFile = async (source: string, filename: string): Promise<File> => {
  if (source.startsWith('data:')) {
    const [header, b64] = source.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  }
  const res = await fetch(source);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

const getClient = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const keywordFallback = (prompt: string, outfits: Outfit[]): Outfit[] => {
  const stopWords = new Set(['a', 'an', 'the', 'for', 'of', 'in', 'with', 'and', 'or', 'is', 'to', 'at', 'my', 'me']);
  const keywords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  const semanticMap: Record<string, string[]> = {
    sweater: ['shirt', 'top', 'tee', 'fleece', 'jacket', 'knit'],
    blazer: ['jacket', 'coat', 'shirt'],
    dress: ['shirt', 'top'],
    pants: ['slim', 'casual', 'fit'],
    casual: ['casual', 'slim', 'tee', 'shirt'],
    formal: ['dress', 'shirt', 'jacket'],
    summer: ['shirt', 'tee', 'light', 'short'],
    winter: ['jacket', 'fleece', 'coat', 'rain', 'snowboard'],
    autumn: ['jacket', 'shirt', 'long'],
    spring: ['shirt', 'light', 'tee'],
    cozy: ['fleece', 'jacket', 'shirt'],
    elegant: ['dress', 'shirt', 'slim', 'formal'],
    classic: ['shirt', 'oxford', 'polo', 'classic'],
    professional: ['dress', 'shirt', 'jacket'],
    workout: ['moisture', 'sport', 'short', 'shirt'],
    vibrant: ['shirt', 'top', 'tee'],
    navy: ['blue', 'shirt', 'jacket'],
    floral: ['dress', 'shirt', 'women'],
    moto: ['biker', 'leather', 'jacket'],
    slim: ['slim', 'fit', 'casual'],
    jacket: ['jacket', 'coat', 'rain', 'biker', 'snowboard'],
    shirt: ['shirt', 'tee', 'top', 'dress'],
  };

  const scored = outfits.map(outfit => {
    const haystack = `${outfit.name} ${outfit.category} ${outfit.gender}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        score += 3;
      }
      const synonyms = semanticMap[kw] || [];
      for (const syn of synonyms) {
        if (haystack.includes(syn)) { score += 1; break; }
      }
    }
    return { ...outfit, score };
  });

  const withScore = scored.filter(o => o.score > 0).sort((a, b) => b.score - a.score);
  if (withScore.length > 0) return withScore.slice(0, 2);

  // Last resort: return the first 2 items so the user always sees something
  return outfits.slice(0, 2);
};

export const findMatchingOutfits = async (prompt: string, outfits: Outfit[]): Promise<Outfit[]> => {
  if (!prompt) return [];

  try {
    // Use the trained ML pickle model (TF-IDF → SVD → KMeans hybrid scoring)
    const results = mlRecommend(prompt, 3);
    return results.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      imageUrl: r.imageUrl,
      style: r.style,
      color: r.color,
      pattern: r.pattern,
      fabric: r.fabric,
      fit: r.fit,
      occasion: r.occasion,
      description: r.description,
      cluster: r.cluster,
    }));
  } catch (error) {
    console.error('ML recommendation failed, falling back to keywords:', error);
    return keywordFallback(prompt, outfits.length ? outfits : []);
  }
};

export const getGeminiChatResponse = async (prompt: string): Promise<string> => {
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content ?? "I'm not sure how to respond.";
  } catch (error) {
    console.error('AI chat error:', error);
    return "I'm having trouble connecting to the AI service right now. Please try again.";
  }
};

export const generateSocialMediaCaptions = async (garmentName: string): Promise<{ [key: string]: string }> => {
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate 3 short engaging social media captions for a virtual try-on photo.
Return ONLY a JSON object with keys: instagram, twitter, facebook.`,
        },
        {
          role: 'user',
          content: `Create captions for a "${garmentName}" virtual try-on photo.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      instagram: parsed.instagram || '',
      twitter: parsed.twitter || '',
      facebook: parsed.facebook || '',
    };

  } catch (error) {
    console.error('Caption generation error:', error);
    throw error;
  }
};

// ─── Feature 1: Person image validation ────────────────────────────────────────

export const validatePersonImage = async (
  imageBase64: string
): Promise<{ valid: boolean; reason: string }> => {
  try {
    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are checking if an image is suitable for virtual clothing try-on.

REQUIREMENTS — the image must:
1. Show exactly ONE real person
2. Show the full upper body clearly: head, shoulders, chest, torso, and at minimum down to the waist
3. Be clear and not heavily blurred or distorted
4. Have the person facing mostly forward (not fully sideways or from behind)

Analyze the image strictly against these requirements and return ONLY this JSON:
{ "valid": true or false, "reason": "one clear sentence" }

If valid: reason = confirmation (e.g. "Full upper body is visible and facing forward.")
If invalid: reason = specific problem (e.g. "Only the face is visible — we need to see at least down to the waist." or "No person detected in this image." or "Person is viewed from behind.")`,
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'low' },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 80,
    });

    const parsed = JSON.parse(
      response.choices[0].message.content || '{"valid":false,"reason":"Could not analyze image."}'
    );
    return { valid: !!parsed.valid, reason: parsed.reason || '' };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: true, reason: '' };
  }
};

// ─── Feature 2: AI-powered virtual try-on ──────────────────────────────────────

export const generateAIEnhancedTryOn = async (
  personImageSource: string,
  garmentImageSource: string,
  garmentName: string
): Promise<string> => {
  const [personFile, garmentFile] = await Promise.all([
    fetchImageAsFile(personImageSource, 'person.png'),
    fetchImageAsFile(garmentImageSource, 'garment.png'),
  ]);

  const prompt = `You are a professional virtual fashion try-on system. Your sole task is to dress the person in Image 1 wearing the exact garment shown in Image 2.

GARMENT: "${garmentName}"

═══ PRESERVE EXACTLY — DO NOT CHANGE ANY OF THESE ═══
• FACE & IDENTITY: The person's face, every facial feature, expression, and skin tone must be 100% pixel-perfect identical to Image 1. No alterations, no beautification, no changes whatsoever.
• BODY: Same body shape, proportions, size, and exact pose as Image 1. Do not change height, weight, posture, or any body part.
• HAIR: Exact same hairstyle, hair color, and hair length as Image 1. No changes.
• BACKGROUND: Keep the exact background, environment, scenery, and lighting from Image 1 completely unchanged.
• ACCESSORIES: Preserve all accessories the person wears in Image 1 (glasses, jewelry, watches, hats, bags) exactly as they appear.
• OTHER CLOTHING: Any clothing item NOT being replaced (pants, shoes, socks, jacket, etc.) must remain exactly as in Image 1.

═══ APPLY THE GARMENT WITH PERFECT FIDELITY ═══
• COLOR: The garment must be the precise, exact color(s) from Image 2 — not an approximation or similar shade, the exact same hue, saturation, and brightness.
• PATTERN & TEXTURE: Every stripe, print, graphic, logo, embroidery, texture, weave pattern, or design detail from Image 2 must be reproduced with complete accuracy.
• DESIGN: Match the exact cut, neckline, collar style, sleeve length and shape, hemline, button style, zipper, pockets, and every structural design element.
• FIT: The garment drapes and fits naturally on the person's body with realistic fabric physics and natural wrinkles.
• PLACEMENT: Position and align the garment correctly on the person's body based on its clothing type (upper body, lower body, or full outfit).

═══ OUTPUT REQUIREMENTS ═══
• Fully photorealistic — must look exactly like a real fashion photograph taken of the person
• Same image composition, framing, angle, and crop as Image 1
• Absolutely no added text, watermarks, borders, frames, or graphic overlays
• No cartoon, illustration, painting, or AI-generated aesthetic — pure photorealism only
• The final image should be visually indistinguishable from a real photograph of the person wearing the garment`;

  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image[]', personFile, 'person.png');
  formData.append('image[]', garmentFile, 'garment.png');
  formData.append('prompt', prompt);
  formData.append('size', '1024x1024');
  formData.append('quality', 'high');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180_000);

  try {
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `Try-on failed (${res.status}).`;
      throw new Error(msg);
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('The AI returned no image. Please try again.');
    return `data:image/png;base64,${b64}`;
  } catch (error) {
    clearTimeout(timeoutId);
    const err = error as Error;
    if (err.name === 'AbortError') throw new Error('Try-on timed out after 3 minutes. Please try again.');
    throw error;
  }
};

// ─── Feature 3: Garment category classification ─────────────────────────────────

export const classifyGarmentCategory = async (
  garmentImageSource: string,
): Promise<'upper_body' | 'lower_body' | 'dresses'> => {
  try {
    const openai = getClient();
    const imageData = garmentImageSource.startsWith('data:')
      ? garmentImageSource
      : garmentImageSource;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Classify this clothing item. Reply with ONLY one of these exact values, nothing else:
upper_body — for tops, shirts, t-shirts, blouses, jackets, hoodies, sweaters, coats
lower_body — for pants, jeans, shorts, skirts, trousers, leggings
dresses — for dresses, jumpsuits, rompers, overalls`,
            },
            {
              type: 'image_url',
              image_url: { url: imageData, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 15,
    });

    const raw = response.choices[0].message.content?.trim().toLowerCase().replace(/[^a-z_]/g, '') ?? '';
    if (raw === 'lower_body') return 'lower_body';
    if (raw === 'dresses') return 'dresses';
    return 'upper_body';
  } catch {
    return 'upper_body';
  }
};
