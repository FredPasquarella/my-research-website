import {takeStudy,describeSample,summarizeMeans,expectedMean,theoreticalSE,TRUE_MEAN} from './sampling-bias-math.mjs';
const root=document.getElementById('bias-lesson');
const names={random:'Simple random sample',convenience:'Morning-only convenience sample',stratified:'Proportionate stratified sample'};
const fmt=v=>v===null?'—':v.toFixed(2), signed=v=>v===null?'—':(v>0?'+':'')+fmt(v);
if(root){
 const $=s=>root.querySelector(s),out=(k,v)=>{$(`[data-output="${k}"]`).textContent=v};
 const n=$('#bias-n'),method=$('#bias-method');let a=[],b=[],lastA=null,lastB=null;const limit=20000;
 const NS='http://www.w3.org/2000/svg';
 function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
 function bins(values){const z=Array(45).fill(0);for(const v of values)z[Math.min(44,Math.max(0,Math.floor(v-30)))]++;return z;}
 function chart(){
  const host=$('[data-chart="means"]'),W=Math.max(268,Math.min(760,Math.floor(host.clientWidth-14))),H=372,L=44,R=14,lo=30,hi=75,x=v=>L+(v-lo)/(hi-lo)*(W-L-R);
  const hist=[bins(a),bins(b)],max=Math.max(1,...hist.flat()),summaries=[summarizeMeans(a),summarizeMeans(b)];
  const svg=node('svg',{viewBox:`0 0 ${W} ${H}`,class:'bias-chart',role:'img','aria-label':`Histograms on identical score and frequency scales. True mean 50. ${a.length} random sample means, average ${fmt(summaries[0].mean)}; ${b.length} ${names[method.value]} means, average ${fmt(summaries[1].mean)}.`});
  const add=(tag,attr,txt)=>svg.appendChild(node(tag,attr,txt));
  const ticks=W<420?[30,40,50,60,70]:[30,35,40,45,50,55,60,65,70,75];
  for(const [i,h] of hist.entries()){
   const T=37+i*159,B=T+105,y=count=>B-count/max*(B-T),c=i&&method.value==='convenience'?'#a05b34':'#456f76';
   add('text',{x:L,y:T-19,'font-size':13,'font-weight':650,fill:'#26363e'},i?'B · '+(method.value==='convenience'?'Morning-only sample':'Stratified sample'):'A · Simple random sample');
   for(const v of ticks)add('line',{x1:x(v),x2:x(v),y1:T,y2:B,stroke:'#e0e6e3'});
   for(const f of [...new Set([0,Math.floor(max/2),max])]){add('line',{x1:L,x2:W-R,y1:y(f),y2:y(f),stroke:'#e0e6e3'});add('text',{x:L-5,y:y(f)+4,'text-anchor':'end','font-size':11,fill:'#53656c'},String(f));}
   h.forEach((count,j)=>{if(count)add('rect',{x:x(lo+j)+.4,y:y(count),width:Math.max(.2,x(lo+j+1)-x(lo+j)-.8),height:B-y(count),fill:c});});
   add('line',{x1:x(50),x2:x(50),y1:T,y2:B,stroke:'#26363e','stroke-width':2,'stroke-dasharray':'5 4'});
   if(summaries[i].mean!==null){const v=summaries[i].mean;add('line',{x1:x(v),x2:x(v),y1:T,y2:B,stroke:c,'stroke-width':2});add('path',{d:`M ${x(v)-4} ${B+3} L ${x(v)+4} ${B+3} L ${x(v)} ${B+10} Z`,fill:c});}
   add('line',{x1:L,x2:W-R,y1:B,y2:B,stroke:'#53656c'});
   if(!a.length)add('text',{x:(L+W-R)/2,y:(T+B)/2,'text-anchor':'middle','font-size':12,fill:'#53656c'},'Draw samples to build the histogram.');
   if(i)for(const v of ticks)add('text',{x:x(v),y:B+27,'text-anchor':'middle','font-size':12,fill:'#53656c'},String(v));
  }
  add('text',{x:(L+W-R)/2,y:H-7,'text-anchor':'middle','font-size':12,fill:'#53656c'},'Sample mean (attention score)');
  host.replaceChildren(svg);
 }
 function composition(k,d){const total=d?d.morning+d.evening:0;for(const group of ['morning','evening']){$(`[data-bar="${k}-${group}"]`).style.width=`${total?100*d[group]/total:0}%`;}out(k+'-composition',d?`${d.morning} morning (${(100*d.morning/total).toFixed(0)}%) · ${d.evening} evening (${(100*d.evening/total).toFixed(0)}%)`:'No sample drawn yet.');out(k+'-latest',d?fmt(d.mean):'—');}
 function render(){const m=method.value, size=Number(n.value),sa=summarizeMeans(a),sb=summarizeMeans(b);out('comparison',names[m]);out('description',m==='convenience'?'The sampling frame includes only morning students. We randomly select within that restricted frame to isolate the coverage problem. Evening students have no chance of selection.':'Select randomly within both groups, using 60% morning and 40% evening observations to match their population proportions.');out('count',a.length.toLocaleString());out('expected-a',fmt(expectedMean('random')));out('expected-b',fmt(expectedMean(m)));out('bias-a',signed(expectedMean('random')-TRUE_MEAN));out('bias-b',signed(expectedMean(m)-TRUE_MEAN));out('theoretical-a',fmt(theoreticalSE(size,'random')));out('theoretical-b',fmt(theoreticalSE(size,m)));for(const [k,s]of [['a',sa],['b',sb]]){out(k+'-mean',fmt(s.mean));out(k+'-bias',signed(s.bias));out(k+'-sd',fmt(s.sd));}composition('a',lastA);composition('b',lastB);chart();}
 function reset(msg){a=[];b=[];lastA=null;lastB=null;render();out('status',msg||'Reset. Ready to draw samples.');}
 function draw(requested){const size=Number(n.value),m=method.value,k=Math.min(requested,limit-a.length);for(let i=0;i<k;i++){lastA=describeSample(takeStudy(size,'random'));lastB=describeSample(takeStudy(size,m));a.push(lastA.mean);b.push(lastB.mean);}render();out('status',k?`Added ${k.toLocaleString()} independent samples for each method. ${a.length.toLocaleString()} per method. Average estimates: ${fmt(summarizeMeans(a).mean)} and ${fmt(summarizeMeans(b).mean)}.`:'20,000 samples per method reached. Reset to start again.');}
 root.querySelectorAll('[data-draw]').forEach(button=>button.addEventListener('click',()=>draw(Number(button.dataset.draw))));$('[data-action="reset"]').addEventListener('click',()=>reset());for(const el of [n,method])el.addEventListener('change',()=>reset('Design changed. Previous samples cleared to keep the comparison consistent.'));render();
 if(typeof ResizeObserver!=='undefined'){let w=0;const o=new ResizeObserver(es=>{const next=Math.round(es[0].contentRect.width);if(next!==w){w=next;chart()}});o.observe($('[data-chart="means"]'));}
}
const answers={prediction:['no','Larger samples from the same restricted frame still exclude the evening group. They can reduce variability without removing the coverage bias.'],frame:['excluded','Evening students have zero chance of inclusion under the morning-only frame, despite being part of the target population.'],size:['precise','A larger sample can reduce the spread of repeated estimates while leaving their expected value eight points too low.'],strata:['within','Proportionate stratified sampling randomly selects within each group and uses the population proportions in the sample.'],assignment:['different','Random sampling concerns who enters the study; random assignment concerns which condition participants enter. The two solve different problems.']};
document.querySelectorAll('.bias-lesson [data-question]').forEach(q=>{const [correct,why]=answers[q.dataset.question],f=q.querySelector('[data-output="feedback"]');q.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{f.textContent='';f.removeAttribute('data-result')}));q.querySelector('button').addEventListener('click',()=>{const s=q.querySelector('input:checked');if(!s){f.dataset.result='pending';f.textContent='Choose an answer first.';return}const ok=s.value===correct;f.dataset.result=ok?'correct':'incorrect';f.textContent=(ok?'Correct. ':'Incorrect. ')+why;});});
