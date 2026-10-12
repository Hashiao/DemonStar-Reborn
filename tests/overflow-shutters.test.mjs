// 三色溢出弹与原作炮门状态回归。 / Color-overflow and native shutter-state regressions.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/campaign-art.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';
const {Game,STEP}=StarfallCore,A=DemonStarEnemyArt,C=DemonStarCampaign,Art=DemonStarCampaignArt,N=DemonStarNetworkState;
function arena(difficulty=1,retainWeaponLevels=false){const g=new Game(224);g.start(difficulty,4,false,{playerCount:2,retainWeaponLevels});g.recordEvents=[];for(const p of g.players)Object.assign(p,{x:40,y:440,invincible:999});return g;}
function spawn(g,id){g.spawnRecord([200,0,id,0,1,-1,0,0]);const e=g.enemies.at(-1);Object.assign(e,{x:200,y:100,px:200,py:100,entered:true});return e;}

test('same-color and full-S overflow retain hostile shots and their damage for every difficulty, rule and owner',()=>{
  for(let difficulty=0;difficulty<4;difficulty++)for(const retained of [false,true])for(const owner of [0,1])for(const weapon of [0,1,2])for(const full of [false,true]){
    const g=arena(difficulty,retained),p=g.players[owner];Object.assign(p,{x:200,y:300,weapon,power:6,defaultWeapon:false,weaponLevels:[6,6,6]});
    g.addBullet(200,282,0,0,false,2,0,{shotType:1});g.addBullet(20,20,0,0,false,2,0,{shotType:1});const hostile=g.bullets.slice(),bombs=p.bombInventory.slice();
    g.collect({type:full?'full':['weapon','ion','plasma'][weapon]},p);
    const nova=g.bullets.filter(b=>b.friendly);assert.equal(nova.length,[16,32,64][weapon]);assert.ok(nova.every(b=>b.playerId===p.id&&b.damage===[355,400,405][weapon]));
    for(let tick=0;tick<4;tick++)g.update(STEP);
    assert.ok(hostile.every(b=>g.bullets.includes(b)&&!b.dead));assert.equal(p.power,6);assert.deepEqual(p.bombInventory,bombs);
    p.y=282;p.invincible=0;const energy=p.energy;g.update(STEP);assert.ok(p.energy<energy);assert.ok(!g.bullets.includes(hostile[0]));assert.ok(g.bullets.includes(hostile[1]));
  }
});

test('overflow still damages enemy hulls and bomb clearing remains independent',()=>{
  for(const weapon of [0,1,2]){
    const g=arena(),p=g.player;Object.assign(p,{x:200,y:300,weapon,power:6,defaultWeapon:false});const e=spawn(g,88);Object.assign(e,{y:255,py:255,hp:99999,guns:[]});
    g.triggerNova();for(let tick=0;tick<8;tick++)g.update(STEP);assert.ok(e.hp<99999);
  }
  for(const bomb of [0,1]){const g=arena();g.addBullet(200,100,0,0,false,2);g.player.bombInventory=[bomb];assert.ok(g.useBomb());for(let tick=0;tick<32;tick++)g.update(STEP);assert.equal(g.bullets.filter(b=>!b.friendly).length,0);}
});

test('stage-two/four shutter families retain source counters, frame bounds and all placements',()=>{
  for(const [id,name,count,pause,cycles,pingPong] of [[88,'G_TNK2A',6,200,999,true],[89,'G_TNK3A',6,200,9,true],[185,'G_BTANK1A',20,250,999,false]]){
    const rule=A.animations[id];assert.deepEqual(rule,{interval:1,pause,loopFrames:count,cycles,start:0,pauseEnd:pingPong?30:0,pauseStart:pingPong?30:0,pingPong,frameCount:count});
    const spec=Art.sprites[name];assert.equal(spec.frames.length,count);assert.equal(Art.routes[name].kind,'campaign');
    for(const f of spec.frames){const [w,h]=Art.assets[spec.asset].size,[x,y,cw,ch]=f.crop;assert.ok(x>0&&y>0&&cw>0&&ch>0&&x+cw<w&&y+ch<h);assert.ok(f.visible.every(n=>n>0));}
    for(const stage of C.levels)if(stage.events.some(r=>r[2]===id))assert.ok(Art.stageAssets[stage.id].includes(spec.asset));
  }
  assert.ok(C.levels[1].events.some(r=>r[2]===88));for(const id of [88,89,185])assert.ok(C.levels[3].events.some(r=>r[2]===id));
});

test('covers open, dwell and close on native ticks; rotary shutters loop after twenty poses',()=>{
  for(const id of [88,89]){
    const g=arena(),e=spawn(g,id),frames=new Map();for(let tick=1;tick<=286;tick++){g.updateEnemyState(e);if([200,201,202,210,212,242,244,252,254,284,286].includes(tick))frames.set(tick,e.animation.frame);}
    assert.deepEqual([...frames.values()],[0,0,1,5,5,5,4,0,0,0,1]);
  }
  const g=arena(),e=spawn(g,185),seen=new Set();for(let tick=1;tick<=290;tick++){g.updateEnemyState(e);if(tick<=251)assert.equal(e.animation.frame,0);if(tick>=251)seen.add(e.animation.frame);}
  assert.equal(seen.size,20);assert.equal(e.animation.frame,0);
});

test('shutter cycles and frozen pause state roundtrip over LAN without changing original guns',()=>{
  for(const id of [88,89,185])for(let difficulty=0;difficulty<4;difficulty++){
    const host=arena(difficulty),control=arena(difficulty),e=spawn(host,id),baseline=spawn(control,id);delete baseline.animation;
    const peer=new Game(),seen=new Set();
    for(let tick=1;tick<=1000;tick++){
      host.updateEnemyState(e);control.updateEnemyState(baseline);for(const gun of e.guns)gun.tick(e,host);for(const gun of baseline.guns)gun.tick(baseline,control);
      assert.deepEqual(host.bullets,control.bullets);host.bullets=[];control.bullets=[];seen.add(e.animation.frame);
      if(tick%17===0){assert.ok(N.apply(peer,N.encode(host),false));assert.deepEqual(peer.enemies[0].animation,e.animation);}
    }
    assert.equal(seen.size,A.animations[id].frameCount);if(id===89)assert.equal(e.animation.cycles,0);
    host.pause();const frozen=structuredClone(e.animation);host.update(1);assert.deepEqual(e.animation,frozen);
    assert.ok(N.apply(peer,N.encode(host),false));assert.deepEqual(peer.enemies[0].animation,frozen);
  }
});
