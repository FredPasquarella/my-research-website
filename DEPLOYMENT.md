# GitHub Pages deployment cutover and rollback

**Status:** Proposed for owner review in Phase 2. Do not treat this runbook as approval to deploy.

## Why this change

The site currently uses Quarto to render into `docs/`. GitHub Pages is configured to serve `main` → `/docs`, and those rendered files are tracked in Git. The goal is to let GitHub Actions render and publish approved changes without requiring RStudio.

This transition **does not** change the website's content, URL, theme, or navigation.

## New workflow (proposed)

`.github/workflows/quarto-pages.yml`:

- On a pull request targeting `main`: checks out the source, installs Quarto 1.11.9, renders the site, verifies the five pages and matching `CNAME` files, and builds a Pages artifact. **The deploy job is skipped**.
- On a push to `main` or manual run on `main`: repeats the build, uploads the Pages artifact, then deploys it to the `github-pages` environment.
- Explicit job-level permissions limit the build job to `contents: read` and the deployment job to `pages: write` and `id-token: write`.
- Only the repository `FredPasquarella/my-research-website` and the `main` branch can deploy. The workflow uses deployment concurrency to prevent overlapping releases.
- The existing `.github/workflows/quarto-check.yml` remains a read-only independent validation check and provides a `quarto-site-preview` ZIP for review.

**Important:** The workflow does not push to `main` or modify `docs/` in Git. A pull request cannot deploy. The workflow will not be merged or production-enabled until the owner gives explicit approval for the cutover.

## Pre-cutover checklist (owner + developer)

1. Confirm that the proposed workflow's pull-request checks are green, including its **Render and package Quarto site** job. Its **Deploy approved main branch** job should show **skipped** for the PR.
2. Check the existing **Quarto site checks** workflow. Download `quarto-site-preview` from its run if you want a local copy of the generated HTML.
3. Confirm that GitHub Pages still shows:
   - Source: **Deploy from a branch**
   - Branch/folder: **main /docs**
   - Custom domain: **www.fredjpasquarella.com**
   - DNS check successful and HTTPS enforced
4. Keep the existing `main/docs` output in Git as an emergency fallback. Record the last known working `main` commit and verify that `docs/index.html` and `docs/CNAME` exist.
5. Obtain the **website owner's explicit permission to switch publishing sources and merge**. Permission to create or review this pull request is not permission to deploy.
6. Where available, configure GitHub's `github-pages` environment so **only `main` may deploy**. Optional required reviewers or protected-branch rules can add stronger approval enforcement; do not assume they are enabled. Avoid direct pushes to `main`.

## Owner-approved cutover: perform in this order

1. In **Settings → Pages → Build and deployment → Source**, change **Deploy from a branch** to **GitHub Actions**. If GitHub suggests creating a workflow template, do not create a second publishing workflow.
2. Verify that the custom domain remains **www.fredjpasquarella.com** and HTTPS remains enabled. If either changes, stop and investigate before merging.
3. Merge the approved Phase 2 pull request into `main`. The resulting push triggers **Quarto Pages deployment**.
4. In **Actions → Quarto Pages deployment**, verify **Render and package Quarto site** followed by **Deploy approved main branch** completes successfully. If a deployment environment prompts for approval, authorize it after reviewing the source revision.
5. Verify the public site at https://www.fredjpasquarella.com/ (and the About, Research, Presentations, Contact, and PDF links). Confirm HTTPS, the domain, and navigation. Compare the output to the pre-cutover site.
6. Record the workflow run link, the deployed commit, and any observations in the pull-request discussion.

A Pages deployment may fail before the source is switched to **GitHub Actions**. Do not merge this workflow expecting production success while Pages still uses **Deploy from a branch**.

## What happens after cutover

Future feature branches are reviewed through pull requests. Once an approved PR is merged into `main`, the new workflow renders and publishes the **source at that commit**. RStudio rendering and committing `docs/` are no longer required for routine deployment.

Keep `docs/` tracked temporarily as a fallback. Removing generated files from version control, changing `_quarto.yml` output settings, or turning on branch protection should be proposed and reviewed separately.

**Current GitHub limitation:** Direct pushes to unprotected `main` could still trigger deployment. Use pull requests and avoid direct pushes; consider repository rules/branch protection with required checks and approvals as a separate administrative step.

## Rollback and troubleshooting

### If a proposed PR fails

- Do not merge it. Inspect the **Actions** logs and fix the feature branch. The live site is unaffected.

### If the first Actions deployment fails after changing Pages source

1. Do not make further changes to source or DNS.
2. Open **Settings → Pages → Build and deployment**.
3. Set Source back to **Deploy from a branch**, selecting **main /docs**, and save.
4. Confirm the pre-cutover `docs/` site is serving from the existing tracked output. Confirm custom domain, DNS, HTTPS, and key pages.
5. Diagnose and repair the workflow on a feature branch. Retry only after a fresh review and approval.

### If a later deployment publishes a bad change

- Prefer reverting the offending PR/commit on `main` (through a reviewed revert PR), which will rebuild and redeploy the restored source.
- For an urgent restore, temporarily switch Pages back to **main /docs**, which will serve the *last committed* output from that folder. Note that `docs/` can become stale after the cutover.
- Do not force-push `main`, delete the `docs/` fallback, remove `CNAME`, or change DNS during rollback.

## Technical references

- [GitHub: Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub: Using custom workflows with Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Quarto: GitHub Pages and custom domains](https://quarto.org/docs/publishing/github-pages.html)
