// 原作追踪与十八档弹型验收。 / Original homing and eighteen weapon-tier regressions.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/combat-visuals.js';import '../web/js/original-rules.js';
const {Game,STEP,TICK,PLAYER_STEP_X}=StarfallCore;
function arena(){const g=new Game(1);g.start();g.recordEvents=[];g.player.invincible=999;return g;}
function enemy(g,x,y){const e={uid:++g.enemySerial,x,y,px:x,py:y,r:3,hp:99999,maxHp:99999,def:{width:12,height:12,hp:99999,flags:0,score:0,sprite:'S_ENEMY14',mode:0},record:[0,0,0,0,0,-1],guns:[],speed:0,time:0,pathFinished:true,exitX:0,exitY:0,entered:true};g.enemies.push(e);return e;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('homing pairs cycle targets and retain a lock even when another enemy becomes closer',()=>{
 const g=arena(),a=enemy(g,50,60),b=enemy(g,220,280);g.emitPlayerShot(39,100,400);g.emitPlayerShot(39,116,400);const [m,n]=g.bullets;assert.equal(m.targetUid,a.uid);assert.equal(n.targetUid,b.uid);
 enemy(g,101,380);g.update(STEP);assert.equal(m.targetUid,a.uid);assert.equal(n.targetUid,b.uid);
});
test('lost homing targets are reacquired cyclically, excluding hidden, scenery and dying targets',()=>{
 const g=arena(),a=enemy(g,40,60),hidden=enemy(g,200,-60),scenery=enemy(g,180,100),dying=enemy(g,220,100),b=enemy(g,300,100);scenery.scenery=true;dying.dying=true;g.emitPlayerShot(39,200,400);assert.equal(g.bullets[0].targetUid,a.uid);a.dead=true;g.steerMissile(g.bullets[0]);assert.equal(g.bullets[0].targetUid,b.uid);assert.notEqual(b.uid,hidden.uid);
});
test('homing moves before steering and never loses the original eight-pixel speed',()=>{
 const g=arena();enemy(g,350,60);g.emitPlayerShot(39,100,420);const b=g.bullets[0];g.update(STEP);near(b.x,100);near(b.y,412);assert.ok(b.flightAngle>0);
 for(let i=0;i<25;i++){const x=b.x,y=b.y;g.update(STEP);near(Math.hypot(b.x-x,b.y-y),8);near(Math.hypot(b.vx,b.vy),8*TICK);}
});
test('source steering uses 64-unit turns and the post-turn snap, including angle wrap',()=>{
 for(const [current,desired,expected] of [[0,500,64],[0,100,100],[0,2040,2040],[2040,8,8],[0,1024,64]]){
  const g=arena(),a=desired*Math.PI/1024,e=enemy(g,200+Math.sin(a)*100,240-Math.cos(a)*100),b={x:200,y:240,targetUid:e.uid,flightAngle:current,speedStep:8};g.steerMissile(b);assert.equal(b.flightAngle,expected);near(Math.hypot(b.vx,b.vy),8*TICK);
 }
});
test('homing fuse, offscreen cleanup, pause and stage restart are deterministic',()=>{
 const g=arena();g.emitPlayerShot(39,200,300);const b=g.bullets[0];
 for(let i=0;i<100;i++){b.y=300;g.update(STEP);assert.ok(g.bullets.includes(b));}b.y=300;g.update(STEP);assert.equal(g.bullets.length,0);assert.equal(g.effects.length,1);
 g.emitPlayerShot(39,200,-10);g.update(STEP);assert.equal(g.bullets.length,0);g.emitPlayerShot(39,200,300);g.pause();const state=JSON.stringify(g);g.update(.2);assert.equal(JSON.stringify(g),state);g.loadStage(2);assert.equal(g.homingCursor,0);assert.equal(g.bullets.length,0);
});
test('main shots inherit only two movement ticks, homing one and ordinary missiles none',()=>{
 for(const [type,ticks] of [[15,2],[17,2],[28,2],[50,2],[39,1],[38,0]]){
  const g=arena();g.emitPlayerShot(type,100,400);const b=g.bullets[0];for(let i=0;i<3;i++)g.update(STEP,{x:1});near(b.x,100+ticks*PLAYER_STEP_X);
 }
});
test('red auxiliary projectiles decelerate to their own source floors while main beams stay at sixteen',()=>{
 for(const [type,start,delta,floor] of [[32,20,-1,12],[33,20,-1,12],[34,21,-2,8],[35,22,-2,8],[36,24,-2,8],[37,24,-2,8]]){
  const g=arena();g.emitPlayerShot(type,200,450,32);const b=g.bullets[0];let traveled=0,speed=start;
  for(let i=0;i<12;i++){const x=b.x,y=b.y;g.update(STEP);traveled+=speed;near(Math.hypot(b.x-x,b.y-y),speed);speed=Math.max(floor,speed+delta);near(b.speedStep,speed);}assert.ok(traveled<start*12);
 }
 const g=arena();g.emitPlayerShot(50,200,450);for(let i=0;i<12;i++)g.update(STEP);near(g.bullets[0].speedStep,16);
});
test('all eighteen upgrade patterns retain the original muzzle counts and damage values',()=>{
 const expected=[[2,2,4,4,6,6],[2,2,2,4,4,4],[2,2,2,2,2,2]];
 for(let color=0;color<3;color++)for(let level=1;level<=6;level++){
  const g=arena();g.player.defaultWeapon=false;g.player.weapon=color;g.player.power=level;g.firePlayer();assert.equal(g.bullets.length,2+expected[color][level-1]);assert.equal(g.bullets.filter(b=>b.defaultShot).length,2);for(const b of g.bullets)assert.equal(b.damage,DemonStarPlayerRules.damage[b.shotType]);
 }
});
test('yellow paired art is one projectile per side with two separate original-sized pellets',()=>{
 const g=arena();g.player.defaultWeapon=false;g.player.weapon=0;g.player.power=6;g.firePlayer('enhancement');assert.equal(g.bullets.length,6);
 for(const type of [18,19,20,21,22,23,24,25]){const spec=DemonStarCombatVisuals.shot(type);assert.equal(spec.parts.length,2);for(const p of spec.parts)assert.ok(p[2]>0&&p[3]>0);assert.ok(spec.parts[0][0]!==spec.parts[1][0]);}
});
test('red, blue and missile geometry uses source dimensions without the old 1.5 or 2 times enlargement',()=>{
 assert.deepEqual([29,30,31,48,49,50].map(t=>DemonStarCombatVisuals.shot(t).width),[1,3,5,9,11,13]);
 assert.deepEqual([26,27,28].map(t=>[DemonStarCombatVisuals.shot(t).width,DemonStarCombatVisuals.shot(t).height]),[[3,8],[3,12],[3,16]]);
 for(const t of [38,39])assert.deepEqual([DemonStarCombatVisuals.shot(t).width,DemonStarCombatVisuals.shot(t).height],[4,8]);assert.equal(DemonStarCombatVisuals.shot(37).height,4);
});
