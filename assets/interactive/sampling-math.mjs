/**
 * Pure probability and simulation functions for the Week 6 learning activity.
 * Population models share the same known mean (50) and SD (10).
 * Each draw is independent, with replacement, from a theoretical population.
 * This module has no browser dependencies so it can be unit tested in Node.
 */

export const POPULATION_MEAN = 50;
export const POPULATION_SD = 10;
export const POPULATION_TYPES = Object.freeze(["normal", "skewed"]);

function uniform(rng) {
  const value = rng();
  if (!(value >= 0 && value < 1)) {
    throw new RangeError("Random source must return a number in [0, 1).");
  }
  return value;
}

export function expectedStandardError(sampleSize) {
  if (!Number.isInteger(sampleSize) || sampleSize < 1) {
    throw new RangeError("Sample size must be a positive integer.");
  }
  return POPULATION_SD / Math.sqrt(sampleSize);
}

export function populationDensity(x, populationType) {
  const z = (x - POPULATION_MEAN) / POPULATION_SD;
  if (populationType === "normal") {
    return Math.exp(-0.5 * z * z) / (POPULATION_SD * Math.sqrt(2 * Math.PI));
  }
  if (populationType === "skewed") {
    // X = 40 + Exp(rate = 1/10), with E[X] = 50 and SD[X] = 10.
    return x < 40 ? 0 : Math.exp(-(x - 40) / 10) / 10;
  }
  throw new RangeError("Unknown population model.");
}

export function drawObservation(populationType, rng = Math.random) {
  if (populationType === "normal") {
    // Box-Muller transform. 1-U is strictly positive for U in [0,1).
    const u1 = 1 - uniform(rng);
    const u2 = uniform(rng);
    return POPULATION_MEAN + POPULATION_SD *
      Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  if (populationType === "skewed") {
    // Shifted exponential distribution, mean 50 and SD 10.
    return 40 - 10 * Math.log(1 - uniform(rng));
  }
  throw new RangeError("Unknown population model.");
}

export function takeSample(sampleSize, populationType, rng = Math.random) {
  if (!Number.isInteger(sampleSize) || sampleSize < 1 || sampleSize > 500) {
    throw new RangeError("Sample size must be an integer between 1 and 500.");
  }
  const values = [];
  let sum = 0;
  for (let i = 0; i < sampleSize; i += 1) {
    const value = drawObservation(populationType, rng);
    values.push(value);
    sum += value;
  }
  return { values, mean: sum / sampleSize };
}

export function describe(values) {
  // Welford's numerically stable online algorithm; sample SD for >1 values.
  let n = 0;
  let mean = 0;
  let m2 = 0;
  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new RangeError("Cannot summarize non-finite data.");
    }
    n += 1;
    const delta = value - mean;
    mean += delta / n;
    m2 += delta * (value - mean);
  }
  return {
    n,
    mean: n ? mean : null,
    sd: n > 1 ? Math.sqrt(m2 / (n - 1)) : null,
  };
}

export function makeSeededRandom(seed = 1) {
  // Mulberry32: deterministic pseudorandom source for automated validation.
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
