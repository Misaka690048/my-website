# Title print treatment

Developer configuration: `src/data/print-headings.ts`. Set
`printHeadingStrength` to `'off'`, `'subtle'`, or `'medium'` (default).
Rebuild when publishing a change. There is no visitor-facing toggle or storage.

`PrintHeadingFilters.astro` embeds `print-filters.svg` once in BaseLayout.
`print-headings.css` is imported last by the existing `site.css` entry.
Only an explicit `.print-heading` opts in; font, color and layout are inherited.
Keep the SVG definitions in the DOM, not `display:none` or `hidden`.

Applied to:

- Home: Latest and Mirrow World (`print-heading--compact`).
- Page titles: Writing, Tags and individual tag headings, Mirrow World, About, 404.
- PostLayout's article/review H1, including local preview content.
- All PostList titles: Home Latest, Writing's year groups and tag result pages
  (`print-heading--compact`). Dates and tags are not filtered.
- The existing inline SVG wordmark (`print-heading--compact` on its span);
  its outlines, size and stable font-independent rendering are unchanged.

Not applied to archive years, article H2–H4, tag links,
metadata, poetry, navigation, image Logo or About's multilingual declarations.
Do not put the class on a wrapper: that would also filter its children/dividers.

## Parameters

All numerical filter parameters live in `print-filters.svg`.

| Profile | Contour displacement scale | Ink-alpha transfer table |
| --- | --- | --- |
| Subtle | 0.85 | .85 .9 .96 1 1 1 1 1 |
| Medium | 2.0 | .58 .62 .74 .96 1 1 1 1 |
| Medium compact | 1.6 | .7 .75 .85 .98 1 1 1 1 |

Contour: fractalNoise frequency `.055 .24`, 2 octaves, seed 17.
Ink: fractalNoise frequency `.72 .86`, 1 octave, seed 29, red channel converted
to alpha and remapped before compositing with the displaced SourceGraphic.
This adds local wear rather than changing the RGB color of the whole heading.
The table's lower bound preserves some ink even in the deepest wear;
it does not punch completely transparent holes into fine Chinese strokes.

Compact applies to the home/list headings, wordmark and opted-in headings at
viewport widths up to 600px. Off removes the filter entirely. Forced-colors
and printing also disable the effect. There is no blur, offset, animation,
JavaScript, external request or new font/resource dependency.

## Verification and limits

On 2026-11-08, Astro check/build passed and generated HTML was checked for a
single set of IDs per page and explicit heading-only application. Offline
librsvg comparisons used Noto Serif CJK SC and EB Garamond at 22–42px in both
palettes, including mixed text and a multiline title. The comparison is saved
in [the comparison image](../../../../docs/assets/print-headings-20261108.png)
(the docs folder is a sibling of the project).

Offline SVG rendering is not a substitute for browser CSS rendering. Browser
access was unavailable; Chrome/Firefox/Safari, device pixel ratios, mobile
line wrapping and the existing View Transitions still require visual review.
The text stays live/selectable and the filter changes no box metrics. Existing
system CJK fallback differences remain. The inline SVG is approximately 3 KiB
uncompressed; actual rendering cost depends on the browser/device and has
not been benchmarked. Review on a slower phone before production publishing.
