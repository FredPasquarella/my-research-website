# Fred J. Pasquarella — Research Website

Source code for [www.fredjpasquarella.com](https://www.fredjpasquarella.com/), built with [Quarto](https://quarto.org/).

## Current publishing arrangement

- The default branch is `main`.
- Quarto source is stored in the repository root (`*.qmd`, `_quarto.yml`, and `styles.css`).
- `quarto render` generates the website in `docs/`.
- GitHub Pages currently publishes **`main` → `/docs`**, with `www.fredjpasquarella.com` as the custom domain.
- Rendered `docs/` files are currently tracked in Git. They remain necessary for the existing branch-based publishing arrangement.

**Do not remove `docs/`, change the GitHub Pages publishing source, or change the domain during initial development.**

## Proposed review workflow

1. Create a feature branch from `main`, rather than editing `main` directly.
2. Make source changes on that branch.
3. Open a pull request (PR) targeting `main`.
4. The **Quarto site checks** workflow renders the project, validates the expected pages and domain file, and uploads a downloadable `quarto-site-preview` artifact.
5. Review the PR's changed files and build checks. The artifact contains a rendered site for inspection; it is **not** a public preview URL.
6. Obtain the site owner's explicit approval before merging or publishing.

The check workflow uses read-only repository permissions. It does **not** push generated files or deploy to GitHub Pages.

## Previewing locally (optional)

With Quarto installed, run from the repository root:

```sh
quarto render
python3 -m http.server 8000 --directory docs
```

Then open `http://localhost:8000/`. Stop the server with Ctrl+C. RStudio can still render and preview the site as before.

## Important: current production release limitation

Under the existing `main` → `/docs` arrangement, a content change will not appear on the live site unless the generated files in `docs/` are also updated and committed to `main`.

Do not assume the new check workflow publishes changes. In particular, commits pushed with the default GitHub Actions `GITHUB_TOKEN` do not trigger a GitHub Pages build for branch-based publishing.

### Phase 2 publishing workflow (proposed; not live yet)

The proposed `.github/workflows/quarto-pages.yml` workflow prepares a GitHub Pages artifact on pull requests **without deploying it**. After a separately approved cutover, merges to `main` will render and deploy the Quarto website automatically.

**Do not merge the publishing workflow or change GitHub Pages Source until the owner explicitly approves the cutover.** The existing publishing source remains **Deploy from a branch → main /docs** for now.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the exact cutover sequence, domain and HTTPS checks, deployment verification, and rollback instructions.

## Rollback

- **Before merging:** close the PR or revert changes on the feature branch; `main` and the live website remain unaffected.
- **After a release:** use a GitHub revert commit or restore a known-good `main` revision, including its matching `docs/` output; recheck the published site. Do not force-push `main`.

## Repository layout

- `_quarto.yml` — Quarto configuration and navigation
- `index.qmd`, `about.qmd`, `research.qmd`, `presentations.qmd`, `contact.qmd` — page content
- `styles.css` — existing styling
- `assets/` — images and downloadable research materials
- `docs/` — currently deployed HTML and static assets
- `.github/workflows/quarto-check.yml` — build validation; no deployment
