import test from 'node:test';
import assert from 'node:assert/strict';
import { syncTocGroups, settledTocTop } from '../src/scripts/toc.ts';
import { activeHeading } from '../src/lib/reading.ts';

function directory() {
  const links = Array.from({ length: 6 }, () => ({}));
  const groups = [0, 3].map(start => {
    const panel = {
      inert: false,
      attributes: {},
      contains: node => links.slice(start + 1, start + 3).includes(node),
      setAttribute(name, value) { this.attributes[name] = value; },
    };
    const classes = new Set();
    return {
      panel, classes,
      contains: node => links.slice(start, start + 3).includes(node),
      querySelector: () => panel,
      classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); } },
    };
  });
  return { links, groups };
}
function expectOpen(groups, states) {
  groups.forEach((group, index) => {
    assert.equal(group.classes.has('is-current-section'), states[index]);
    assert.equal(group.panel.inert, !states[index]);
    assert.equal(group.panel.attributes['aria-hidden'], String(!states[index]));
  });
}

test('TOC starts collapsed, follows h2/h3 ownership, switches chapters and resets at top', () => {
  const { groups, links } = directory();
  syncTocGroups(groups);
  expectOpen(groups, [false, false]);
  for (const index of [0, 1, 2, 3, 4, 5, 2, 0]) {
    syncTocGroups(groups, links[index]);
    expectOpen(groups, [index < 3, index >= 3]);
  }
  syncTocGroups(groups);
  expectOpen(groups, [false, false]);
});

test('a clicked h3 near the document end keeps its own chapter open', () => {
  const { groups, links } = directory();
  const active = activeHeading(800, [-600, -400, 110, 120, 130, 140], 500, 700,
    { pageAtEnd: true, requestedHeading: 2 });
  assert.equal(active, 2);
  syncTocGroups(groups, links[active]);
  expectOpen(groups, [true, false]);
});

test('focused child does not become inert mid-keyboard-navigation; folds after focus leaves', () => {
  const { groups, links } = directory();
  syncTocGroups(groups, links[3], links[1]);
  expectOpen(groups, [true, true]);
  syncTocGroups(groups, links[3], links[3]);
  expectOpen(groups, [false, true]);
});

test('a section without children remains a valid navigation target', () => {
  const rootOnly = { querySelector: () => null };
  assert.doesNotThrow(() => syncTocGroups([rootOnly], {}));
});

test('arrow target stays fixed throughout a preceding chapter collapse', () => {
  for (const height of [120, 90, 40.5, 12, 0]) {
    assert.equal(settledTocTop(60 + height, [{ current: height, expanded: 120, open: false }]), 60);
  }
});

test('arrow target also stays fixed while a preceding focused section expands', () => {
  for (const height of [0, 20, 70, 120]) {
    assert.equal(settledTocTop(60 + height, [{ current: height, expanded: 120, open: true }]), 180);
  }
  assert.equal(settledTocTop(60, []), 60);
});
