// 三色进度、暂停难度及存档迁移回归。 / Retained color power, paused difficulty and save migration regressions.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';
const {Game,validCheckpoint}=StarfallCore,N=DemonStarNetworkState;
const arena=(retain=true)=>{const g=new Game(42);g.start(1,1,false,{playerCount:2,retainWeaponLevels:retain});g.recordEvents=[];return g;};
test('yellow 6 → blue 1 → yellow nova → blue 2 keeps independent levels and nova ownership',()=>{
 const g=arena(),p=g.player;for(let i=0;i<6;i++)g.upgradeWeapon(0);g.upgradeWeapon(1);assert.equal(p.power,1);assert.deepEqual(p.weaponLevels,[6,1,0]);g.drainEvents();g.upgradeWeapon(0);assert.equal(p.power,6);assert.deepEqual(g.drainEvents(),[{type:'nova',weapon:0,playerId:1}]);assert.ok(g.bullets.every(b=>b.nova===0));assert.equal(g.bullets.length,16);g.upgradeWeapon(1);assert.equal(p.power,2);assert.equal(g.bullets.length,16);
 g.upgradeWeapon(2);assert.deepEqual(p.weaponLevels,[6,2,1]);g.upgradeWeapon(2,true);assert.deepEqual(p.weaponLevels,[6,2,6]);g.upgradeWeapon(2);assert.equal(g.drainEvents().filter(e=>e.type==='nova'&&e.weapon===2).length,1);
});
test('bank survives stage transition, pause and low energy but clears only for the dead player',()=>{
 const g=arena(),[a,b]=g.players;g.upgradeWeapon(0,true,a);g.upgradeWeapon(1,true,b);g.pause();g.resume();g.loadStage(2);assert.deepEqual(a.weaponLevels,[6,0,0]);assert.deepEqual(b.weaponLevels,[0,6,0]);a.invincible=0;a.energy=4;g.hitPlayer(1,'projectile',a);assert.equal(a.power,6);g.hitPlayer(100,'projectile',a);assert.deepEqual(a.weaponLevels,[0,0,0]);assert.deepEqual(b.weaponLevels,[0,6,0]);assert.equal(a.defaultWeapon,true);assert.ok(g.pickups.some(p=>p.deathDrop));
});
test('classic mode preserves color reset and critical-energy downgrade',()=>{
 const g=arena(false);g.upgradeWeapon(0,true);g.upgradeWeapon(1);g.upgradeWeapon(0);assert.equal(g.player.power,1);g.upgradeWeapon(0,true);g.player.invincible=0;g.player.energy=4;g.hitPlayer(1);assert.equal(g.player.power,5);assert.deepEqual(g.player.weaponLevels,[0,0,0]);
});
test('stage checkpoint and wire snapshot roundtrip separate color banks without aliasing',()=>{
 const g=arena();g.upgradeWeapon(0,true);g.upgradeWeapon(1);g.upgradeWeapon(2,true,g.players[1]);g.loadStage(3);const cp=g.checkpoint();assert.equal(cp.version,2);assert.equal(cp.retainWeaponLevels,true);const restored=new Game();assert.ok(restored.loadCheckpoint(cp));assert.deepEqual(restored.players.map(p=>p.weaponLevels),[[6,1,0],[0,0,6]]);restored.player.weaponLevels[0]=1;assert.equal(cp.players[0].weaponLevels[0],6);
 const state=N.encode(g),client=new Game();assert.ok(N.apply(client,state));assert.equal(client.retainWeaponLevels,true);assert.deepEqual(client.player.weaponLevels,[6,1,0]);client.player.weaponLevels[0]=2;assert.equal(state.players[0].weaponLevels[0],6);
 for(const bad of [null,[0,1],[0,1,7],[0,1,1.5]]){const invalid=structuredClone(cp);invalid.players[0].weaponLevels=bad;assert.equal(validCheckpoint(invalid),false);const wire=structuredClone(state);wire.players[0].weaponLevels=bad;assert.equal(N.valid(wire),false);}
});
test('version 1 stage saves migrate to classic mode and retain original equipment',()=>{
 const g=arena(false);g.upgradeWeapon(1,true);g.loadStage(2);const cp=g.checkpoint();cp.version=1;delete cp.retainWeaponLevels;for(const p of cp.players)delete p.weaponLevels;const restored=new Game();assert.ok(restored.loadCheckpoint(cp));assert.equal(restored.retainWeaponLevels,false);assert.equal(restored.player.power,6);assert.equal(restored.player.weapon,1);assert.deepEqual(restored.player.weaponLevels,[0,0,0]);restored.loadStage(3);assert.equal(restored.checkpoint().version,2);
});
test('live difficulty changes preserve world identity and entry checkpoint, then affect subsequent hits',()=>{
 const g=arena();g.upgradeWeapon(0,true);g.player.invincible=0;assert.equal(g.setDifficulty(3),false);g.pause();const before=JSON.stringify(g),entry=g.stageEntry,players=g.players,bullets=g.bullets;
 for(const n of [-1,4,1.5,NaN])assert.equal(g.setDifficulty(n),false);assert.equal(JSON.stringify(g),before);assert.ok(g.setDifficulty(3));assert.equal(g.stageEntry,entry);assert.equal(g.players,players);assert.equal(g.bullets,bullets);assert.equal(g.phase,'paused');assert.equal(g.checkpoint().difficulty,1);g.resume();g.hitPlayer(1);assert.equal(g.player.energy,13);assert.equal(g.player.power,6);
});
