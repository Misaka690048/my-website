import test from 'node:test';
import assert from 'node:assert/strict';
import { siteAge } from '../src/lib/site-age.ts';

test('site age uses Beijing midnight and includes launch day', () => {
  assert.equal(siteAge(Date.parse('2026-10-26T15:59:59Z')).days, 0);
  assert.equal(siteAge(Date.parse('2026-10-26T16:00:00Z')).days, 1);
  assert.equal(siteAge(Date.parse('2026-10-27T15:59:59Z')).days, 1);
  assert.equal(siteAge(Date.parse('2026-10-27T16:00:00Z')).days, 2);
  assert.equal(siteAge(Date.parse('2026-11-03T12:00:00+08:00')).days, 8);
});

test('copyright range and refresh deadline change at Beijing new year', () => {
  const before = siteAge(Date.parse('2026-12-31T15:59:59Z'));
  const after = siteAge(Date.parse('2026-12-31T16:00:00Z'));
  assert.equal(before.years, '2026');
  assert.equal(after.years, '2026–2027');
  assert.equal(after.days, before.days + 1);
  assert.equal(before.nextUpdate, 1000);
  assert.equal(after.nextUpdate, 86_400_000);
});

test('day count spans leap day without depending on the device timezone', () => {
  const before = siteAge(Date.parse('2028-02-28T16:00:00Z'));
  const after = siteAge(Date.parse('2028-02-29T16:00:00Z'));
  assert.equal(after.days, before.days + 1);
  assert.equal(siteAge(Date.parse('2028-03-01T00:00:00+08:00')).days, after.days);
});
