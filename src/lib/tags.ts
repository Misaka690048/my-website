export const matchesTags = (tags: readonly string[], selected: readonly string[]) =>
  selected.every(tag => tags.includes(tag));

export const selectedTags = (search: string) =>
  [...new Set(new URLSearchParams(search).getAll('tag').filter(Boolean))];

export function tagURL(path: string, tags: readonly string[]) {
  const params = new URLSearchParams();
  [...new Set(tags)].forEach(tag => params.append('tag', tag));
  return path + (params.size ? `?${params}` : '');
}

export function countTags(posts: { data: { tags: string[] } }[]) {
  const counts = new Map<string, number>();
  posts.forEach(post => post.data.tags.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
  return [...counts].sort(([a], [b]) => a.localeCompare(b, 'zh-CN'));
}
