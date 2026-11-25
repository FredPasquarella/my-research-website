import { CRITICAL, intervalWidth, drawInterval } from './confidence-interval-math.mjs';
const root=document.getElementById('ci-lesson');
if(root){
  const $=(s)=>root.querySelector(s);
  const out=(k,v)=>{$(`[data-output="${k}"]`).textContent=v};
  const n=$('#ci-n'), confidence=$('#ci-confidence');
  const limit=20000, recentLimit=20;
  let total=0, hits=0, recent=[];
  const fmt=x=>x.toFixed(2), pct=x=>`${x.toFixed(1)}%`;
  const svgNS='http://www.w3.org/2000/svg';
  function node(type,attrs={},text){const e=document.createElementNS(svgNS,type);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
  function renderChart(){
    // Preserve a common score scale across settings; expand only to include rare extreme intervals.
    let lo=20,hi=80;for(const d of recent){lo=Math.min(lo,Math.floor(d.lower/10)*10);hi=Math.max(hi,Math.ceil(d.upper/10)*10)}
    const W=Math.max(270,Math.min(600,Math.floor($('[data-chart="intervals"]').clientWidth-18)));
    const compact=W<450,L=compact?45:58,R=compact?67:78,top=35,step=22,bottom=top+Math.max(4,recent.length)*step+6,H=bottom+43;
    const x=v=>L+(v-lo)/(hi-lo)*(W-L-R);
    const svg=node('svg',{viewBox:`0 0 ${W} ${H}`,class:'ci-chart',role:'img','aria-label':recent.length?`Recent ${recent.length} intervals, ${recent.filter(d=>d.covers).length} contain 50. Exact values are in the table below.`:'No intervals yet. The dashed line marks the true mean of 50.'});
    const add=(tag,attr,txt)=>svg.appendChild(node(tag,attr,txt));
    for(let t=lo;t<=hi;t+=compact?20:10){add('line',{x1:x(t),x2:x(t),y1:top-5,y2:bottom,stroke:'#d4dfdc'});add('text',{x:x(t),y:bottom+18,'text-anchor':'middle',fill:'#53656c','font-size':compact?12:14},String(t))}
    add('line',{x1:x(50),x2:x(50),y1:top-12,y2:bottom,stroke:'#80521c','stroke-width':2,'stroke-dasharray':'5 4'});
    add('text',{x:x(50),y:17,'text-anchor':'middle',fill:'#80521c','font-size':14,'font-weight':650},'True mean = 50');
    if(!recent.length)add('text',{x:W/2,y:top+41,'text-anchor':'middle',fill:'#53656c','font-size':15},'Draw a sample to construct an interval.');
    recent.forEach((d,i)=>{const y=top+i*step+10,c=d.covers?'#456f76':'#a05b34';
      add('text',{x:L-8,y:y+4,'text-anchor':'end',fill:'#53656c','font-size':compact?11:13},`#${d.id}`);
      add('line',{x1:x(d.lower),x2:x(d.upper),y1:y,y2:y,stroke:c,'stroke-width':2.8,'stroke-dasharray':d.covers?'none':'6 4'});
      for(const v of [d.lower,d.upper])add('line',{x1:x(v),x2:x(v),y1:y-4,y2:y+4,stroke:c,'stroke-width':2});
      add('circle',{cx:x(d.mean),cy:y,r:3.6,fill:c});
      add('text',{x:W-R+8,y:y+4,fill:c,'font-size':compact?11:13,'font-weight':600},d.covers?'Contains':'Misses');
    });
    add('line',{x1:L,x2:W-R,y1:bottom,y2:bottom,stroke:'#526a70'});
    add('text',{x:(L+W-R)/2,y:H-4,'text-anchor':'middle',fill:'#53656c','font-size':14},'Attention score');
    $('[data-chart="intervals"]').replaceChildren(svg);
    const body=$('[data-output="rows"]');body.replaceChildren();
    for(const d of recent){const tr=document.createElement('tr');for(const v of [d.id,fmt(d.mean),fmt(d.lower),fmt(d.upper),d.covers?'Contains':'Misses']){const td=document.createElement('td');td.textContent=v;tr.appendChild(td)}body.appendChild(tr)}
    if(!recent.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='No intervals yet.';tr.appendChild(td);body.appendChild(tr)}
    out('chart-summary',recent.length?`Showing the most recent ${recent.length} of ${total.toLocaleString()} intervals. Each row represents a new independent sample; the dot is its sample mean.`:'No intervals drawn yet. Each new sample will add an interval.');
  }
  function render(){
    const c=Number(confidence.value), count=Number(n.value), a=intervalWidth(count,c), last=recent.at(-1);
    out('total',total.toLocaleString());out('coverage',total?pct(hits/total*100):'—');out('target',`${c}%`);out('counts',total?`${hits.toLocaleString()} contain the true mean; ${(total-hits).toLocaleString()} miss it.`:'No intervals constructed yet.');
    $('[data-bar="hit"]').style.width=`${total?hits/total*100:0}%`; $('[data-bar="miss"]').style.width=`${total?(total-hits)/total*100:0}%`;
    out('n',count);out('confidence',`${c}%`);out('se',fmt(a.se));out('critical',fmt(CRITICAL[c]));out('margin',fmt(a.margin));out('width',fmt(a.width));
    out('mean',last?fmt(last.mean):'—');out('interval',last?`[${fmt(last.lower)}, ${fmt(last.upper)}]`:'—');out('latest-result',last?(last.covers?'Contains the true mean':'Misses the true mean'):'No sample yet');$('[data-output="latest-result"]').dataset.result=last&&!last.covers?'miss':'contains';
    renderChart();
  }
  function reset(message){total=0;hits=0;recent=[];render();out('status',message||'Simulation reset. Ready to draw a new sample.');}
  function draw(requested){const added=Math.min(requested,limit-total);if(!added){out('status','The 20,000 interval limit has been reached. Reset to start again.');return}for(let i=0;i<added;i++){const d=drawInterval(Number(n.value),Number(confidence.value));d.id=++total;hits+=Number(d.covers);recent.push(d);if(recent.length>recentLimit)recent.shift()}render();out('status',`Added ${added.toLocaleString()} independent ${added===1?'sample':'samples'}. ${total.toLocaleString()} total; ${pct(hits/total*100)} contain the true mean.`)}
  root.querySelectorAll('[data-draw]').forEach(b=>b.addEventListener('click',()=>draw(Number(b.dataset.draw))));
  $('[data-action="reset"]').addEventListener('click',()=>reset());
  n.addEventListener('change',()=>reset('Sample size changed. Previous intervals were cleared to keep results comparable.'));
  confidence.addEventListener('change',()=>reset('Confidence level changed. Previous intervals were cleared to keep results comparable.'));
  render();
  if (typeof ResizeObserver !== 'undefined') {
    let previousWidth=0; const observer=new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width); if(width!==previousWidth){previousWidth=width;renderChart()}}); observer.observe($('[data-chart="intervals"]'));
  }
}
const answers={prediction:{correct:'narrower',yes:'Larger samples have smaller standard errors, so the interval is narrower when confidence and population SD are held fixed.',no:'Compare standard error for n = 10 and n = 40. Larger samples provide more precise estimates.'},meaning:{correct:'procedure',yes:'A 95% confidence interval procedure captures the fixed true mean in about 95% of repeated independent samples.',no:'Confidence describes the long-run success rate of the interval procedure, not the percentage of individual observations or a probability assigned to the fixed mean after calculation.'},size:{correct:'narrower',yes:'Increasing sample size reduces standard error and interval width, holding confidence and population variability fixed.',no:'The standard error is SD divided by the square root of n. Increasing n reduces the width.'},level:{correct:'wider',yes:'A 99% interval is wider than a 90% interval for the same sample and known SD, trading precision for higher long-run coverage.',no:'Higher confidence requires a larger critical value, so the interval gets wider.'},variation:{correct:'vary',yes:'Coverage is a random proportion over finite runs. It tends toward the confidence level over many repetitions but need not equal it exactly.',no:'The confidence level is a long-run probability, not a promise that exactly 19 of every 20 intervals contain the mean.'}};
document.querySelectorAll('#ci-lesson [data-question], #ci-knowledge-check [data-question]').forEach(q=>{const a=answers[q.dataset.question],f=q.querySelector('[data-output="feedback"]');q.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{f.textContent='';f.removeAttribute('data-result')}));q.querySelector('button').addEventListener('click',()=>{const selected=q.querySelector('input:checked');if(!selected){f.dataset.result='pending';f.textContent='Choose an answer first.';return}const ok=selected.value===a.correct;f.dataset.result=ok?'correct':'incorrect';f.textContent=(ok?'Correct. ':'Incorrect. ')+(ok?a.yes:a.no)})});
