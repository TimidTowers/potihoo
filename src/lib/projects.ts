import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/utils';

export type ProjectEntry = CollectionEntry<'projects'>;
export type GalleryEntry = ProjectEntry['data']['gallery'][number];

/** Display order of the four portfolio categories. */
export const CATEGORY_ORDER = ['animation', 'characters', 'illustration', 'backgrounds'] as const;
export type Category = (typeof CATEGORY_ORDER)[number];

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
