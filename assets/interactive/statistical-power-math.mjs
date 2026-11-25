/** Exact normal sampling model, two-sided one-sample z-test. */
import {twoSidedP} from './hypothesis-testing-math.mjs';
export const NULL_MEAN=50;
const critical=Object.freeze({0.01:2.5758293035489004,0.05:1.959963984540054,0.1:1.6448536269514722});
export function normalCDF(z){if(!Number.isFinite(z))throw new RangeError('z must be finite');return z<0?twoSidedP(z)/2:1-twoSidedP(z)/2;}
export function powerModel(n,delta,sd,alpha){
 if(!Number.isInteger(n)||n<1||!Number.isFinite(delta)||delta<=0||!Number.isFinite(sd)||sd<=0||!Object.hasOwn(critical,alpha))throw new RangeError('Invalid model settings');
 const se=sd/Math.sqrt(n), c=critical[alpha], shift=delta/se, lower=NULL_MEAN-c*se,upper=NULL_MEAN+c*se;
 const beta=Math.max(0,normalCDF(c-shift)-normalCDF(-c-shift));
 const power=Math.min(1,normalCDF(-c-shift)+normalCDF(shift-c));
 return {n,delta,sd,alpha,se,c,shift,lower,upper,beta,power,d:delta/sd,alternativeMean:NULL_MEAN+delta};
}
export function drawMean(mean,se,rng=Math.random){
 const u=rng(),v=rng();if(!(u>=0&&u<1&&v>=0&&v<1))throw new RangeError('Invalid random source');
 return mean+se*Math.sqrt(-2*Math.log(1-u))*Math.cos(2*Math.PI*v);
}
export function rejects(mean,model){return mean<=model.lower||mean>=model.upper;}
export function drawStudy(model,truth,rng=Math.random){if(truth!=='null'&&truth!=='alternative')throw new RangeError('Unknown truth');const mean=drawMean(truth==='null'?NULL_MEAN:model.alternativeMean,model.se,rng);return {mean,reject:rejects(mean,model)};}
