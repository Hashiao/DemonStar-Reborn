import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';import '../web/js/boss-deaths.js';
const {Game,STEP,deathTransform}=StarfallCore,C=DemonStarCampaign,N=DemonStarNetworkState;
function setup(stage=2,players=1,difficulty=1){const g=new Game(220);g.start(difficulty,stage,false,{playerCount:players});g.recordEvents=[];g.player.invincible=999;return g;}
function spawn(g,id,x=200,y=100){g.spawnRecord([x,0,id,0,1,-1,0,0]);const e=g.enemies.at(-1);Object.assign(e,{x,y,px:x,py:y,entered:true});return e;}
function age(g,e,ticks){for(let i=0;i<ticks;i++)g.updateEnemyState(e);}
test('partly visible chain entrants retain delayed damage until their centers enter play',()=>{
 const g=setup(),a=spawn(g,101,200,0),b=spawn(g,100,200,-15);b.entered=false;
 g.killEnemy(a);age(g,b,12);assert.equal(b.hp,-50);assert.equal(b.dead,false);
 b.y=0;age(g,b,1);assert.equal(b.dead,true);
});
test('critical chain nodes burn down at the native threshold and continue the cascade',()=>{
 const g=setup(2,2),a=spawn(g,100),b=spawn(g,101,232),c=spawn(g,100,264);g.killEnemy(a,g.players[1]);
 age(g,b,8);assert.equal(b.hp,50);assert.equal(b.dead,false);age(g,b,9);assert.equal(b.hp,50);
 age(g,b,1);assert.equal(b.hp,49);g.pause();g.update(.2);assert.equal(b.hp,49);g.resume();
 age(g,b,489);assert.equal(b.hp,1);assert.equal(b.dead,false);age(g,b,1);assert.equal(b.dead,true);
 assert.equal(c.chainDamage,750);age(g,c,8);assert.equal(c.dead,true);assert.equal(g.players[0].score,0);assert.equal(g.players[1].score,g.score);
 const threshold=spawn(g,100,100,100);threshold.hp=175;age(g,threshold,20);assert.equal(threshold.hp,175);
});

test('ground center cascades through adjacent source objects after eight updates',()=>{
 const g=setup(),center=spawn(g,101),first=spawn(g,100,232),second=spawn(g,100,264),isolated=spawn(g,100,330),other=spawn(g,64,210);
 g.killEnemy(center);assert.equal(center.dead,true);assert.equal(first.chainTicks,9);assert.equal(first.chainDamage,750);assert.equal(second.chainTicks,undefined);assert.equal(other.chainTicks,undefined);
 age(g,first,7);assert.equal(first.hp,700);age(g,first,1);assert.equal(first.dead,true);assert.equal(second.chainTicks,9);
 age(g,second,8);assert.equal(second.dead,true);assert.equal(isolated.hp,700);assert.equal(isolated.chainTicks,undefined);assert.equal(g.kills,3);
});
test('chain damage uses original HP and square distance, never unconditional group deletion',()=>{
 const g=setup(),source=spawn(g,100),diagonal=spawn(g,101,233,133),beyond=spawn(g,100,234,100);
 g.killEnemy(source);age(g,diagonal,8);assert.equal(diagonal.hp,50);assert.equal(diagonal.dead,false);assert.equal(beyond.chainTicks,undefined);
 assert.equal(g.score,source.def.score);assert.equal(diagonal.def.hp,750);
});
test('unshootable pipes participate in chain propagation with their own original damage',()=>{
 const g=setup(),center=spawn(g,101),pipe=spawn(g,162,232),nextPipe=spawn(g,162,264),orb=spawn(g,100,264,132);
 assert.equal(pipe.scenery,true);assert.equal(g.targetable(pipe),false);g.killEnemy(pipe);assert.equal(pipe.dead,false);
 g.killEnemy(center);age(g,pipe,8);assert.equal(pipe.dead,true);assert.equal(nextPipe.chainDamage,1);age(g,nextPipe,8);assert.equal(nextPipe.dead,true);
 age(g,orb,8);assert.equal(orb.hp,699);assert.equal(orb.dead,false);
});
test('chain boundaries exclude fully hidden targets and overwrite pending damage',()=>{
 const g=setup(),one=spawn(g,100,200,0),above=spawn(g,100,200,-16),edge=spawn(g,100,200,-15),outside=spawn(g,100,234,0);
 g.killEnemy(one);assert.equal(above.chainTicks,undefined);assert.equal(edge.chainTicks,9);assert.equal(outside.chainTicks,undefined);
 age(g,edge,3);const stronger=spawn(g,101,200,1);g.killEnemy(stronger);assert.equal(edge.chainTicks,9);assert.equal(edge.chainDamage,750);
 age(g,edge,7);assert.equal(edge.hp,700);age(g,edge,1);assert.equal(edge.dead,true);
});
test('P2 chain credit is stable and dying structures cannot score or drop twice',()=>{
 const g=setup(2,2),a=spawn(g,101),b=spawn(g,100,232);a.record[5]=11;b.record[5]=11;
 g.killEnemy(a,g.players[1]);age(g,b,8);assert.equal(g.players[0].score,0);assert.equal(g.players[1].score,a.def.score+b.def.score);
 const score=g.score,kills=g.kills,count=g.pickups.length;g.finishEnemy(a);g.finishEnemy(b);age(g,b,20);
 assert.equal(g.score,score);assert.equal(g.kills,kills);assert.equal(g.pickups.length,count);
});
for(let difficulty=0;difficulty<4;difficulty++)test('pending chain survives pause and live difficulty change '+difficulty,()=>{
 const g=setup(2,1,difficulty),a=spawn(g,101),b=spawn(g,100,232);g.killEnemy(a);g.pause();g.update(.2);
 assert.equal(b.chainTicks,9);g.setDifficulty((difficulty+1)%4);g.resume();for(let i=0;i<8;i++)g.update(STEP);
 assert.equal(b.dead,true);assert.equal(g.difficulty,(difficulty+1)%4);
});
test('source snake formations retain all bodies, independent HP, and visible dying parts',()=>{
 for(const stage of [3,10])for(let difficulty=0;difficulty<4;difficulty++){
  const g=setup(stage,1,difficulty),rows=C.levels[stage-1].events;
  const start=rows.findIndex(r=>C.definitions[C.byId[r[2]]].sprite==='S_ENEMY37A'),group=rows[start][6];
  g.recordEvents=rows.slice(start).slice(0,rows.slice(start).findIndex((r,i)=>i>0&&r[6]!==group));
  assert.ok(g.recordEvents.length>=5);g.scroll=g.recordEvents[0][1];g.dispatchRecords();
  const parts=g.enemies.slice();assert.equal(parts.length,g.recordEvents.length);assert.ok(parts.slice(1,-1).every(e=>e.def.sprite==='S_ENEMY36A'));
  const offset=300-parts[0].y;for(const e of parts){e.y+=offset;e.py=e.y;e.entered=true;}
  const head=parts[0],others=parts.slice(1).map(e=>e.hp);g.killEnemy(head);
  assert.equal(head.dying,true);assert.equal(head.dead,false);assert.equal(g.targetable(head),false);assert.deepEqual(parts.slice(1).map(e=>e.hp),others);
  age(g,head,49);assert.equal(head.dead,false);assert.equal(deathTransform(head).scale,1);age(g,head,1);assert.equal(head.dead,true);
 }
});
test('snake damage and death rendering survive authoritative LAN frames',()=>{
 const host=setup(3,2),head=spawn(host,10),body=spawn(host,11,200,68),tail=spawn(host,12,200,36);
 host.killEnemy(body,host.players[1]);age(host,body,12);const state=N.encode(host,host.drainEvents()),client=new Game(1);
 assert.equal(N.apply(client,state,false),true);assert.equal(client.enemies.length,3);const copy=client.enemies.find(e=>e.uid===body.uid);
 assert.equal(copy.dying,true);assert.deepEqual(deathTransform(copy),deathTransform(body));assert.equal(head.dead,false);assert.equal(tail.dead,false);
 host.pause();const before=body.fallFixed;host.update(.2);assert.equal(body.fallFixed,before);
});
test('three redrawn damaged segments have source bounds and immutable RGBA atlas hashes',()=>{
 const a=DemonStarBossDeathArt;assert.deepEqual(Object.keys(a.segments),['S_ENEMY37A','S_ENEMY36A','S_ENEMY35A']);
 const expected=[[1093,32,36,0,1],[1091,32,31,0,1.5],[1089,32,40,0,0]];
 Object.values(a.segments).forEach((s,i)=>{assert.deepEqual([s.sourceEntry,...s.size,...s.offset],expected[i]);const info=a.assets[s.asset],bytes=readFileSync('web/'+s.asset);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),info.sha256);assert.equal(bytes[25],6);
 const [x,y,w,h]=s.crop;assert.ok(x>0&&y>0&&x+w<info.size[0]&&y+h<info.size[1]);});
});
