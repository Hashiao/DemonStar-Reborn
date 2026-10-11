// 点按、数字倾斜与实体长按回归 / Point, digital tilt and physical-hold regressions.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/input.js';import '../web/js/tilt.js';
const {Input,preferences}=DemonStarInput,{Game,STEP,PLAYER_STEP_X,PLAYER_STEP_Y}=StarfallCore;
test('point travel is bounded on every step and arrives exactly without teleport or oscillation',()=>{
 for(const target of [{x:16,y:64},{x:384,y:440},{x:200.1,y:410.3}]){const g=new Game(1);g.start();g.recordEvents=[];g.player.invincible=999;for(let i=0;i<200;i++){const {x,y}=g.player;g.update(STEP,{target});assert.ok(Math.max(Math.abs((g.player.x-x)/PLAYER_STEP_X),Math.abs((g.player.y-y)/PLAYER_STEP_Y))<=1+1e-10);}assert.ok(Math.abs(g.player.x-target.x)<1e-9);assert.ok(Math.abs(g.player.y-target.y)<1e-9);}
});
test('point ownership, temporary local restrictions and prior preferences survive round trips',()=>{
 const a=new Input();a.config.players[0].touch='point';a.config.players[1].touch='point';a.setCount(2);assert.equal(a.mode(0),'point');assert.equal(a.mode(1),'floating');a.point(0,20,80);a.point(1,200,200);assert.deepEqual(a.sample([],[],true).players[0].target,{x:20,y:80});assert.equal(a.states[1].target,null);a.clear(true);assert.equal(a.states[0].target,null);
 a.config.players[0].touch='tilt';assert.equal(a.mode(0),'floating');a.setCount(1);assert.equal(a.mode(0),'tilt');assert.equal(preferences(a.export()).players[0].touch,'tilt');assert.equal(preferences({version:2,players:[{touch:'fixed'}]}).players[0].touch,'floating');
});
test('tilt dead zone, full directions, hysteresis, inversion and stale samples',async()=>{
 let now=0;const t=new DemonStarTilt({available:true,ready:Promise.resolve(),on(){},request:async()=>true},()=>now);await t.start();const pose=(x,y=0,orientation=0)=>t.receive({x:Math.sin(x*Math.PI/180),y:-Math.sin(y*Math.PI/180),z:-Math.cos(x*Math.PI/180)*Math.cos(y*Math.PI/180),orientation});
 pose(0);assert.ok(t.calibrate());pose(9);assert.deepEqual(t.sample({tiltAngle:10}),{x:0,y:0});pose(11);assert.equal(t.sample({tiltAngle:10}).x,1);pose(25);assert.equal(t.sample({tiltAngle:10}).x,1);pose(9);assert.equal(t.sample({tiltAngle:10}).x,1);pose(7);assert.equal(t.sample({tiltAngle:10}).x,0);pose(-15,15);assert.deepEqual(t.sample({tiltAngle:10,tiltInvertX:true,tiltInvertY:true}),{x:1,y:-1});now=601;assert.deepEqual(t.sample({}),{x:0,y:0});assert.equal(t.calibrate(),false);pose(0,0,90);assert.deepEqual(t.sample({}),{x:0,y:0});assert.ok(t.calibrate());t.stop();assert.equal(t.running,false);
});
test('toggle hint tracks physical touch, keyboard, mouse and pad, once per continuous hold',()=>{
 for(const device of ['touch','key','mouse','pad']){const a=new Input();a.config.mousePlayer=1;let pads=[];if(device==='touch')a.touchFire(0,7,true);if(device==='key')a.key({code:'KeyZ'},true);if(device==='mouse')a.mouseButton(0,true);if(device==='pad'){pads=[{connected:true,axes:[0,0],buttons:[{pressed:false}]}];a.sample(pads);pads[0].buttons[0].pressed=true;}a.sample(pads);a.commit();a.sample(pads);assert.deepEqual(a.holdHints(100),[]);assert.deepEqual(a.holdHints(1299),[]);assert.deepEqual(a.holdHints(1300),[0]);assert.deepEqual(a.holdHints(6000),[]);a.clear(true);a.sample([]);assert.deepEqual(a.holdHints(8000),[]);assert.equal(a.firing(0),device!=='pad');}
});
