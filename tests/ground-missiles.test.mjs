import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';
const {Game,STEP}=StarfallCore,N=DemonStarNetworkState;
const spawn=(g,id,x=200,y=100)=>{g.spawnRecord([x,0,id,0,1,-1,0,0]);const e=g.enemies.at(-1);Object.assign(e,{x,y,px:x,py:y,entered:true});return e;};
const setup=(stage=4,difficulty=1,players=2)=>{const g=new Game(221);g.start(difficulty,stage,false,{playerCount:players});g.recordEvents=[];for(const p of g.players)p.invincible=999;return g;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('native angled launchers fire down-left/down-right at original speed across every placement stage and difficulty',()=>{
 for(const stage of [4,6,12,16])for(let difficulty=0;difficulty<4;difficulty++)for(const players of [1,2])for(const [id,type,angle,sign] of [[117,44,0x316,1],[118,43,0x4ea,-1]]){
  const g=setup(stage,difficulty,players),e=spawn(g,id);assert.ok(g.stage.map.events.some(r=>r[2]===id));
  for(const gun of e.guns){gun.delay=0;gun.wait=0;gun.tick(e,g);}
  assert.equal(g.bullets.length,2);
  for(const [i,b] of g.bullets.entries()){
   const raw=e.def.guns[i];assert.equal(b.shotType,type);assert.ok(b.vx*sign>0&&b.vy>0);close(Math.hypot(b.vx,b.vy)*STEP,6);
   close(Math.atan2(b.vx,-b.vy),angle>1024?(angle-2048)*Math.PI/1024:angle*Math.PI/1024);
   assert.equal(b.x,e.x-e.def.width/2+raw[0]);assert.equal(b.y,e.y-e.def.height/2+raw[1]+4);
   assert.equal(b.damage,DemonStarPlayerRules.damage[type]);assert.equal(b.flightAngle,angle);assert.equal(b.missile,true);
  }
 }
});

test('first Boss missiles retain downward speed, raw gun timing and half-height muzzle alignment',()=>{
 const g=setup(1),e=spawn(g,40);const guns=e.guns.filter(gun=>gun.raw[2]===8);
 for(const gun of guns){const source=gun.raw.slice();gun.delay=0;gun.wait=0;gun.angle=0;gun.tick(e,g);assert.deepEqual(gun.raw,source);}
 assert.equal(g.bullets.length,2);
 for(const [i,b] of g.bullets.entries()){close(b.vx,0);close(b.vy*STEP,7);assert.equal(b.y,e.y-e.def.height/2+guns[i].raw[1]+8);assert.equal(b.shotType,8);}
});

test('missile trails drift backward, stay bounded and never consume gameplay randomness or create projectiles',()=>{
 const g=setup(),before=g.random.state();
 for(const [type,angle] of [[8,1024],[43,1258],[44,790]]){
  const old=g.particles.length;g.enemyMissileTrail({x:200,y:200,shotType:type,flightAngle:angle});assert.equal(g.particles.length-old,2);
  for(const p of g.particles.slice(old)){assert.ok(p.smoke);assert.ok(p.vy<0);if(type!==8)assert.ok(p.vx*(type===43?1:-1)>0);}
 }
 assert.equal(g.bullets.length,0);assert.equal(g.random.state(),before);g.particles=new Array(349).fill({});g.enemyMissileTrail({x:200,y:200,shotType:43});assert.equal(g.particles.length,350);
});

test('terrain fixtures and intact supply boxes keep position relative to terrain through firing, pause and difficulty changes',()=>{
 for(const fps of [30,60,120])for(let difficulty=0;difficulty<4;difficulty++)for(const players of [1,2]){
  const g=setup(4,difficulty,players);for(const [i,id] of [87,152,88,117,118].entries())spawn(g,id,40+i*75,30);
  for(let frame=0;frame<fps*7;frame++){
   g.update(1/fps);const alpha=g.pendingTime/STEP,scroll=g.previousScroll+(g.scroll-g.previousScroll)*alpha;
   for(const e of g.enemies){assert.equal(e.y-g.scroll,30);assert.equal(e.x,e.originX);close(e.py+(e.y-e.py)*alpha-scroll,30);}
  }
  const positions=g.enemies.map(e=>[e.x,e.y]);g.pause();g.setDifficulty((difficulty+1)%4);g.update(.2);assert.deepEqual(g.enemies.map(e=>[e.x,e.y]),positions);g.resume();g.update(STEP);for(const e of g.enemies)assert.equal(e.y-g.scroll,30);
 }
});

test('LAN terrain and fixtures share a snapshot interpolation interval, including newly seen fixtures',()=>{
 for(const gap of [1,2,3,6]){
  const host=setup(),peer=new Game(222);for(const [i,id] of [87,152,88,117,118].entries())spawn(host,id,40+i*75);
  host.update(STEP);assert.ok(N.apply(peer,N.encode(host),false));const oldScroll=peer.scroll;
  for(let i=0;i<gap;i++)host.update(STEP);spawn(host,117,100,150);assert.ok(N.apply(peer,N.encode(host),true));assert.equal(peer.previousScroll,oldScroll);
  for(const alpha of [0,.25,.5,.75,1])for(const e of peer.enemies){const y=e.py+(e.y-e.py)*alpha,scroll=peer.previousScroll+(peer.scroll-peer.previousScroll)*alpha;close(y-scroll,e.y-peer.scroll);}
 }
});

test('LAN movement correction preserves autonomous turrets and snaps terrain with entities across pause and stage changes',()=>{
 const host=setup(),peer=new Game(222),tank=spawn(host,85);host.update(STEP);assert.ok(N.apply(peer,N.encode(host),false));const oldY=peer.enemies[0].y;
 for(let i=0;i<6;i++)host.update(STEP);tank.y+=20;assert.ok(N.apply(peer,N.encode(host)));assert.equal(peer.enemies[0].py,oldY);
 host.pause();assert.ok(N.apply(peer,N.encode(host)));assert.equal(peer.previousScroll,peer.scroll);assert.equal(peer.enemies[0].py,peer.enemies[0].y);
 host.resume();host.update(STEP);assert.ok(N.apply(peer,N.encode(host)));assert.equal(peer.previousScroll,peer.scroll);
 host.loadStage(2);spawn(host,87);assert.ok(N.apply(peer,N.encode(host)));assert.equal(peer.previousScroll,peer.scroll);assert.equal(peer.enemies[0].py,peer.enemies[0].y);
});
