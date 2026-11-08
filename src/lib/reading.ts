/** Page top is 0%; the article's final line reaching the viewport bottom is 100%. */
export function readingProgress(scrollY: number, articleEnd: number, viewportHeight: number): number {
  if (scrollY <= 0) return 0;
  const distance = articleEnd - viewportHeight;
  if (distance <= 0) return 100;
  return Math.round(Math.max(0, Math.min(1, scrollY / distance)) * 100);
}

/** Track h2 and h3 alike at the reading line beneath the header. */
export function activeHeading(
  scrollY: number,
  headingTops: number[],
  articleBottom: number,
  viewportHeight: number,
  options: { pageAtEnd?: boolean; requestedHeading?: number | null } = {},
): number {
  // Near the page end, multiple anchors can share the same clamped scroll position.
  // Preserve the explicit choice until the reader resumes manual scrolling.
  const requested = options.requestedHeading;
  if (requested != null && requested >= 0 && requested < headingTops.length) return requested;
  if (scrollY <= 0 || articleBottom <= 150) return -1;
  // Seeing the end of the article is not the same as reaching the page's scroll limit.
  if (options.pageAtEnd && articleBottom <= viewportHeight + 1) return headingTops.length - 1;
  let active = -1;
  headingTops.forEach((top, index) => { if (top <= 150) active = index; });
  return active;
}
