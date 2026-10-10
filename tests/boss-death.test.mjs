import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';
const {Game,STEP,deathScale}=StarfallCore,C=DemonStarCampaign;
const falling=[3,4,5,6,9,12,13,15,18];
function boss(stage){const g=new Game(51);g.start(1,stage,true);g.phase='playing';g.launch=null;g.recordEvents=[];g.spawnRecord(g.stage.map.events.find(r=>C.definitions[C.byId[r[2]]].flags&1));g.boss.x=130;g.boss.y=120;return g;}
test('all eighteen Bosses follow the original ground/fall flag gate',()=>{
  for(let stage=1;stage<=18;stage++){const g=boss(stage),e=g.boss;g.killEnemy(e);assert.equal(!!e.dying,falling.includes(stage),'stage '+stage);assert.equal(!!e.dead,!falling.includes(stage));assert.equal(g.phase,falling.includes(stage)?'playing':'aftermath');if(!falling.includes(stage)){assert.equal(g.effects[0].x,130);assert.equal(g.effects[0].y,120);}assert.equal(g.score,falling.includes(stage)?0:e.def.score);}
});
test('eligible falling Bosses use original threshold-before-step ordering and one final reward',()=>{
  const g=boss(3),e=g.boss;g.killEnemy(e);for(let i=0;i<38;i++)g.updateEnemyState(e);assert.equal(e.fall,122);assert.equal(e.fallSpeed,4);assert.equal(e.dead,false);assert.equal(g.score,0);g.updateEnemyState(e);assert.equal(e.dead,true);assert.equal(e.deathTicks,39);assert.equal(g.effects[0].x,200+(130-200)*deathScale(122));assert.equal(g.effects[0].y,240+(120-240)*deathScale(122));const score=g.score;g.finishEnemy(e);assert.equal(g.score,score);assert.equal(g.kills,1);
});
test('a paused Boss death does not advance and the projection contracts toward field center',()=>{
  const g=boss(4),e=g.boss;g.killEnemy(e);g.update(STEP);g.pause();const before=JSON.stringify(g);g.update(.2);assert.equal(JSON.stringify(g),before);assert.equal(deathScale(0),1);assert.equal(deathScale(40.75),deathScale(40));assert.ok(deathScale(120)<deathScale(40));assert.ok(deathScale(120)>.62&&deathScale(120)<.63);
});
