import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      title_en: z.string().optional(),
      description: z.string(),
      description_en: z.string().optional(),
      category: z.enum(['animation', 'characters', 'illustration', 'backgrounds']),
      year: z.union([z.number(), z.string()]),
      cover: image(),
      gallery: z
        .array(
          z.object({
            image: image(),
            caption: z.string().optional(),
            caption_en: z.string().optional(),
          })
        )
        .default([]),
      video: z.string().optional(),
      role: z.string().optional(),
      client: z.string().optional(),
      tools: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      order: z.number().default(0),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/about' }),
  schema: z.object({
    lang: z.enum(['es', 'en']),
    name: z.string(),
    headline: z.string(),
    bio: z.string(),
    approach: z.string(),
    portrait: z.string().optional(),
    tools: z.array(z.string()).default([]),
    experience: z.array(z.object({
      role: z.string(),
      org: z.string(),
      period: z.string(),
    })).default([]),
    education: z.array(z.object({
      title: z.string(),
      org: z.string(),
      period: z.string(),
    })).default([]),
  }),
});

/** Ajustes globales editables desde el CMS (banner, email, redes). */
const settings = defineCollection({
  loader: glob({ pattern: '*.{yml,yaml,json}', base: './src/content/settings' }),
  schema: ({ image }) =>
    z.object({
      email: z.string(),
      banner: z
        .array(
          z.object({
            image: image(),
            alt: z.string().optional(),
          })
        )
        .default([]),
      socials: z
        .array(
          z.object({
            label: z.string(),
            handle: z.string().optional(),
            url: z.string(),
          })
        )
        .default([]),
    }),
});

export const collections = { projects, about, settings };
