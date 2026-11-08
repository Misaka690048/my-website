import { getCollection } from 'astro:content';
import publication from '../data/publication.json';
export async function sortedPosts() {
  return (await getCollection('posts', post => import.meta.env.DEV || publication.includeTestContent || !post.data.preview)).sort((a, b) =>
    b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
}
// Unique CSS identifier, including for Chinese filenames.
export const titleTransition = (id: string) =>
  `post-${Array.from(id, char => char.codePointAt(0)!.toString(16)).join('-')}`;
export const metadataTransition = (id: string, part: 'date' | 'tags') =>
  `${titleTransition(id)}-${part}`;
