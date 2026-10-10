import '../web/js/enemy-art.js';
import test from 'node:test';
import assert from 'node:assert/strict';
await import('../web/js/campaign.js');await import('../web/js/player-rules.js');await import('../web/js/projectile-rules.js');await import('../web/js/weapon-art.js');await import('../web/js/combat-visuals.js');await import('../web/js/original-rules.js');await import('../web/js/music-bank.js');
const {Game,STEP,Gun}=StarfallCore,C=DemonStarCampaign;
function arena(){const g=new Game(5);g.start();g.recordEvents=[];g.player.invincible=999;return g;}
function enemy(g,x,y,hp=10000){const d={width:40,height:40,hp,flags:0,score:10,sprite:'S_ENEMY14',mode:0};const e={uid:++g.enemySerial,x,y,px:x,py:y,r:16,hp,maxHp:hp,def:d,record:[0,0,0,0,0,-1],guns:[],speed:0,time:0};g.enemies.push(e);return e;}
test('offscreen enemies cannot take normal, nova, pulse or bomb damage',()=>{
  for(const extra of [{},{nova:0,hitEnemies:[]},{pulse:true,shotType:61,hitEnemies:[]}]){
    const g=arena(),e=enemy(g,200,-60);g.addBullet(200,-45,0,-400,true,500,0,extra);g.update(STEP);assert.equal(e.hp,10000);
    e.y=100;g.addBullet(200,115,0,-400,true,500,0,extra);g.update(STEP);assert.equal(e.hp,9500);
    e.y=-60;g.addBullet(200,-45,0,-400,true,500);g.update(STEP);assert.equal(e.hp,9500);
  }
  const g=arena(),e=enemy(g,200,-35);g.player.y=64;g.useBomb();for(let i=0;i<12;i++)g.update(STEP);assert.equal(e.hp,10000);
});
test('homing selection ignores enemies which have not entered the battlefield',()=>{
  const g=arena();enemy(g,300,-30);g.addBullet(200,100,0,-100,true,1,0,{homing:true});g.update(STEP);assert.equal(g.bullets[0].vx,0);
  enemy(g,280,100);g.update(STEP);assert.ok(g.bullets[0].vx>0);
});
test('forward bomb detonates locally then suppresses all enemy guns for 30 ticks',()=>{
  const g=arena();g.player.y=300;const near=enemy(g,200,202),far=enemy(g,20,30);g.useBomb();assert.equal(near.hp,10000);
  for(let i=0;i<11;i++)g.update(STEP);assert.equal(near.hp,5500);assert.equal(far.hp,10000);assert.equal(g.enemyFireLock,30);
  const raw=[0,0,1,0,0,0,1,99,1024,0,0,0,7,9999,0,0,99,0],gun=new Gun(raw);near.guns=[gun];g.bullets=[];
  for(let i=0;i<29;i++)g.update(STEP);assert.equal(g.bullets.filter(b=>!b.friendly).length,0);
  g.update(STEP);assert.ok(g.bullets.some(b=>!b.friendly));
});
test('scatter bomb deploys 32 moving charges and preserves the old damage cap',()=>{
  const g=arena();g.player.bombInventory=[1];g.player.y=280;const e=enemy(g,200,190);g.useBomb();assert.equal(g.specials.length,32);
  for(let i=0;i<32;i++)g.update(STEP);assert.ok(g.specials.every(s=>s.exploded));assert.ok(e.hp===10000||e.hp===7600);
  assert.ok(new Set(g.specials.map(s=>Math.round(s.x))).size>10);
});
test('super pulse fires without holding A and freezes the previous damage/duration profile',()=>{
  const g=arena();g.player.bombInventory=[2];g.useBomb();assert.equal(g.player.mega,4);g.update(STEP);assert.equal(g.bullets.length,1);assert.equal(g.bullets[0].damage,720);assert.equal(g.bullets[0].shotType,61);
  for(let i=0;i<130;i++)g.update(STEP);assert.equal(g.player.mega,0);assert.equal(g.shotsFired,29);
});
test('tracking hulls keep turning after the last shot; nontracking hulls retain heading',()=>{
  const g=arena(),e=enemy(g,200,120);e.def.flags=0x400;e.facing=16;g.player.x=350;g.player.y=120;
  for(let i=0;i<8;i++)g.update(STEP);assert.equal(e.facing,8);assert.equal(g.bullets.length,0);
  g.player.x=50;for(let i=0;i<16;i++)g.update(STEP);assert.equal(e.facing,24);
  e.def.flags=0;g.player.x=350;g.update(STEP);assert.equal(e.facing,24);
});
test('low-health visuals use original base-HP thresholds without passive HP loss',()=>{
  const g=arena(),e=enemy(g,200,100,1600);e.boss=true;e.hp=399;g.update(STEP);assert.ok(e.critical);assert.ok(!e.burning);
  e.hp=99;for(let i=0;i<30;i++)g.update(STEP);assert.ok(e.burning);assert.equal(e.hp,99);
});
test('Boss arrival radio waits 60 ticks, destruction animates before score and stage completion',()=>{
  const g=arena();g.spawnRecord(g.stage.map.events.find(r=>C.definitions[C.byId[r[2]]].flags&1));g.drainEvents();
  for(let i=0;i<59;i++)g.update(STEP);assert.ok(!g.drainEvents().some(e=>e.type==='boss-radio'));g.update(STEP);assert.equal(g.drainEvents().filter(e=>e.type==='boss-radio').length,1);
  const b=g.boss;b.hp=0;g.killEnemy(b);assert.equal(g.phase,'playing');assert.equal(g.score,0);assert.ok(b.dying);
  g.pause();const fall=b.fall;g.update(1);assert.equal(b.fall,fall);g.resume();for(let i=0;i<50;i++)g.update(STEP);
  assert.equal(g.phase,'cleared');assert.equal(g.score,b.def.score+3000);g.killEnemy(b);assert.equal(g.score,b.def.score+3000);
});
test('red six-tier width and blue three-tier length come from distinct original sprites',()=>{
  assert.deepEqual([29,30,31,48,49,50].map(t=>DemonStarCombatVisuals.shot(t).width),[1,3,5,9,11,13]);
  assert.deepEqual([26,27,28].map(t=>DemonStarCombatVisuals.shot(t).height),[8,12,16]);
});
test('all 18 stage music selections match the original jump table, including repeated tracks',()=>{
  assert.deepEqual(DemonStarMusic.stages,['PHASER','SLOWRKET','8GALS','PHATTY','BLIP','ENDLEV','SMACK','SPACTOUT','SLOWRKET','SIMP','8GALS','ASTEROID','BLIP','PACE','SPACEBL','DAVIS_C','WARP','NO_GOOD'].map(n=>'MDS_'+n));
  assert.equal(DemonStarMusic.tracks.MDS_LOSE,DemonStarMusic.tracks.MDS_WIN);
});
