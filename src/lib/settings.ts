import { getCollection, type CollectionEntry } from 'astro:content';

export type SiteSettings = CollectionEntry<'settings'>['data'];

const FALLBACK: SiteSettings = {
  email: 'anapaulatvi@gmail.com',
  banner: [],
  socials: [],
};

/**
 * Ajustes del sitio (editables desde el CMS en "Ajustes del sitio").
 * Si el archivo faltara, el sitio sigue funcionando con valores mínimos.
 */
export async function getSettings(): Promise<SiteSettings> {
  const entries = await getCollection('settings');
  return entries[0]?.data ?? FALLBACK;
}
