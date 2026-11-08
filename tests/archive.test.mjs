import test from 'node:test';
import assert from 'node:assert/strict';
import { syncYears } from '../src/scripts/archive.ts';
import { postYear, formatPostDate } from '../src/lib/post-date.ts';

test('filtering hides empty years, counts only visible rows, and restores cleared years', () => {
  const group = rows => ({
    hidden: false, rows, label: { textContent: '' },
    querySelectorAll() { return this.rows; }, querySelector() { return this.label; },
  });
  const a = group([{ hidden: false }, { hidden: true }]);
  const b = group([{ hidden: true }]);
  const root = { querySelectorAll: () => [a, b] };
  syncYears(root);
  assert.equal(a.hidden, false); assert.equal(a.label.textContent, '1 post');
  assert.equal(b.hidden, true); assert.equal(b.label.textContent, '0 posts');
  for (const g of [a, b]) g.rows.forEach(row => { row.hidden = false; });
  syncYears(root);
  assert.equal(a.label.textContent, '2 posts'); assert.equal(b.hidden, false);
  for (const g of [a, b]) g.rows.forEach(row => { row.hidden = true; });
  syncYears(root);
  assert.ok(a.hidden && b.hidden);
});

test('archive year matches the displayed Beijing date across New Year', () => {
  for (const [date, year] of [['2026-12-31T15:59:59Z', 2026], ['2026-12-31T16:00:00Z', 2027]]) {
    assert.equal(postYear(new Date(date)), year);
    assert.ok(formatPostDate(new Date(date)).endsWith(String(year)));
  }
});
