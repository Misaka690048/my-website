import { syncYears } from './archive';
import { matchesTags, selectedTags, tagURL } from '../lib/tags';

// Prepare the destination before Astro snapshots it for a page transition.
export function primeFilters(doc: Document, search: string) {
  const root = doc.querySelector<HTMLElement>('[data-collection]');
  if (!root) return;
  const selected = selectedTags(search);
  const showResults = !root.hasAttribute('data-tag-directory') || selected.length > 0;
  const results = root.querySelector<HTMLElement>('[data-filter-results]');
  if (results) results.hidden = !showResults;
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-post-row]'));
  rows.forEach(row => { row.hidden = !showResults || !matchesTags(JSON.parse(row.dataset.tags!), selected); });
  syncYears(root);
  const visible = rows.filter(row => !row.hidden).length;
  root.querySelector<HTMLElement>('[data-filter-status]')!.textContent = selected.length
    ? `${visible} / ${rows.length} posts` : `${rows.length} ${rows.length === 1 ? 'post' : 'posts'}`;
  root.querySelector<HTMLElement>('[data-filter-empty]')!.hidden = visible > 0;
}

export function setupFilters(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-collection]');
  if (!root) return;
  const path = root.dataset.path!;
  const directory = root.hasAttribute('data-tag-directory');
  const results = root.querySelector<HTMLElement>('[data-filter-results]');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-post-row]'));
  const rowTags = new Map(rows.map(row => [row, JSON.parse(row.dataset.tags!) as string[]]));
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-filter-tag]'));
  const status = root.querySelector<HTMLElement>('[data-filter-status]')!;
  const selectedBox = root.querySelector<HTMLElement>('[data-selected-tags]')!;
  const count = root.querySelector<HTMLElement>('[data-tag-selection-count]');
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]')!;
  const emptyMessage = root.querySelector<HTMLElement>('[data-empty-message]')!;
  const clearButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-clear-tags]'));
  const panel = root.querySelector<HTMLDetailsElement>('[data-tag-panel]');
  const compact = matchMedia('(max-width: 1280px)');
  if (panel) {
    panel.open = !compact.matches;
    compact.addEventListener('change', () => { panel.open = !compact.matches; }, { signal });
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = selectedTags(location.search);
  let revision = 0;
  let animations: Animation[] = [];
  const stopAnimations = () => { animations.forEach(animation => animation.cancel()); animations = []; };

  function controls(visible: HTMLElement[]) {
    const restoreFocus = selectedBox.contains(document.activeElement)
      || clearButtons.some(button => button === document.activeElement && !selected.length);
    links.forEach(link => {
      const active = selected.includes(link.dataset.filterTag!);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
      link.href = tagURL(path, active ? selected.filter(tag => tag !== link.dataset.filterTag) : [...selected, link.dataset.filterTag!]);
    });
    status.textContent = selected.length ? `${visible.length} / ${rows.length} posts` : `${rows.length} ${rows.length === 1 ? 'post' : 'posts'}`;
    if (count) count.textContent = selected.length ? `(${selected.length})` : '';
    clearButtons.forEach(button => { button.hidden = !selected.length; });
    selectedBox.hidden = !selected.length;
    selectedBox.replaceChildren(...selected.map(tag => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'selected-tag';
      const label = document.createElement('span');
      label.textContent = `#${tag}`;
      const remove = document.createElement('span');
      remove.textContent = '×';
      remove.setAttribute('aria-hidden', 'true');
      button.append(label, remove);
      button.setAttribute('aria-label', `Remove tag ${tag}`);
      button.addEventListener('click', () => change(selected.filter(value => value !== tag)), { signal });
      return button;
    }));
    emptyMessage.textContent = rows.length ? 'No matching posts.' : 'No posts yet.';
    if (restoreFocus) {
      const target = selectedBox.querySelector<HTMLButtonElement>('button')
        ?? panel?.querySelector<HTMLElement>('summary') ?? links[0];
      target?.focus({ preventScroll: true });
    }
  }

  async function render(animate: boolean) {
    const current = ++revision;
    // Capture in-flight visual positions before cancelling a superseded animation.
    const wasClosed = results?.hidden ?? false;
    const previous = new Map(rows.filter(row => !row.hidden && !wasClosed).map(row => [row, row.getBoundingClientRect().top]));
    stopAnimations();
    const showResults = !directory || selected.length > 0;
    const visible = showResults ? rows.filter(row => matchesTags(rowTags.get(row)!, selected)) : [];
    const wanted = new Set(visible);
    const moving = animate && !reduced.matches;
    const exiting = rows.filter(row => !row.hidden && !wasClosed && !wanted.has(row));
    const fading: HTMLElement[] = results && !wasClosed && !showResults ? [results] : exiting;
    if (moving && fading.length) {
      animations = fading.map(row => row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 130, fill: 'forwards', easing: 'ease-out' }));
      await Promise.allSettled(animations.map(animation => animation.finished));
      if (current !== revision || signal.aborted) return;
    }
    stopAnimations();
    // All layout changes happen together after the fade, so the selected-tag
    // row cannot make the still-visible entries jump before FLIP starts.
    controls(visible);
    if (results) results.hidden = !showResults;
    rows.forEach(row => { row.hidden = !wanted.has(row); });
    syncYears(root);
    empty.hidden = visible.length > 0;
    if (moving && results && wasClosed && showResults) {
      animations = [results.animate([
        { opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' })];
    } else if (moving) {
      animations = visible.map(row => {
        const top = previous.get(row);
        const offset = top === undefined ? 9 : top - row.getBoundingClientRect().top;
        return row.animate([
          { transform: `translateY(${offset}px)`, opacity: top === undefined ? 0 : 1 },
          { transform: 'translateY(0)', opacity: 1 },
        ], { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      });
    }
  }

  function change(tags: string[]) {
    selected = [...new Set(tags)];
    // Keep Astro's history bookkeeping; Back from a post restores this list and selection.
    history.replaceState(history.state, '', tagURL(path, selected));
    void render(true);
  }
  const plainClick = (event: MouseEvent) => !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && event.button === 0;
  links.forEach(link => link.addEventListener('click', event => {
    if (!plainClick(event)) return;
    event.preventDefault();
    const tag = link.dataset.filterTag!;
    change(selected.includes(tag) ? selected.filter(value => value !== tag) : [...selected, tag]);
  }, { signal }));
  clearButtons.forEach(button => button.addEventListener('click', () => change([]), { signal }));
  window.addEventListener('popstate', () => { selected = selectedTags(location.search); void render(false); }, { signal });
  reduced.addEventListener('change', () => { void render(false); }, { signal });
  signal.addEventListener('abort', () => { ++revision; stopAnimations(); });
  void render(false);
}
