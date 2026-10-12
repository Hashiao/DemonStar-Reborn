// 简单难度脉冲预警必须保持战斗时序和联机一致。 / Easy pulse warnings preserve combat timing and network parity.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';
const {Game,Gun,STEP,DIFFICULTIES}=StarfallCore,C=DemonStarCampaign,N=DemonStarNetworkState;
const defs=C.definitions.filter(d=>(d.flags&1)&&d.guns.some(r=>[9,10].includes(r[2])));
function scene(difficulty=0,id=40,players=1){const g=new Game(222);g.start(difficulty,1,false,{playerCount:players});g.recordEvents=[];g.spawnRecord([200,0,id,0,1,-1,0,0]);const e=g.enemies[0];Object.assign(e,{x:200,y:80,px:200,py:80,entered:true,pathFinished:true,exitX:0,exitY:0});for(const p of g.players)p.invincible=999;return {g,e};}

test('all 12 laser bosses predict each real volley without changing gun state, shots, RNG or events',()=>{
 assert.equal(defs.length,12);let cases=0;
 for(const difficulty of [0,1,2,3])for(const d of defs)for(const [index,raw] of d.guns.entries()){
  if(![9,10].includes(raw[2]))continue;
  const {g,e}=scene(difficulty,d.id),gun=new Gun(raw),shots=[];g.addBullet=(...args)=>shots.push(args);let starts=0;
  for(let tick=0;tick<1250;tick++){
   const before=JSON.stringify(gun),rng=g.random.state(),count=shots.length,events=g.events.length,w=gun.laserWarning(e,g,index);
   assert.equal(JSON.stringify(gun),before);assert.equal(g.random.state(),rng);assert.equal(shots.length,count);assert.equal(g.events.length,events);
   if(difficulty!==0)assert.equal(w,null);
   if(w){assert.ok(w.ticks>=1&&w.ticks<=29);const probe=Object.assign(new Gun(raw),gun),out=[],context={...g,rules:DIFFICULTIES[difficulty],enemyFireLock:0,targetPlayer:()=>g.player,addBullet:()=>out.push(n)};let n;
    for(n=1;n<=w.ticks;n++)assert.equal(!!probe.tick(e,context),n===w.ticks);
    assert.equal(out[0],w.ticks);out.length=0;
    for(n=1;n<=w.period;n++)probe.tick(e,context);
    assert.deepEqual(w.pulses,[0,...out.filter(t=>t<w.period)]);
   }
   const fires=gun.tick(e,g);if(fires){starts++;if(difficulty===0)assert.equal(w?.ticks,1);}
  }
  assert.ok(starts>0);cases++;
 }
 assert.equal(cases,132);
});

test('a single warning ends when the volley starts, with harmless preparation and original first-hit damage',()=>{
 const {g,e}=scene();e.guns=e.guns.filter(gun=>gun.raw[2]===9);e.guns[0].delay=29;g.player.x=e.x-e.def.width/2+e.guns[0].raw[0];g.player.invincible=0;
 for(let i=0;i<29;i++){g.update(STEP);assert.equal(g.player.energy,16);assert.equal(g.bullets.length,0);assert.equal(g.laserWarnings.length,1);}
 assert.equal(g.laserWarnings[0].ticks,1);g.update(STEP);assert.equal(g.laserWarnings.length,0);assert.equal(g.player.energy,14);assert.ok(g.bullets.some(b=>b.beam));
 for(let i=0;i<4;i++){g.update(STEP);assert.equal(g.laserWarnings.length,0);}
});

test('pause/difficulty changes preserve the remaining firing time instead of adding another second',()=>{
 const {g,e}=scene(1);e.guns=e.guns.filter(gun=>gun.raw[2]===9);e.guns[0].delay=8;g.update(STEP);g.pause();const state=JSON.stringify(e.guns);
 assert.ok(g.setDifficulty(0));assert.equal(g.laserWarnings[0].ticks,8);const warning=JSON.stringify(g.laserWarnings);for(let i=0;i<30;i++)g.update(.1);assert.equal(JSON.stringify(g.laserWarnings),warning);assert.equal(JSON.stringify(e.guns),state);
 g.setDifficulty(2);assert.deepEqual(g.laserWarnings,[]);g.setDifficulty(0);g.resume();for(let i=0;i<7;i++){g.update(STEP);assert.ok(!g.bullets.length);}g.update(STEP);assert.ok(g.bullets.some(b=>b.beam));assert.equal(g.laserWarnings.length,0);
});

test('bomb suppression, dead emitters and stage/load transitions leave no stale warning',()=>{
 const {g,e}=scene();e.guns=e.guns.filter(gun=>gun.raw[2]===9);e.guns[0].delay=12;g.update(STEP);assert.equal(g.laserWarnings.length,1);
 g.enemyFireLock=40;g.update(STEP);assert.equal(g.laserWarnings.length,0);for(let i=0;i<30;i++)g.update(STEP);assert.equal(g.bullets.length,0);
 e.guns=[new Gun(e.def.guns.find(r=>r[2]===9))];e.guns[0].delay=10;g.enemyFireLock=0;g.update(STEP);assert.ok(g.laserWarnings.length);g.killEnemy(e);g.update(STEP);assert.equal(g.laserWarnings.length,0);
 const save=g.checkpoint();g.loadCheckpoint(save);assert.deepEqual(g.laserWarnings,[]);g.loadStage(2);assert.deepEqual(g.laserWarnings,[]);
});

test('ordinary laser enemies do not get Boss assistance',()=>{
 for(const id of [22,313]){const {g,e}=scene(0,id);for(const gun of e.guns)gun.delay=10;g.update(STEP);assert.deepEqual(g.laserWarnings,[]);}
});

test('host snapshots carry multi-muzzle warnings and difficulty changes to both players without client prediction',()=>{
 const {g,e}=scene(0,239,2);e.guns=e.guns.filter(gun=>[9,10].includes(gun.raw[2]));for(const [i,gun] of e.guns.entries())gun.delay=10+i;g.update(STEP);assert.equal(g.laserWarnings.length,6);
 const client=new Game(223);assert.ok(N.apply(client,N.encode(g),false));assert.deepEqual(client.laserWarnings,g.laserWarnings);assert.equal(client.boss.guns.length,0);
 const before=JSON.stringify(client);for(const mutate of [s=>s.laserWarnings[0].ticks=0,s=>s.laserWarnings[0].owner=-1,s=>s.laserWarnings[0].pulses=[0,NaN],s=>s.laserWarnings[0].period=0,s=>delete s.laserWarnings]){const bad=N.encode(g);mutate(bad);assert.equal(N.apply(client,bad),false);assert.equal(JSON.stringify(client),before);}
 g.pause();g.setDifficulty(1);assert.ok(N.apply(client,N.encode(g)));assert.deepEqual(client.laserWarnings,[]);
});
