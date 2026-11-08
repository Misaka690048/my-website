import { getCollection } from 'astro:content';
import { connectWorks } from './work-links';
import publication from '../data/publication.json';
export { workURL, coverTransition } from './work-links';

export async function libraryWorks() {
  const [works, reviews] = await Promise.all([getCollection('works'), getCollection('reviews')]);
  return connectWorks(works, reviews, import.meta.env.DEV || publication.includeTestContent);
}
export type LibraryWork = Awaited<ReturnType<typeof libraryWorks>>[number];
