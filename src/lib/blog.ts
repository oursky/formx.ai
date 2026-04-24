import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type WhatsNewEntry = CollectionEntry<'whatsNew'>;

export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getCollection(
    'blog',
    ({ data }) => !data.draft && data.category === category
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getLatestPosts(count: number = 3): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.slice(0, count);
}

export async function getRelatedPosts(
  currentId: string,
  category: string,
  count: number = 3
): Promise<BlogPost[]> {
  const posts = await getCollection(
    'blog',
    ({ data, id }) => !data.draft && id !== currentId && data.category === category
  );
  const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  // If not enough in category, fill with latest posts from other categories
  if (sorted.length >= count) return sorted.slice(0, count);
  const remaining = await getCollection(
    'blog',
    ({ data, id }) => !data.draft && id !== currentId && data.category !== category
  );
  const fillerPosts = remaining
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, count - sorted.length);
  return [...sorted, ...fillerPosts];
}

export const CATEGORY_LABELS: Record<string, string> = {
  accounting: 'Accounting',
  automation: 'Automation',
  guide: 'Guide',
  'machine-learning': 'Machine Learning',
  'ocr-software': 'OCR Software',
};

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
