import '../web/js/enemy-art.js';
import test from 'node:test';
import assert from 'node:assert/strict';
await import('../web/js/campaign.js');
await import('../web/js/player-rules.js');await import('../web/js/projectile-rules.js');await import('../web/js/weapon-art.js');
await import('../web/js/original-rules.js');
const {Game,Gun,STAGES,STEP,TICK,PLAYER_STEP_X,PLAYER_STEP_Y,DROPS,DROP_NEXT,intersects}=globalThis.StarfallCore;
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
  const g=new Game(17);g.start();g.update(1/60);g.pause();const state=JSON.stringify(g);for(let i=0;i<180;i++)g.update(1/60,{x:1});assert.equal(JSON.stringify(g),state);assert.ok(g.resume());g.update(STEP,{x:1});assert.ok(g.player.x>200);
});
test('gun honors initial delay, fixed angle and finite cycle count',()=>{
  const raw=[8,18,1,0,3,0,7,1,1024,0,0,0,7,0,0,0,2,0],gun=new Gun(raw),shots=[];
  const game={enemyFireLock:0,rules:{fire:1},player:{x:200,y:400},addBullet:(...a)=>shots.push(a)};
  const e={x:200,y:100,r:15,def:{width:32,height:32}};
  for(let i=0;i<3;i++)gun.tick(e,game);assert.equal(shots.length,0);
  for(let i=0;i<50;i++)gun.tick(e,game);assert.equal(shots.length,2);assert.ok(Math.abs(shots[0][2])<.0001);assert.equal(shots[0][3],7*TICK);
});
test('swept hit detects fast bullets crossing a small target',()=>{assert.ok(intersects(0,0,0,100,0,45,3));assert.ok(!intersects(0,0,0,100,8,45,3));});
test('bomb clears hostile fire and consumes exactly one bomb',()=>{
  const g=new Game(1);g.start();g.addBullet(100,100,0,60,false);g.addBullet(110,110,0,-60,true);assert.ok(g.useBomb());assert.equal(g.player.bombs,2);for(let i=0;i<11;i++)g.update(STEP);assert.ok(g.bullets.every(b=>b.friendly));g.pause();assert.equal(g.useBomb(),false);assert.equal(g.player.bombs,2);
});
test('weapon switching resets power, matching upgrades cap at six',()=>{
  const g=new Game(1);g.start();g.player.power=5;g.collect({type:'ion',time:0});assert.equal(g.player.weapon,1);assert.equal(g.player.power,1);for(let i=0;i<10;i++)g.collect({type:'ion',time:0});assert.equal(g.player.power,6);assert.ok(g.bullets.length>0);
});
test('armor loss, spare lives, invulnerability and game over',()=>{
  const g=new Game(1);g.start();g.player.invincible=0;g.hitPlayer(2);assert.equal(g.player.energy,14);g.hitPlayer(2);assert.equal(g.player.energy,12);g.player.invincible=0;g.hitPlayer(100);assert.equal(g.player.lives,3);assert.equal(g.player.energy,16);g.player.lives=1;g.player.invincible=0;g.player.respawn=0;g.hitPlayer(100);assert.equal(g.phase,'gameover');
});
test('deterministic campaign simulation reaches each original boss without NaNs',()=>{
  for(let stage=1;stage<=18;stage++){
    const g=new Game(234);g.start(1,stage);let ticks=0;
    while(!g.bossSpawned&&ticks<24000){g.player.invincible=100;g.player.fire=100;g.update(1/60);ticks++;}
    assert.ok(g.bossSpawned,`stage ${stage} never spawned boss`);assert.ok(g.boss,`stage ${stage} boss missing`);
    for(let i=0;i<900;i++){g.player.invincible=100;g.player.fire=100;g.update(1/60);for(const e of g.enemies){assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y));}}
    assert.ok(g.boss.y>-100&&g.boss.y<480,`stage ${stage} boss left field: ${g.boss.y}`);
    assert.ok(g.bullets.length<1802);const falls=(g.boss.def.flags&0xc0)===0x80;g.boss.hp=0;g.killEnemy(g.boss);if(falls)assert.equal(g.phase,'playing');for(let t=0;t<60&&g.phase==='playing';t++)g.update(STEP);assert.equal(g.phase,stage===18?'victory':'cleared');
    if(stage<18){assert.ok(g.nextStage());assert.equal(g.stage.id,stage+1);}else assert.equal(g.nextStage(),false);
  }
});

test('original initial inventory and paired default muzzles; firing requires A',()=>{
  const g=new Game(1);g.start();g.recordEvents=[];
  assert.equal(g.player.lives,4);assert.equal(g.player.energy,16);assert.deepEqual(g.player.bombInventory,[0,0,0]);
  g.update(STEP);assert.equal(g.shotsFired,0);
  g.update(STEP,{fire:true});assert.equal(g.shotsFired,2);
  assert.deepEqual(g.bullets.map(b=>b.x),[192,206]);assert.ok(g.bullets.every(b=>b.defaultShot&&b.vx===0));
  for(let i=0;i<10;i++)g.update(STEP);assert.equal(g.shotsFired,2);
});

test('all original drop IDs, crystal healing, no invented extra-life drop',()=>{
  const expected=['medal','energy','weapon','ion','plasma','bomb','scatter','shield','missile','homing','full','crystal','side','rear','magnetic','mega'];
  const g=new Game(2);g.start();for(let id=0;id<16;id++)g.spawnPickup(id,100,100);
  assert.deepEqual(g.pickups.map(p=>p.type),expected);g.spawnPickup(-1,100,100);g.spawnPickup(16,100,100);assert.equal(g.pickups.length,16);
  g.player.energy=13;g.collect({type:'crystal'});assert.equal(g.player.energy,15);g.collect({type:'crystal'});assert.equal(g.player.energy,16);
  g.collect({type:'mega'});assert.equal(g.player.lives,4);assert.equal(g.player.bombInventory.at(-1),2);
});

test('mixed bomb inventory has capacity six and consumes newest first',()=>{
  const g=new Game(1);g.start();g.collect({type:'scatter'});g.collect({type:'mega'});g.collect({type:'bomb'});g.collect({type:'scatter'});
  assert.deepEqual(g.player.bombInventory,[0,0,0,1,2,0]);g.drainEvents();
  g.recordEvents=[];for(let i=0;i<6;i++){assert.ok(g.useBomb());assert.equal(g.useBomb(),false);for(let t=0;t<35;t++)g.update(STEP);}assert.equal(g.useBomb(),false);
  assert.deepEqual(g.drainEvents().filter(e=>e.type==='bomb').map(e=>e.bombType),[0,2,1,0,0,0]);
});

test('pickup cycles use original first delay and 110-tick subsequent delay',()=>{
  const g=new Game(1);g.start();g.spawnPickup(2,200,200);const item=g.pickups[0];
  for(let i=0;i<180;i++)g.updatePickup(item);assert.equal(item.id,2);
  g.updatePickup(item);assert.equal(item.id,3);assert.equal(item.type,'ion');
  for(let i=0;i<111;i++)g.updatePickup(item);assert.equal(item.id,4);
  for(const id of [0,1,7,10,11])assert.equal(DROP_NEXT[id],-1);
});

test('35 ms simulation is independent of render cadence and caps joystick speed',()=>{
  const simulate=rate=>{const g=new Game(33);g.start();g.recordEvents=[];for(let i=0;i<rate*2;i++)g.update(1/rate,{x:.2,y:-.2,fire:true});return g;};
  const a=simulate(60),b=simulate(120);assert.equal(a.frame,b.frame);assert.equal(a.shotsFired,b.shotsFired);assert.equal(a.scroll,b.scroll);assert.equal(a.player.x,b.player.x);assert.equal(a.player.y,b.player.y);
  const g=new Game(1);g.start();g.recordEvents=[];const x=g.player.x,y=g.player.y;g.update(STEP,{x:1000,y:-1000});assert.ok(Math.abs(g.player.x-x-PLAYER_STEP_X)<1e-9);assert.ok(Math.abs(y-g.player.y-PLAYER_STEP_Y)<1e-9);
  assert.equal(g.scroll,1);assert.equal(g.frame,1);
  const e={x:100,y:0,speed:3,def:{mode:0}};g.moveEnemy(e,STEP);assert.equal(e.y,3);
});

test('opening square supply ships drop weapons even with map drop -1',()=>{
  const g=new Game(5);g.start(1,1);const records=g.recordEvents.filter(r=>campaign.definitions[campaign.byId[r[2]]].sprite==='S_ENEMY14').slice(0,2);
  assert.equal(records.length,2);for(const r of records){assert.equal(r[5],-1);g.spawnRecord(r);const e=g.enemies.at(-1);e.y=100;g.killEnemy(e);g.killEnemy(e);}
  assert.deepEqual(g.pickups.map(p=>p.id),[2,3]);assert.equal(g.kills,2);
});

test('automatic supply drops honor difficulty, low energy and campaign sequence',()=>{
  const g=new Game(5);g.start(1,1);g.player.bombInventory=[];g.player.energy=3;g.automaticDrops({x:100,y:100});
  assert.deepEqual(g.pickups.map(p=>p.id),[5,1,2]);g.player.energy=9;g.automaticDrops({x:120,y:100});assert.deepEqual(g.pickups.slice(3).map(p=>p.id),[6,11,3]);
  g.player.energy=16;g.player.bombInventory=[0,0,0];g.pickups=[];g.automaticDrops({x:100,y:100});g.automaticDrops({x:100,y:100});assert.deepEqual(g.pickups.map(p=>p.id),[4,2]);
});

test('nonfatal enemy hit emits impact audio separately from player damage and death',()=>{
  const g=new Game(9);g.start();g.recordEvents=[];g.player.invincible=100;g.drainEvents();
  g.spawnRecord(g.stage.map.events.find(r=>campaign.definitions[campaign.byId[r[2]]].sprite==='S_ENEMY14'));
  const e=g.enemies[0];e.x=200;e.y=200;e.pathFinished=true;e.speed=0;
  g.addBullet(200,210,0,-400,true,1);g.update(STEP);let events=g.drainEvents();assert.ok(events.some(e=>e.type==='enemy-hit'));assert.ok(!events.some(e=>e.type==='hit'||e.type==='explosion'));
  g.addBullet(200,210,0,-400,true,5000);g.update(STEP);events=g.drainEvents();assert.equal(events.filter(e=>e.type==='explosion').length,1);
});

test('bank and thrust follow input and settle, preserving original 17-pose range',()=>{
  const g=new Game(1);g.start();g.recordEvents=[];for(let i=0;i<8;i++)g.update(STEP,{x:-1,y:-1});assert.equal(g.player.bank,0);assert.equal(g.player.thrust,1);
  for(let i=0;i<16;i++)g.update(STEP,{x:1,y:1});assert.equal(g.player.bank,16);assert.equal(g.player.thrust,-1);
  for(let i=0;i<8;i++)g.update(STEP);assert.equal(g.player.bank,8);assert.equal(g.player.thrust,0);
  assert.ok(PLAYER_STEP_X>4&&PLAYER_STEP_Y>4);assert.equal((400-32)/PLAYER_STEP_X,72);
});

test('base cannons remain active with every enhanced color and exact max-tier shot IDs',()=>{
  const expected=[[15,15,17,17,22,23,24,25],[15,15,28,28,28,28],[15,15,50,37],[15,15,59]];
  for(let weapon=0;weapon<4;weapon++){const g=new Game(1);g.start();g.collect({type:['weapon','ion','plasma','magnetic'][weapon]});g.collect({type:'full'});g.firePlayer();assert.equal(g.player.power,6);assert.deepEqual(g.bullets.map(b=>b.shotType),expected[weapon]);assert.equal(g.bullets[0].damage,50);assert.equal(g.bullets[0].vy,-24*TICK);}
});

test('same color upgrades, different color loses the previous tier, full S preserves color',()=>{
  const g=new Game(1);g.start();assert.equal(g.player.power,0);g.collect({type:'ion'});assert.equal(g.player.power,1);g.collect({type:'ion'});assert.equal(g.player.power,2);
  g.collect({type:'full'});assert.equal(g.player.power,6);assert.equal(g.player.weapon,1);g.collect({type:'plasma'});assert.equal(g.player.power,1);g.collect({type:'ion'});assert.equal(g.player.power,1);
  const fresh=new Game(1);fresh.start();fresh.collect({type:'full'});assert.equal(fresh.player.weapon,0);assert.equal(fresh.player.power,6);assert.equal(fresh.player.defaultWeapon,false);
});

test('primary and enhancement retain distinct original held-fire cadences',()=>{
  const g=new Game(1);g.start();g.recordEvents=[];g.collect({type:'ion'});for(let i=0;i<8;i++)g.update(STEP,{fire:true});
  assert.equal(g.shotsFired,12);assert.equal(g.bullets.filter(b=>b.shotType===15).length,4);assert.equal(g.bullets.filter(b=>b.shotType===26).length,8);
});

test('missile pickup switches one 50-volley inventory and launches a homing pair',()=>{
  const g=new Game(1);g.start();g.recordEvents=[];g.collect({type:'missile'});assert.equal(g.player.missileAmmo,50);g.collect({type:'missile'});assert.equal(g.player.missileAmmo,100);
  g.collect({type:'homing'});assert.equal(g.player.missileAmmo,50);assert.equal(g.player.missileType,9);g.update(STEP,{fire:true});const shots=g.bullets.filter(b=>b.missile);assert.equal(shots.length,2);assert.ok(shots.every(b=>b.homing&&b.damage===200));assert.equal(g.player.missileAmmo,49);
  g.collect({type:'missile'});assert.equal(g.player.missileAmmo,50);assert.equal(g.player.missileType,8);
});

test('side and rear upgrades persist without a countdown and clear on death',()=>{
  const g=new Game(1);g.start();g.recordEvents=[];for(let i=0;i<4;i++){g.collect({type:'side'});g.collect({type:'rear'});}assert.equal(g.player.side,4);assert.equal(g.player.rear,4);
  for(let i=0;i<1000;i++)g.update(STEP);assert.equal(g.player.side,4);g.collect({type:'ion'});assert.equal(g.player.rear,4);
  g.player.invincible=0;g.hitPlayer(100);assert.equal(g.player.side,0);assert.equal(g.player.rear,0);
});

test('death drops one colored orb, or two at max, then resets to base guns',()=>{
  for(const [weapon,id] of [[0,2],[1,3],[2,4]])for(const power of [1,2,3,4,5,6]){
    const g=new Game(1);g.start();g.recordEvents=[];g.player.weapon=weapon;g.player.defaultWeapon=false;g.player.power=power;g.player.invincible=0;g.hitPlayer(100);
    assert.deepEqual(g.pickups.map(p=>p.id),Array(power===6?2:1).fill(id));assert.equal(g.player.power,0);assert.ok(g.player.defaultWeapon);assert.equal(g.player.bombs,3);assert.ok(g.player.respawn>0);
    g.update(STEP,{fire:true});assert.equal(g.shotsFired,0);assert.equal(g.pickups.length,power===6?2:1);
  }
});

test('damage at critical energy downgrades color once; spare supplies drop at death',()=>{
  const g=new Game(1);g.start();g.player.defaultWeapon=false;g.player.weapon=1;g.player.power=6;g.player.energy=4;g.player.invincible=0;g.hitPlayer(1);assert.equal(g.player.power,5);
  g.player.bombInventory=[0,0,0,1];g.player.missileAmmo=50;g.player.invincible=0;g.hitPlayer(100);assert.deepEqual(g.pickups.map(p=>p.id),[8,6,3]);assert.equal(g.player.missileAmmo,0);
});

test('max-tier same color and full S each launch distinct gold, blue and red novas',()=>{
  for(const [weapon,count,damage] of [[0,16,355],[1,32,400],[2,64,405]])for(const pickup of ['full',['weapon','ion','plasma'][weapon]]){
    const g=new Game(1);g.start();g.player.defaultWeapon=false;g.player.weapon=weapon;g.player.power=6;g.collect({type:pickup});
    assert.equal(g.bullets.length,count);assert.ok(g.bullets.every(b=>b.nova===weapon&&b.damage===damage));assert.equal(g.player.power,6);assert.equal(g.player.weapon,weapon);assert.equal(g.player.bombs,3);
  }
});

test('nova clears hostile projectiles along its path instead of deleting the whole field',()=>{
  const g=new Game(1);g.start();g.recordEvents=[];g.player.x=200;g.player.y=300;g.player.defaultWeapon=false;g.player.power=6;
  g.addBullet(200,282,0,0,false);g.addBullet(20,20,0,0,false);g.triggerNova();g.update(STEP);g.update(STEP);
  const hostile=g.bullets.filter(b=>!b.friendly);assert.equal(hostile.length,1);assert.equal(hostile[0].x,20);
});

test('all original fixed drop records retain their content; non-target scenery stays non-target',()=>{
  let fixed=0;for(const stage of campaign.levels)for(const r of stage.events){if(r[5]<0)continue;fixed++;const g=new Game(1);g.start(1,stage.id);g.spawnRecord(r);const e=g.enemies.at(-1);e.x=200;e.y=150;g.killEnemy(e);
    if(e.scenery)assert.equal(g.pickups.length,0);else assert.equal(g.pickups[0].id,r[5]);}
  assert.equal(fixed,411);
});

test('boss live health uses the original spawn-time doubling rule',()=>{
  const g=new Game(1);g.start();const r=g.stage.map.events.find(r=>campaign.definitions[campaign.byId[r[2]]].flags&1);g.spawnRecord(r);assert.equal(g.boss.hp,g.boss.def.hp*2);
});
