import test from 'node:test';
import assert from 'node:assert/strict';
await import('../web/js/campaign.js');
await import('../web/js/original-rules.js');
const {Game,Gun,STAGES,intersects}=globalThis.StarfallCore;
const campaign=globalThis.DemonStarCampaign;

test('18 original maps retain all 8368 placements and 387 definitions',()=>{
  assert.equal(STAGES.length,18);assert.equal(campaign.definitions.length,387);
  assert.equal(campaign.levels.reduce((n,s)=>n+s.events.length,0),8368);
  for(const stage of campaign.levels){assert.ok(stage.events.length>200);for(const e of stage.events){assert.ok(campaign.definitions[campaign.byId[e[2]]]);assert.ok(Number.isInteger(e[0])&&Number.isInteger(e[1]));}}
});
test('reference HP, score, path and gun values remain unscaled in data',()=>{
  const scout=campaign.definitions[1],boss=campaign.definitions[194];
  assert.equal(scout.hp,250);assert.equal(scout.speed,3);assert.equal(scout.score,250);assert.equal(scout.guns[0][4],72);
  assert.equal(boss.hp,8000);assert.deepEqual(boss.path,[[0,80],[32,0],[-64,0]]);
});
test('pause freezes score, position, spawning and timers',()=>{
  const g=new Game(17);g.start();g.update(1/60);g.pause();const state=JSON.stringify(g);for(let i=0;i<180;i++)g.update(1/60,{x:1});assert.equal(JSON.stringify(g),state);assert.ok(g.resume());g.update(1/60,{x:1});assert.ok(g.player.x>200);
});
test('gun honors initial delay, fixed angle and finite cycle count',()=>{
  const raw=[8,18,1,0,3,0,7,1,1024,0,0,0,7,0,0,0,2,0],gun=new Gun(raw),shots=[];
  const game={rules:{fire:1},player:{x:200,y:400},addBullet:(...a)=>shots.push(a)};
  const e={x:200,y:100,r:15,def:{width:32,height:32}};
  for(let i=0;i<3;i++)gun.tick(e,game);assert.equal(shots.length,0);
  for(let i=0;i<50;i++)gun.tick(e,game);assert.equal(shots.length,2);assert.ok(Math.abs(shots[0][2])<.0001);assert.equal(shots[0][3],420);
});
test('swept hit detects fast bullets crossing a small target',()=>{assert.ok(intersects(0,0,0,100,0,45,3));assert.ok(!intersects(0,0,0,100,8,45,3));});
test('bomb clears hostile fire and consumes exactly one bomb',()=>{
  const g=new Game(1);g.start();g.addBullet(100,100,0,60,false);g.addBullet(110,110,0,-60,true);assert.ok(g.useBomb());assert.equal(g.player.bombs,2);assert.ok(g.bullets.every(b=>b.friendly));g.pause();assert.equal(g.useBomb(),false);assert.equal(g.player.bombs,2);
});
test('weapon switching resets power, matching upgrades cap at six',()=>{
  const g=new Game(1);g.start();g.player.power=5;g.collect({type:'ion',time:0});assert.equal(g.player.weapon,1);assert.equal(g.player.power,1);for(let i=0;i<10;i++)g.collect({type:'ion',time:0});assert.equal(g.player.power,6);assert.ok(g.bullets.length>0);
});
test('armor loss, spare lives, invulnerability and game over',()=>{
  const g=new Game(1);g.start();g.player.invincible=0;g.hitPlayer(2);assert.equal(g.player.energy,8);g.hitPlayer(2);assert.equal(g.player.energy,8);g.player.invincible=0;g.hitPlayer(100);assert.equal(g.player.lives,2);assert.equal(g.player.energy,10);g.player.lives=1;g.player.invincible=0;g.hitPlayer(100);assert.equal(g.phase,'gameover');
});
test('deterministic campaign simulation reaches each original boss without NaNs',()=>{
  for(let stage=1;stage<=18;stage++){
    const g=new Game(234);g.start(1,stage);let ticks=0;
    while(!g.bossSpawned&&ticks<8000){g.player.invincible=100;g.player.fire=100;g.update(1/60);ticks++;}
    assert.ok(g.bossSpawned,`stage ${stage} never spawned boss`);assert.ok(g.boss,`stage ${stage} boss missing`);
    for(let i=0;i<900;i++){g.player.invincible=100;g.player.fire=100;g.update(1/60);for(const e of g.enemies){assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));}}
    assert.ok(g.boss.y>-100&&g.boss.y<480,`stage ${stage} boss left field: ${g.boss.y}`);
    assert.ok(g.bullets.length<1802);g.boss.hp=0;g.killEnemy(g.boss);assert.equal(g.phase,stage===18?'victory':'cleared');
    if(stage<18){assert.ok(g.nextStage());assert.equal(g.stage.id,stage+1);}else assert.equal(g.nextStage(),false);
  }
});
