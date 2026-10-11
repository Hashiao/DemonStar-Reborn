// 共用调度与 iOS 专用平滑回归。 / Shared scheduling and iOS-only smoothing regressions.
import test from 'node:test';import assert from 'node:assert/strict';
import '../web/js/soundbank.js';import '../web/js/audio.js';
globalThis.Audio=class{setAttribute(){}addEventListener(){}pause(){}play(){return Promise.resolve();}};
globalThis.DemonStarMusic={menu:'menu',stages:['stage'],tracks:{menu:'menu.mp3',stage:'stage.mp3'}};
await import('../web/js/music.js');await import('../web/js/ios-audio.js');
class Param{constructor(){this.value=0;this.events=[];}cancelScheduledValues(t){this.events.push(['cancel',t]);}setValueAtTime(v,t){this.value=v;this.events.push(['set',v,t]);}linearRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);}}
class Context{
 constructor(){this.state='running';this.currentTime=0;this.destination={};this.resumes=0;this.suspends=0;}
 createGain(){return {gain:new Param(),connect(){},disconnect(){this.disconnected=true;}};}
 createDynamicsCompressor(){return {threshold:{},ratio:{},attack:{},release:{},connect(){}};}
 createBuffer(c,n,r){const samples=new Float32Array(n);return {length:n,sampleRate:r,getChannelData:()=>samples};}
 createBufferSource(){return {connect(){},disconnect(){this.disconnected=true;},start(){},stop(t){this.stopTime=t;}};}
 resume(){this.resumes++;this.state='running';return Promise.resolve();}
 suspend(){this.suspends++;this.state='suspended';return Promise.resolve();}
 close(){this.state='closed';return Promise.resolve();}
}
globalThis.window={AudioContext:Context};const tick=()=>new Promise(r=>setImmediate(r));
test('iOS selection requires the actual native bridge; Android uses base classes',()=>{delete globalThis.webkit;assert.equal(DemonStarIOSAudio.supported(),false);globalThis.DemonStarHost={command(){}};assert.equal(DemonStarIOSAudio.supported(),false);globalThis.webkit={messageHandlers:{demonstar:{}}};assert.equal(DemonStarIOSAudio.supported(),true);delete globalThis.webkit;delete globalThis.DemonStarHost;const a=new StarfallAudio();a.unlock();const s=a.sample('ion');a.stopSource(s);assert.equal(s.disconnected,true);assert.equal(a.constructor,StarfallAudio);});
test('iOS attacks and natural ends ramp; stolen voice fades before disconnect',()=>{const a=new DemonStarIOSAudio();a.unlock();const s=a.sample('hit');assert.deepEqual(s.gainNode.gain.events.slice(0,2),[['set',0,0],['ramp',1,.004]]);a.ctx.currentTime=.035;a.sample('hit');assert.equal(a.active.filter(s=>s.kind==='hit').length,1);assert.equal(s.stopTime,.043000000000000003);assert.equal(s.disconnected,undefined);assert.equal(a.sources.has(s),true);s.onended();assert.equal(s.disconnected,true);assert.equal(a.sources.has(s),false);});
test('iOS inherits the shared scheduler while replacing only playback hooks',()=>{assert.equal(DemonStarIOSAudio.prototype.sample,StarfallAudio.prototype.sample);assert.equal(DemonStarIOSAudio.prototype.claimVoice,StarfallAudio.prototype.claimVoice);assert.notEqual(DemonStarIOSAudio.prototype.configureSource,StarfallAudio.prototype.configureSource);});
for(const Class of [StarfallAudio,DemonStarIOSAudio]){
 test(Class.name+': sustained explosions and enemy fire cannot steal either player shot pool',()=>{
  const a=new Class();a.unlock();a.radio('bossWarning');const radio=a.missionSource;
  for(let n=0;n<80;n++){
   a.ctx.currentTime=n*.07;
   for(const kind of ['explosion','groundExplosion','heavyExplosion','hit','enemyShot','enemyMissile','enemyLaser','bossEngine1'])a.sample(kind);
   a.effect('shot',{weapon:n%3,playerId:1});a.effect('shot',{weapon:(n+1)%3,playerId:2});
   assert.equal(a.lastShots.get(1),n*.07);assert.equal(a.lastShots.get(2),n*.07);
   for(const id of [1,2])assert.equal(a.active.filter(s=>s.playerId===id).length,Math.min(n+1,2));
   assert.ok(a.active.filter(s=>s.voiceGroup==='world').length<=8);assert.ok(a.active.length<=12);assert.equal(a.missionSource,radio);
   for(const s of [...a.sources])if(s.releasing)s.onended();
  }
 });
 test(Class.name+': world overflow retains priority and cannot evict protected shot voices',()=>{
  const a=new Class();a.unlock();const shot=a.sample('ion');
  for(const kind of ['groundExplosion','nova','playerLaunch','fullPowerA','missionComplete','missionStart','stagePraise'])assert.ok(a.sample(kind));a.radio('bossWarning');
  assert.equal(a.sample('explosion'),null);assert.equal(a.sample('megaBomb'),null);assert.ok(a.active.includes(shot));assert.ok(a.sample('proton',1,false,2));assert.equal(a.active.filter(s=>s.voiceGroup==='world').length,8);
 });
 test(Class.name+': shot cooldown is per player, advances only on playback and resets on stage entry',()=>{
  const a=new Class();a.unlock();a.ctx.currentTime=10;a.effect('shot',{weapon:0,playerId:1});a.effect('shot',{weapon:1,playerId:2});assert.equal(a.lastShots.size,2);
  a.ctx.currentTime=10.02;a.effect('shot',{weapon:0,playerId:1});assert.equal(a.active.filter(s=>s.playerId===1).length,1);
  a.ctx.currentTime=11;a.enabled=false;a.effect('shot',{playerId:1});assert.equal(a.lastShots.get(1),10);a.enabled=true;a.effect('shot',{playerId:1});assert.equal(a.lastShots.get(1),11);
  a.effect('stage');a.effect('shot',{playerId:1});a.effect('shot',{playerId:2});assert.equal(a.active.filter(s=>s.playerId>0).length,2);
 });
 test(Class.name+': oldest shot replacement affects only its owner, preserving radio ducking',()=>{
  const a=new Class();a.unlock();a.radio('bossWarning');const first=a.sample('proton',1.1,false,1),second=a.sample('ion',1.1,false,1),p2=a.sample('proton',1.1,false,2);const next=a.sample('plasma',1.1,false,1);
  assert.ok(!a.active.includes(first));assert.ok(a.active.includes(second));assert.ok(a.active.includes(p2));assert.ok(a.active.includes(next));assert.ok(Math.abs(next.level-.44)<1e-8);assert.equal(a.active.filter(s=>s.kind==='proton'&&s.playerId===2).length,1);
 });
}
test('iOS context reset cannot leave shot cooldowns on the old audio clock',()=>{const a=new DemonStarIOSAudio();a.unlock();a.ctx.currentTime=80;a.effect('shot',{playerId:1});a.reset();a.unlock();a.effect('shot',{playerId:1});assert.equal(a.active.filter(s=>s.playerId===1).length,1);assert.equal(a.lastShots.get(1),0);});
test('paused dialogs cannot resume frozen voices, actual resume handles interrupted state',async()=>{let allowed=true;const a=new DemonStarIOSAudio(()=>allowed);a.unlock();a.sample('explosion');allowed=false;a.suspend();a.unlock();await new Promise(r=>setTimeout(r,25));assert.equal(a.ctx.state,'suspended');assert.equal(a.ctx.resumes,0);assert.equal(a.sample('menu'),null);allowed=true;a.ctx.state='interrupted';a.unlock();await tick();assert.equal(a.ctx.resumes,1);assert.equal(a.ctx.state,'running');assert.equal(a.halted,false);});
test('rapid resume cancels pending suspend and repeated interruption resume is coalesced',async()=>{const a=new DemonStarIOSAudio();a.unlock();a.suspend();a.unlock();await new Promise(r=>setTimeout(r,25));assert.equal(a.ctx.suspends,0);a.ctx.state='interrupted';a.unlock();a.unlock();await tick();assert.equal(a.ctx.resumes,1);});
test('reset releases all pending tails and creates a fresh context',()=>{const a=new DemonStarIOSAudio();a.unlock();const old=a.ctx,s=a.sample('hit');a.stopSource(s);a.reset();assert.equal(a.sources.size,0);assert.equal(a.ctx,null);a.unlock();assert.notEqual(a.ctx,old);assert.ok(a.ambient);});
test('a late resume completion cannot override a newer pause',async()=>{const a=new DemonStarIOSAudio();a.unlock();const ctx=a.ctx;ctx.state='suspended';let finish;ctx.resume=()=>new Promise(resolve=>finish=()=>{ctx.state='running';resolve();});a.unlock();a.suspend();finish();await new Promise(r=>setTimeout(r,30));assert.equal(ctx.state,'suspended');assert.equal(a.halted,true);});
test('native iOS menu transition sends only the final track; legacy class retains its sequence',async()=>{
 for(const Class of [DemonStarMusicPlayer,DemonStarIOSMusic]){const calls=[],pending=[],native={available:true,ready:Promise.resolve({platform:'ios',music:true}),request(method,state){calls.push(state);return new Promise(resolve=>pending.push(()=>resolve({track:state.track,ready:true,paused:!state.playing})));}},m=new Class({native});const drain=async()=>{for(let i=0;i<10;i++){await tick();pending.shift()?.();if(!pending.length&&!m.nativePending&&!m.syncQueued)break;}await tick();};m.unlock();await m.ready;await drain();m.stage(1);await drain();m.suspend();await drain();calls.length=0;m.resume();m.menu();await drain();assert.deepEqual(calls.filter(s=>s.action==='state').map(s=>s.track),Class===DemonStarIOSMusic?['menu']:['stage','menu']);}
});
