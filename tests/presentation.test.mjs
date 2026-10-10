import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';
import '../web/js/campaign.js';
import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';
import '../web/js/original-rules.js';
const {Game,STEP}=StarfallCore;
function ticks(g,n,input={}){for(let i=0;i<n;i++)g.update(STEP,input);}
function arena(){const g=new Game(3);g.start();g.recordEvents=[];g.player.invincible=999;return g;}
function enemy(g,flags=0){const d={width:40,height:40,hp:100,flags,score:250,sprite:'G_STAT1A',mode:0};const e={uid:1,x:200,y:200,px:200,py:200,r:16,hp:100,maxHp:100,def:d,record:[0,0,0,0,0,-1],guns:[],speed:0,time:0};g.enemies.push(e);return e;}
test('launch blocks combat and map time, orders door/deck/radio, and pauses exactly',()=>{
  const g=new Game(1);g.start(1,1,true);assert.equal(g.phase,'launch');assert.equal(g.drainEvents()[0].deferredLaunch,true);
  ticks(g,25,{x:1,fire:true});assert.equal(g.frame,0);assert.equal(g.scroll,0);assert.equal(g.shotsFired,0);assert.equal(g.player.x,200);assert.equal(g.useBomb(),false);assert.equal(g.drainEvents().length,0);
  ticks(g,1);assert.deepEqual(g.drainEvents().map(e=>e.type),['launch']);
  g.pause();const frozen=JSON.stringify(g);ticks(g,100);assert.equal(JSON.stringify(g),frozen);g.resume();assert.equal(g.phase,'launch');
  while(g.phase==='launch')g.update(STEP,{x:1,fire:true});assert.equal(g.frame,0);assert.equal(g.scroll,0);assert.equal(g.totalTime,0);assert.deepEqual(g.drainEvents().map(e=>e.type),['mission-start']);
  ticks(g,1,{fire:true});assert.equal(g.frame,1);assert.equal(g.shotsFired,2);
});
test('surviving blue/red tier-two shots have larger impact, yellow always small',()=>{
  for(const [type,row,size] of [[15,0,16],[16,0,16],[25,0,16],[26,0,16],[27,1,40],[28,1,40],[29,0,16],[30,1,40],[31,1,40],[50,1,40]]){
    const g=arena(),e=enemy(g);g.addBullet(200,220,0,-600,true,1,0,{shotType:type});ticks(g,1);assert.equal(e.hp,99);assert.equal(g.effects[0].row,row);assert.equal(g.effects[0].size,size);assert.equal(g.effects.length,1);
  }
});
test('offscreen protection does not produce imaginary impacts',()=>{const g=arena(),e=enemy(g);e.y=-60;g.addBullet(200,-45,0,-600,true,100,0,{shotType:31});ticks(g,1);assert.equal(g.effects.length,0);assert.equal(e.hp,100);});
test('ordinary deaths create expanding fireballs once, with independent finite lifetimes',()=>{
  const g=arena(),e=enemy(g);g.killEnemy(e);g.killEnemy(e);assert.equal(g.kills,1);assert.equal(g.score,250);assert.equal(g.effects.length,1);assert.equal(g.effects[0].row,2);assert.ok(g.effects[0].size>=48);ticks(g,24);assert.equal(g.effects.length,0);
});
test('only both ground-remnant flags preserve inert scrolling wrecks',()=>{
  for(const flags of [0,0x40,0x80,0xc0,0x20400]){const g=arena(),e=enemy(g,flags);g.killEnemy(e);assert.equal(g.wrecks.length,flags===0xc0?1:0);const score=g.score;ticks(g,1);if(flags===0xc0)assert.equal(g.wrecks[0].y,201);assert.equal(g.score,score);assert.equal(g.enemies.length,0);ticks(g,320);assert.equal(g.wrecks.length,0);}
});
test('bonus uses surviving bombs and medals across four difficulties exactly once',()=>{
  for(let d=0;d<4;d++){const g=new Game(2);g.start(d);g.player.medals=10;g.defeatBoss();assert.deepEqual(g.stageBonus,{bombs:3,medals:10,bombScore:3000,medalScore:20000,total:23000,awarded:true});assert.equal(g.score,23000);g.defeatBoss();g.completeStage();assert.equal(g.score,23000);assert.ok(g.nextStage());assert.equal(g.player.medals,0);assert.equal(g.stageBonus,null);assert.equal(g.score,23000);}
});
test('last-life death clears medal bonus eligibility; ordinary hits retain medals',()=>{const g=arena();g.player.invincible=0;g.player.medals=7;g.hitPlayer(1);assert.equal(g.player.medals,7);g.hitPlayer(100);assert.equal(g.player.medals,0);});
test('aftermath leaves time for blast, freezes combat, resumes and awards once',()=>{
  const g=arena();g.presentation=true;g.addEffect(2,200,150,112,36);g.defeatBoss();assert.equal(g.phase,'aftermath');assert.equal(g.stageBonus.awarded,false);const frame=g.frame;ticks(g,15,{fire:true,x:1});assert.equal(g.frame,frame);assert.equal(g.shotsFired,0);g.pause();const age=g.effects[0].age;ticks(g,20);assert.equal(g.effects[0].age,age);g.resume();ticks(g,30);assert.equal(g.phase,'cleared');assert.equal(g.effects.length,0);assert.equal(g.score,3000);g.completeStage();assert.equal(g.score,3000);g.nextStage();assert.equal(g.phase,'launch');
});
test('final mission pays bonus without unlocking a nonexistent nineteenth stage',()=>{const g=new Game(1);g.start(1,18);g.player.bombInventory=[];g.player.medals=2;g.defeatBoss();assert.equal(g.phase,'victory');assert.equal(g.score,4000);assert.equal(g.nextStage(),false);});
test('effects remain bounded during dense fire and new stage clears old visuals',()=>{const g=arena();for(let i=0;i<500;i++)g.addEffect(1,200,200,40,24);assert.equal(g.effects.length,160);ticks(g,24);assert.equal(g.effects.length,0);g.addEffect(1,200,200,40,24);g.start();assert.equal(g.effects.length,0);assert.equal(g.wrecks.length,0);});
