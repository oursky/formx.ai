import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogCategories = [
  'accounting',
  'automation',
  'guide',
  'machine-learning',
  'ocr-software',
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
    featured: z.boolean().default(false),
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

const customerStory = defineCollection({
  loader: glob({ base: './src/content/customer-story', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    customer_name: z.string(),
    industry: z.string(),
    location: z.string().optional(),
    customer_logo: z.string().optional(),
    customer_logo_alt: z.string().default(''),
    featured_image: z.string(),
    featured_image_alt: z.string().default(''),
    metrics: z.array(z.object({
      value: z.string(),
      label: z.string(),
      icon: z.string(),
      icon_alt: z.string().default(''),
    })).default([]),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    og_title: z.string().optional(),
    og_description: z.string().optional(),
    og_image: z.string().optional(),
    twitter_card: z.string().default('summary_large_image'),
    canonical_url: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, whatsNew, legal, customerStory };
