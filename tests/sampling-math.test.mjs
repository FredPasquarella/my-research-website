import test from "node:test";
import assert from "node:assert/strict";
import {
  POPULATION_MEAN,
  POPULATION_SD,
  populationDensity,
  expectedStandardError,
  drawObservation,
  takeSample,
  describe,
  makeSeededRandom,
} from "../assets/interactive/sampling-math.mjs";

function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) < tolerance,
    message + ": expected " + expected + ", got " + actual);
}

function collectMeans(type, n, repetitions, seed) {
  const rng = makeSeededRandom(seed);
  const means = [];
  for (let i = 0; i < repetitions; i += 1) {
    means.push(takeSample(n, type, rng).mean);
  }
  return means;
}

function skewness(values) {
  const { mean, sd } = describe(values);
  const n = values.length;
  return values.reduce((sum, x) => sum + ((x - mean) / sd) ** 3, 0) / n;
}

test("sample means use exactly the requested number of observations", () => {
  const s = takeSample(5, "normal", makeSeededRandom(42));
  assert.equal(s.values.length, 5);
  near(s.mean, s.values.reduce((a, b) => a + b, 0) / 5, 1e-12,
    "sample mean");
});

test("sampling models have plausible theoretical densities", () => {
  near(populationDensity(50, "normal"), 1 / (10 * Math.sqrt(2 * Math.PI)),
    1e-12, "normal density at its mean");
  assert.equal(populationDensity(39, "skewed"), 0);
  near(populationDensity(40, "skewed"), 0.1, 1e-12,
    "shifted exponential density");
  assert.equal(POPULATION_MEAN, 50);
  assert.equal(POPULATION_SD, 10);
});

test("theoretical standard error scales as 1/sqrt(n)", () => {
  near(expectedStandardError(5), 10 / Math.sqrt(5), 1e-12, "SE at n=5");
  near(expectedStandardError(20), expectedStandardError(5) / 2,
    1e-12, "quadrupling n halves SE");
  assert.throws(() => expectedStandardError(0), RangeError);
  assert.throws(() => expectedStandardError(2.5), RangeError);
});

test("normal and right-skewed populations have mean near 50 and SD near 10", () => {
  for (const type of ["normal", "skewed"]) {
    const rng = makeSeededRandom(type === "normal" ? 41 : 43);
    const values = [];
    for (let i = 0; i < 25000; i += 1) values.push(drawObservation(type, rng));
    const s = describe(values);
    near(s.mean, 50, 0.4, type + " population mean");
    near(s.sd, 10, 0.4, type + " population SD");
  }
});

test("empirical SD of sample means approaches theoretical standard error", () => {
  for (const type of ["normal", "skewed"]) {
    for (const n of [2, 5, 30]) {
      const means = collectMeans(type, n, 15000, 100 + n);
      const s = describe(means);
      near(s.mean, 50, 0.35, type + " mean of means n=" + n);
      near(s.sd, expectedStandardError(n), 0.3,
        type + " SD of means n=" + n);
    }
  }
});

test("sampling means from skewed population becomes less skewed as n increases", () => {
  const small = collectMeans("skewed", 2, 12000, 101);
  const large = collectMeans("skewed", 30, 12000, 101);
  assert.ok(skewness(small) > skewness(large) + 0.5,
    "skewness should substantially decrease with larger sample size");
  assert.ok(Math.abs(skewness(large)) < 0.6,
    "distribution of means should be less skewed at n=30");
});

test("summary handles zero or one sample without inventing an SD", () => {
  assert.deepEqual(describe([]), { n: 0, mean: null, sd: null });
  assert.deepEqual(describe([50]), { n: 1, mean: 50, sd: null });
  assert.throws(() => describe([Infinity]), RangeError);
});

test("the random source is deterministic when seeded and rejects invalid values", () => {
  assert.equal(makeSeededRandom(123)(), makeSeededRandom(123)());
  assert.throws(() => drawObservation("normal", () => 1), RangeError);
  assert.throws(() => drawObservation("missing"), RangeError);
  assert.throws(() => takeSample(0, "normal"), RangeError);
});
