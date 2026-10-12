// 速度属于各玩家操作偏好，不属于关卡存档。 / Speed belongs to each player's controls, not stage saves.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/original-rules.js';import '../web/js/input.js';import '../web/js/network-state.js';
const {Game,STEP,MOVE_SPEEDS,PLAYER_STEP_X,PLAYER_STEP_Y,validMoveSpeed}=StarfallCore,{Input,preferences}=DemonStarInput,N=DemonStarNetworkState;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('new and existing control profiles default to medium without resetting saved controls',()=>{
 const input=preferences({version:3,count:2,players:[{touch:'tilt',fireMode:'hold',tiltAngle:9,bindings:{fire:['key:KeyQ']}},{touch:'dpad'}]});assert.deepEqual(input.players.map(p=>p.moveSpeed),['medium','medium','medium','medium']);assert.equal(input.players[0].touch,'tilt');assert.equal(input.players[0].fireMode,'hold');assert.equal(input.players[0].tiltAngle,9);assert.deepEqual(input.players[0].bindings.fire,['key:KeyQ']);
 input.players[0].moveSpeed='slow';input.players[1].moveSpeed='fast';assert.deepEqual(preferences(input).players.slice(0,2).map(p=>p.moveSpeed),['slow','fast']);
 for(const bad of ['__proto__','constructor',4,NaN,null,{}, {toString:'invalid'}])assert.equal(validMoveSpeed(bad),false);
 close(MOVE_SPEEDS.medium,(MOVE_SPEEDS.slow+MOVE_SPEEDS.fast)/2);
});
test('default engine/input is medium and each shared-device player owns its independent speed',()=>{
 const g=new Game(223),input=new Input({count:2});g.start(0,1,false,{playerCount:2});g.recordEvents=[];assert.ok(g.players.every(p=>p.moveSpeed==='medium'));input.move(0,1,1);input.move(1,1,1);
 const before=g.players.map(p=>({...p}));g.update(STEP,input.sample([],g.players));for(let i=0;i<2;i++){close(g.players[i].x-before[i].x,PLAYER_STEP_X*5/6);close(g.players[i].y-before[i].y,PLAYER_STEP_Y*5/6);}
 input.config.players[0].moveSpeed='slow';input.config.players[1].moveSpeed='fast';const at=g.players.map(p=>p.x);g.update(STEP,input.sample([],g.players));close(g.players[0].x-at[0],PLAYER_STEP_X*2/3);close(g.players[1].x-at[1],PLAYER_STEP_X);assert.equal(g.frame,2);assert.equal(g.scroll,2);
});
test('paused speed changes preserve combat and latched fire; checkpoints do not replace control preferences',()=>{
 const g=new Game(223),input=new Input();g.start();g.recordEvents=[];input.pulse(0,'fire');g.pause();const checkpoint=g.checkpoint(),before=JSON.stringify(g.players);input.config.players[0].moveSpeed='slow';g.update(STEP,input.sample([],g.players,false));assert.equal(JSON.stringify(g.players),before);assert.equal(input.firing(0),true);
 g.resume();input.move(0,1,0);const x=g.player.x;g.update(STEP,input.sample([],g.players));close(g.player.x-x,PLAYER_STEP_X*2/3);assert.ok(g.shotsFired>0);
 assert.ok(g.loadCheckpoint(checkpoint));const start=g.player.x;g.update(STEP,input.sample([],g.players));close(g.player.x-start,PLAYER_STEP_X*2/3);assert.equal(input.config.players[0].moveSpeed,'slow');assert.equal(checkpoint.players[0].moveSpeed,undefined);
});
test('every speed stops at short targets and keeps the last valid cap on malformed input',()=>{
 for(const moveSpeed of ['slow','medium','fast']){const g=new Game(223);g.start();g.recordEvents=[];g.player.x=100;g.player.y=100;g.update(STEP,{moveSpeed,target:{x:100.1,y:100.2}});close(g.player.x,100.1);close(g.player.y,100.2);g.update(STEP,{moveSpeed:99,x:1,y:1});close(g.player.x,100.1+PLAYER_STEP_X*MOVE_SPEEDS[moveSpeed]);close(g.player.y,100.2+PLAYER_STEP_Y*MOVE_SPEEDS[moveSpeed]);}
});
test('snapshots retain independent speed labels and reject invalid caps before changing the client',()=>{
 const g=new Game(223);g.start(0,1,false,{playerCount:2});g.recordEvents=[];g.update(STEP,{players:[{moveSpeed:'slow'},{moveSpeed:'fast'}]});const client=new Game(224);assert.ok(N.apply(client,N.encode(g),false));assert.deepEqual(client.players.map(p=>p.moveSpeed),['slow','fast']);const before=JSON.stringify(client);for(const bad of [null,6,'warp',{toString:'bad'}]){const s=N.encode(g);s.players[1].moveSpeed=bad;assert.equal(N.apply(client,s),false);assert.equal(JSON.stringify(client),before);}
});
