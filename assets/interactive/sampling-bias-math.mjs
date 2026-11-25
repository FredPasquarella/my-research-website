// Finite synthetic population: 300 morning and 200 evening students.
const pattern=[30,34,36,39,41,43,45,48,50,54];
export const POPULATION=Object.freeze(Array.from({length:500},(_,id)=>Object.freeze({id,group:id<300?'morning':'evening',score:pattern[id%10]+(id<300?0:20)})));
export const MORNING=Object.freeze(POPULATION.slice(0,300)), EVENING=Object.freeze(POPULATION.slice(300));
export const TRUE_MEAN=50;
export function sampleWithoutReplacement(pool,n,rng=Math.random){
 if(!Number.isInteger(n)||n<1||n>pool.length)throw new RangeError('Invalid sample size');
 const indices=Array.from({length:pool.length},(_,i)=>i);
 for(let i=0;i<n;i++){const u=rng();if(!(u>=0&&u<1))throw new RangeError('Invalid random source');const j=i+Math.floor(u*(pool.length-i));[indices[i],indices[j]]=[indices[j],indices[i]];}
 return indices.slice(0,n).map(i=>pool[i]);
}
export function takeStudy(n,method,rng=Math.random){
 if(![10,25,50,100,200].includes(n))throw new RangeError('Unsupported sample size');
 if(method==='random')return sampleWithoutReplacement(POPULATION,n,rng);
 if(method==='convenience')return sampleWithoutReplacement(MORNING,n,rng);
 if(method==='stratified')return [...sampleWithoutReplacement(MORNING,n*3/5,rng),...sampleWithoutReplacement(EVENING,n*2/5,rng)];
 throw new RangeError('Unknown sampling method');
}
export function describeSample(sample){if(!sample.length)throw new RangeError('Empty sample');return {mean:sample.reduce((a,b)=>a+b.score,0)/sample.length,morning:sample.filter(p=>p.group==='morning').length,evening:sample.filter(p=>p.group==='evening').length};}
export function summarizeMeans(values){if(!values.length)return {mean:null,bias:null,sd:null};const mean=values.reduce((a,b)=>a+b,0)/values.length;return {mean,bias:mean-TRUE_MEAN,sd:values.length>1?Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/(values.length-1)):null};}
export function expectedMean(method){if(method==='convenience')return 42;if(['random','stratified'].includes(method))return 50;throw new RangeError('Unknown method');}
export function theoreticalSE(n,method){
 const v=pool=>{const m=pool.reduce((s,p)=>s+p.score,0)/pool.length;return pool.reduce((s,p)=>s+(p.score-m)**2,0)/(pool.length-1)};
 const term=(pool,k)=>(1-k/pool.length)*v(pool)/k;
 if(method==='random')return Math.sqrt(term(POPULATION,n));
 if(method==='convenience')return Math.sqrt(term(MORNING,n));
 if(method==='stratified')return Math.sqrt(.36*term(MORNING,n*3/5)+.16*term(EVENING,n*2/5));
 throw new RangeError('Unknown method');
}
