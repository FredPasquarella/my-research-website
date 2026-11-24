import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BASELINE_TIMES,
  describeDistribution,
  withAdjustedTime,
} from "../assets/interactive/distribution-math.mjs";

function near(actual, expected, tol = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tol,
    "Expected " + actual + " to be close to " + expected);
}

test("baseline summary matches the displayed example", () => {
  const result = describeDistribution(BASELINE_TIMES);
  assert.equal(result.n, 10);
  near(result.mean, 10.7);
  near(result.median, 10.5);
  near(result.sd, 1.888562063228706);
  near(result.range, 6);
  near(result.z, (14 - 10.7) / 1.888562063228706);
  assert.deepEqual(result.sorted, [8, 9, 9, 10, 10, 11, 11, 12, 13, 14]);
});

test("changing only the last observation raises the mean and spread, not the median", () => {
  const before = describeDistribution(BASELINE_TIMES);
  const modified = withAdjustedTime(35);
  const after = describeDistribution(modified);
  assert.deepEqual(modified.slice(0, -1), BASELINE_TIMES.slice(0, -1));
  assert.equal(modified.at(-1), 35);
  near(after.mean, 12.8);
  near(after.median, 10.5);
  assert.ok(after.sd > before.sd);
  assert.equal(after.range, 27);
  assert.ok(after.mean - before.mean > after.median - before.median);
  assert.equal(BASELINE_TIMES.at(-1), 14, "immutable baseline unchanged");
});

test("sample SD uses n minus 1 and z is in SD units", () => {
  const result = describeDistribution([1, 3, 5], 2);
  near(result.mean, 3);
  near(result.median, 3);
  near(result.sd, 2);
  near(result.z, 1);
  near(result.range, 4);
});

test("median handles odd/even sample sizes and duplicates", () => {
  assert.equal(describeDistribution([12, 1, 2], 0).median, 2);
  assert.equal(describeDistribution([2, 2, 4, 6], 0).median, 3);
  const equal = describeDistribution([7, 7, 7], 0);
  assert.equal(equal.sd, 0);
  assert.equal(equal.z, null, "z is undefined when SD is zero");
});

test("invalid values are rejected and input is not mutated", () => {
  for (const invalid of [13, 41, NaN, Infinity, 14.5]) {
    assert.throws(() => withAdjustedTime(invalid), RangeError);
  }
  assert.throws(() => withAdjustedTime(14, [10]), RangeError);
  assert.throws(() => describeDistribution([]), RangeError);
  assert.throws(() => describeDistribution([1, Number.POSITIVE_INFINITY]), RangeError);
  assert.throws(() => describeDistribution([1, 2], 3), RangeError);
  const values = [9, 2, 5];
  describeDistribution(values);
  assert.deepEqual(values, [9, 2, 5]);
});

const lesson = readFileSync(
  new URL("../courses/elementary-statistics/lessons/describing-distributions.qmd", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL("../assets/interactive/distribution-lesson.mjs", import.meta.url),
  "utf8"
);
const styles = readFileSync(
  new URL("../assets/interactive/interactive-lessons.css", import.meta.url),
  "utf8"
);

test("four review questions follow the technical and intuitive explanation", () => {
  const objectives = lesson.split("**Learning goals**")[1].split("**Before starting:**")[0];
  assert.equal((objectives.match(/^\d\. /gm) || []).length, 4);
  const ids = [...lesson.matchAll(/data-question="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["center", "outlier", "variation", "z-score"]);
  assert.ok(lesson.indexOf("## Check your understanding") >
            lesson.indexOf("## What do these summaries tell us?"));
  assert.equal((lesson.match(/data-action="check-answer"/g) || []).length, 4);
  assert.equal((lesson.match(/aria-live="polite"/g) || []).length, 4);
});

test("answer logic uses explicit labels and thematic feedback colors", () => {
  assert.match(controller, /correct: "Correct\."/);
  assert.match(controller, /incorrect: "Incorrect\."/);
  assert.match(controller, /const checkRoot = document\.getElementById\("distribution-knowledge-check"\)/);
  assert.match(controller, /feedback\.dataset\.result = result/);
  assert.match(styles, /\.clt-feedback\[data-result="correct"\]/);
  assert.match(styles, /\.clt-feedback\[data-result="incorrect"\]/);
});
