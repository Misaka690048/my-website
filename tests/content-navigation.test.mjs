import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { matchesTags, selectedTags, tagURL } from '../src/lib/tags.ts';

test('multiple tags narrow results by intersection, removal broadens them', () => {
  const entries = [
    ['数据结构', '编程', 'C++', '线性结构', '栈'],
    ['数据结构', '编程', 'C++', '线性结构', '队列'],
    ['数据结构', '编程', '树'],
    ['模拟电子', '电路基础'],
  ];
  const count = tags => entries.filter(entry => matchesTags(entry, tags)).length;
  assert.equal(count([]), 4);
  assert.equal(count(['数据结构']), 3);
  assert.equal(count(['数据结构', '编程', 'C++']), 2);
  assert.equal(count(['数据结构', '编程', 'C++', '线性结构', '栈']), 1);
  assert.equal(count(['栈', '队列']), 0);
  assert.equal(count(['数据结构', '不存在的标签']), 0);
});

test('tag URLs retain Chinese, plus signs and punctuation through refresh', () => {
  const tags = ['C++', '数据结构', 'A&B', '#写作'];
  const url = new URL(tagURL('/notes/', [...tags, 'C++']), 'https://imisslog.com');
  assert.deepEqual(selectedTags(url.search), tags);
  assert.equal(tagURL('/notes/', []), '/notes/');
});

const poems = JSON.parse(readFileSync(new URL('../src/data/poems.json', import.meta.url), 'utf8'));
const component = readFileSync(new URL('../src/components/Poetry.astro', import.meta.url), 'utf8');
const script = component.match(/<script is:inline data-astro-rerun>([\s\S]*?)<\/script>/)[1];
function page() {
  const fields = new Map(['text', 'author', 'work'].map(name => [`[data-poem-${name}]`, { textContent: '' }]));
  const figure = { dataset: { poems: JSON.stringify(poems) }, querySelector: key => fields.get(key) };
  return { fields, doc: { querySelector: () => figure } };
}
function context(storage) {
  const p = page();
  const ctx = vm.createContext({ window: {}, document: p.doc, sessionStorage: storage });
  // Fix randomness without replacing the VM's other standard Math methods.
  vm.runInContext('Math.random = () => 0;', ctx);
  vm.runInContext(script, ctx);
  return { ctx, ...p };
}

test('poem remains on internal navigation and changes after a full reload', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  const first = context(storage);
  const id = first.ctx.window.__imisslogPoem;
  const destination = page();
  first.ctx.window.__imisslogRenderPoem(destination.doc);
  assert.equal(destination.fields.get('[data-poem-text]').textContent, first.fields.get('[data-poem-text]').textContent);
  // Astro re-executes the inline script after swapping; this must not choose again.
  vm.runInContext(script, first.ctx);
  assert.equal(first.ctx.window.__imisslogPoem, id);
  const reload = context(storage);
  assert.notEqual(reload.ctx.window.__imisslogPoem, id);
});

test('blocked browser storage still renders a complete, attributed quote', () => {
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  const result = context(blocked);
  for (const value of result.fields.values()) assert.ok(value.textContent.length > 0);
  assert.equal(new Set(poems.map(poem => poem.id)).size, poems.length);
});

test('reloads exhaust the poem pool before repeating, including the cycle boundary', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  const ids = Array.from({ length: poems.length * 2 }, () => context(storage).ctx.window.__imisslogPoem);
  assert.equal(new Set(ids.slice(0, poems.length)).size, poems.length);
  assert.equal(new Set(ids.slice(poems.length)).size, poems.length);
  for (let i = 1; i < ids.length; i++) assert.notEqual(ids[i], ids[i - 1]);
});

test('obsolete or malformed poem history does not break rendering', () => {
  for (const history of ['invalid JSON', '{}', '["removed-poem"]']) {
    const store = new Map([['imisslog-poem-seen', history], ['imisslog-last-poem', poems[0].id]]);
    const result = context({ getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) });
    assert.notEqual(result.ctx.window.__imisslogPoem, poems[0].id);
    assert.ok(result.fields.get('[data-poem-text]').textContent);
  }
});
