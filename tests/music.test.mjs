import test from 'node:test';import assert from 'node:assert/strict';
class Media {constructor(){this.readyState=0;this.loads=0;this.plays=0;this.listeners={};this.paused=true;this.currentTime=0;}setAttribute(){}addEventListener(name,fn){this.listeners[name]=fn;}load(){this.loads++;}play(){this.plays++;this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
globalThis.Audio=Media;globalThis.DemonStarMusic={menu:'menu',results:'results',stages:['stage'],tracks:{menu:'assets/menu.mp3',stage:'assets/stage.mp3',results:'assets/results.mp3'}};
await import('../web/js/music.js');
function player(){let now=0;const m=new DemonStarMusicPlayer({clock:()=>now});m.unlock();return {m,advance:n=>now+=n};}
test('unready local BGM retries twice, then stops rather than reloading forever',()=>{const {m,advance}=player();advance(4999);m.update(false);assert.equal(m.audio.loads,1);advance(1);m.update(false);assert.equal(m.audio.loads,2);advance(5000);m.update(false);assert.equal(m.audio.loads,3);advance(50000);m.update(false);assert.equal(m.audio.loads,3);m.stage(1);assert.equal(m.loadRetries,0);advance(5000);m.update(false);assert.equal(m.audio.loads,5);});
test('ready media and saved mute/zero-volume/background state are not restarted by recovery',()=>{for(const setup of [m=>{m.audio.readyState=4;m.audio.currentTime=31;},m=>m.setEnabled(false),m=>{m.volume=0;},m=>m.suspend(),m=>{m.unlocked=false;},m=>{m.error=4;}]){const {m,advance}=player();setup(m);const state={loads:m.audio.loads,plays:m.audio.plays,time:m.audio.currentTime};advance(12000);m.update(false);assert.deepEqual({loads:m.audio.loads,plays:m.audio.plays,time:m.audio.currentTime},state);}});

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function nativeFixture(){let now=0;const calls=[],pending=[];const native={available:true,ready:Promise.resolve({platform:'ios',music:true}),request(method,state){calls.push({method,...state});return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};const m=new DemonStarMusicPlayer({native,clock:()=>now});return {m,calls,pending,advance:n=>now+=n,async reply(state={}){pending.shift().resolve({backend:'ios-native',track:m.track,ready:true,paused:!m.wantsPlayback(),currentTime:17,duration:90,volume:m.effectiveVolume(),...state});await flush();}};}
test('native negotiation applies saved mute and volume before startup, without loading WebKit media',async()=>{
  const f=nativeFixture(),m=f.m;m.setEnabled(false);m.volume=.12;m.unlock();assert.equal(f.calls.length,0);await m.ready;
  assert.deepEqual(f.calls[0],{method:'music',action:'state',track:'menu',asset:'assets/menu.mp3',playing:false,volume:.12});await f.reply();
  assert.equal(m.audio.loads,0);assert.equal(m.audio.plays,0);assert.equal(m.snapshot().backend,'ios-native');assert.equal(m.snapshot().paused,true);
});
test('native track/pause changes during an in-flight request are coalesced to the latest state',async()=>{
  const f=nativeFixture(),m=f.m;m.unlock();await m.ready;m.stage(1);m.suspend();m.volume=.6;m.update(true);assert.equal(f.calls.length,1);await f.reply({track:'menu'});
  assert.equal(m.snapshot().ready,false);assert.equal(f.calls.length,2);assert.deepEqual(f.calls[1],{method:'music',action:'state',track:'stage',asset:'assets/stage.mp3',playing:false,volume:.6*.38});await f.reply();
  assert.equal(m.snapshot().ready,true);m.resume();assert.equal(f.calls.at(-1).playing,true);await f.reply();m.setEnabled(false);assert.equal(f.calls.at(-1).playing,false);await f.reply();assert.equal(m.audio.loads,0);
});
test('native polling is bounded and reports only actual player time without fabricating progress',async()=>{
  const f=nativeFixture(),m=f.m;m.unlock();await m.ready;await f.reply();for(let i=0;i<60;i++)m.update(false);assert.equal(f.calls.length,1);
  f.advance(250);m.update(false);assert.deepEqual(f.calls.at(-1),{method:'music',action:'status'});assert.equal(m.snapshot().currentTime,17);f.advance(50000);assert.equal(m.snapshot().currentTime,17);await f.reply({currentTime:18.75});assert.equal(m.snapshot().currentTime,18.75);
});
test('native playback failure remains visible after a successful status read',async()=>{
  const f=nativeFixture(),m=f.m;m.unlock();await m.ready;f.pending.shift().reject(new Error('music-play-failed'));await flush();assert.equal(m.snapshot().error,'music-play-failed');f.advance(250);m.update(false);await f.reply({paused:true});assert.equal(m.snapshot().error,'music-play-failed');m.resume();await f.reply();assert.equal(m.snapshot().error,null);
});
test('Android capabilities retain media playback after saved settings are applied',async()=>{
  const m=new DemonStarMusicPlayer({native:{available:true,ready:Promise.resolve({platform:'android'})}});m.volume=.21;m.setEnabled(false);m.unlock();await m.ready;assert.equal(m.backend,'media');assert.equal(m.audio.loads,1);assert.equal(m.audio.plays,0);assert.equal(m.audio.volume,.21);m.setEnabled(true);assert.equal(m.audio.plays,1);
});
test('foreground resume is not lost behind an in-flight request with the same desired state',async()=>{
  const f=nativeFixture(),m=f.m;m.unlock();await m.ready;m.resume();await f.reply({paused:true});assert.equal(f.calls.length,2);assert.equal(f.calls[1].action,'state');assert.equal(f.calls[1].playing,true);await f.reply({paused:false});assert.equal(m.snapshot().paused,false);
});
