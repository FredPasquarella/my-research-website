import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { makeSeededRandom } from "../assets/interactive/sampling-math.mjs";
import {
  MODEL_MEAN, MODEL_SD, standardize, standardNormalCDF,
  modelProbability, drawNormalTrials, observedFraction,
  emptyHistogram, mergeHistograms, histogramTotals,
  histogramBinIndex, HISTOGRAM_MIN, HISTOGRAM_MAX, HISTOGRAM_BIN_COUNT,
} from "../assets/interactive/normal-probability-math.mjs";

function near(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) < tolerance,
    "Expected " + actual + " to be close to " + expected);
}

test("the model standardizes scores using the same parameters as Week 6", () => {
  assert.equal(MODEL_MEAN, 50);
  assert.equal(MODEL_SD, 10);
  near(standardize(50), 0);
  near(standardize(60), 1);
  near(standardize(30), -2);
  assert.throws(() => standardize(60, 50, 0), RangeError);
});

test("normal CDF agrees with canonical areas and symmetry", () => {
  near(standardNormalCDF(0), 0.5);
  near(standardNormalCDF(1), 0.841344746, 2e-7);
  near(standardNormalCDF(-1), 0.158655254, 2e-7);
  near(standardNormalCDF(2), 0.977249868, 2e-7);
  near(standardNormalCDF(-2), 0.022750132, 2e-7);
  near(standardNormalCDF(3), 0.998650102, 2e-7);
  near(standardNormalCDF(-3), 0.001349898, 2e-7);
  for (const z of [-3, -2, -1, 0, 1, 2, 3]) {
    near(standardNormalCDF(z) + standardNormalCDF(-z), 1, 2e-10);
  }
  assert.throws(() => standardNormalCDF(NaN), RangeError);
});

test("normal probability covers complementary and monotonic regions", () => {
  near(modelProbability(50, "below"), 0.5, 2e-9);
  near(modelProbability(60, "above"), 0.158655254, 2e-7);
  near(modelProbability(65, "above"), 0.0668072, 2e-6);
  near(modelProbability(70, "above"), 0.022750132, 2e-7);
  for (const t of [30, 40, 50, 60, 70]) {
    near(modelProbability(t, "above") + modelProbability(t, "below"), 1, 1e-12);
  }
  assert.ok(modelProbability(70, "above") < modelProbability(60, "above"));
  assert.ok(modelProbability(70, "below") > modelProbability(60, "below"));
});

test("repeated normal observations approximate the theoretical tail frequency", () => {
  const rng = makeSeededRandom(907);
  const s = drawNormalTrials(60, "above", 10000, rng);
  assert.equal(s.count, 10000);
  assert.ok(s.matches >= 0 && s.matches <= 10000);
  assert.ok(Number.isFinite(s.lastValue));
  near(observedFraction(s.matches, s.count), modelProbability(60, "above"), 0.018);
});

test("independent batches accumulate correctly and have valid fractions", () => {
  const rng = makeSeededRandom(99);
  const a = drawNormalTrials(50, "below", 100, rng);
  const b = drawNormalTrials(50, "below", 1000, rng);
  const p = observedFraction(a.matches + b.matches, a.count + b.count);
  assert.ok(p > 0.42 && p < 0.58);
  assert.equal(observedFraction(0, 0), null);
  assert.equal(observedFraction(2, 5), 0.4);
});

test("invalid inputs are rejected", () => {
  assert.throws(() => modelProbability(60, "between"), RangeError);
  assert.throws(() => modelProbability(Infinity, "above"), RangeError);
  assert.throws(() => drawNormalTrials(50, "above", 0), RangeError);
  assert.throws(() => drawNormalTrials(50, "above", 10001), RangeError);
  assert.throws(() => observedFraction(5, 4), RangeError);
  assert.throws(() => observedFraction(-1, 4), RangeError);
});

test("simulated scores accumulate into fixed five-point bins", () => {
  assert.equal(HISTOGRAM_MIN, 10);
  assert.equal(HISTOGRAM_MAX, 90);
  assert.equal(HISTOGRAM_BIN_COUNT, 16);
  assert.equal(histogramBinIndex(10), 0);
  assert.equal(histogramBinIndex(14.99), 0);
  assert.equal(histogramBinIndex(15), 1);
  assert.equal(histogramBinIndex(60), 10);
  assert.equal(histogramBinIndex(89.99), 15);
  assert.equal(histogramBinIndex(9), -1);
  assert.equal(histogramBinIndex(90), 16);

  const rng = makeSeededRandom(8402);
  const first = drawNormalTrials(61, "above", 100, rng);
  const second = drawNormalTrials(61, "above", 1000, rng);
  const combined = mergeHistograms(first.histogram, second.histogram);
  const totals = histogramTotals(combined);

  assert.equal(totals.total, 1100);
  assert.equal(totals.selectedTotal, first.matches + second.matches);
  assert.equal(totals.displayed + totals.outside, 1100);
  assert.equal(first.count + second.count, 1100);
  assert.equal(first.histogram.counts.length, HISTOGRAM_BIN_COUNT);
  assert.equal(combined.counts.length, HISTOGRAM_BIN_COUNT);
  assert.ok(combined.counts.some(n => n > 0));
  assert.ok(combined.counts[10] > 0 && combined.selectedCounts[10] > 0,
    "The threshold-crossing 60–65 bin should contain selected scores");
  assert.ok(combined.selectedCounts[10] < combined.counts[10],
    "The cutoff should split one bin into both matching and other scores");

  // Merge does not alter earlier batches or their arrays.
  const originalTotal = histogramTotals(first.histogram);
  assert.equal(originalTotal.total, 100);
  assert.equal(originalTotal.selectedTotal, first.matches);
});

test("scores outside the displayed range still count toward probabilities", () => {
  // Box-Muller draws: approximately 7.57, 92.43, 62, and 58.94.
  const uniforms = [
    1 - Math.exp(-9), 0.5,
    1 - Math.exp(-9), 0,
    1 - Math.exp(-0.72), 0,
    1 - Math.exp(-0.4), 0,
  ];
  let index = 0;
  const batch = drawNormalTrials(60, "above", 4, () => uniforms[index++]);
  const totals = histogramTotals(batch.histogram);
  assert.equal(batch.matches, 2);
  assert.equal(totals.total, 4);
  assert.equal(totals.displayed, 2);
  assert.equal(totals.outside, 2);
  assert.equal(totals.selectedTotal, 2);
  assert.equal(batch.histogram.belowRange, 1);
  assert.equal(batch.histogram.aboveRange, 1);
  assert.equal(batch.histogram.selectedOutside, 1);
});

test("reset gives a fresh empty histogram with no old observations", () => {
  const empty = emptyHistogram();
  assert.deepEqual(histogramTotals(empty), {
    displayed: 0, selectedDisplayed: 0, outside: 0, total: 0,
    selectedTotal: 0,
  });
  const rng = makeSeededRandom(123);
  const filled = mergeHistograms(empty, drawNormalTrials(50, "below", 100, rng).histogram);
  assert.equal(histogramTotals(filled).total, 100);

  const reset = emptyHistogram();
  assert.equal(histogramTotals(reset).total, 0);
  assert.notEqual(reset.counts, filled.counts);
  assert.notEqual(reset.counts, empty.counts);
  reset.counts[0] = 3;
  assert.equal(empty.counts[0], 0, "Reset arrays must not share references");
});

const lesson = readFileSync(
  new URL("../courses/elementary-statistics/lessons/normal-probability.qmd", import.meta.url), "utf8"
);
const browser = readFileSync(
  new URL("../assets/interactive/normal-probability-lesson.mjs", import.meta.url), "utf8"
);

test("Week 5 lesson aligns four objectives with end-of-lesson questions", () => {
  const goals = lesson.split("**Learning goals**")[1]?.split("**Before starting:**")[0] ?? "";
  assert.equal((goals.match(/^\d\. /gm) || []).length, 4);
  const ids = [...lesson.matchAll(/data-question="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, ["area", "z", "threshold", "frequency"]);
  assert.ok(lesson.indexOf("## Check your understanding") >
    lesson.indexOf("## What is the normal model telling us?"));
  assert.equal((lesson.match(/data-action="check-answer"/g) || []).length, 4);
  // Prediction, activity status, histogram summary, and four question responses.
  assert.equal((lesson.match(/aria-live="polite"/g) || []).length, 7);
});

test("feedback reuses explicit theme labels and separate correct/incorrect responses", () => {
  assert.match(browser, /"Correct\."/);
  assert.match(browser, /"Incorrect\."/);
  assert.match(browser, /feedback\(response, selected\.value === answer\.key \? "correct" : "incorrect"/);
  assert.match(lesson, /normal-probability-lesson\.mjs/);
  assert.match(lesson, /normal-probability-lesson\.css/);
  assert.match(lesson, /normal-probability-check/);
  assert.match(lesson, /data-chart="empirical-histogram"/);
  assert.match(lesson, /data-output="empirical-description"/);
  assert.ok(!lesson.includes('data-bar="theoretical"'));
  assert.ok(!lesson.includes('data-bar="observed"'));
  assert.match(browser, /drawEmpiricalHistogram\(\)/);
  assert.match(browser, /state.histogram = mergeHistograms\(state.histogram, batch.histogram\)/);
  assert.match(browser, /state.histogram = emptyHistogram\(\)/);
});
