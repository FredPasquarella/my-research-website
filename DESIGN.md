# Website visual system: hybrid editorial and research prototype

**Status: Draft design, not published.** This document describes the source styles in `styles.css` on the draft design branch.

## Design principle

Use an **editorial approach on professional pages** and a **more structured approach to learning resources**, without splitting the site into unrelated visual identities.

- Professional pages: typography-led hierarchy, generous whitespace, readable publication/presentation entries, quiet rules, and selective photography.
- Teaching pages: the same fonts and palette, with an expandable course catalog, a separate area for individual learning resources, numbered learning modules, clear status labels, structured tables, and instructional controls only where useful.
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
- `teaching.qmd`: teaching and learning homepage with separate sections for courses, individual lectures and videos, and interactive resources. Personal teaching approach and limited research project guidance appear below.
- `courses/elementary-statistics/index.qmd`: first course collection, with a six-module pathway and laboratory, software, accessibility, and project details.
- `contact.qmd` — preserve Formspree endpoint and existing form fields; simplify duplicated heading.

## Component conventions

- Use semantic Markdown/Quarto headings in document order and descriptive text links.
- Use `.editorial-hero`, `.editorial-feature-grid`, and `.editorial-spotlight` for professional landing-page components.
- Use `.course-feature`, `.course-module`, and `.course-module__number` for teaching resources.
- Reuse the shared CSS color and font tokens when developing reveal.js slides and future statistical simulations.
- Never present placeholder activities as finished lessons or link to lessons that do not exist.
- Use real data only when approved and public/de-identified/simulated; avoid identifiable student or clinical records.

## Teaching information architecture

The Teaching and Learning section is a permanent hub, not a single-course website.

- Put each course or sustained learning sequence in its own folder under `courses/<course-slug>/`, with an `index.qmd` overview and its own lessons when ready. The initial example is `courses/elementary-statistics/index.qmd`.
- List all available courses on `teaching.qmd`, adding new entries to the existing Courses and learning pathways section. Do not redesign the global navigation for every new course.
- Support standalone lectures, recorded explanations, worked examples, and topic-based interactive demonstrations that do not belong to a full course. Introduce a dedicated resource collection or index once real material exists; avoid empty public sections and placeholder launch links.
- Reuse the site typography, color variables, and accessibility conventions for future Quarto/reveal.js slides, embedded videos, and HTML simulations.
- Do not imply a course, lesson, or video is published before it is ready.

## Editorial principles

- Keep copy precise and natural. Avoid formulaic promotional phrases, inflated claims, and long sentences that try to summarize too many goals.
- Prefer ordinary commas, colons, and periods to typographic en dashes or em dashes in authored page copy. Ordinary hyphens remain appropriate inside established terms and published titles should be cited accurately.
- Position applied research, data science, and program evaluation as principal areas of work. Retain measurement as an important supporting area.
- Describe doctoral internship work as periodic project guidance with consultation as needed, rather than implying substantial classroom teaching or extensive ongoing mentorship.
- Preserve verified facts, citations, and links when making stylistic changes.

## Review and release

1. Review the Quarto build artifact on desktop and at mobile widths.
2. Confirm heading and link hierarchy, typography, contrast, keyboard navigation, and content accuracy.
3. Refine the design based on feedback.
4. Publish **only after explicit owner approval** by merging the draft pull request into `main`; deployment is automatic.
5. For rollback, use a reviewed revert PR or the documented deployment fallback in `DEPLOYMENT.md`.
