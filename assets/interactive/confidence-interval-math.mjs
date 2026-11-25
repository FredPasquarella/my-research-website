/** Known-sigma confidence intervals for independent draws from N(50, 10²). */
import { POPULATION_MEAN, expectedStandardError, takeSample } from './sampling-math.mjs';
export const CRITICAL = Object.freeze({90:1.6448536269514722,95:1.959963984540054,99:2.5758293035489004});
export function intervalWidth(n, confidence) {
  if (!Object.hasOwn(CRITICAL, confidence)) throw new RangeError('Unsupported confidence level');
  const se = expectedStandardError(n);
  const margin = CRITICAL[confidence] * se;
  return {se, margin, width: 2 * margin};
}
export function intervalFromMean(mean, n, confidence) {
  if (!Number.isFinite(mean)) throw new RangeError('Mean must be finite');
  const {se, margin, width} = intervalWidth(n, confidence);
  const lower=mean-margin, upper=mean+margin;
  return {mean, se, margin, width, lower, upper, covers: lower <= POPULATION_MEAN && upper >= POPULATION_MEAN};
}
export function drawInterval(n, confidence, rng=Math.random) {
  return intervalFromMean(takeSample(n,'normal',rng).mean,n,confidence);
}
