import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePageTransition } from '../src/scripts/page-transitions.ts';
import { formatPostDate } from '../src/lib/post-date.ts';

// Minimal DOM fixtures model selected and hidden rows, including a hidden parent.
function page(ids, { article = false, hidden = [] } = {}) {
  const parts = ids.flatMap(id => ['', '-date', '-tags'].map(suffix => ({
    dataset: { postTransition: id + suffix },
    active: false,
    closest: () => hidden.includes(id) ? {} : null,
    toggleAttribute(_name, active) { this.active = active; },
  })));
  return {
    parts,
    documentElement: { dataset: {} },
    querySelector: () => article ? { querySelectorAll: () => parts } : null,
    querySelectorAll: () => parts,
  };
}

test('list → article → list pairs only the selected title, date and tags', () => {
  const list = page(['first', 'second']);
  const article = page(['second'], { article: true });
  assert.equal(preparePageTransition(list, article, '/writing/', '/posts/second/'), 'shared');
  assert.deepEqual(list.parts.map(part => part.active), [false, false, false, true, true, true]);
  assert.ok(article.parts.every(part => part.active));
  assert.equal(preparePageTransition(article, list, '/posts/second/', '/writing/'), 'shared');
  assert.equal(list.documentElement.dataset.pageTransition, 'shared');
});

test('section navigation clears shared metadata even when entries overlap', () => {
  const home = page(['first']);
  const article = page(['first'], { article: true });
  preparePageTransition(home, article, '/', '/posts/first/');
  const writing = page(['first']);
  assert.equal(preparePageTransition(home, writing, '/', '/writing/'), 'page');
  assert.ok(home.parts.every(part => !part.active));
  assert.ok(writing.parts.every(part => !part.active));
});

test('filtered-out rows and unopened tag results cannot become shared elements', () => {
  for (const path of ['/writing/', '/notes/', '/tags/']) {
    const list = page(['first'], { hidden: ['first'] });
    const article = page(['first'], { article: true });
    assert.equal(preparePageTransition(article, list, '/posts/first/', path), 'page');
    assert.ok(article.parts.every(part => !part.active));
  }
});

test('visible tag results pair with their article; unrelated articles do not', () => {
  const tags = page(['first', 'second']);
  const first = page(['first'], { article: true });
  const second = page(['second'], { article: true });
  assert.equal(preparePageTransition(tags, first, '/tags/', '/posts/first/'), 'shared');
  assert.equal(preparePageTransition(first, second, '/posts/first/', '/posts/second/'), 'page');
});

test('English dates use short months, unpadded days and Beijing calendar dates', () => {
  assert.equal(formatPostDate(new Date('2026-11-06T00:00:00+08:00')), 'Nov 6, 2026');
  assert.equal(formatPostDate(new Date('2026-12-31T16:00:00Z')), 'Jan 1, 2027');
  assert.equal(formatPostDate(new Date('2026-12-31T15:59:59Z')), 'Dec 31, 2026');
});

test('tag detail pages share article metadata in both directions', () => {
  const list = page(['first']);
  const article = page(['first'], { article: true });
  const path = '/tags/%E7%A7%91%E5%B9%BB%E5%B0%8F%E8%AF%B4/';
  assert.equal(preparePageTransition(list, article, path, '/posts/first/'), 'shared');
  assert.equal(preparePageTransition(article, list, '/posts/first/', path), 'shared');
});

test('home and library share only the clicked cover with its review, in both directions', () => {
  for (const path of ['/', '/mirrow-world/']) {
    const shelf = page(['cover-first', 'cover-second']);
    shelf.parts.splice(1, 2);
    shelf.parts.splice(2, 2);
    const article = page(['cover-second', 'review-title'], { article: true });
    article.parts.splice(1, 2);
    assert.equal(preparePageTransition(shelf, article, path, '/mirrow-world/second/'), 'shared');
    assert.deepEqual(shelf.parts.map(part => part.active), [false, true]);
    assert.deepEqual(article.parts.map(part => part.active), [true, false, false, false]);
    assert.equal(preparePageTransition(article, shelf, '/mirrow-world/second/', path), path === '/' ? 'shared-home' : 'shared');
  }
});

test('returning home keeps the page entrance alongside matched covers or post metadata', () => {
  for (const [id, path] of [['cover-ai-hong', '/mirrow-world/ai-hong/'], ['first', '/posts/first/']]) {
    const home = page([id, 'unrelated']);
    const article = page([id], { article: true });
    assert.equal(preparePageTransition(article, home, path, '/'), 'shared-home');
    assert.equal(home.documentElement.dataset.pageTransition, 'shared-home');
    assert.equal(article.documentElement.dataset.pageTransition, 'shared-home');
    assert.ok(article.parts.every(part => part.active));
    assert.deepEqual(home.parts.map(part => part.active), [true, true, true, false, false, false]);
    // The combined return mode must not leak into the next article visit.
    assert.equal(preparePageTransition(home, article, '/', path), 'shared');
    assert.equal(home.documentElement.dataset.pageTransition, 'shared');
  }
});

test('library navigation uses page animation; returning to an absent home cover falls back cleanly', () => {
  const home = page(['cover-first']);
  const library = page(['cover-first', 'cover-second']);
  const article = page(['cover-second'], { article: true });
  assert.equal(preparePageTransition(home, library, '/', '/mirrow-world/'), 'page');
  assert.equal(preparePageTransition(article, home, '/mirrow-world/second/', '/'), 'page');
});
