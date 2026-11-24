/**
 * Pure statistics for the Weeks 3-4 descriptive distributions lesson.
 * All observations are simulated task-completion times, in whole minutes.
 * We report sample SD (dividing by n-1), not population SD.
 */

export const BASELINE_TIMES = Object.freeze([8, 9, 9, 10, 10, 11, 11, 12, 13, 14]);
export const LOWEST_ADJUSTABLE_TIME = 14;
export const HIGHEST_ADJUSTABLE_TIME = 40;

export function withAdjustedTime(lastTime, initial = BASELINE_TIMES) {
  if (!Number.isFinite(lastTime) ||
      !Number.isInteger(lastTime) ||
      lastTime < LOWEST_ADJUSTABLE_TIME ||
      lastTime > HIGHEST_ADJUSTABLE_TIME) {
    throw new RangeError("The adjustable completion time must be a whole number from 14 through 40.");
  }
  if (!Array.isArray(initial) && !ArrayBuffer.isView(initial)) {
    throw new TypeError("Expected a collection of completion times.");
  }
  if (initial.length < 2) {
    throw new RangeError("At least two observations are required.");
  }
  const values = [...initial];
  values[values.length - 1] = lastTime;
  return values;
}

export function describeDistribution(values, highlightedIndex = values.length - 1) {
  if (!Array.isArray(values) || values.length < 2) {
    throw new RangeError("A distribution needs at least two observations.");
  }
  if (!values.every((v) => Number.isFinite(v))) {
    throw new RangeError("All observations must be finite numbers.");
  }
  if (!Number.isInteger(highlightedIndex) ||
      highlightedIndex < 0 || highlightedIndex >= values.length) {
    throw new RangeError("Highlighted observation index is out of range.");
  }

  const n = values.length;
  const sorted = [...values].sort((a, b) => a - b);
  let mean = 0;
  let m2 = 0;

  // Welford's algorithm avoids unnecessary cancellation in variance.
  for (let i = 0; i < n; i++) {
    const delta = values[i] - mean;
    mean += delta / (i + 1);
    m2 += delta * (values[i] - mean);
  }

  const middle = Math.floor(n / 2);
  const median = n % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
  const sd = Math.sqrt(m2 / (n - 1)); // Sample standard deviation.
  const highlightedValue = values[highlightedIndex];
  return {
    n, values: [...values], sorted,
    mean, median, sd,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    highlightedValue,
    z: sd === 0 ? null : (highlightedValue - mean) / sd,
  };
}
