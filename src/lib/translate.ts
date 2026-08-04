/**
 * Traducción automática ES → EN en tiempo de build (DeepL API free).
 *
 * - Solo se usa cuando un campo *_en está vacío: lo escrito a mano siempre gana.
 * - Si no hay API key, falla la red o se agota la cuota, devuelve undefined y
 *   el sitio cae al texto en español — el build NUNCA se rompe por esto.
 * - Cache en memoria por build para no repetir llamadas entre páginas (es/en).
 */

const API_KEY: string | undefined =
  (typeof import.meta !== 'undefined' && import.meta.env?.DEEPL_API_KEY) ||
  (typeof process !== 'undefined' ? process.env?.DEEPL_API_KEY : undefined);

const API_URL = 'https://api-free.deepl.com/v2/translate';

const cache = new Map<string, string>();
let warnedNoKey = false;

export async function translateEsToEn(text: string | undefined | null): Promise<string | undefined> {
  if (!text || !text.trim()) return undefined;

  if (!API_KEY) {
    if (!warnedNoKey) {
      console.warn('[translate] DEEPL_API_KEY no definida — los campos EN vacíos mostrarán el texto en español.');
      warnedNoKey = true;
    }
    return undefined;
  }

  const hit = cache.get(text);
  if (hit) return hit;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], source_lang: 'ES', target_lang: 'EN-US' }),
    });

    if (!res.ok) throw new Error(`DeepL respondió ${res.status}`);

    const data = (await res.json()) as { translations?: Array<{ text?: string }> };
    const translated = data.translations?.[0]?.text;

    if (typeof translated === 'string' && translated.length > 0) {
      cache.set(text, translated);
      return translated;
    }
    return undefined;
  } catch (err) {
    console.warn(`[translate] Fallback a español ("${text.slice(0, 40)}…"):`, (err as Error).message);
    return undefined;
  }
}
