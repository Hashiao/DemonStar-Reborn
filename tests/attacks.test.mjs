import '../web/js/enemy-art.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/campaign.js';
import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';
import '../web/js/original-rules.js';
const C=DemonStarCampaign,{Game,Gun,STEP}=StarfallCore;
const create=()=>{const g=new Game(23);g.start();g.recordEvents=[];g.player.invincible=999;return g;};
const spawn=(g,id,x=200)=>{g.spawnRecord([x,0,id,0,1,-1,0,0]);return g.enemies.at(-1);};

test('all aimed path exits lock once and never steer after the player moves',()=>{
  const defs=C.definitions.filter(d=>(d.mode===9||d.mode===10)&&(d.pathFlags&1)&&!(d.pathFlags&4));
  assert.ok(defs.some(d=>d.id===76));assert.ok(defs.some(d=>d.id===356));
  for(const d of defs){
    const g=create(),e=spawn(g,d.id);e.x=160;e.y=80;g.player.x=280;g.player.y=420;g.finishPath(e);
    const dx=e.exitX,dy=e.exitY;assert.ok(dx>0&&dy>0);
    for(let i=0;i<50;i++){g.player.x=i%2?16:384;g.player.y=i%2?64:440;const x=e.x,y=e.y;g.moveEnemy(e,STEP);assert.ok(Math.abs(e.x-x-dx*e.speed)<1e-9);assert.ok(Math.abs(e.y-y-dy*e.speed)<1e-9);}
  }
});

test('meteor locks at the final waypoint, not before its entry path',()=>{
  const g=create(),e=spawn(g,76);g.player.x=320;
  for(let i=0;i<150&&!e.pathFinished;i++){assert.equal(e.exitX,undefined);g.moveEnemy(e,STEP);}
  assert.ok(e.pathFinished);assert.ok(e.exitX>0);const heading=e.exitX;g.player.x=0;g.moveEnemy(e,STEP);assert.equal(e.exitX,heading);
});

test('spinner enters slowly then accelerates by one per tick from 2 to 12',()=>{
  const g=create(),e=spawn(g,30);assert.equal(e.speed,2);
  for(let i=0;i<200&&e.pathIndex===1;i++){g.moveEnemy(e,STEP);assert.equal(e.speed,2);}
  assert.equal(e.pathIndex,2);const speeds=[];
  for(let i=0;i<10;i++){g.moveEnemy(e,STEP);speeds.push(e.speed);}
  assert.deepEqual(speeds,[3,4,5,6,7,8,9,10,11,12]);assert.equal(e.def.hp,200);
});

test('spinner plays six rotor poses on logic ticks and pause freezes the pose',()=>{
  const g=create(),e=spawn(g,30),poses=[];for(let i=0;i<6;i++){g.update(STEP);poses.push(e.animationFrame);}
  assert.deepEqual(poses,[1,2,3,4,5,0]);g.pause();g.update(.25);assert.equal(e.animationFrame,0);
});

test('path without an exit flag despawns without kill score or drops',()=>{
  const g=create(),e=spawn(g,30);g.finishPath(e);assert.ok(e.dead);assert.equal(g.kills,0);assert.equal(g.score,0);assert.equal(g.pickups.length,0);
});

test('first Boss keeps original star, twin missile and finite three laser volleys',()=>{
  const d=C.definitions[C.byId[40]],shots=[];let tick=0;
  const g={rules:{fire:1},enemyFireLock:0,player:{x:200,y:400},addBullet:(x,y,vx,vy,friendly,damage,style,extra)=>shots.push({tick,...extra,damage})};
  const guns=d.guns.map(r=>new Gun(r)),e={uid:1,x:200,y:64,r:35,def:d};
  for(tick=1;tick<=1800;tick++)for(const gun of guns)gun.tick(e,g);
  assert.equal(shots[0].shotType,11);assert.equal(shots[0].tick,225);
  assert.equal(shots.filter(s=>s.shotType===8).length,16);
  const beams=shots.filter(s=>s.shotType===9);assert.deepEqual(beams.map(s=>s.tick),[621,622,623,624,625,786,787,788,789,790,951,952,953,954,955]);
  assert.ok(beams.every(s=>s.beam&&s.damage===4));assert.equal(d.hp,8000);
  assert.ok(shots.some(s=>s.shotType===11&&s.tick>955),'star attacks continue after lasers end');
});

test('blue laser stays on moving muzzle, covers the column, and expires',()=>{
  const g=create(),e=spawn(g,40);e.x=200;e.y=64;e.entered=true;e.pathFinished=true;e.exitX=0;e.exitY=0;e.guns=[];
  const raw=e.def.guns[2].slice();raw[4]=0;const gun=new Gun(raw);gun.tick(e,g);
  const b=g.bullets[0];assert.ok(b.beam);e.x=230;g.player.x=229;g.player.y=400;g.player.invincible=0;
  g.update(STEP);assert.equal(g.player.energy,12);assert.equal(b.x,229);assert.ok(!b.dead);assert.ok(b.y<110);
  g.update(STEP);g.update(STEP);g.update(STEP);assert.ok(!g.bullets.includes(b));
});

test('laser cannot damage outside its column or remain after emitter dies',()=>{
  const g=create(),e=spawn(g,40);e.x=200;e.y=64;e.guns=[];e.pathFinished=true;e.exitY=0;e.exitX=0;
  const raw=e.def.guns[2].slice();raw[4]=0;new Gun(raw).tick(e,g);g.player.x=260;g.player.invincible=0;g.update(STEP);assert.equal(g.player.energy,16);
  e.dying=true;e.fall=0;e.fallSpeed=.25;e.deathTicks=0;g.player.x=199;g.update(STEP);assert.equal(g.player.energy,16);assert.ok(g.bullets.every(b=>!b.beam));
});
