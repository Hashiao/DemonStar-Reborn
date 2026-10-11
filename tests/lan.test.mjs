import test from 'node:test';
import assert from 'node:assert/strict';
import '../web/js/enemy-art.js';import '../web/js/campaign.js';import '../web/js/player-rules.js';import '../web/js/projectile-rules.js';import '../web/js/weapon-art.js';import '../web/js/original-rules.js';import '../web/js/network-state.js';import '../web/js/lan.js';
const {Game,STEP}=StarfallCore,{Session,PROTOCOL}=DemonStarLAN;
class Hub {
  constructor(){this.links=new Map();this.serial=0;}
  transport(platform){const listeners=new Set(),t={capabilities:{platform,lan:true},on:f=>listeners.add(f),emit:e=>listeners.forEach(f=>f(e))};t.request=async(method,args={})=>{
    if(method==='host'){this.host=t;return {addresses:['192.168.1.2'],port:37654};}
    if(method==='join'){if(!this.host)throw new Error('connect-failed');const id='peer-'+(++this.serial);this.links.set(id,{host:this.host,client:t});this.host.emit({type:'connected',peer:id});t.emit({type:'connected',peer:'host'});return {};}
    if(method==='drop'){const link=this.links.get(args.peer);if(link){this.links.delete(args.peer);link.host.emit({type:'disconnected',peer:args.peer});link.client.emit({type:'disconnected',peer:'host'});}return {};}
    if(method==='stop'){for(const [id,l] of [...this.links])if(l.host===t||l.client===t){this.links.delete(id);l.host.emit({type:'disconnected',peer:id});l.client.emit({type:'disconnected',peer:'host'});}if(this.host===t)this.host=null;return {};}
    return {};
  };t.send=(peer,packet)=>{const data=JSON.stringify(packet);for(const [id,l] of [...this.links]){if(l.host===t&&(peer==='*'||peer===id))l.client.emit({type:'message',peer:'host',data});else if(l.client===t&&peer==='host')l.host.emit({type:'message',peer:id,data});}};return t;}
}
async function room(count=4,maxPlayers=4){let now=1000;const hub=new Hub(),host=new Session(hub.transport('android'),new Game(11),{maxPlayers,identity:'a'.repeat(32),clock:()=>now}),clients=[];await host.host();for(let i=1;i<count;i++){const c=new Session(hub.transport(i%2?'ios':'android'),new Game(i),{maxPlayers,identity:String(i).repeat(32),clock:()=>now});await c.join('192.168.1.2',host.code);clients.push(c);}return {hub,host,clients,advance:n=>now+=n};}

test('lobby load starts all peers with saved rules; paused difficulty and banks survive reconnection',async()=>{
  const {host,clients}=await room(2,2),g=new Game(8);g.start(2,1,false,{playerCount:2,retainWeaponLevels:true});g.upgradeWeapon(0,true,g.players[1]);g.upgradeWeapon(1,false,g.players[1]);g.loadStage(3);const cp=g.checkpoint();assert.equal(clients[0].load(cp),false);assert.ok(host.load(cp));assert.equal(clients[0].game.stage.id,3);assert.deepEqual(clients[0].game.players[1].weaponLevels,[6,1,0]);assert.equal(clients[0].game.retainWeaponLevels,true);assert.equal(host.load(cp),false);
  host.game.pause();const frame=host.game.frame,epoch=host.epoch;assert.ok(host.game.setDifficulty(0));host.flush();assert.equal(host.epoch,epoch);assert.equal(clients[0].game.frame,frame);assert.equal(clients[0].game.difficulty,0);await clients[0].native.request('stop');await clients[0].connect();assert.equal(clients[0].game.difficulty,0);assert.deepEqual(clients[0].game.players[1].weaponLevels,[6,1,0]);assert.ok(host.load(cp));assert.ok(host.epoch>epoch);assert.equal(clients[0].game.difficulty,2);
});
test('old movement-rule room revision is rejected at handshake without reserving a seat',async()=>{
  const {hub,host}=await room(1,2),guest=hub.transport('ios'),packets=[];guest.on(e=>{if(e.type==='message')packets.push(JSON.parse(e.data));});await guest.request('join');guest.send('host',{protocol:PROTOCOL,type:'hello',code:host.code,token:'e'.repeat(32),platform:'ios',inputVersion:4,stateVersion:2});assert.equal(host.members.length,1);assert.ok(packets.some(p=>p.type==='rejected'&&p.reason==='protocol-version'));
  const client=new Session(hub.transport('ios'),new Game());client.role='client';client.clientPacket('host',{type:'welcome',slot:2,roster:[{slot:1,connected:true,platform:'ios'},{slot:2,connected:true,platform:'ios'}],epoch:0});assert.equal(client.error,'protocol-version');assert.equal(client.authenticated,false);
});

test('host difficulty changes update the next wave on both peers without replacing the current world',async()=>{
  const {host,clients}=await room(2,2);assert.ok(host.start());const g=host.game,client=clients[0].game,epoch=host.epoch;
  g.phase='playing';g.launch=null;g.recordEvents=[8,16,24].map(y=>[136,y,86,0,1,2,0,4]);
  g.pause();assert.ok(g.setDifficulty(2));host.flush();assert.equal(client.difficulty,2);g.resume();g.scroll=8;g.dispatchRecords();host.flush();
  assert.equal(client.enemies.length,1);const uid=g.enemies[0].uid;
  g.pause();assert.ok(g.setDifficulty(0));host.flush();g.resume();g.scroll=16;g.dispatchRecords();host.flush();
  assert.equal(client.difficulty,0);assert.equal(client.enemies.length,1);assert.equal(client.enemies[0].uid,uid);
  g.pause();assert.ok(g.setDifficulty(3));host.flush();g.resume();g.scroll=24;g.dispatchRecords();host.flush();
  assert.equal(client.difficulty,3);assert.equal(client.enemies.length,2);assert.equal(g.cursor,3);assert.equal(host.epoch,epoch);
});
test('two-player product limit rejects a third player without applying later state',async()=>{
  const {hub,host,clients}=await room(3,2),rejected=clients[1];assert.equal(host.members.length,2);assert.equal(rejected.status,'rejected');assert.equal(rejected.authenticated,false);assert.ok(host.start());assert.equal(clients[0].game.players.length,2);const phase=rejected.game.phase;rejected.clientPacket('host',host.packet('state',{epoch:host.epoch,sequence:999,state:DemonStarNetworkState.encode(host.game)}));assert.equal(rejected.game.phase,phase);assert.equal(rejected.status,'rejected');
  const pending=hub.transport('ios'),messages=[];pending.on(e=>{if(e.type==='message')messages.push(JSON.parse(e.data));});await pending.request('join');host.flush();host.broadcastRoster();assert.deepEqual(messages,[]);
});
test('two-player clients reject a reserved four-seat host without entering combat',async()=>{
  const {hub,host}=await room(2),guest=new Session(hub.transport('ios'),new Game(),{maxPlayers:2,identity:'d'.repeat(32)});await guest.join('192.168.1.2',host.code);assert.equal(guest.status,'rejected');assert.equal(guest.error,'player-limit');assert.equal(guest.authenticated,false);assert.equal(host.members.length,2);
});
test('mixed-platform handshake allocates four stable seats and rejects a fifth player',async()=>{
  const {hub,host,clients}=await room();assert.deepEqual(clients.map(c=>c.localSlot),[2,3,4]);assert.equal(host.members.length,4);const extra=new Session(hub.transport('ios'),new Game(),{identity:'9'.repeat(32)});await extra.join('192.168.1.2',host.code);assert.equal(extra.status,'rejected');assert.equal(extra.error,'room-full');assert.equal(host.members.length,4);
});
test('room code rejection keeps the error and does not reserve a player',async()=>{
  const {hub,host}=await room(1),guest=new Session(hub.transport('ios'),new Game(),{identity:'7'.repeat(32)});await guest.join('192.168.1.2','wrong');assert.equal(guest.status,'rejected');assert.equal(guest.error,'room-code');assert.equal(host.members.length,1);
});
test('only the host advances combat and broadcasts four owned input streams',async()=>{
  const {host,clients,advance}=await room();assert.ok(host.start());host.game.phase='playing';host.game.launch=null;host.game.recordEvents=[];host.flush();advance(100);
  clients[0].update(STEP,{x:1,y:0,fire:true,bomb:0});clients[1].update(STEP,{x:-1,y:0,fire:true,bomb:0});clients[2].update(STEP,{x:0,y:-1,fire:false,bomb:1});host.game.update(STEP,host.inputs({x:0,y:0,fire:true,bomb:0}));host.update(STEP,{},host.game.drainEvents());
  assert.equal(host.game.frame,1);assert.deepEqual(host.game.players.map(p=>p.shotsFired),[2,2,2,0]);assert.deepEqual(host.game.players.map(p=>p.bombs),[3,3,3,2]);for(const c of clients){assert.equal(c.game.frame,1);assert.equal(c.game.players[3].bombs,2);assert.equal(c.game.players[1].x,host.game.players[1].x);}
  clients[0].game.player.energy=1;assert.equal(host.game.player.energy,16);
});
test('disconnect pauses the room and reconnect retains the same slot and equipment',async()=>{
  const {host,clients}=await room();host.start();host.game.phase='playing';host.game.launch=null;host.game.players[2].side=4;host.flush();const c=clients[1];await c.native.request('stop');assert.equal(host.game.phase,'paused');assert.equal(host.game.players[2].connected,false);assert.equal(c.status,'disconnected');await c.connect();assert.equal(c.localSlot,3);assert.equal(host.members.length,4);assert.equal(host.game.players[2].connected,true);assert.equal(c.game.players[2].side,4);assert.equal(c.game.phase,'paused');
});
test('stale input releases movement and old stage/replayed packets cannot fire',async()=>{
  const {host,clients,advance}=await room(2);host.start();host.game.phase='playing';host.game.launch=null;host.game.recordEvents=[];const c=clients[0];advance(100);c.update(STEP,{x:1,y:0,fire:true,bomb:0});assert.equal(host.inputs().players[1].fire,true);advance(301);assert.equal(host.inputs().players[1].fire,false);
  host.game.loadStage(2);host.flush();c.native.send('host',{protocol:PROTOCOL,type:'input',epoch:host.epoch-1,sequence:999,x:1,y:0,fire:true,bomb:9});assert.equal(host.inputs().players[1].fire,false);assert.equal(c.game.stage.id,2);assert.equal(c.epoch,host.epoch);
});
test('guest pause request freezes all peers without allowing a guest stage replacement',async()=>{
  const {host,clients}=await room(2);host.start();host.game.phase='playing';host.game.launch=null;host.flush();clients[0].requestPause();assert.equal(host.game.phase,'paused');assert.equal(clients[0].game.phase,'paused');assert.equal(clients[0].start(3,18),false);assert.equal(host.game.stage.id,1);
});
test('an eliminated host cannot resume an endless battle with only disconnected teammates',async()=>{
  const {host,clients}=await room(2);host.start();host.game.phase='playing';host.game.launch=null;host.game.player.lives=0;await clients[0].native.request('stop');assert.equal(host.game.phase,'paused');host.game.resume();assert.equal(host.game.phase,'gameover');
});
test('overlapping room actions do not revive an obsolete host request',async()=>{
  const stops=[],calls=[],native={capabilities:{platform:'android'},on(){},send(){},request(method){calls.push(method);return method==='stop'?new Promise(resolve=>stops.push(resolve)):Promise.resolve({addresses:[]});}},room=new Session(native,new Game(),{identity:'f'.repeat(32)});
  const first=room.host(),second=room.host();stops[1](true);await second;stops[0](true);await first;assert.equal(calls.filter(m=>m==='host').length,1);assert.equal(room.status,'lobby');
});

// 准备屏门控及目标坐标使用主机移动规则。 / Ready barriers and targets use authoritative movement.
test('LAN preserves full diagonal axes and target travel across all four difficulties',async()=>{
 for(const difficulty of [0,1,2,3]){
  const {host,clients}=await room(2,2);host.start(difficulty);const g=host.game;g.phase='playing';g.launch=null;g.recordEvents=[];for(const p of g.players){p.x=16;p.y=64;p.invincible=999;}host.flush();
  for(let tick=0;tick<50;tick++){clients[0].sendControls({x:1,y:1,fire:false,bomb:0});g.update(STEP,host.inputs({x:1,y:1,fire:false,bomb:0}));host.flush();if(tick===0){assert.equal(g.players[0].x,g.players[1].x);assert.equal(g.players[0].y,g.players[1].y);}if(tick===47)assert.ok(g.players.every(p=>Math.abs(p.x-384)<1e-8));}
  assert.ok(g.players.every(p=>p.x===384&&p.y===440));assert.equal(clients[0].game.players[1].y,440);
  clients[0].sendControls({x:0,y:0,fire:false,bomb:0,target:{x:16,y:64}});for(let tick=0;tick<50;tick++){g.update(STEP,host.inputs());host.flush();}assert.equal(clients[0].game.players[1].x,16);assert.equal(clients[0].game.players[1].y,64);
  clients[0].sendControls({x:999,y:-999,fire:false,bomb:0});assert.equal(host.inputs().players[1].x,1);assert.equal(host.inputs().players[1].y,-1);
 }
});
test('LAN ready barrier waits for both players and point targets arrive on the host',async()=>{
 const {host,clients}=await room(2,2);host.start();host.game.phase='playing';host.game.launch=null;host.game.recordEvents=[];host.flush();let local,remote,completed=0;host.onPrepare=done=>local=done;clients[0].onPrepare=done=>remote=done;
 host.beginReady(()=>{completed++;host.game.resume();host.flush();});assert.equal(host.game.phase,'paused');local();assert.equal(completed,0);remote();assert.equal(completed,1);remote();assert.equal(completed,1);
 clients[0].sendControls({x:0,y:0,fire:false,bomb:0,target:{x:100,y:100}});for(let i=0;i<180;i++)host.game.update(STEP,host.inputs());assert.equal(host.game.players[1].x,100);assert.equal(host.game.players[1].y,100);
 host.beginReady(()=>completed++);local();host.cancelReady();remote();assert.equal(completed,1);
});
