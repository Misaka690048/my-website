import test from 'node:test';
import assert from 'node:assert/strict';
import { groupedTags, tagInfo, tagPageURL } from '../src/lib/tag-catalog.ts';

test('directory groups used tags and counts matching entries, excluding unused catalog entries', () => {
  const posts = [{data:{tags:['科幻小说']}}, {data:{tags:['科幻小说']}}, {data:{tags:['C++','递归']}}];
  const groups = groupedTags(posts);
  assert.deepEqual(groups.map(group => group.name), ['小说','电子与计算机']);
  assert.equal(groups[0].tags[0].count, 2);
  assert.equal(groups.flatMap(group => group.tags).length, 3);
  assert.deepEqual(groupedTags([]), []);
});

test('new uncatalogued tags remain accessible without being misclassified', () => {
  const groups = groupedTags([{data:{tags:['自定标签']}}]);
  assert.equal(groups[0].name, 'Other');
  assert.equal(groups[0].tags[0].name, '自定标签');
  assert.ok(tagInfo('科幻小说').description.length > 0);
});

test('detail URLs round-trip Chinese tags and C++ safely', () => {
  for (const tag of ['科幻小说','C++']) {
    const url = new URL(tagPageURL(tag), 'https://imisslog.com');
    assert.equal(decodeURIComponent(url.pathname.split('/')[2]), tag);
    assert.equal(url.search, '');
  }
});
