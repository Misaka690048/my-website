import catalog from '../data/tag-catalog.json' with { type: 'json' };
import { countTags } from './tags.ts';

export const tagGroups = ['小说', '电子与计算机'];
export const tagPageURL = (tag: string) => `/tags/${encodeURIComponent(tag)}/`;
export function tagInfo(name: string) {
  return catalog.find(tag => tag.name === name)
    ?? { name, group: 'Other', description: '' };
}
export function groupedTags(posts: { data: { tags: string[] } }[]) {
  const tags = countTags(posts).map(([name, count]) => ({ ...tagInfo(name), count }));
  return [...tagGroups, 'Other'].map(name => ({
    name,
    tags: tags.filter(tag => tag.group === name).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN')),
  })).filter(group => group.tags.length > 0);
}
