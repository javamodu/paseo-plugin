import assert from 'node:assert/strict';
import { transition, topologicalOrder, dependencySatisfied, canAccept, canDispatch,
         aggregateTrials } from '../reference/domain.mjs';
const checks = [];
function test(name, fn) { fn(); checks.push({name, verdict:'PASS'}); }
test('Terminal cancel cannot resume', () => assert.throws(() => transition('CANCELLED','RUNNING')));
test('Cancel requires observed confirmation', () => assert.equal(transition('CANCEL_REQUESTED','CANCELLED'),'CANCELLED'));
test('Running cannot silently cancel', () => assert.throws(() => transition('RUNNING','CANCELLED')));
test('Unknown cannot blind resume', () => assert.throws(() => transition('UNKNOWN_EXTERNAL_STATE','RUNNING')));
test('Skip does not unlock a dependency', () => assert.equal(dependencySatisfied('SKIPPED'),false));
test('Valid prerequisite unlocks', () => assert.equal(dependencySatisfied('SUCCEEDED'),true));
test('DAG stable order', () => assert.deepEqual(topologicalOrder([
 {id:'verify',dependsOn:['code']},{id:'code',dependsOn:[]}]),['code','verify']));
test('Cycle rejected', () => assert.throws(() => topologicalOrder([
 {id:'a',dependsOn:['b']},{id:'b',dependsOn:['a']}])));
test('Unknown dependency rejected', () => assert.throws(() => topologicalOrder([{id:'a',dependsOn:['x']}])));
test('Duplicate IDs rejected', () => assert.throws(() => topologicalOrder([{id:'a',dependsOn:[]},{id:'a',dependsOn:[]}])));
const now=Date.parse('2026-10-13T18:00:00Z');
const valid = {
 run:{id:'r',version:2,state:'WAITING_APPROVAL',candidateHash:'candidate',evaluatorHash:'eval',planHash:'plan',policyHash:'policy'},
 evidence:{trustedEvaluator:true,verdict:'PASS',exitCode:0,testCount:2,candidateHash:'candidate',evaluatorHash:'eval'},
 approval:{runId:'r',decision:'APPROVED',actor:'operator',action:'ACCEPT_RESULT',
  expectedRunVersion:2,planHash:'plan',candidateHash:'candidate',policyHash:'policy',expiresAt:'2026-10-14T18:00:00Z'},
 now,
};
test('Matching independent evidence and approval accepted', () => assert.equal(canAccept(valid),true));
for (const [name, object, key, value] of [
 ['Changed candidate invalidates approval','run','candidateHash','new'],
 ['Wrong evaluator rejected','evidence','evaluatorHash','wrong'],
 ['Untrusted receipt rejected','evidence','trustedEvaluator',false],
 ['Failed evidence rejected','evidence','verdict','FAIL'],
 ['Zero tests rejected','evidence','testCount',0],
 ['Stale version rejected','approval','expectedRunVersion',1],
 ['Expired approval rejected','approval','expiresAt','2026-10-12T18:00:00Z'],
 ['Wrong run approval rejected','approval','runId','other'],
 ['Budget approval cannot accept','approval','action','EXTEND_BUDGET'],
]) {
 test(name, () => {
   const input=structuredClone(valid); input[object][key]=value; assert.equal(canAccept(input),false);
 });
}
const dispatch={stopped:false,paused:false,usageKnown:true,sandbox:true,active:0,capacity:2,
 spent:10,reserved:20,requested:30,tokenLimit:100};
test('Bounded valid dispatch',()=>assert.equal(canDispatch(dispatch),true));
test('Persistent stop blocks dispatch',()=>assert.equal(canDispatch({...dispatch,stopped:true}),false));
test('Capacity wait blocks dispatch',()=>assert.equal(canDispatch({...dispatch,active:2}),false));
test('Unknown usage is not free budget',()=>assert.equal(canDispatch({...dispatch,usageKnown:false}),false));
test('Sandbox missing blocks write',()=>assert.equal(canDispatch({...dispatch,sandbox:false}),false));
test('Reservation blocks overspend',()=>assert.equal(canDispatch({...dispatch,requested:80}),false));
test('Invalid numeric budget rejected',()=>assert.equal(canDispatch({...dispatch,requested:NaN}),false));
const trials=[
 {started:true,verdict:'PASS',attempts:1,knownCostMicros:100},
 {started:true,verdict:'FAIL',attempts:3,knownCostMicros:200},
 {started:true,verdict:'PASS',attempts:2,knownCostMicros:300},
 {started:true,verdict:'TIMEOUT',attempts:1,knownCostMicros:400},
 {started:false,verdict:'NOT_RUN',attempts:0,knownCostMicros:null},
];
test('Failures remain in acceptance denominator',()=>assert.equal(aggregateTrials(trials).acceptedRate,0.5));
test('First pass denominator all started',()=>assert.equal(aggregateTrials(trials).firstPassRate,0.25));
test('Failure costs included',()=>assert.equal(aggregateTrials(trials).costPerAcceptedMicros,500));
test('Unknown cost disables cost ranking',()=>assert.equal(aggregateTrials([
 ...trials,{started:true,verdict:'FAIL',attempts:1,knownCostMicros:null}]).costPerAcceptedMicros,null));
test('Empty denominator null',()=>assert.equal(aggregateTrials([]).acceptedRate,null));
console.log(JSON.stringify({suite:'pure-reference-domain',checks},null,2));
