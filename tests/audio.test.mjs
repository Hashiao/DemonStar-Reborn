import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await import('../web/js/soundbank.js');
await import('../web/js/audio.js');
const started=[];
class Context{
  constructor(){this.state='running';this.currentTime=0;this.destination={};}
  createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
  createDynamicsCompressor(){return {threshold:{},ratio:{},attack:{},release:{},connect(){}};}
  createBuffer(channels,length,rate){const samples=new Float32Array(length);return {length,sampleRate:rate,getChannelData:()=>samples};}
  createBufferSource(){return {connect(){},disconnect(){},start(){started.push(this);},stop(){this.onended?.();}};}
  suspend(){this.state='suspended';return Promise.resolve();}
  resume(){this.state='running';return Promise.resolve();}
}
globalThis.window={AudioContext:Context};
test('distinct impact and explosion samples, first shot is never throttled away',()=>{
  const a=new StarfallAudio();a.unlock();const n=started.length;a.effect('shot',{weapon:0});assert.equal(started.length,n+1);assert.equal(started.at(-1).buffer,a.buffers.proton);
  a.effect('enemy-hit');assert.equal(started.at(-1).buffer,a.buffers.hit);a.effect('explosion');assert.equal(started.at(-1).buffer,a.buffers.explosion);assert.notEqual(a.buffers.hit.length,a.buffers.explosion.length);
});
test('mission radio survives delayed audio unlock, plays once and stops on restart/menu',()=>{
  const a=new StarfallAudio();a.effect('stage');a.update(.02,true);assert.ok(a.pendingMission);a.unlock();a.update(.02,true);const voice=a.missionSource;assert.ok(voice);assert.equal(a.buffers.missionStart.sampleRate,11025);
  const n=started.length;a.update(.1,true);assert.equal(started.length,n);a.suspend();a.effect('stage');a.update(.1,true);assert.equal(a.missionSource,null);assert.ok(a.pendingMission);a.unlock();a.update(.1,true);assert.ok(a.missionSource);a.stopMission();assert.equal(a.missionSource,null);assert.equal(a.pendingMission,false);
});
test('bundled authorized samples are finite and have no fetch dependency',()=>{
  const a=new StarfallAudio();a.unlock();for(const kind of ['proton','hit','explosion','missionStart']){const b=a.makeBuffer(kind);assert.ok(b.length>1000);assert.ok(b.getChannelData(0).every(Number.isFinite));assert.ok(b.getChannelData(0).some(n=>Math.abs(n)>.02));}
  const duration=a.buffers.missionStart.length/11025;assert.ok(duration>1&&duration<1.3);
});
test('every bundled clip and PCM bank matches the supplied-audio provenance hashes',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../docs/audio-manifest.json',import.meta.url),'utf8'));
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(manifest.inventory.length,55);assert.equal(Object.keys(DemonStarSounds).length,22);
  for(const entry of manifest.inventory.filter(e=>e.asset)){
    assert.match(entry.asset,/\/W_[A-Z0-9]+\.mp3$/);
    assert.equal(hash(await readFile(new URL('../'+entry.asset,import.meta.url))),entry.sourceSha256);
    for(const key of entry.keys){const sound=DemonStarSounds[key];assert.equal(sound.rate,11025);assert.equal(hash(Buffer.from(sound.pcm,'base64')),entry.pcmSha256);assert.equal(Buffer.from(sound.pcm,'base64').length,entry.frames*2);}
  }
});
test('equipment, bombs, ground explosions and radio use their original distinct resources',()=>{
  const a=new StarfallAudio();a.unlock();
  for(const item of ['energy','crystal','medal','shield']){a.effect('pickup',{item});assert.equal(started.at(-1).buffer,a.buffers[item]);}
  a.effect('pickup',{item:'homing'});assert.equal(started.at(-1).buffer,a.buffers.pickup);
  a.effect('pickup',{item:'full'});assert.equal(started.at(-1).buffer,a.buffers.fullPowerA);
  a.effect('pickup',{item:'full'});assert.equal(started.at(-1).buffer,a.buffers.fullPowerB);
  a.effect('boss');assert.equal(started.at(-1).buffer,a.buffers.bossWarning);
  for(const [bombType,key] of ['bomb','scatterBomb','megaBomb'].entries()){a.effect('bomb',{bombType});assert.equal(started.at(-1).buffer,a.buffers[key]);}
  a.effect('explosion',{ground:true});assert.equal(started.at(-1).buffer,a.buffers.groundExplosion);
  a.effect('shield-lost');assert.equal(started.at(-1).buffer,a.buffers.shieldLost);
  a.stopMission();assert.equal(a.missionSource,null);
});
