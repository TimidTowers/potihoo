import es from './es.json';
import en from './en.json';

export const languages = {
  es: 'Español',
  en: 'English',
} as const;

export const defaultLang = 'es';

export type Lang = keyof typeof languages;

const dictionaries = { es, en } as const;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in languages) return lang as Lang;
  return defaultLang;
}

/**
 * Returns a function that resolves dotted translation keys for the given lang.
 *   const t = useTranslations('en');
 *   t('nav.home') // → "Home"
 */
export function useTranslations(lang: Lang) {
  const dict = dictionaries[lang] ?? dictionaries[defaultLang];
  return function t(key: string): string {
    const value = key
      .split('.')
      .reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), dict);
    if (typeof value === 'string') return value;
    return key;
  };
}

/**
 * Build a localized URL. For the default locale (es) we strip the prefix.
 */
export function localizedPath(path: string, lang: Lang): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return `/${lang}${clean === '/' ? '' : clean}`;
}

/**
 * Strip the locale prefix from a pathname so we can switch languages while
 * staying on the same page.
 */
export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && segments[0] in languages) {
    segments.shift();
  }
  return '/' + segments.join('/');
}
