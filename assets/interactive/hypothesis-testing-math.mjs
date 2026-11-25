/** Two-sided one-sample z test; null mean 50, known population SD 10. */
import { POPULATION_MEAN, expectedStandardError, takeSample } from './sampling-math.mjs';
// Complementary error function approximation (Numerical Recipes), stable in the tails.
export function twoSidedP(z) {
  if (!Number.isFinite(z)) throw new RangeError('z must be finite');
  if (z === 0) return 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  const erfc = t * Math.exp(-x*x - 1.26551223 + t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return Math.max(0, Math.min(1, erfc));
}
export function testMean(mean, n, alpha) {
  if (!Number.isFinite(mean) || ![0.01, 0.05, 0.10].includes(alpha)) throw new RangeError('Invalid test setting');
  const se=expectedStandardError(n), z=(mean-POPULATION_MEAN)/se, p=twoSidedP(z);
  return {mean,n,alpha,se,z,p,reject:p<=alpha};
}
export function drawNullZ(n,rng=Math.random) {return (takeSample(n,'normal',rng).mean-POPULATION_MEAN)/expectedStandardError(n);}
export function isExtreme(z,observedZ) {return Math.abs(z)>=Math.abs(observedZ);}
