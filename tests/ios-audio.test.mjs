// iOS 专用修复与 Android 原类隔离。 / iOS-specific fixes and isolation from the original Android classes.
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
test('original priority and three logical slots survive iOS smoothing',()=>{const a=new DemonStarIOSAudio();a.unlock();a.radio('bossWarning');a.sample('explosion');a.sample('hit');assert.equal(a.sample('ion'),null);assert.equal(a.active.length,3);a.sample('bomb');assert.equal(a.active.length,3);assert.ok(a.missionSource);assert.equal(a.active.some(s=>s.kind==='hit'),false);assert.ok(a.sources.size>a.active.length);});
test('paused dialogs cannot resume frozen voices, actual resume handles interrupted state',async()=>{let allowed=true;const a=new DemonStarIOSAudio(()=>allowed);a.unlock();a.sample('explosion');allowed=false;a.suspend();a.unlock();await new Promise(r=>setTimeout(r,25));assert.equal(a.ctx.state,'suspended');assert.equal(a.ctx.resumes,0);assert.equal(a.sample('menu'),null);allowed=true;a.ctx.state='interrupted';a.unlock();await tick();assert.equal(a.ctx.resumes,1);assert.equal(a.ctx.state,'running');assert.equal(a.halted,false);});
test('rapid resume cancels pending suspend and repeated interruption resume is coalesced',async()=>{const a=new DemonStarIOSAudio();a.unlock();a.suspend();a.unlock();await new Promise(r=>setTimeout(r,25));assert.equal(a.ctx.suspends,0);a.ctx.state='interrupted';a.unlock();a.unlock();await tick();assert.equal(a.ctx.resumes,1);});
test('reset releases all pending tails and creates a fresh context',()=>{const a=new DemonStarIOSAudio();a.unlock();const old=a.ctx,s=a.sample('hit');a.stopSource(s);a.reset();assert.equal(a.sources.size,0);assert.equal(a.ctx,null);a.unlock();assert.notEqual(a.ctx,old);assert.ok(a.ambient);});
test('a late resume completion cannot override a newer pause',async()=>{const a=new DemonStarIOSAudio();a.unlock();const ctx=a.ctx;ctx.state='suspended';let finish;ctx.resume=()=>new Promise(resolve=>finish=()=>{ctx.state='running';resolve();});a.unlock();a.suspend();finish();await new Promise(r=>setTimeout(r,30));assert.equal(ctx.state,'suspended');assert.equal(a.halted,true);});
test('native iOS menu transition sends only the final track; legacy class retains its sequence',async()=>{
 for(const Class of [DemonStarMusicPlayer,DemonStarIOSMusic]){const calls=[],pending=[],native={available:true,ready:Promise.resolve({platform:'ios',music:true}),request(method,state){calls.push(state);return new Promise(resolve=>pending.push(()=>resolve({track:state.track,ready:true,paused:!state.playing})));}},m=new Class({native});const drain=async()=>{for(let i=0;i<10;i++){await tick();pending.shift()?.();if(!pending.length&&!m.nativePending&&!m.syncQueued)break;}await tick();};m.unlock();await m.ready;await drain();m.stage(1);await drain();m.suspend();await drain();calls.length=0;m.resume();m.menu();await drain();assert.deepEqual(calls.filter(s=>s.action==='state').map(s=>s.track),Class===DemonStarIOSMusic?['menu']:['stage','menu']);}
});
