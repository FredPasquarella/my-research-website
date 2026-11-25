import test from 'node:test';import assert from 'node:assert/strict';
import {powerModel,drawStudy,rejects} from '../assets/interactive/statistical-power-math.mjs';
import {makeSeededRandom} from '../assets/interactive/sampling-math.mjs';
const close=(x,y,tol=2e-7)=>assert.ok(Math.abs(x-y)<tol,`${x} versus ${y}`);
test('worked example',()=>{const m=powerModel(25,4,10,.05);close(m.power,.5160052739761748);close(m.beta,1-.5160052739761748);close(m.lower,46.08007203091989);close(m.upper,53.91992796908011);assert.equal(m.d,.4);assert.equal(m.se,2);assert.equal(rejects(m.lower,m),true);assert.equal(rejects(50,m),false)});
test('sample size, effect, variability, alpha tradeoffs',()=>{let m=powerModel(25,4,10,.05);assert.ok(powerModel(100,4,10,.05).power>m.power);assert.ok(powerModel(25,6,10,.05).power>m.power);assert.ok(powerModel(25,4,20,.05).power<m.power);assert.ok(powerModel(25,4,10,.01).power<m.power);assert.ok(powerModel(25,4,10,.10).power>m.power)});
test('invalid model settings',()=>{for(const a of [[0,4,10,.05],[25,0,10,.05],[25,4,0,.05],[25,4,10,.02]])assert.throws(()=>powerModel(...a))});
for(const [n,d,sd,a] of [[10,1,20,.01],[25,4,10,.05],[100,4,10,.05],[50,6,15,.10],[100,8,5,.01]])test(`simulation ${n}/${d}/${sd}/${a}`,()=>{const m=powerModel(n,d,sd,a),rng=makeSeededRandom(188+n+d);let nr=0,ar=0;for(let i=0;i<20000;i++){nr+=Number(drawStudy(m,'null',rng).reject);ar+=Number(drawStudy(m,'alternative',rng).reject)}close(nr/20000,a,.009);close(ar/20000,m.power,.012);close(m.power+m.beta,1)});
