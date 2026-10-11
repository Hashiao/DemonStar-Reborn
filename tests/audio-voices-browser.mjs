// 共用调度在已构建包及原始音源上的验证。 / Shared scheduling in the built bundle with supplied samples.
import {createRequire} from 'node:module';import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>window.StarfallApp?.renderer.presentationReady());
 const probe=await readFile('tests/audio-voice-probe.js','utf8'),results={};
 for(const name of ['StarfallAudio','DemonStarIOSAudio']){results[name]=await page.evaluate(probe+'('+name+')');assert.equal(results[name].sharedScheduler,true);}
 const mixing=await page.evaluate(async()=>{
  const results={};for(const [name,Class] of [['android',StarfallAudio],['ios',DemonStarIOSAudio]]){
   const context=new OfflineAudioContext(1,96000,48000),audio=new Class();audio.ctx={state:'running',destination:context.destination,get currentTime(){return context.currentTime;},createBuffer:(...args)=>context.createBuffer(...args),createGain:()=>context.createGain(),createBufferSource:()=>context.createBufferSource(),createDynamicsCompressor:()=>context.createDynamicsCompressor()};audio.connectOutput();
   for(const kind of ['explosion','groundExplosion','heavyExplosion','hit','enemyShot','enemyMissile','enemyLaser','bossEngine1'])audio.sample(kind,.8);
   for(const id of [1,2])for(const kind of ['proton','ion'])audio.sample(kind,1.1,false,id);
   const pcm=(await context.startRendering()).getChannelData(0);let peak=0,overRange=0;for(const sample of pcm){if(!Number.isFinite(sample))throw new Error('Nonfinite mixed audio');peak=Math.max(peak,Math.abs(sample));if(Math.abs(sample)>1)overRange++;}results[name]={peak,overRange};
  }return results;
 });
 console.log(JSON.stringify({mixing}));assert.deepEqual(errors,[]);for(const mix of Object.values(mixing)){assert.ok(mix.peak>0);assert.equal(mix.overRange,0);}
 const report={status:'passed',results,mixing,errors,scope:'Built web bundle and real Chromium AudioContext/OfflineAudioContext. No physical speaker, Bluetooth or hardware latency measurement.'};await writeFile('artifacts/m218-audio-voices-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
