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

## Week 5 component: Normal probabilities and simulated frequencies

- Course: Elementary Statistics sample syllabus, Week 5, normal distributions and basic probability.
- Scope: Normal area/probability, standard scores, cutoff/tail direction, and long-run interpretation of simulated probability. This activity **does not replace** separate instruction on conditional probability and independence.
- Model: Synthetic normal population with mean 50 and SD 10, consistent with the Week 6 population parameters.
- Interaction: Threshold 30 to 70, probability at or below versus above, theoretical normal curve with shaded region, and a histogram that accumulates independently drawn scores. The probability table retains the theoretical and observed percentages.
- Learning pattern: Prediction, interactive experiment, interpretation, technical explanation followed by intuition, then four objective-aligned knowledge checks with explicit Correct./Incorrect. labels.
- `assets/interactive/normal-probability-math.mjs`: independent functions for normal CDF, standard scores, theoretical probabilities, and count-based simulated frequencies, reusing the existing Week 6 normal random-number generator.
- `assets/interactive/normal-probability-lesson.mjs`: accessible plot, control behavior and response feedback.
- `assets/interactive/normal-probability-lesson.css`: scoped presentation matching site design and existing feedback components.
- `tests/normal-probability.test.mjs`: numerical comparison with standard normal benchmarks, complementary tails, empirical frequencies, and lesson structure checks.
- The empirical histogram uses 16 fixed five-point bins across the displayed score range 10 to 90. Each bar contains actual counts, split into scores inside and outside the chosen probability region, even when a threshold cuts through a bin.
- Out-of-range scores remain in both the total number of draws and the probability calculations. Their count is disclosed under the histogram, so the numerical probability does not silently exclude them.
- The two graphics share the score axis but use different vertical scales: density for the theoretical normal curve and observed frequency for the histogram. The histogram vertical scale changes as more samples are drawn.
- Each new batch adds to existing bins. Changing the threshold, selecting the other tail, or resetting clears the counts rather than reclassifying old observations.
- Automated tests verify that histogram bin totals and highlighted counts match the simulated draws, including extremes, that batches accumulate correctly, and that reset creates fresh empty state.

Manual verification: Move cutoff and change tail; observe the area, z-score, and theoretical probability; draw 100 then 1,000 scores; verify the observed frequency is not artificially forced to the theoretical value; ensure changing settings resets observations; check all answer feedback, keyboard navigation, and phone-sized layouts.

The SVG curve shows the horizontal range 10 to 90 for legibility; the calculated probability is for the entire theoretical distribution, including the negligible normal tails beyond the plotted limits. No real participant, student, or clinical data are collected or stored.

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
