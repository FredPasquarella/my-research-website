# Website visual system — hybrid editorial/research prototype

**Status: Proposed design, not yet approved or published.** This document describes the source styles in `styles.css` on the draft design branch.

## Design principle

Use an **editorial approach on professional pages** and a **more structured approach to learning resources**, without splitting the site into unrelated visual identities.

- Professional pages: typography-led hierarchy, generous whitespace, readable publication/presentation entries, quiet rules, and selective photography.
- Teaching pages: the same fonts and palette, with a single highlighted course destination, numbered learning modules, clear status labels, structured tables, and instructional controls only where useful.
- Avoid decorative emojis and icons in navigation, article metadata, cards, and page headings. Retain only functional accessibility-relevant interface controls provided by Quarto (for example, the search utility) when needed.

## Shared color tokens

| Token | Value | Use |
|---|---|---|
| `--site-background` | `#FAF9F6` | Warm off-white page background |
| `--site-paper` | `#FFFFFF` | Form fields and occasional clear surfaces |
| `--site-ink` | `#26363E` | Headings and body text |
| `--site-muted` | `#53656C` | Secondary explanatory text |
| `--site-accent` | `#456F76` | Supporting visual accents |
| `--site-accent-dark` | `#30545B` | Links and primary controls |
| `--site-tint` | `#EEF4F3` | Featured course region |
| `--site-border` | `#DADFD9` | Dividers and restrained borders |

Colors are proposals; check normal and focus contrast during design review.

## Typography

- Headings: **Source Serif 4**, falling back to Georgia/Times.
- Body, navigation, form inputs, and learning controls: **Source Sans 3**, with system sans-serif fallbacks.
- Fonts are loaded from Google Fonts when available; fallbacks keep the site usable if the font request fails.
- Large but restrained page titles; small uppercase text only for short section labels; paragraph line height approximately 1.7.
- Readable line lengths and generous section spacing take precedence over a dense grid.

## Page-level treatments

- `index.qmd` — editorial hero with photo, three unboxed pathways, feature publication, and clearly labeled teaching status.
- `about.qmd` — narrative biography and section headings; no empty CV placeholders.
- `research.qmd` — text-first publication and graduate research entries; no emoji metadata.
- `presentations.qmd` — divider-separated presentation records rather than heavy Bootstrap cards.
- `teaching.qmd` — featured statistics hub and structured list of planned interactive resources before teaching philosophy and experience.
- `courses/elementary-statistics/index.qmd` — sequential six-module learning pathway, followed by laboratory, software, accessibility, and project details.
- `contact.qmd` — preserve Formspree endpoint and existing form fields; simplify duplicated heading.

## Component conventions

- Use semantic Markdown/Quarto headings in document order and descriptive text links.
- Use `.editorial-hero`, `.editorial-feature-grid`, and `.editorial-spotlight` for professional landing-page components.
- Use `.course-feature`, `.course-module`, and `.course-module__number` for teaching resources.
- Reuse the shared CSS color and font tokens when developing reveal.js slides and future statistical simulations.
- Never present placeholder activities as finished lessons or link to lessons that do not exist.
- Use real data only when approved and public/de-identified/simulated; avoid identifiable student or clinical records.

## Review and release

1. Review the Quarto build artifact on desktop and at mobile widths.
2. Confirm heading and link hierarchy, typography, contrast, keyboard navigation, and content accuracy.
3. Refine the design based on feedback.
4. Publish **only after explicit owner approval** by merging the draft pull request into `main`; deployment is automatic.
5. For rollback, use a reviewed revert PR or the documented deployment fallback in `DEPLOYMENT.md`.
