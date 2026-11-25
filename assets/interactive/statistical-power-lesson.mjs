import {powerModel,drawStudy,NULL_MEAN} from './statistical-power-math.mjs';
const root=document.getElementById('power-lesson');
const modelPct=x=>x>=.9999?'>99.99%':x<=.0001?'<0.01%':`${(100*x).toFixed(2)}%`;
const pct=x=>x===0?'0%':x===1?'100%':x<.0001?'<0.01%':x>.9999?'>99.99%':`${(100*x).toFixed(2)}%`;
if(root){
 const $=s=>root.querySelector(s),out=(k,v)=>{$(`[data-output="${k}"]`).textContent=v};
 const controls=['n','delta','sd','alpha'].map(k=>$(`#power-${k}`));
 const model=()=>powerModel(...controls.map(e=>Number(e.value)));
 let count=0,nullReject=0,altReject=0,last=null;const limit=20000;
 const fmt=x=>x.toFixed(2),NS='http://www.w3.org/2000/svg';
 function node(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;return el;}
 function chart(m){
  const host=$('[data-chart="distributions"]'),W=Math.max(270,Math.min(740,Math.floor(host.clientWidth-12))),H=360,L=36,R=18;
  const min=Math.floor((Math.min(NULL_MEAN-4.2*m.se,m.lower)-.1)/5)*5,max=Math.ceil((Math.max(m.alternativeMean+4.2*m.se,m.upper)+.1)/5)*5;
  const x=v=>L+(v-min)/(max-min)*(W-L-R), dense=(v,mu)=>Math.exp(-.5*((v-mu)/m.se)**2);
  const svg=node('svg',{viewBox:`0 0 ${W} ${H}`,class:'power-chart',role:'img','aria-label':`Two sampling distributions on a shared sample-mean scale. Under the null, mean 50 and Type I error ${modelPct(m.alpha)}. Under the specified alternative, mean ${m.alternativeMean}, Type II error ${modelPct(m.beta)}, power ${modelPct(m.power)}. Reject outside ${fmt(m.lower)} to ${fmt(m.upper)}.`});
  const add=(tag,a,t)=>svg.appendChild(node(tag,a,t));
  const tick=Math.max(5,Math.ceil((max-min)/(W<420?4:7)/5)*5);
  const ticks=[];for(let v=Math.ceil(min/tick)*tick;v<=max;v+=tick)ticks.push(v);
  for(const [i,mu] of [NULL_MEAN,m.alternativeMean].entries()){
   const T=27+i*158,B=T+100,y=v=>B-87*dense(v,mu);
   const poly=(a,b)=>Array.from({length:101},(_,j)=>{const v=a+(b-a)*j/100;return `${j?'L':'M'}${x(v).toFixed(2)} ${y(v).toFixed(2)}`}).join(' ');
   const fill=(a,b,c)=>{if(b>a)add('path',{d:`${poly(a,b)} L${x(b)} ${B} L${x(a)} ${B} Z`,fill:c,'fill-opacity':.88})};
   for(const v of ticks)add('line',{x1:x(v),x2:x(v),y1:T,y2:B,stroke:'#e0e6e3'});
   fill(min,m.lower,i?'#72969a':'#bd815c');fill(m.lower,m.upper,i?'#bd815c':'#72969a');fill(m.upper,max,i?'#72969a':'#bd815c');
   add('path',{d:poly(min,max),fill:'none',stroke:'#30545b','stroke-width':2});
   add('line',{x1:x(mu),x2:x(mu),y1:T,y2:B,stroke:'#30545b','stroke-dasharray':'2 4','stroke-width':1.2});
   for(const v of [m.lower,m.upper])add('line',{x1:x(v),x2:x(v),y1:T,y2:B,stroke:'#80521c','stroke-width':1.7,'stroke-dasharray':'5 4'});
   add('line',{x1:L,x2:W-R,y1:B,y2:B,stroke:'#53656c'});
   add('text',{x:L,y:T-9,'font-size':13,'font-weight':650,fill:'#26363e'},i?`Effect is real (mean = ${m.alternativeMean})`:'Null is true (mean = 50)');
   add('text',{x:L,y:B+18,'font-size':12,fill:'#8a4a21'},i?`Type II error: ${modelPct(m.beta)}`:`Type I error: ${modelPct(m.alpha)}`);
   add('text',{x:W-R,y:B+18,'text-anchor':'end','font-size':12,fill:'#30545b'},i?`Power: ${modelPct(m.power)}`:`Correct: ${modelPct(1-m.alpha)}`);
   if(i)for(const v of ticks)add('text',{x:x(v),y:B+39,'text-anchor':'middle','font-size':12,fill:'#53656c'},String(v));
  }
  add('text',{x:(L+W-R)/2,y:H-6,'text-anchor':'middle','font-size':13,fill:'#53656c'},'Sample mean (attention score)');
  host.replaceChildren(svg);
 }
 function render(){const m=model();for(const[k,v]of Object.entries({alpha:modelPct(m.alpha),beta:modelPct(m.beta),power:modelPct(m.power),effect:fmt(m.d),alternative:fmt(m.alternativeMean),se:fmt(m.se),lower:fmt(m.lower),upper:fmt(m.upper),total:count.toLocaleString(),nullReject:nullReject.toLocaleString(),nullKeep:(count-nullReject).toLocaleString(),altReject:altReject.toLocaleString(),altKeep:(count-altReject).toLocaleString(),observedAlpha:count?pct(nullReject/count):'—',observedBeta:count?pct((count-altReject)/count):'—',observedPower:count?pct(altReject/count):'—',latest:last?`Null study mean ${fmt(last.a.mean)} — ${last.a.reject?'reject (Type I error)':'fail to reject (correct)'}. Effect study mean ${fmt(last.b.mean)} — ${last.b.reject?'reject (correct detection)':'fail to reject (Type II error)'}.`:'No studies simulated yet.'}))out(k,v);
  for(const[k,v]of Object.entries({nullGood:count?(count-nullReject)/count:0,nullError:count?nullReject/count:0,altGood:count?altReject/count:0,altError:count?(count-altReject)/count:0}))$(`[data-bar="${k}"]`).style.width=`${v*100}%`;
  chart(m);
 }
 function reset(msg){count=0;nullReject=0;altReject=0;last=null;render();out('status',msg||'Simulation reset. Draw studies to begin.');}
 root.querySelectorAll('[data-draw]').forEach(b=>b.addEventListener('click',()=>{const m=model(),k=Math.min(Number(b.dataset.draw),limit-count);for(let i=0;i<k;i++){const a=drawStudy(m,'null'),b=drawStudy(m,'alternative');nullReject+=Number(a.reject);altReject+=Number(b.reject);last={a,b};count++}render();out('status',k?`Added ${k.toLocaleString()} independent studies in each scenario. Total per scenario: ${count.toLocaleString()}.`:'Limit reached: 20,000 studies per scenario. Reset to begin again.');}));
 $('[data-action="reset"]').addEventListener('click',()=>reset());controls.forEach(e=>e.addEventListener('change',()=>reset('Settings changed. Previous studies cleared so the observed rates match the current model.')));render();
 if(typeof ResizeObserver!=='undefined'){let w=0;const o=new ResizeObserver(es=>{const next=Math.round(es[0].contentRect.width);if(next!==w){w=next;chart(model())}});o.observe($('[data-chart="distributions"]'));}
}
const answers={prediction:['higher','A larger sample reduces standard error, making a fixed real difference easier to detect.'],errors:['type1','Rejecting a true null is a Type I error. Missing a specified real effect is a Type II error.'],power:['detect','Power is the probability of rejecting the null when a specified alternative is true. It is not the probability that the alternative is true.'],design:['larger','Holding alpha, SD and the real difference fixed, a larger sample increases power.'],tradeoff:['less','A smaller alpha reduces false positives but makes rejection harder, reducing power for a fixed design and specified effect.']};
document.querySelectorAll('.power-lesson [data-question]').forEach(q=>{const [correct,why]=answers[q.dataset.question],f=q.querySelector('[data-output="feedback"]');q.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{f.textContent='';f.removeAttribute('data-result')}));q.querySelector('button').addEventListener('click',()=>{const selected=q.querySelector('input:checked');if(!selected){f.dataset.result='pending';f.textContent='Choose an answer first.';return}const ok=selected.value===correct;f.dataset.result=ok?'correct':'incorrect';f.textContent=(ok?'Correct. ':'Incorrect. ')+why;});});
