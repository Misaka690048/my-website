import test from 'node:test';
import assert from 'node:assert/strict';
import { connectWorks, coverTransition, workURL } from '../src/lib/work-links.ts';
const work = (id, review, preview = false) => ({ id, data: { order: 0, preview, review: review ? { id: review } : undefined } });
const review = (id, body = 'An actual review.', preview = false) => ({ id, body, data: { preview } });

test('unwritten, missing and empty reviews leave works visible but unlinked', () => {
  const result = connectWorks([work('no-review'), work('missing', 'missing'), work('empty', 'empty'), work('written', 'written')],
    [review('empty', '  '), review('written')], false);
  assert.equal(result.length, 4);
  assert.deepEqual(result.filter(w => w.href).map(w => w.id), ['written']);
});

test('preview works and reviews are excluded unless test content is explicitly enabled', () => {
  const works = [work('local-work', 'published', true), work('local-review', 'draft'), work('live', 'published')];
  const reviews = [review('published'), review('draft', 'Draft text', true)];
  const live = connectWorks(works, reviews, false);
  assert.deepEqual(live.filter(w => w.href).map(w => w.id), ['live']);
  assert.equal(live.length, 2);
  assert.equal(connectWorks(works, reviews, true).filter(w => w.href).length, 3);
});

test('Unicode work IDs have safe URLs and collision-free cover transition names', () => {
  assert.equal(workURL('哀鸿'), '/mirrow-world/%E5%93%80%E9%B8%BF/');
  assert.match(coverTransition('哀鸿'), /^cover-[\da-f-]+$/);
  assert.notEqual(coverTransition('ab'), coverTransition('a-b'));
});
