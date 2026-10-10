import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';
import '../web/js/campaign.js';
import '../web/js/player-rules.js';
import '../web/js/projectile-rules.js';
import '../web/js/weapon-art.js';
import '../web/js/original-rules.js';
const {Game,STEP,PLAYER_STEP_X,validCheckpoint}=StarfallCore;
const arena=(count=4)=>{const g=new Game(44);g.start(1,1,false,{playerCount:count});g.recordEvents=[];return g;};
const ticks=(g,n,input={})=>{for(let i=0;i<n;i++)g.update(STEP,input);};
function enemy(g,x,y,hp=100){const e={uid:++g.enemySerial,x,y,px:x,py:y,r:12,hp,maxHp:hp,def:{width:24,height:24,hp,score:123,flags:0,mode:0,sprite:'S_ENEMY14'},record:[0,0,0,0,0,-1],guns:[],time:0,speed:0};g.enemies.push(e);return e;}

test('one through four players move and shoot independently without advancing world four times',()=>{
  for(let count=1;count<=4;count++){
    const g=arena(count),before=g.players.map(p=>p.x);g.update(STEP,{players:g.players.map((p,i)=>({x:i%2?-1:1,fire:i!==2}))});
    assert.equal(g.frame,1);assert.equal(g.scroll,1);assert.equal(g.player,g.players[0]);
    for(const [i,p] of g.players.entries()){assert.ok(Math.abs(p.x-before[i]-PLAYER_STEP_X*(i%2?-1:1))<1e-9);assert.equal(g.bullets.filter(b=>b.playerId===p.id).length,i===2?0:2);}
    assert.equal(new Set(g.players.map(p=>p.bombInventory)).size,count);
  }
});
test('projectiles inherit only the movement of the firing player',()=>{
  const g=arena(2);g.emitPlayerShot(15,200,300,0,{playerId:2});g.update(STEP,{players:[{x:-1},{x:1}]});assert.ok(Math.abs(g.bullets[0].x-200-PLAYER_STEP_X)<1e-9);
});
test('pickup claimant, death drops, damage and last life belong to one player',()=>{
  const g=arena(2),[a,b]=g.players;a.x=100;b.x=102;a.y=b.y=300;
  const item={x:102,y:300,id:2,type:'weapon',angle:0,speed:0,time:0,cycleTicks:100};g.pickups.push(item);g.update(STEP);
  assert.equal(a.power,0);assert.equal(b.power,1);assert.equal(g.pickups.length,0);assert.equal(g.collect(item,a),false);
  b.invincible=0;b.lives=1;g.hitPlayer(100,'projectile',b);assert.equal(b.lives,0);assert.equal(a.lives,4);assert.equal(g.phase,'playing');assert.equal(g.pickups[0].id,2);
  const x=b.x;ticks(g,80,{players:[{},{x:1,fire:true,bomb:1}]});assert.equal(b.x,x);assert.equal(b.shotsFired,0);
  a.invincible=0;a.lives=1;g.hitPlayer(100,'projectile',a);assert.equal(g.phase,'gameover');
});
test('one enemy projectile is consumed once but a vertical beam hits both players',()=>{
  const g=arena(2),[a,b]=g.players;a.x=b.x=200;a.y=b.y=300;a.invincible=b.invincible=0;
  g.addBullet(200,300,0,0,false,2);g.update(STEP);assert.equal(a.energy+b.energy,30);
  const e=enemy(g,200,100,9999);g.addBullet(200,100,0,0,false,2,0,{beam:true,owner:e.uid,offsetX:0,offsetY:0,age:0,beamFrames:4});g.update(STEP);assert.equal(a.energy+b.energy,26);
});
test('enemy targeting selects a live nearby player, excluding eliminated players',()=>{
  const g=arena(4);g.players[0].lives=0;g.players[1].x=40;g.players[2].x=320;g.players[3].x=380;
  assert.equal(g.targetPlayer(325,200).id,3);g.players[2].respawn=1;assert.equal(g.targetPlayer(325,200).id,4);
});
test('all players can bomb simultaneously and command retransmission does not consume more bombs',()=>{
  const g=arena(),input={players:g.players.map(()=>({bomb:12}))};g.update(STEP,input);assert.equal(g.specials.length,4);assert.deepEqual(g.players.map(p=>p.bombs),[2,2,2,2]);
  ticks(g,80,input);assert.deepEqual(g.players.map(p=>p.bombs),[2,2,2,2]);
  g.update(STEP,{players:[{bomb:13},{},{},{}]});assert.deepEqual(g.players.map(p=>p.bombs),[1,2,2,2]);
  ticks(g,40,{players:[{bomb:12},{},{},{}]});assert.equal(g.player.bombs,1);
});
test('simultaneous blue auras follow their owners and keep individual damage cadence',()=>{
  const g=arena(2),[a,b]=g.players;a.bombInventory=[2];b.bombInventory=[2];g.useBomb(a);g.useBomb(b);g.update(STEP,{players:[{x:-1},{x:1}]});
  assert.equal(g.bullets.length,2);for(const p of g.players){const shot=g.bullets.find(b=>b.playerId===p.id);assert.equal(shot.x,p.x);assert.equal(shot.damage,720);}
  a.mega=0;g.update(STEP);assert.ok(g.bullets.every(shot=>shot.playerId===2));
});
test('kill and stage bonus attribution is separate, while the team total is paid once',()=>{
  const g=arena(2),[a,b]=g.players,e=enemy(g,b.x,200,10);g.addBullet(b.x,200,0,0,true,20,0,{playerId:2});g.update(STEP);
  assert.equal(b.score,123);assert.equal(a.score,0);assert.equal(b.kills,1);assert.equal(g.score,123);assert.ok(e.dead);
  a.medals=1;b.medals=2;g.defeatBoss();assert.deepEqual(g.stageBonuses.map(s=>s.total),[5000,7000]);assert.equal(a.score,5000);assert.equal(b.score,7123);assert.equal(g.score,12123);
  g.completeStage();assert.equal(g.score,12123);assert.equal(g.nextStage(),true);assert.deepEqual(g.players.map(p=>p.medals),[0,0]);assert.equal(g.checkpoint().score,12123);
});
test('checkpoint restores the stage entry, not a later partially completed battle',()=>{
  const g=arena(4);g.players[2].defaultWeapon=false;g.players[2].weapon=2;g.players[2].power=6;g.players[2].bombInventory=[2,1];g.players[2].missileAmmo=73;g.players[1].lives=2;g.players[1].energy=9;
  g.score=1234;g.supplyIndex=2;g.random();g.loadStage(3);const saved=g.checkpoint(),nextRandom=g.random();g.players[2].power=1;g.score=9999;g.frame=999;
  assert.ok(validCheckpoint(saved));const h=new Game(9);assert.ok(h.loadCheckpoint(saved,false));assert.equal(h.stage.id,3);assert.equal(h.players.length,4);assert.equal(h.players[2].power,6);assert.deepEqual(h.players[2].bombInventory,[2,1]);assert.equal(h.players[2].bombs,2);assert.equal(h.players[2].missileAmmo,73);assert.equal(h.players[1].energy,9);assert.equal(h.score,1234);assert.equal(h.frame,0);assert.equal(h.random(),nextRandom);
  saved.players[2].bombInventory.length=0;assert.equal(h.players[2].bombs,2);const copy=h.checkpoint();copy.score=8;assert.equal(h.checkpoint().score,1234);
});
test('invalid or future checkpoints are rejected atomically without changing the run',()=>{
  const g=arena(2),s=g.checkpoint();
  for(const mutate of [v=>v.version=99,v=>v.stage=19,v=>v.players[1].id=1,v=>v.players[0].bombInventory=[5],v=>v.players[0].energy=NaN,v=>v.players[0].power=6,v=>v.players=[],v=>v.randomState=-1]){const broken=JSON.parse(JSON.stringify(s));mutate(broken);const before=JSON.stringify(g);assert.equal(g.loadCheckpoint(broken),false);assert.equal(JSON.stringify(g),before);}
});
test('four-player simulation remains deterministic across render rates and pause',()=>{
  const run=rate=>{const g=arena(4);for(let t=0;t<rate*2;t++)g.update(1/rate,{players:[{x:.1,fire:true},{x:-.1,fire:true},{y:-.1,fire:true},{y:-.2,fire:true}]});return g;};
  const a=run(60),b=run(120);assert.deepEqual(a.players,b.players);assert.deepEqual(a.bullets,b.bullets);assert.equal(a.scroll,b.scroll);
  a.pause();const frozen=JSON.stringify(a);a.update(.25,{players:[{fire:true,bomb:1}]});assert.equal(JSON.stringify(a),frozen);
});
test('four independent players reach all eighteen original bosses without modifying campaign timing',()=>{
  for(let stage=1;stage<=18;stage++){
    const g=new Game(31);g.start(1,stage,false,{playerCount:4});let n=0;
    while(!g.bossSpawned&&n++<18000){for(const p of g.players)p.invincible=999;g.update(STEP);}
    assert.ok(g.bossSpawned,`stage ${stage}`);assert.equal(g.frame,n);assert.equal(g.scroll,n);
    for(const p of g.players)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    g.killEnemy(g.boss,g.players[3]);ticks(g,60);assert.equal(g.phase,stage===18?'victory':'cleared');assert.equal(g.players[3].kills,1);assert.equal(g.stageBonuses.length,4);
  }
});
