import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';
const {Game,STEP}=StarfallCore,N=DemonStarNetworkState;
test('authoritative world roundtrips four players, real prototypes, equipment and effects',()=>{
  const host=new Game(7);host.start(1,3,false,{playerCount:4,mode:'lan'});for(let i=0;i<160;i++){for(const p of host.players)p.invincible=999;host.update(STEP,{players:host.players.map(()=>({fire:true}))});}
  const events=host.drainEvents(),state=N.encode(host,events),wire=JSON.stringify(state),client=new Game(8);assert.ok(N.valid(state));assert.ok(N.apply(client,JSON.parse(wire),false));assert.equal(client.players.length,4);assert.equal(client.frame,host.frame);assert.equal(client.score,host.score);assert.deepEqual(client.players.map(p=>p.bombInventory),host.players.map(p=>p.bombInventory));assert.equal(client.enemies[0].def,host.enemies[0].def);assert.equal(client.bullets.length,host.bullets.length);assert.ok(wire.length<1048576);
  assert.equal(client.players[2].bombs,3);assert.ok(client.events.length>0);assert.deepEqual(client.checkpoint(),host.checkpoint());
});
test('snapshot interpolation tracks identity rather than changing array positions',()=>{
  const host=new Game(5);host.start(1,1,false,{playerCount:2});host.recordEvents=[];host.update(STEP,{players:[{fire:true},{}]});const client=new Game(9);assert.ok(N.apply(client,N.encode(host),false));const oldX=client.player.x,oldBullet=client.bullets[1];host.bullets.shift();host.update(STEP,{players:[{x:1},{}]});assert.ok(N.apply(client,N.encode(host)));assert.equal(client.player.px,oldX);assert.equal(client.bullets[0].px,oldBullet.x);assert.equal(client.bullets[0].wireId,oldBullet.wireId);
});
test('malformed snapshots are rejected before altering the current client',()=>{
  const host=new Game(1);host.start();const good=N.encode(host),client=new Game(2);N.apply(client,good,false);
  for(const change of [s=>s.version=9,s=>s.stage=19,s=>s.players[0].x=NaN,s=>s.players[0].bombInventory=[99],s=>s.events=[{type:'unknown'}],s=>s.bullets=new Array(1802).fill({}),s=>s.checkpoint.version=100]){const bad=JSON.parse(JSON.stringify(good));change(bad);const before=JSON.stringify(client);assert.equal(N.apply(client,bad),false);assert.equal(JSON.stringify(client),before);}
});
test('dense four-player frame stays below native framing limit and retains pause/bonus state',()=>{
  const host=new Game(1);host.start(1,18,false,{playerCount:4});host.recordEvents=[];for(let i=0;i<1801;i++)host.emitPlayerShot(15,200,400,0,{playerId:i%4+1});host.pause();const frame=N.encode(host);assert.ok(N.valid(frame));const packet=JSON.stringify({protocol:'demonstar-lan-1',type:'state',epoch:1,sequence:1,state:frame});assert.ok(Buffer.byteLength(packet)<1048576);assert.ok(JSON.stringify({method:'send',requestId:0,peer:'*',data:packet}).length<1048576+4096);const client=new Game(2);assert.ok(N.apply(client,frame));assert.equal(client.phase,'paused');assert.equal(client.bullets.length,1801);
});
