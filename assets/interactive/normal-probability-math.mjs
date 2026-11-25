/**
 * Week 5: theoretical normal probabilities and independent observations.
 * Reuse the Week 6 normal sampling function to keep both activities consistent.
 * There are no browser dependencies, so numerical results can be unit tested.
 */
import { drawObservation } from "./sampling-math.mjs";

export const MODEL_MEAN = 50;
export const MODEL_SD = 10;
export const THRESHOLD_MIN = 30;
export const THRESHOLD_MAX = 70;
export const SIDES = Object.freeze(["below", "above"]);

export function standardize(value, mean = MODEL_MEAN, sd = MODEL_SD) {
  if (![value, mean, sd].every(Number.isFinite) || sd <= 0) {
    throw new RangeError("The value and mean must be finite, and SD must be positive.");
  }
  return (value - mean) / sd;
}

export function standardNormalCDF(z) {
  if (!Number.isFinite(z)) throw new RangeError("z must be finite.");
  // Preserve the exact symmetry of the standard normal at its mean.
  if (z === 0) return 0.5;
  // Abramowitz and Stegun 7.1.26; maximum absolute error ~7.5e-8.
  const a = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * a);
  const polynomial = t * (0.319381530 + t *
    (-0.356563782 + t * (1.781477937 + t *
      (-1.821255978 + t * 1.330274429))));
  const upperTail = Math.exp(-0.5 * a * a) / Math.sqrt(2 * Math.PI) * polynomial;
  return z >= 0 ? 1 - upperTail : upperTail;
}

export function modelProbability(threshold, side) {
  if (!SIDES.includes(side)) throw new RangeError("Side must be below or above.");
  if (!Number.isFinite(threshold)) throw new RangeError("Threshold must be finite.");
  const below = standardNormalCDF(standardize(threshold));
  return side === "below" ? below : 1 - below;
}

// Keep identical fixed-width bins while observations accumulate. The displayed
// score scale matches the theoretical curve. Extreme draws outside that scale
// remain in the numerical probabilities and are counted separately.
export const HISTOGRAM_MIN = 10;
export const HISTOGRAM_MAX = 90;
export const HISTOGRAM_BIN_WIDTH = 5;
export const HISTOGRAM_BIN_COUNT =
  (HISTOGRAM_MAX - HISTOGRAM_MIN) / HISTOGRAM_BIN_WIDTH;

export function emptyHistogram() {
  return {
    counts: new Array(HISTOGRAM_BIN_COUNT).fill(0),
    selectedCounts: new Array(HISTOGRAM_BIN_COUNT).fill(0),
    belowRange: 0,
    aboveRange: 0,
    selectedOutside: 0,
  };
}

export function histogramBinIndex(value) {
  if (!Number.isFinite(value)) throw new RangeError("Scores must be finite.");
  if (value < HISTOGRAM_MIN) return -1;
  if (value >= HISTOGRAM_MAX) return HISTOGRAM_BIN_COUNT;
  return Math.floor((value - HISTOGRAM_MIN) / HISTOGRAM_BIN_WIDTH);
}

export function mergeHistograms(first, second) {
  if (first.counts.length !== HISTOGRAM_BIN_COUNT ||
      second.counts.length !== HISTOGRAM_BIN_COUNT) {
    throw new RangeError("Incompatible histogram bin counts.");
  }
  return {
    counts: first.counts.map((count, i) => count + second.counts[i]),
    selectedCounts: first.selectedCounts.map((count, i) =>
      count + second.selectedCounts[i]),
    belowRange: first.belowRange + second.belowRange,
    aboveRange: first.aboveRange + second.aboveRange,
    selectedOutside: first.selectedOutside + second.selectedOutside,
  };
}

export function histogramTotals(histogram) {
  const displayed = histogram.counts.reduce((total, value) => total + value, 0);
  const selectedDisplayed = histogram.selectedCounts.reduce(
    (total, value) => total + value, 0);
  const outside = histogram.belowRange + histogram.aboveRange;
  return {
    displayed,
    selectedDisplayed,
    outside,
    total: displayed + outside,
    selectedTotal: selectedDisplayed + histogram.selectedOutside,
  };
}

export function drawNormalTrials(threshold, side, repetitions, rng = Math.random) {
  if (!SIDES.includes(side) || !Number.isFinite(threshold)) {
    throw new RangeError("Specify a finite threshold and a valid side.");
  }
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10000) {
    throw new RangeError("Draw between 1 and 10,000 observations at once.");
  }
  const histogram = emptyHistogram();
  let matches = 0;
  let lastValue = null;
  for (let i = 0; i < repetitions; i++) {
    const value = drawObservation("normal", rng);
    lastValue = value;
    const selected = side === "below" ? value <= threshold : value > threshold;
    if (selected) matches++;
    const index = histogramBinIndex(value);
    if (index < 0) {
      histogram.belowRange++;
      if (selected) histogram.selectedOutside++;
    } else if (index >= HISTOGRAM_BIN_COUNT) {
      histogram.aboveRange++;
      if (selected) histogram.selectedOutside++;
    } else {
      histogram.counts[index]++;
      if (selected) histogram.selectedCounts[index]++;
    }
  }
  return { count: repetitions, matches, lastValue, histogram };
}

export function observedFraction(matches, total) {
  if (!Number.isInteger(total) || total < 0 ||
      !Number.isInteger(matches) || matches < 0 || matches > total) {
    throw new RangeError("Counts must be valid nonnegative integers.");
  }
  return total === 0 ? null : matches / total;
}
