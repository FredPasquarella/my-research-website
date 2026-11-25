import {testMean,drawNullZ,isExtreme} from './hypothesis-testing-math.mjs';
const root=document.getElementById('ht-lesson');
if(root){
 const $=s=>root.querySelector(s),out=(k,v)=>{$(`[data-output="${k}"]`).textContent=v};
 const n=$('#ht-n'),mean=$('#ht-mean'),alpha=$('#ht-alpha');
 let draws=[];const limit=20000;
 const fmtP=p=>p===0?'0 (numerical limit)':p<.0001?p.toExponential(2):p.toFixed(4);
 const NS='http://www.w3.org/2000/svg';
 function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e}
 function chart(kind,d){
  const host=$(`[data-chart="${kind}"]`), W=Math.max(280,Math.min(700,Math.floor(host.clientWidth-12))), H=kind==='null'?220:225,L=42,R=18,T=25,B=H-48;
  const ext=Math.max(5,Math.ceil(Math.abs(d.z)+.2),...draws.map(v=>Math.ceil(Math.abs(v))));const x=z=>L+(z+ext)/(2*ext)*(W-L-R);
  const svg=node('svg',{viewBox:`0 0 ${W} ${H}`,class:'ht-chart',role:'img','aria-label':kind==='null'?`Null standard normal distribution. The two tails at or beyond absolute z ${Math.abs(d.z).toFixed(2)} have total probability ${fmtP(d.p)}.`:`Histogram of ${draws.length} simulated null z statistics. Orange bars count results at least as extreme as the observed statistic.`});
  const add=(tag,attr,text)=>svg.appendChild(node(tag,attr,text));
  const density=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),y=z=>B-(B-T)*density(z)/.42;
  const poly=(a,b)=>Array.from({length:121},(_,i)=>{const z=a+(b-a)*i/120;return `${i?'L':'M'}${x(z).toFixed(2)} ${y(z).toFixed(2)}`}).join(' ');
  for(let i=-ext;i<=ext;i+=ext>6?2:1){add('line',{x1:x(i),x2:x(i),y1:T,y2:B,stroke:'#e0e6e3'});add('text',{x:x(i),y:B+18,'text-anchor':'middle','font-size':12,fill:'#53656c'},String(i))}
  if(kind==='null'){
   add('path',{d:poly(-ext,ext)+` L${x(ext)} ${B} L${x(-ext)} ${B} Z`,fill:'#e5eeee'});
   for(const [a,b] of [[-ext,-Math.abs(d.z)],[Math.abs(d.z),ext]])add('path',{d:poly(a,b)+` L${x(b)} ${B} L${x(a)} ${B} Z`,fill:'#bd815c','fill-opacity':.82});
   add('path',{d:poly(-ext,ext),fill:'none',stroke:'#30545b','stroke-width':2});
  }else{
   const bins=Array.from({length:40},()=>[0,0]);
   for(const z of draws){const i=Math.max(0,Math.min(39,Math.floor((z+ext)/(2*ext)*40)));bins[i][Number(isExtreme(z,d.z))]++}
   const max=Math.max(1,...bins.map(a=>a[0]+a[1]));let bw=(W-L-R)/40;
   bins.forEach(([a,b],i)=>{const h1=a/max*(B-T),h2=b/max*(B-T);if(a)add('rect',{x:L+i*bw+.4,y:B-h1,width:Math.max(.1,bw-.8),height:h1,fill:'#9db4b7'});if(b)add('rect',{x:L+i*bw+.4,y:B-h1-h2,width:Math.max(.1,bw-.8),height:h2,fill:'#bd815c'})});
   add('text',{x:L-6,y:T+4,'text-anchor':'end','font-size':11,fill:'#53656c'},String(max));
   if(!draws.length)add('text',{x:(L+W-R)/2,y:(T+B)/2,'text-anchor':'middle','font-size':13,fill:'#53656c'},'Draw null samples to build the histogram.');
  }
  for(const z of new Set([-Math.abs(d.z),Math.abs(d.z)]))add('line',{x1:x(z),x2:x(z),y1:T,y2:B,stroke:'#80521c','stroke-width':1.6,'stroke-dasharray':'5 4'});
  add('circle',{cx:x(d.z),cy:B,r:4,fill:'#80521c'});add('line',{x1:L,x2:W-R,y1:B,y2:B,stroke:'#53656c'});add('text',{x:(L+W-R)/2,y:H-9,'text-anchor':'middle','font-size':13,fill:'#53656c'},'Standardized sample mean (z)');host.replaceChildren(svg);
 }
 function render(){const d=testMean(Number(mean.value),Number(n.value),Number(alpha.value));const extreme=draws.filter(z=>isExtreme(z,d.z)).length;
  out('mean',d.mean.toFixed(1));out('z',d.z.toFixed(3));out('p',fmtP(d.p));out('se',d.se.toFixed(3));out('alpha',d.alpha.toFixed(2));out('cutoffs',`±${Math.abs(d.z).toFixed(3)}`);out('count',draws.length.toLocaleString());out('extreme',extreme.toLocaleString());out('empirical',draws.length?`${(100*extreme/draws.length).toFixed(2)}%`:'—');out('theoretical',`${100*d.p<.0001?(100*d.p).toExponential(2):(100*d.p).toFixed(4)}%`);out('decision',d.reject?'Reject the null hypothesis.':'Fail to reject the null hypothesis.');$('[data-output="decision"]').dataset.result=d.reject?'reject':'retain';out('reason',d.reject?'The p-value is at or below the chosen significance level. The data provide evidence against the null under the model.':'The p-value is above the chosen significance level. The data do not provide sufficient evidence against the null under the model; this does not establish that the null is true.');chart('null',d);chart('empirical',d);
 }
 function reset(msg){draws=[];render();out('status',msg||'Simulation reset. Draw null samples to begin.');}
 root.querySelectorAll('[data-draw]').forEach(b=>b.addEventListener('click',()=>{const k=Math.min(Number(b.dataset.draw),limit-draws.length);for(let i=0;i<k;i++)draws.push(drawNullZ(Number(n.value)));render();out('status',k?`Added ${k.toLocaleString()} independent null samples. Total: ${draws.length.toLocaleString()}.`:'The 20,000 sample limit has been reached. Reset to start again.')}));
 $('[data-action="reset"]').addEventListener('click',()=>reset());n.addEventListener('change',()=>reset('Sample size changed. Previous simulated samples cleared.'));mean.addEventListener('input',render);alpha.addEventListener('change',render);render();
 if(typeof ResizeObserver!=='undefined'){let w=0;const o=new ResizeObserver(es=>{const next=Math.round(es[0].contentRect.width);if(next!==w){w=next;const d=testMean(Number(mean.value),Number(n.value),Number(alpha.value));chart('null',d);chart('empirical',d)}});o.observe($('[data-chart="null"]'))}
}
const answers={prediction:['smaller','An observed mean farther from 50 is more extreme under the same null sampling distribution, making the two-sided p-value smaller.'],meaning:['extreme','The p-value is the probability, assuming the null model, of a test statistic at least as extreme as observed.'],distance:['smaller','Holding sample size and variability fixed, greater distance from the null mean produces a larger absolute z and a smaller p-value.'],alpha:['unchanged','Alpha is the decision threshold chosen before data analysis. It does not change the data or the p-value.'],decision:['insufficient','Failure to reject means insufficient evidence against the null under the model; it does not prove no effect.']};
document.querySelectorAll('.ht-lesson [data-question]').forEach(q=>{const [correct,explain]=answers[q.dataset.question],f=q.querySelector('[data-output="feedback"]');q.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{f.textContent='';f.removeAttribute('data-result')}));q.querySelector('button').addEventListener('click',()=>{const s=q.querySelector('input:checked');if(!s){f.dataset.result='pending';f.textContent='Choose an answer first.';return}const ok=s.value===correct;f.dataset.result=ok?'correct':'incorrect';f.textContent=(ok?'Correct. ':'Incorrect. ')+explain})});
