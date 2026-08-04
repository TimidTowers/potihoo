import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { Lang } from '@/i18n/utils';
import { useTranslations } from '@/i18n/utils';
import type { GalleryItem, GallerySection } from '@/components/WorkGallery';
import {
  getPublishedProjects,
  localizedTitleAuto,
  localizedDescriptionAuto,
  localizedCaptionAuto,
  type Category,
} from '@/lib/projects';

// Columna limitada a ~60rem; en móvil ancho completo menos el padding de página.
const SIZES = '(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) 88vw, 60rem';

async function toItem(
  img: ImageMetadata,
  title: string,
  caption: string,
  sectionLabel: string,
  video?: string
): Promise<GalleryItem> {
  const opt = await getImage({ src: img, widths: [640, 960, 1280, 1920], format: 'webp', quality: 90 });
  return {
    src: opt.src,
    srcSet: opt.srcSet.attribute,
    sizes: SIZES,
    width: img.width,
    height: img.height,
    title,
    caption,
    sectionLabel,
    ...(video ? { video } : {}),
  };
}

/** Arma la sección (tira vertical) de una categoría, con imágenes optimizadas. */
export async function buildGallerySection(cat: Category, lang: Lang): Promise<GallerySection> {
  const t = useTranslations(lang);
  const label = t(`work.categories.${cat}`);
  const projects = await getPublishedProjects();

  const items: GalleryItem[] = [];
  for (const p of projects.filter((p) => p.data.category === cat)) {
    const title = await localizedTitleAuto(p, lang);
    const fallback = await localizedDescriptionAuto(p, lang);
    // Proyectos sin galería explícita aportan su portada.
    if (p.data.gallery.length === 0) {
      items.push(await toItem(p.data.cover, title, fallback, label));
    } else {
      for (const g of p.data.gallery) {
        items.push(await toItem(g.image, title, (await localizedCaptionAuto(g, lang)) ?? fallback, label, g.video));
      }
    }
  }

  return { id: cat, label, items };
}
