import test from 'node:test';import assert from 'node:assert/strict';
import {intervalFromMean,intervalWidth,drawInterval} from '../assets/interactive/confidence-interval-math.mjs';
import {makeSeededRandom} from '../assets/interactive/sampling-math.mjs';
test('known example and inclusion',()=>{const d=intervalFromMean(52,25,95);assert.ok(Math.abs(d.lower-48.08007203)<1e-7);assert.ok(Math.abs(d.upper-55.91992797)<1e-7);assert.equal(d.covers,true);assert.equal(intervalFromMean(60,25,95).covers,false)});
test('precision and confidence tradeoffs',()=>{assert.ok(Math.abs(intervalWidth(10,95).width/2-intervalWidth(40,95).width)<1e-12);assert.ok(intervalWidth(10,90).width<intervalWidth(10,95).width);assert.ok(intervalWidth(10,95).width<intervalWidth(10,99).width)});
test('invalid settings rejected',()=>{assert.throws(()=>intervalWidth(0,95));assert.throws(()=>intervalWidth(10,92));assert.throws(()=>intervalFromMean(NaN,10,95))});
for(const n of [5,10,40,100])for(const c of [90,95,99])test(`coverage n=${n}, confidence=${c}`,()=>{const rng=makeSeededRandom(183+n+c);let hits=0;for(let i=0;i<20000;i++)hits+=Number(drawInterval(n,c,rng).covers);assert.ok(Math.abs(hits/20000-c/100)<0.012,`observed ${hits/20000}`)});
