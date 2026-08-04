import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/utils';

export type ProjectEntry = CollectionEntry<'projects'>;
export type GalleryEntry = ProjectEntry['data']['gallery'][number];

/** Display order of the four portfolio categories. */
export const CATEGORY_ORDER = ['animation', 'characters', 'illustration', 'backgrounds'] as const;
export type Category = (typeof CATEGORY_ORDER)[number];

/** URL slug of each category page, per language (es sin prefijo, en bajo /en/). */
export const CATEGORY_SLUGS: Record<Lang, Record<Category, string>> = {
  es: { animation: 'animacion', characters: 'personajes', illustration: 'ilustracion', backgrounds: 'fondos' },
  en: { animation: 'animation', characters: 'characters', illustration: 'illustration', backgrounds: 'backgrounds' },
};

export function categoryPath(cat: Category, lang: Lang): string {
  const slug = CATEGORY_SLUGS[lang][cat];
  return lang === 'es' ? `/${slug}` : `/${lang}/${slug}`;
}

export async function getPublishedProjects(): Promise<ProjectEntry[]> {
  const all = await getCollection('projects', ({ data }) => !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeaturedProjects(): Promise<ProjectEntry[]> {
  const all = await getPublishedProjects();
  return all.filter((p) => p.data.featured);
}

export function localizedTitle(p: ProjectEntry, lang: Lang): string {
  if (lang === 'en' && p.data.title_en) return p.data.title_en;
  return p.data.title;
}

export function localizedDescription(p: ProjectEntry, lang: Lang): string {
  if (lang === 'en' && p.data.description_en) return p.data.description_en;
  return p.data.description;
}

export function localizedCaption(g: GalleryEntry, lang: Lang): string | undefined {
  if (lang === 'en') return g.caption_en ?? g.caption;
  return g.caption;
}

/* --------------------------------------------------------------------------
 * Variantes "auto": si el campo *_en está vacío, traducen el español con
 * DeepL en build time (con fallback silencioso al español si algo falla).
 * Lo escrito a mano en el CMS siempre tiene prioridad.
 * ------------------------------------------------------------------------ */
import { translateEsToEn } from '@/lib/translate';

export async function localizedTitleAuto(p: ProjectEntry, lang: Lang): Promise<string> {
  if (lang !== 'en') return p.data.title;
  if (p.data.title_en) return p.data.title_en;
  return (await translateEsToEn(p.data.title)) ?? p.data.title;
}

export async function localizedDescriptionAuto(p: ProjectEntry, lang: Lang): Promise<string> {
  if (lang !== 'en') return p.data.description;
  if (p.data.description_en) return p.data.description_en;
  return (await translateEsToEn(p.data.description)) ?? p.data.description;
}

export async function localizedCaptionAuto(g: GalleryEntry, lang: Lang): Promise<string | undefined> {
  if (lang !== 'en') return g.caption;
  if (g.caption_en) return g.caption_en;
  if (!g.caption) return undefined;
  return (await translateEsToEn(g.caption)) ?? g.caption;
}
