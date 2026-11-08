import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from 'astro:transitions/client';

import { readingProgress, activeHeading } from '../lib/reading';
import { setupFilters, primeFilters } from './filters';
import { setupFooter, updateFooter } from './footer';
import { setupCodeCopy } from './code-copy';
import { isPostListPath, preparePageTransition } from './page-transitions';
import { syncTocGroups, settledTocTop } from './toc';

type Theme = 'system' | 'light' | 'dark';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let preference: Theme = 'system';
let themeTimer = 0;
try {
  const saved = localStorage.getItem('imisslog-theme');
  if (saved === 'light' || saved === 'dark') preference = saved;
} catch { /* The site still works when storage is unavailable. */ }

function nextTheme(): Theme {
  return preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
}
function applyTheme(doc: Document = document) {
  doc.documentElement.dataset.themePreference = preference;
  doc.documentElement.dataset.theme = preference === 'system'
    ? (systemTheme.matches ? 'dark' : 'light') : preference;
  const button = doc.querySelector<HTMLButtonElement>('#theme-toggle');
  const label = `${preference === 'system' ? 'System' : preference === 'light' ? 'Light' : 'Dark'} mode; switch to ${nextTheme()} mode`;
  button?.setAttribute('aria-label', label);
  button?.setAttribute('title', label);
}
function transitionTheme() {
  document.documentElement.classList.add('theme-changing');
  clearTimeout(themeTimer);
  applyTheme();
  themeTimer = window.setTimeout(() => document.documentElement.classList.remove('theme-changing'), 350);
}
systemTheme.addEventListener('change', () => {
  if (preference === 'system') transitionTheme();
});
window.addEventListener('storage', event => {
  if (event.storageArea !== localStorage || (event.key !== 'imisslog-theme' && event.key !== null)) return;
  preference = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system';
  transitionTheme();
});

let pageController: AbortController | undefined;
let scrollFrame = 0;
let scrollTarget: number | null = null;
let requestedHeading: number | null = null;
let returnFromArticle: string | null = null;

function cancelScroll() {
  requestedHeading = null;
  if (scrollTarget === null) return;
  scrollTarget = null;
  window.scrollTo({ top: window.scrollY, behavior: 'instant' });
}
function smoothScrollTo(top: number, headingIndex: number | null = null) {
  cancelScroll();
  requestedHeading = headingIndex;
  const target = Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
  if (reducedMotion.matches || Math.abs(target - window.scrollY) < 1) {
    window.scrollTo({ top: target, behavior: 'instant' });
    return;
  }
  // Let the browser own the acceleration, deceleration and frame scheduling.
  scrollTarget = target;
  window.scrollTo({ top: target, behavior: 'smooth' });
}
reducedMotion.addEventListener('change', event => {
  if (event.matches) cancelScroll();
});

type SearchEntry = { title: string; description: string; url: string; text: string };
let searchIndex: Promise<SearchEntry[]> | undefined;
function loadIndex() {
  return searchIndex ??= fetch('/search-index.json').then(response => {
    if (!response.ok) throw new Error('Search index unavailable');
    return response.json() as Promise<SearchEntry[]>;
  }).catch(error => { searchIndex = undefined; throw error; });
}
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase();

function setupPage() {
  pageController?.abort();
  cancelAnimationFrame(scrollFrame);
  cancelScroll();
  pageController = new AbortController();
  const { signal } = pageController;
  document.documentElement.classList.add('enhanced');
  applyTheme();
  setupFilters(signal);
  setupFooter(signal);
  setupCodeCopy(signal);
  const topButton = document.querySelector<HTMLButtonElement>('#back-to-top')!;
  const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')!;
  const input = document.querySelector<HTMLInputElement>('#site-search')!;
  const results = document.querySelector<HTMLUListElement>('#search-results')!;
  const status = document.querySelector<HTMLElement>('#search-status')!;
  const openSearchButton = document.querySelector<HTMLButtonElement>('[data-open-search]')!;
  let closingTimer = 0;
  let searchRequest = 0;
  const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-toc-link]'));
  const headings = tocLinks.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  const tocNav = document.querySelector<HTMLElement>('.toc-nav');
  const tocGroups = Array.from(document.querySelectorAll<HTMLElement>('[data-toc-group]'));
  const tocIndicator = document.querySelector<HTMLElement>('.toc-indicator');
  const percent = document.querySelector<HTMLElement>('#back-to-top-percent');
  const article = document.querySelector<HTMLElement>('#article-body');
  const coverGlow = document.querySelector<HTMLElement>('[data-cover-glow]');
  const tocDetails = document.querySelector<HTMLDetailsElement>('.toc details');
  if (tocDetails && matchMedia('(max-width: 1280px)').matches) tocDetails.open = false;

  themeToggle.addEventListener('click', () => {
    preference = nextTheme();
    transitionTheme();
    try { localStorage.setItem('imisslog-theme', preference); } catch {}
  }, { signal });

  async function renderResults() {
    const request = ++searchRequest;
    const query = input.value.trim();
    results.replaceChildren();
    status.closest<HTMLElement>('.search-body')!.hidden = !query;
    if (!query) { status.textContent = ''; return; }
    status.textContent = 'Searching…';
    try {
      const index = await loadIndex();
      if (signal.aborted || request !== searchRequest) return;
      const terms = normalize(query).split(/\s+/).filter(Boolean);
      const matches = index.filter(entry => {
        const haystack = normalize(`${entry.title} ${entry.description} ${entry.text}`);
        return terms.every(term => haystack.includes(term));
      }).sort((a, b) => {
        const score = (entry: SearchEntry) => terms.reduce((total, term) => total + (normalize(entry.title).includes(term) ? 2 : 0) + (normalize(entry.description).includes(term) ? 1 : 0), 0);
        return score(b) - score(a);
      });
      status.textContent = matches.length ? `${matches.length} ${matches.length === 1 ? 'result' : 'results'}${matches.length > 20 ? ' · First 20 shown' : ''}` : 'No results.';
      for (const entry of matches.slice(0, 20)) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = entry.url;
        const title = document.createElement('strong');
        title.textContent = entry.title;
        const snippet = document.createElement('p');
        const position = normalize(entry.text).indexOf(terms[0]);
        const start = Math.max(0, position - 26);
        snippet.textContent = position >= 0 ? `${start ? '…' : ''}${entry.text.slice(start, start + 100)}${entry.text.length > start + 100 ? '…' : ''}` : entry.description;
        link.append(title, snippet);
        li.append(link);
        results.append(li);
      }
    } catch {
      if (!signal.aborted && request === searchRequest) status.textContent = 'Search unavailable. Please try again.';
    }
  }
  function openSearch() {
    clearTimeout(closingTimer);
    dialog.classList.remove('is-closing');
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('search-open');
    input.focus({ preventScroll: true });
    void renderResults();
  }
  function closeSearch(immediate = false) {
    clearTimeout(closingTimer);
    const finish = () => {
      dialog.close();
      dialog.classList.remove('is-closing');
      document.documentElement.classList.remove('search-open');
      if (!immediate) {
        // Reading pages hide navigation controls; return keyboard focus to Home.
        const focusTarget = openSearchButton.closest('[hidden]')
          ? document.querySelector<HTMLAnchorElement>('.site-brand') : openSearchButton;
        focusTarget?.focus({ preventScroll: true });
      }
    };
    if (immediate || reducedMotion.matches) finish();
    else { dialog.classList.add('is-closing'); closingTimer = window.setTimeout(finish, 140); }
  }
  openSearchButton.addEventListener('click', openSearch, { signal });
  dialog.querySelector('[data-close-search]')!.addEventListener('click', () => closeSearch(), { signal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeSearch(); }, { signal });
  dialog.addEventListener('click', event => { if (event.target === dialog) closeSearch(); }, { signal });
  results.addEventListener('click', event => {
    if ((event.target as Element).closest('a')) closeSearch(true);
  }, { signal });
  input.addEventListener('input', () => { void renderResults(); }, { signal });
  input.addEventListener('keydown', event => {
    const first = results.querySelector<HTMLAnchorElement>('a');
    if (event.key === 'ArrowDown' && first) { event.preventDefault(); first.focus(); }
    if (event.key === 'Enter' && first && !event.isComposing) { event.preventDefault(); first.click(); }
  }, { signal });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) interruptScroll();
  }, { signal });

  function updateScroll() {
    const y = window.scrollY;
    if (coverGlow) {
      const bottom = coverGlow.getBoundingClientRect().bottom + y;
      // Fade the local copy as the reader leaves the cover; scrolling back restores it.
      const visibility = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, 1 - Math.max(0, y) / Math.max(1, bottom)));
      coverGlow.style.setProperty('--cover-glow-visibility', String(visibility));
    }
    if (scrollTarget !== null && Math.abs(y - scrollTarget) < 1) scrollTarget = null;
    const showTop = article ? y > 0 : y > 350;
    topButton.classList.toggle('is-visible', showTop);
    topButton.inert = !showTop;
    if (article) {
      const bounds = article.getBoundingClientRect();
      if (percent) percent.textContent = `${readingProgress(y, bounds.bottom + y, innerHeight)}%`;
      const active = activeHeading(y, headings.map(heading => heading?.getBoundingClientRect().top ?? Infinity), bounds.bottom, innerHeight, {
        requestedHeading,
        pageAtEnd: y + innerHeight >= document.documentElement.scrollHeight - 1,
      });
      tocLinks.forEach((link, index) => {
        if (index === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      syncTocGroups(tocGroups, tocLinks[active], document.activeElement);
      // Inline TOCs reserve their fully expanded height (capped in CSS), so an
      // expanding section cannot move the article and upset scroll tracking.
      if (tocNav && tocDetails?.open) {
        const fullHeight = tocGroups.reduce((height, group) => {
          const parentLink = group.querySelector<HTMLElement>(':scope > a');
          const children = group.querySelector<HTMLElement>('.toc-children');
          return height + (parentLink?.offsetHeight ?? 0) + (children?.scrollHeight ?? 0) + 1;
        }, 0);
        tocNav.style.setProperty('--toc-expanded-height', `${fullHeight}px`);
      }
      if (tocIndicator && tocNav) {
        const link = tocLinks[active];
        const visible = !!link && !!tocDetails?.open;
        if (visible) {
          const rect = link.getBoundingClientRect();
          const navRect = tocNav.getBoundingClientRect();
          const style = getComputedStyle(link);
          // Align to the first line even if a long chapter title wraps.
          const x = rect.left - navRect.left + 2;
          const precedingPanels = tocGroups.flatMap(group => {
            const panel = group.querySelector<HTMLElement>('[data-toc-children]');
            // The selected link's own panel doesn't shift its first-line position.
            if (!panel || panel.contains(link) || !(panel.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING)) return [];
            return [{
              current: panel.getBoundingClientRect().height,
              expanded: panel.firstElementChild?.scrollHeight ?? 0,
              open: group.classList.contains('is-current-section'),
            }];
          });
          const top = settledTocTop(rect.top - navRect.top, precedingPanels)
            + parseFloat(style.paddingTop) + parseFloat(style.lineHeight) / 2 - 8;
          tocIndicator.style.transform = `translate(${x.toFixed(2)}px, ${top.toFixed(2)}px)`;
          if (!tocIndicator.hasAttribute('data-positioned')) {
            tocIndicator.getBoundingClientRect();
            tocIndicator.dataset.positioned = '';
          }
        }
        tocIndicator.classList.toggle('is-visible', visible);
      }
    }
  }

  function scheduleScroll() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateScroll);
  }
  function interruptScroll() {
    cancelScroll();
    scheduleScroll();
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true, signal });
  window.addEventListener('resize', interruptScroll, { passive: true, signal });
  tocDetails?.addEventListener('toggle', scheduleScroll, { signal });
  tocNav?.addEventListener('focusout', scheduleScroll, { signal });
  // Images, text wrapping and the overall directory toggle can change geometry.
  const resizeObserver = new ResizeObserver(scheduleScroll);
  if (article) resizeObserver.observe(article);
  if (coverGlow) resizeObserver.observe(coverGlow);
  if (tocDetails) resizeObserver.observe(tocDetails);
  // Track each panel, even when two opposite animations keep total height equal.
  tocGroups.forEach(group => {
    const panel = group.querySelector<HTMLElement>('[data-toc-children]');
    if (panel) resizeObserver.observe(panel);
  });
  signal.addEventListener('abort', () => resizeObserver.disconnect());
  window.addEventListener('wheel', interruptScroll, { passive: true, signal });
  window.addEventListener('touchstart', () => {
    if (scrollTarget !== null) interruptScroll();
  }, { passive: true, signal });
  window.addEventListener('touchmove', interruptScroll, { passive: true, signal });
  window.addEventListener('pointerdown', event => {
    // Interrupt an animation or scrollbar drag, but a theme/TOC-toggle click
    // after arrival should not discard the reader's explicit chapter choice.
    if (scrollTarget !== null || event.target === document.documentElement) interruptScroll();
  }, { passive: true, signal });
  topButton.addEventListener('click', () => {
    smoothScrollTo(0);
    document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
  }, { signal });
  tocLinks.forEach((link, index) => link.addEventListener('click', event => {
    const mouse = event as MouseEvent;
    if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button !== 0) return;
    const heading = headings[index];
    if (!heading) return;
    event.preventDefault();
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    history.replaceState(history.state, '', link.hash);
    smoothScrollTo(heading.getBoundingClientRect().top + window.scrollY - 112, index);
    scheduleScroll();
  }, { signal }));
  document.querySelectorAll<HTMLAnchorElement>('[data-back-to-list]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (returnFromArticle === location.pathname) { event.preventDefault(); history.back(); }
  }, { signal }));

  signal.addEventListener('abort', () => { clearTimeout(closingTimer); ++searchRequest; });
  updateScroll();
}

document.addEventListener('astro:before-preparation', (event: TransitionBeforePreparationEvent) => {
  const load = event.loader;
  event.loader = async () => {
    await load();
    if (event.signal.aborted || event.defaultPrevented) return;
    primeFilters(event.newDocument, event.to.search);
    preparePageTransition(document, event.newDocument, event.from.pathname, event.to.pathname);
  };
  const fromList = isPostListPath(event.from.pathname);
  returnFromArticle = fromList && event.to.pathname.startsWith('/posts/') && event.navigationType !== 'traverse' ? event.to.pathname : null;
  cancelScroll();
  document.querySelector<HTMLDialogElement>('#search-dialog')?.close();
  document.documentElement.classList.remove('search-open');
});
document.addEventListener('astro:before-swap', (event: TransitionBeforeSwapEvent) => {
  pageController?.abort();
  applyTheme(event.newDocument);
  updateFooter(event.newDocument);
  primeFilters(event.newDocument, event.to.search);
  const poetryWindow = window as Window & { __imisslogRenderPoem?: (doc: Document) => void };
  poetryWindow.__imisslogRenderPoem?.(event.newDocument);
  event.newDocument.documentElement.classList.add('enhanced');
});
document.addEventListener('astro:page-load', setupPage);
