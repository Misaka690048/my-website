const listPaths = new Set(['/', '/writing/', '/notes/', '/tags/', '/mirrow-world/']);
export const isPostListPath = (path: string) => listPaths.has(path) || /^\/tags\/[^/]+\/$/.test(path);

function visibleParts(doc: Document) {
  return Array.from(doc.querySelectorAll<HTMLElement>('[data-post-transition]'))
    .filter(element => !element.closest('[hidden]'));
}

// Run after loading/filtering the destination, before either snapshot is taken.
export function preparePageTransition(from: Document, to: Document, fromPath: string, toPath: string) {
  const fromArticle = from.querySelector<HTMLElement>('#reading-article');
  const toArticle = to.querySelector<HTMLElement>('#reading-article');
  const paired = (fromArticle && !toArticle && isPostListPath(toPath))
    || (toArticle && !fromArticle && isPostListPath(fromPath));
  const article = fromArticle ?? toArticle;
  const articleParts = paired && article
    ? Array.from(article.querySelectorAll<HTMLElement>('[data-post-transition]')) : [];
  const title = articleParts[0]?.dataset.postTransition;
  const oldNames = new Set(visibleParts(from).map(element => element.dataset.postTransition));
  const newNames = new Set(visibleParts(to).map(element => element.dataset.postTransition));
  const shared = !!title && oldNames.has(title) && newNames.has(title);
  const sharedNames = new Set(shared ? articleParts.map(element => element.dataset.postTransition)
    .filter(name => oldNames.has(name) && newNames.has(name)) : []);
  // Home always enters as a page, even when its shelf or Latest shares an element.
  // Named children keep their own snapshots while the rest of main slides in.
  const mode = shared ? (toPath === '/' ? 'shared-home' : 'shared') : 'page';
  for (const doc of [from, to]) {
    doc.documentElement.dataset.pageTransition = mode;
    doc.querySelectorAll<HTMLElement>('[data-post-transition]').forEach(element => {
      element.toggleAttribute('data-transition-active', sharedNames.has(element.dataset.postTransition));
    });
  }
  return mode;
}
