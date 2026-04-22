import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogCategories = [
  'accounting',
  'automation',
  'features',
  'guide',
  'machine-learning',
  'ocr-software',
  'tools',
] as const;

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    category: z.enum(blogCategories),
    author: z.string().default('FormX'),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    featured_image: z.string(),
    featured_image_alt: z.string().default(''),
    og_title: z.string().optional(),
    og_description: z.string().optional(),
    og_image: z.string().optional(),
    twitter_card: z.string().default('summary_large_image'),
    canonical_url: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const whatsNew = defineCollection({
  loader: glob({ base: './src/content/whats-new', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tag: z.string().default('NEW FEATURES'),
    featured_image: z.string(),
    og_title: z.string().optional(),
    og_description: z.string().optional(),
    og_image: z.string().optional(),
    twitter_card: z.string().default('summary_large_image'),
    canonical_url: z.string().optional(),
  }),
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    heading: z.string(),
    description: z.string().default(''),
    canonicalUrl: z.string().optional(),
  }),
});

export const collections = { blog, whatsNew, legal };
