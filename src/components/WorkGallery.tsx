import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';

export interface GalleryItem {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  title: string;
  caption: string;
  /** Category label shown as a chip above the image in the lightbox. */
  sectionLabel: string;
}

export interface GallerySection {
  id: string;
  label: string;
  items: GalleryItem[];
}

interface Props {
  sections: GallerySection[];
  emptyLabel: string;
  lang: 'es' | 'en';
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function WorkGallery({ sections, emptyLabel, lang }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  // Single-category mode: the page supplies its own header, so no tabs/h2 here.
  const single = sections.length === 1;

  const t = useMemo(
    () =>
      lang === 'en'
        ? { close: 'Close', prev: 'Previous', next: 'Next', open: 'Open image' }
        : { close: 'Cerrar', prev: 'Anterior', next: 'Siguiente', open: 'Abrir imagen' },
    [lang]
  );

  // Flattened list for modal prev/next across every section
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  // Map section+item position → flat index
  const flatOffset = useMemo(() => {
    const offsets: Record<string, number> = {};
    let acc = 0;
    for (const s of sections) {
      offsets[s.id] = acc;
      acc += s.items.length;
    }
    return offsets;
  }, [sections]);

  // Track which section is on screen to highlight its tab
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    for (const s of sections) {
      const el = sectionRefs.current[s.id];
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [sections]);

  // Keyboard + scroll-lock while the modal is open
  useEffect(() => {
    if (modalIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalIndex(null);
      if (e.key === 'ArrowRight') setModalIndex((i) => (i === null ? null : (i + 1) % flat.length));
      if (e.key === 'ArrowLeft') setModalIndex((i) => (i === null ? null : (i - 1 + flat.length) % flat.length));
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [modalIndex, flat.length]);

  const scrollToSection = useCallback((id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }, []);

  const current = modalIndex !== null ? flat[modalIndex] : null;

  return (
    <MotionConfig reducedMotion="user">
      {/* Category tabs — anchors, not filters (hidden in single-category mode) */}
      {!single && (
      <nav
        aria-label="Categorías"
        className="sticky top-[68px] z-30 border-b border-paper/10 bg-ink/75 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-5 py-3 lg:px-10">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(s.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                activeId === s.id
                  ? 'border-magenta-500 bg-magenta-500 text-paper'
                  : 'border-paper/20 text-paper/80 hover:border-paper'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>
      )}

      {/* One section per category: big header + continuous vertical strip */}
      <div className="mx-auto w-full max-w-3xl px-5 md:max-w-4xl lg:max-w-[60rem] lg:px-8">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}
            className={single ? 'scroll-mt-36 pb-14 pt-2 md:pb-20 md:pt-4' : 'scroll-mt-36 py-14 md:py-20'}
          >
            {!single && (
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mb-8 font-display text-4xl font-semibold tracking-tight md:mb-12 md:text-6xl"
            >
              {section.label}
              <span className="text-magenta-500">.</span>
            </motion.h2>
            )}

            {section.items.length === 0 ? (
              <p className="italic text-paper/50">{emptyLabel}</p>
            ) : (
              <div className="flex flex-col gap-6 md:gap-10">
                {section.items.map((item, i) => (
                  <motion.button
                    key={`${section.id}-${i}`}
                    type="button"
                    onClick={() => setModalIndex(flatOffset[section.id] + i)}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    whileHover={{ scale: 1.015 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="group block w-full overflow-hidden rounded-2xl bg-paper/5 text-left"
                    aria-label={`${t.open}: ${item.title}`}
                    aria-haspopup="dialog"
                  >
                    <img
                      src={item.src}
                      srcSet={item.srcSet}
                      sizes={item.sizes}
                      width={item.width}
                      height={item.height}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="block h-auto w-full"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {current && modalIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/92 p-4 backdrop-blur-sm md:p-8"
            onClick={() => setModalIndex(null)}
          >
            <motion.figure
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="relative flex max-h-full w-full max-w-5xl flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="mb-3 inline-block rounded-full bg-magenta-500 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-paper">
                {current.sectionLabel}
              </span>
              <img
                src={current.src}
                srcSet={current.srcSet}
                sizes="92vw"
                alt={current.title}
                className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain"
              />
              <figcaption className="mt-5 w-full max-w-2xl text-center">
                <p className="font-display text-xl font-semibold text-paper md:text-2xl">{current.title}</p>
                {current.caption && <p className="mt-2 text-sm leading-relaxed text-paper/70 md:text-base">{current.caption}</p>}
                <p className="mt-3 font-mono text-[11px] tracking-widest text-paper/40">
                  {modalIndex + 1} / {flat.length}
                </p>
              </figcaption>

              <button
                type="button"
                onClick={() => setModalIndex(null)}
                aria-label={t.close}
                className="absolute -top-2 right-0 grid size-10 place-items-center rounded-full bg-paper/10 text-paper transition-colors hover:bg-magenta-500 md:-right-2"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => setModalIndex((modalIndex - 1 + flat.length) % flat.length)}
                aria-label={t.prev}
                className="absolute left-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/10 text-lg text-paper transition-colors hover:bg-fire-500 md:-left-2"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setModalIndex((modalIndex + 1) % flat.length)}
                aria-label={t.next}
                className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/10 text-lg text-paper transition-colors hover:bg-fire-500 md:-right-2"
              >
                →
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
