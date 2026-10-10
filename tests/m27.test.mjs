// 出击、激光和血条回归。 / Launch, laser and health-bar regressions.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/campaign-art.js';import '../web/js/enemy-shots.js';
import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/enemy-art.js';import '../web/js/presentation-art.js';import '../web/js/superweapon-art.js';import '../web/js/original-rules.js';import '../web/js/render-hd.js';
const {Game,STEP,HEALTH_BAR_MIN_HP}=StarfallCore;
function arena(){const g=new Game(1);g.start();g.recordEvents=[];g.player.invincible=999;return g;}
function enemy(g,x,y,hp=10000,boss=false){const e={uid:++g.enemySerial,x,y,px:x,py:y,r:16,hp,maxHp:hp,def:{width:40,height:40,hp:boss?hp/2:hp,flags:boss?1:0,score:200,sprite:'S_ENEMY14',mode:0},record:[0,0,0,0,0,-1],guns:[],speed:0,time:0,boss};g.enemies.push(e);if(boss)g.boss=e;return e;}
test('carrier clears in about 3.7 seconds without advancing battle clocks',()=>{
  for(const cadence of [1/30,1/60,1/120]){const g=new Game(1);g.start(1,1,true);let wall=0;while(g.phase==='launch'){g.update(cadence,{fire:true,x:1});wall+=cadence;}assert.ok(wall>=3.70&&wall<3.8,wall);assert.equal(g.frame,0);assert.equal(g.shotsFired,0);assert.equal(g.scroll,0);assert.equal(g.player.x,200);assert.equal(g.drainEvents().filter(e=>e.type==='mission-start').length,1);}
});
test('blue bomb creates a player-bound beam, never a travelling ring',()=>{
  const g=arena();g.player.bombInventory=[2];g.useBomb();g.update(STEP);const b=g.bullets[0];assert.ok(b.playerBeam);assert.equal(b.vx,0);assert.equal(b.vy,0);assert.equal(b.damage,720);assert.equal(b.endY,0);
  g.player.x=260;g.player.y=300;g.update(STEP);assert.equal(b.x,260);assert.equal(b.y,280);assert.equal(g.bullets.length,1);g.pause();const frozen=JSON.stringify(g);g.update(.25);assert.equal(JSON.stringify(g),frozen);
});
test('laser stops at the nearest visible enemy and preserves one damage budget per pulse',()=>{
  const g=arena(),near=enemy(g,200,260),far=enemy(g,200,100),side=enemy(g,270,230),behind=enemy(g,200,450),offscreen=enemy(g,200,-50);g.player.bombInventory=[2];g.useBomb();g.update(STEP);
  assert.equal(near.hp,9280);assert.equal(g.bullets[0].endY,276);for(let i=0;i<3;i++)g.update(STEP);assert.equal(near.hp,9280);g.update(STEP);assert.equal(near.hp,8560);for(const e of [far,side,behind,offscreen])assert.equal(e.hp,10000);
});
test('full sustained beam can deplete the existing first-boss HP without changing its values',()=>{
  const g=arena(),boss=enemy(g,200,120,16000,true);g.player.bombInventory=[2];g.useBomb();for(let i=0;i<114&&!boss.dead;i++)g.update(STEP);assert.equal(boss.maxHp,16000);assert.equal(boss.hp,0);assert.ok(boss.dead);assert.ok(g.elapsed<4);
});
test('beam expires with its weapon and stage changes clear aura/beam state',()=>{
  const g=arena();g.player.bombInventory=[2];g.useBomb();for(let i=0;i<130;i++)g.update(STEP);assert.equal(g.player.mega,0);assert.equal(g.shotsFired,29);assert.equal(g.bullets.filter(b=>b.playerBeam).length,0);
  g.player.bombInventory=[2];g.useBomb();g.update(STEP);g.defeatBoss();g.nextStage();assert.equal(g.player.mega,0);assert.equal(g.bullets.length,0);
});
test('ordinary bars use maximum HP, not hull size or remaining HP, and exclude bosses',()=>{
  assert.equal(HEALTH_BAR_MIN_HP,905);const r={enemyHealthBars:true},show=e=>StarfallRenderer.prototype.showsEnemyHealth.call(r,{def:{width:120,height:120},entered:true,hp:1,...e});
  assert.equal(show({maxHp:904}),false);assert.equal(show({maxHp:905}),true);assert.equal(show({maxHp:1005}),true);assert.equal(show({maxHp:16000,boss:true}),false);assert.equal(show({maxHp:1005,scenery:true}),false);r.enemyHealthBars=false;assert.equal(show({maxHp:1005}),false);
});
test('tanker maps the redrawn crop to the original 44 by 87 visible footprint',()=>{
  const spec=DemonStarEnemyArt.sprites.S_SPTNKRA;assert.equal(spec.asset,'assets/mission1-hd.png');assert.equal(spec.frames.length,1);assert.equal(spec.frames[0][6],44);assert.equal(spec.frames[0][7],87);assert.ok(spec.frames[0][2]<250);
});
