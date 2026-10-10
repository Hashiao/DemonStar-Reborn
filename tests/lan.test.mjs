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
