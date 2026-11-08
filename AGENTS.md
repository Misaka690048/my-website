## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

- Maintain `../docs/给自己看.md` as the user's plain-language project diary. Record ideas discussed, decisions, completed work, reference downloads/readings, experiments and rollbacks under the current Asia/Shanghai date. Distinguish implemented, user-accepted, pending and deferred work. Update its current todo list as decisions change; preserve historical entries. When the user requests an end-of-day update, reconcile and fill gaps without duplicating entries. Continue maintaining the existing runbook, design record and operations manual as well; this diary does not replace them.

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Design preferences

- Use neutral interaction feedback: muted text/icons become the body text color; links and tags use thin underlines, and selected tags keep their underline. Do not reintroduce a colored interaction accent. Keep tag counts and remove icons outside underlines; do not change font size or weight on hover. Decorative cover colors and syntax highlighting remain independent. Do not add rectangular background highlights unless the user explicitly requests them. Keep visible keyboard focus indicators.
- The article TOC shows top-level sections initially, automatically expanding only the current section’s h3 children while reading (latest user decision, 2026-11-07). Keep the current h2 or h3 marked by the moving arrow; preserve explicit clicked-heading selection near the page end. Keep a focused child reachable until focus leaves its section. See `../docs/网站设计参考与偏好.md`.
- Use concise English for interface labels; preserve the language of posts, notes, tags, poetry and the user's About declarations. Avoid redundant instructional copy.
- Tag directory links underline only the tag name on hover or selection, never the count. The Tags directory uses numbered category headings (no category icon), serif tag names and monospace superscript counts; the Writing sidebar retains its shared double-tag icon. Do not add an icon on each directory tag.

- Typography roles follow the local Venin reference: serif for prose, all headings, navigation, tags, TOC and general controls; Courier-style monospace for dates, English section labels and footer. Do not reintroduce sans-serif headings or tags. Preserve the separately approved poetry, code and About declaration fonts. Fangsong is only for explicitly marked quoted blocks. See the latest 2026-11-07 design correction.

- Writing is the unified article/note collection. Keep Mirrow World reviews separate; do not reintroduce Notes navigation or category badges. Article lists have no row dividers, with dates on the right and tags below titles. Article date/tags share one wrapping metadata row. Preserve existing post URLs and legacy Notes redirects.

- Visual effects must be perceptible at normal browsing scale and coherent with the whole site; do not treat an imperceptible texture as a completed visual goal. The logo's direction is monochrome botanical fine-line ink/etching with sparse hatching and clear negative space. Site-wide ornamental treatments remain proposals until approved. If a chosen asset cannot be downloaded, give the user the official URL, exact filename and destination for manual download rather than silently substituting it.

- The latest botanical direction is site-wide (2026-11-07): small, nearly straight engraved botanical rules are reserved for major section boundaries. Tags sidebars, search and compact TOC use plain rules; quotations have no botanical tail. Avoid large flowers, undulating branches or oversized decorative spacing. The previous simplified SVG pilot was rejected. Keep decorative rules out of individual article rows; retain functional table/code/focus boundaries. Use neutral grayscale, preserve serif prose and the separately approved poetry font. The logo is a reference, not a mandatory template for every page. Writing groups posts by publication year in Asia/Shanghai; filtering hides empty years and updates counts. Latest stays flat. New botanical visuals and archive grouping await user acceptance.


- Latest visual-only redesign (2026-11-07): preserve all sections, routes, content ordering and functional scripts. Palette is near-white #f7f7f5 / ink #111111 and near-black #0b0b0b / soft white #f0f0ed. Use serif Chinese text, classical display fallbacks and existing monospace metadata/code. EB Garamond was subsequently self-hosted on 2026-11-08; see the font-system note below.
- Current divider uses only the user's src/assets/ornaments/divider-light.png, copied unchanged from ../浅色模式分割线.png. Dark mode applies CSS invert(1) to this SAME source, preserving pixel geometry and alpha exactly. Do not use the separate user dark PNG (geometry differs), redraw, mirror, crop, blend or alter opacity. Keep utility rules plain and BotanicalBackdrop separate. Previous rose-vine imagery is historical only.

- Article pages (including Mirrow World reviews) use an image-only reading masthead: 160px desktop / 128px mobile Logo above the title, aligned to the reading column. Hide wordmark, navigation and tools there; keep Logo as Home and bottom Back link. No preview notice or footer preview link on reading pages. Respect src/data/publication.json for test-content inclusion; retain noindex on preview articles and keep /design-preview/ development-only. Search keyboard shortcut still works; closing returns focus to visible Logo when nav is hidden.

- The image Logo has its own square logo-artwork View Transition named site-logo, 460ms ease-out geometry interpolation. Keep this separate from site-header (whose geometry animation is disabled), so entering/leaving reading pages visibly scales the Logo without distortion.

- Global botanical background is an explicit exception to the general perceptible-effects preference: it should be almost invisible while reading. Use the user's botanical-pattern-light.png and deterministic RGB #F2F2F2 dark PNG with identical alpha/dimensions; no generative redraw. Background controls live in src/styles/botanical-background.css (opacity .04/.05, tile 420/320px, reading strength .2). Keep this separate from divider imagery.

- Font-system update (2026-11-08): font faces and role variables are centralized in src/styles/fonts.css. Preserve separate serif, display, poetry/fangsong, Courier metadata and DejaVu code roles. Display uses self-hosted EB Garamond Latin WOFF (500–650, about 70 KiB); license is public/fonts/EB-Garamond-OFL.txt. Keep it off body/navigation/About declarations. Regenerate with scripts/prepare-display-font.py; the source TTF is ../EBGaramond[wght].ttf. Home display headings use display; archive years use mono. The fixed wordmark now uses inline EB Garamond 600 outlines (src/assets/branding/wordmark.svg), generated by scripts/prepare-wordmark.py, to eliminate font-loading swaps. Preserve its 23px/21px sizing and currentColor; do not reintroduce a network font dependency for the wordmark. Special .quoted reuses Poetry Fangsong; run scripts/subset-poetry-font.py when adding literal quoted text or poems. About language-specific styles remain unchanged. See src/assets/fonts/README.md for pending steps and CJK tradeoffs.

- Review cover colors are a deliberate exception to neutral UI styling: works.css owns the color wash (work glowColor, opacity .25) and lower-right blurred cover (24px, initial .7 fading on scroll). Do not desaturate/override them in editorial.css. Stack botanical pattern at -2 and review wash at -1 within body's isolated context.

- Vintage title treatment (2026-11-08): use explicit .print-heading on selected display headings, page/article H1, all PostList titles and the text wordmark. Shared inline SVG definitions live in src/assets/typography/print-filters.svg; developer strength in src/data/print-headings.ts defaults to medium (off/subtle supported). Home/list headings and wordmark use compact treatment; mobile also reduces contour displacement. Do not filter body sections, navigation, tags, metadata, poetry, image Logo or About declarations. Preserve existing font/box metrics and wordmark outlines. See src/assets/typography/README.md; user accepted the initial title effect, added list/wordmark coverage awaits acceptance.

- Footer update (2026-11-09): no top divider on any page. Shared Footer has no VineDivider; keep .site-footer border-free. Preserve botanical dividers elsewhere.

- Online test release (2026-11-09): the user explicitly authorized publishing the current sample posts, works and reviews. src/data/publication.json includeTestContent defaults to true for this release; content loader, lists, routes, tag results and search share this switch. src/preview/content is now versioned, not Git-ignored. Setting the switch false and rebuilding restores production exclusion; local dev still includes samples. Preserve preview:true/noindex metadata and the development-only design-preview route/footer link. This supersedes earlier local-only publication instructions for these samples.
