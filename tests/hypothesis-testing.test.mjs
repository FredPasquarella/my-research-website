import test from 'node:test';import assert from 'node:assert/strict';
import {twoSidedP,testMean,drawNullZ,isExtreme} from '../assets/interactive/hypothesis-testing-math.mjs';
import {makeSeededRandom} from '../assets/interactive/sampling-math.mjs';
for(const [z,p] of [[0,1],[1,.317310507862914],[1.96,.04999579029644],[2,.045500263896358],[3,.00269979606326],[5,5.73303143758389e-7],[6,1.9731752900754e-9]])test(`two-sided p at z=${z}`,()=>{assert.ok(Math.abs(twoSidedP(z)-p)<Math.max(2e-7*p,1e-15));assert.equal(twoSidedP(z),twoSidedP(-z))});
test('worked example and decisions',()=>{let a=testMean(54,25,.05);assert.equal(a.z,2);assert.equal(a.se,2);assert.equal(a.reject,true);let b=testMean(54,25,.01);assert.equal(b.p,a.p);assert.equal(b.reject,false);assert.equal(testMean(46,25,.05).p,a.p)});
test('larger sample and greater distance reduce p',()=>{assert.ok(testMean(54,100,.05).p<testMean(54,10,.05).p);assert.ok(testMean(54,25,.05).p<testMean(51,25,.05).p)});
test('inclusive absolute tails',()=>{assert.equal(isExtreme(-2,2),true);assert.equal(isExtreme(1.99,2),false);assert.equal(isExtreme(0,0),true)});
for(const n of [10,25,50,100])test(`null simulation n=${n}`,()=>{const rng=makeSeededRandom(938+n);let extreme=0;for(let i=0;i<20000;i++)extreme+=Number(isExtreme(drawNullZ(n,rng),1.959963984540054));assert.ok(Math.abs(extreme/20000-.05)<.008)});
