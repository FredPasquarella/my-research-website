# Interactive teaching component guide

Status: Development draft. The source files below are intended for a Quarto website hosted on GitHub Pages.

## First component

- Course: Elementary Statistics sample syllabus, Week 6
- Topic: Sampling distributions, the central limit theorem, standard error
- Syllabus connection: Lab 3, simulate sampling variability and examine sample size
- Example: two synthetic theoretical populations with mean 50 and SD 10
- Learning objective: distinguish observations from sample means, explain effects of sample size on variability, compare observed and theoretical standard error, and recognize that the distribution of means can become more approximately normal

## Files and reusable design

- `courses/elementary-statistics/lessons/sampling-distributions.qmd`: instructional page with an introduction, prediction, interactive activity, interpretation prompts, knowledge check, and Lab 3 connection
- `assets/interactive/sampling-math.mjs`: independent and testable statistical logic. No DOM dependencies
- `assets/interactive/sampling-distributions.mjs`: browser interactions, charts, summaries, and immediate feedback. No external libraries
- `assets/interactive/interactive-lessons.css`: controls, accessible feedback, responsive layout, and site design tokens
- `tests/sampling-math.test.mjs`: Node built-in tests for sampling, model parameters, standard error, and convergence
- `_quarto.yml`: explicit resource copy rules for static JavaScript and CSS

Future lessons should follow the same instructional pattern: question, prerequisites, prediction, interaction, interpretation, knowledge check, and a link back to the appropriate course unit. Reuse styles and numerical utilities as appropriate, not entire unrelated activities.

## Statistical implementation

The normal model is `N(50, 10^2)`. The skewed model is `40 + Exponential(mean=10)`. Both have population mean 50 and population SD 10.

For each independent sample of size n, draw n independent observations with replacement and calculate their mean. Repeat sampling to build an empirical sampling distribution.

Theoretical standard error for both models is `10 / sqrt(n)`. The observed SD of accumulated sample means should approach that quantity as the number of repetitions grows.

The histograms use a shared horizontal scale for easy comparison. Their vertical scales are independently adjusted; this is explained in the activity. Theoretical population curve and simulated means use different representations. No sample results are persisted or transmitted.

The central limit theorem is stated cautiously: when observations are independent and identically distributed with finite variance, suitably standardized sample means approach normality as n grows. A particular sample size is not a universal threshold.

## Quality checks and open manual checks

GitHub Actions must run Node syntax checks, numerical tests, `quarto render`, and existence/asset checks before a merge.

Before release, manually verify in a standard web browser:

1. The population curve changes when population shape changes; the right plot resets as expected.
2. Drawing 1, 100, and 1,000 independent samples updates the histogram and numerical table.
3. Changing population or sample size clears old data and recalculates theoretical SE.
4. The n=5 and n=30 simulation provides meaningful differences in spread; repeated draws approach the SE formula.
5. Both prediction and knowledge-check controls work with pointer and keyboard interaction, with understandable feedback announced to assistive technology.
6. On mobile widths, controls stack and charts remain legible and navigable.
7. With reduced-motion settings or slow fonts, essential functionality remains accessible.
8. The full site and lesson load from the actual GitHub Pages domain using HTTPS.

This lesson is independent practice, not a graded Lab 3 submission. No student information should be placed in the public site.

## Rendering locally

Run `quarto render` at the repository root. To test module imports, serve the rendered `docs/` folder through a local HTTP server instead of opening the rendered HTML from a `file://` URL. Browser ES module imports can be blocked from local file URLs.

The project is configured to publish only on approved merges to `main`. Work on a feature branch and review the pull request artifacts before publishing.
