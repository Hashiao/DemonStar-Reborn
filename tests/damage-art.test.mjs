import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/campaign.js';
import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';
import '../web/js/enemy-art.js';
import '../web/js/original-rules.js';
const {Game,Gun,STEP}=StarfallCore,C=DemonStarCampaign,A=DemonStarEnemyArt;
const arena=(difficulty=1)=>{const g=new Game(24);g.start(difficulty);g.recordEvents=[];g.player.invincible=0;return g;};
const spawn=(g,id)=>{g.spawnRecord([200,0,id,0,1,-1,0,0]);return g.enemies.at(-1);};

test('actual hits use distinct original projectile values in all four difficulties',()=>{
  const expected={1:[1,2,3,4],40:[3,6,7,8],8:[4,8,9,10],11:[6,12,13,14],9:[2,4,5,6],10:[8,16,17,18]};
  for(const [type,values] of Object.entries(expected))for(let difficulty=0;difficulty<4;difficulty++){
    const g=arena(difficulty);g.player.energy=40;g.addBullet(g.player.x,g.player.y,0,0,false,DemonStarPlayerRules.damage[type],0,{shotType:Number(type)});g.update(STEP);
    assert.equal(g.player.energy,40-values[difficulty],`type ${type}, difficulty ${difficulty}`);assert.equal(g.player.invincible,0);assert.equal(g.bullets.length,0);
  }
});

test('enemy gun constructor uses its original template rather than 1/2 damage buckets',()=>{
  for(const type of [0,1,2,3,4,5,6,7,8,9,10,11,12,40,41,42,43,44]){
    const g=arena(),e=spawn(g,47);e.x=200;e.y=80;
    new Gun([17,20,type,0,0,0,30,1,1024,0,0,0,7,0,0,0,1,0]).tick(e,g);
    assert.equal(g.bullets[0].damage,DemonStarPlayerRules.damage[type]);
  }
});

test('two bullets on the same tick both hurt without adding invincibility',()=>{
  for(let d=0;d<4;d++){
    const g=arena(d);for(let n=0;n<2;n++)g.addBullet(g.player.x,g.player.y,0,0,false,2);
    g.update(STEP);assert.equal(g.player.energy,[14,12,10,8][d]);assert.equal(g.player.invincible,0);
    g.addBullet(g.player.x,g.player.y,0,0,false,2);g.update(STEP);assert.equal(g.player.energy,[13,10,7,4][d]);
  }
});

test('all collision size brackets bypass the projectile difficulty formula',()=>{
  for(let d=0;d<4;d++)for(const [id,loss] of [[71,4],[70,12],[61,16]]){
    const g=arena(d),e=spawn(g,id);g.player.energy=40;const hp=e.hp;
    assert.ok(g.collideEnemy(e));assert.equal(g.player.energy,40-loss);assert.equal(e.hp,hp-305);assert.equal(g.player.invincible,0);
  }
});

test('circled 34-pixel enemy destroys an unprotected full-energy life and itself',()=>{
  for(let d=0;d<4;d++){
    const g=arena(d),e=spawn(g,47);g.collideEnemy(e);
    assert.equal(g.player.lives,3);assert.equal(g.player.energy,16);assert.equal(g.player.invincible,135*STEP);assert.ok(e.dead);assert.equal(g.kills,1);
  }
});

test('shield absorbs player collision damage but enemy loses 305; respawn blocks contact',()=>{
  const g=arena(),e=spawn(g,61);g.player.shield=1;g.collideEnemy(e);assert.equal(g.player.energy,16);assert.equal(e.hp,895);
  g.player.shield=0;g.player.invincible=1;assert.equal(g.collideEnemy(e),false);assert.equal(e.hp,895);
  g.player.invincible=0;g.player.respawn=1;assert.equal(g.collideEnemy(e),false);assert.equal(e.hp,895);
});

test('death protection survives subsequent hits and ordinary hits do not erase it',()=>{
  const g=arena();g.player.energy=1;g.hitPlayer(2);const state=[g.player.lives,g.player.energy,g.player.invincible,g.player.respawn];
  for(let n=0;n<5;n++)assert.equal(g.hitPlayer(100),false);
  assert.deepEqual([g.player.lives,g.player.energy,g.player.invincible,g.player.respawn],state);
});

test('all three colors drop 6 to 5 only when a surviving hit leaves 1-3 energy',()=>{
  for(let d=0;d<4;d++)for(const weapon of [0,1,2])for(const remaining of [1,2,3,4]){
    const g=arena(d);Object.assign(g.player,{weapon,power:6,defaultWeapon:false,energy:remaining+[1,2,3,4][d]});g.hitPlayer(2);
    assert.equal(g.player.energy,remaining);assert.equal(g.player.power,remaining<4?5:6);assert.equal(g.player.defaultWeapon,false);assert.equal(g.player.invincible,0);
  }
});

test('further nonfatal critical hits downgrade again, never below tier one',()=>{
  const g=arena();Object.assign(g.player,{weapon:2,power:6,defaultWeapon:false,energy:4});g.hitPlayer(1);assert.equal(g.player.power,5);g.hitPlayer(1);assert.equal(g.player.power,4);g.hitPlayer(1);assert.equal(g.player.power,3);
  g.player.power=1;g.player.energy=2;g.hitPlayer(1);assert.equal(g.player.power,1);assert.equal(g.player.defaultWeapon,false);
});

test('lethal hit uses death drops and weapon reset instead of critical downgrade',()=>{
  const g=arena();Object.assign(g.player,{weapon:1,power:6,defaultWeapon:false,energy:2});g.hitPlayer(2);
  assert.equal(g.player.lives,3);assert.equal(g.player.power,0);assert.ok(g.player.defaultWeapon);assert.equal(g.pickups.filter(p=>p.id===3).length,2);
});

test('correct fighter has six frames while its opening nonanimated definition stays still',()=>{
  const g=arena(),fixed=spawn(g,0),animated=spawn(g,47);
  assert.equal(A.sprites.S_ENEMY1A.frames.length,6);
  for(let i=0;i<61;i++)g.updateEnemyState(animated);assert.equal(animated.animation.frame,0);
  g.updateEnemyState(animated);assert.equal(animated.animation.frame,1);
  const seen=new Set();for(let i=0;i<350;i++){g.updateEnemyState(fixed);g.updateEnemyState(animated);seen.add(animated.animation.frame);}
  assert.equal(fixed.animation.frame,0);assert.equal(seen.size,6);assert.equal(animated.animation.cycles,0);assert.equal(animated.animation.frame,5);
});

test('big rock uses all 24 tumbling poses and retains original visible proportions',()=>{
  const g=arena(),e=spawn(g,61),frames=A.sprites.S_ASTER1A.frames;
  assert.equal(frames.length,24);assert.deepEqual(frames[0].slice(6),[31,49]);assert.deepEqual(frames[6].slice(6),[31,32]);
  for(let n=0;n<7;n++)g.updateEnemyState(e);assert.equal(e.animation.frame,0);
  const seen=new Set();for(let n=0;n<48;n++){g.updateEnemyState(e);seen.add(e.animation.frame);}
  assert.equal(seen.size,24);assert.equal(e.animation.cycles,999);g.pause();const state=JSON.stringify(e.animation);g.update(.25);assert.equal(JSON.stringify(e.animation),state);
});

test('net turret has 32 dedicated directions and remains fixed relative to background scroll',()=>{
  const g=arena(),e=spawn(g,115);assert.equal(A.sprites.S_ASTSHT1B.frames.length,32);assert.ok(A.sprites.S_ASTSHT1B.directional);
  e.x=e.px=200;e.y=e.py=100;g.player.x=350;const y=e.y,scroll=g.scroll;
  for(let n=0;n<20;n++)g.update(STEP);assert.equal(e.x,200);assert.equal(e.y-y,g.scroll-scroll);assert.ok(e.facing>=0&&e.facing<32);
});
