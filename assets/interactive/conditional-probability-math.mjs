// Exact finite model: A = attended workshop; B = met attention criterion.
export const N=100, A=40, B=50;
export const QUERIES=Object.freeze({
 b:{label:'P(B)',den:[0,1,2,3],num:[0,2]},
 a:{label:'P(A)',den:[0,1,2,3],num:[0,1]},
 both:{label:'P(A and B)',den:[0,1,2,3],num:[0]},
 either:{label:'P(A or B)',den:[0,1,2,3],num:[0,1,2]},
 bGivenA:{label:'P(B | A)',den:[0,1],num:[0]},
 bGivenNotA:{label:'P(B | not A)',den:[2,3],num:[2]},
 aGivenB:{label:'P(A | B)',den:[0,2],num:[0]}
});
export function makeTable(overlap){if(!Number.isInteger(overlap)||overlap<0||overlap>40)throw new RangeError('Overlap must be an integer from 0 to 40');return [overlap,A-overlap,B-overlap,N-A-B+overlap];}
export function evaluate(counts,key){if(!Array.isArray(counts)||counts.length!==4||counts.some(x=>!Number.isInteger(x)||x<0)||!Object.hasOwn(QUERIES,key))throw new RangeError('Invalid table or query');const q=QUERIES[key],sum=ids=>ids.reduce((s,i)=>s+counts[i],0),numerator=sum(q.num),denominator=sum(q.den);return {numerator,denominator,probability:denominator?numerator/denominator:null};}
export function isIndependent(counts){const [a,b,c,d]=counts;return a*d===b*c;}
export function drawCategory(counts,rng=Math.random){const u=rng();if(!(u>=0&&u<1)||counts.some(x=>!Number.isInteger(x)||x<0)||counts.length!==4)throw new RangeError('Invalid draw');const total=counts.reduce((a,b)=>a+b,0);if(!total)throw new RangeError('Empty population');let index=u*total;for(let i=0;i<4;i++){index-=counts[i];if(index<0)return i;}return 3;}
