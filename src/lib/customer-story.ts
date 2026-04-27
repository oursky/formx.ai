import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
export { formatDate } from './blog';

export type CustomerStoryEntry = CollectionEntry<'customerStory'>;

export async function getAllStories(): Promise<CustomerStoryEntry[]> {
  const stories = await getCollection('customerStory', ({ data }) => !data.draft);
  return stories.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getFeaturedStory(): Promise<CustomerStoryEntry | undefined> {
  const stories = await getAllStories();
  return stories.find((s) => s.data.featured) ?? stories[0];
}

export async function getRelatedStories(
  currentId: string,
  limit: number = 3
): Promise<CustomerStoryEntry[]> {
  const stories = await getCollection(
    'customerStory',
    ({ data, id }) => !data.draft && id !== currentId
  );
  return stories
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, limit);
}
