import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/utils';

export type ProjectEntry = CollectionEntry<'projects'>;

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
