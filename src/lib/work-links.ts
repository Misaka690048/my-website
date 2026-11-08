// Independent of Astro's runtime so publication boundaries can be tested.
export const workURL = (id: string) => `/mirrow-world/${encodeURIComponent(id)}/`;
export const coverTransition = (id: string) =>
  `cover-${Array.from(id, char => char.codePointAt(0)!.toString(16)).join('-')}`;

export function connectWorks<
  W extends { id: string; data: { preview: boolean; order: number; review?: { id: string } } },
  R extends { id: string; body?: string; data: { preview: boolean } },
>(works: W[], reviews: R[], includePreview: boolean) {
  const visibleReviews = new Map(reviews
    .filter(review => (includePreview || !review.data.preview) && review.body?.trim())
    .map(review => [review.id, review]));
  return works.filter(work => includePreview || !work.data.preview)
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))
    .map(work => {
      const review = work.data.review ? visibleReviews.get(work.data.review.id) : undefined;
      return { ...work, review, href: review ? workURL(work.id) : undefined };
    });
}
