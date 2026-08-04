import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';

export interface BannerSlide {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
}

interface Props {
  slides: BannerSlide[];
  lang: 'es' | 'en';
}

const INTERVAL_MS = 4500;

export default function BannerCarousel({ slides, lang }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const t =
    lang === 'en'
      ? { label: 'Banner', prev: 'Previous slide', next: 'Next slide', goto: 'Go to slide' }
      : { label: 'Banner', prev: 'Anterior', next: 'Siguiente', goto: 'Ir a la imagen' };

  // Auto-advance (only with 2+ slides), paused while hovering
  useEffect(() => {
    if (count < 2 || paused) return;
    timer.current = setInterval(() => setActive((i) => (i + 1) % count), INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-roledescription="carousel"
        aria-label={t.label}
        className="group relative w-full overflow-hidden bg-ink"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* aspect-video mantiene la proporción real del arte; el max-h solo
            recorta levemente en pantallas muy anchas para no comerse la página */}
        <div className="relative aspect-video max-h-[640px] w-full">
          {slides.map((s, i) => (
            <motion.img
              key={s.src}
              src={s.src}
              srcSet={s.srcSet}
              sizes="100vw"
              width={s.width}
              height={s.height}
              alt={i === active ? s.alt : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              initial={false}
              animate={{ opacity: i === active ? 1 : 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="absolute inset-0 size-full object-cover object-center"
              aria-hidden={i !== active}
            />
          ))}
          {/* Subtle bottom fade so the banner blends into the page */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-ink/70" />
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label={t.prev}
              onClick={() => setActive((active - 1 + count) % count)}
              className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ink/50 text-paper opacity-0 backdrop-blur transition-opacity hover:bg-magenta-500 group-hover:opacity-100"
            >
              ←
            </button>
            <button
              type="button"
              aria-label={t.next}
              onClick={() => setActive((active + 1) % count)}
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-ink/50 text-paper opacity-0 backdrop-blur transition-opacity hover:bg-magenta-500 group-hover:opacity-100"
            >
              →
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${t.goto} ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  className={`size-2 rounded-full transition-colors ${
                    i === active ? 'bg-sun-500' : 'bg-paper/40 hover:bg-paper/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </MotionConfig>
  );
}
