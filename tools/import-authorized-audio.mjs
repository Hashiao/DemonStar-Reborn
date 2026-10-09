// Import user-supplied, authorized MP3s without downloading an audio toolchain.
// Chrome's local decoder produces the PCM bank used by offline iOS 12 WebViews.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(process.argv[2]||path.join(root,'audio'));
const output=path.join(root,'web/assets/audio');
const mapping=await readFile(path.join(source,'音频文件名对照表.txt'),'utf8');
const entries=[...mapping.matchAll(/^(W_\w+)\.wav\t([^\t\r\n]+\.mp3)\t([\d.]+)/gm)].map(m=>({resource:m[1],filename:m[2],expectedSeconds:Number(m[3])}));
if(entries.length<55)throw new Error('The base 55-entry supplied filename mapping is incomplete');
const bindings={proton:'W_PSHOT1',ion:'W_PSHOT2',plasma:'W_PSHOT3',hit:'W_HITSHIP',
  explosion:'W_EXPLOSION1',heavyExplosion:'W_EXPLOSION2',groundExplosion:'W_GRDEXP1',
  bomb:'W_MEGABOMB',scatterBomb:'W_SHOT2',megaBomb:'W_LASER2',pickup:'W_GETSHOT',
  menu:'W_MENUCLICK',nova:'W_SHOTEXP',missionStart:'W_RADIO12',bossWarning:'W_RADIO1',bossFall:'W_BOSSFALL',missionComplete:'W_RADIO11',
  fullPowerA:'W_RADIO10',fullPowerB:'W_RADIO9',crystal:'W_GETCRYSTAL',energy:'W_GETENERGY',
  medal:'W_GETMEDAL',shield:'W_GETSHIELD',shieldLost:'W_LOSESHIELD',stageAmbience:'W_GLOOP',menuAmbience:'W_ILOOP',playerLaunch:'W_PLAYERLNCH',bossEngine1:'W_BOSS',bossEngine2:'W_BOSS2',bossEngine3:'W_BOSS3',bossEngine4:'W_BOSS4',bossEngine5:'W_BOSS5',bossEngine6:'W_BOSS6'};
if(entries.some(e=>e.resource==='W_PULSE'))bindings.pulseCharge='W_PULSE';
const audit=JSON.parse(await readFile(path.join(root,'docs/audio-bindings.json'),'utf8'));
const priorities=Object.fromEntries(audit.bindings.map(b=>[b.resource,b.priority]));
const hash=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({channel:'chrome',headless:true});
const bank={},inventory=[];
try{
  const page=await browser.newPage();
  await page.evaluate(()=>{globalThis.decoder=new OfflineAudioContext(1,1,11025);});
  await mkdir(output,{recursive:true});
  for(const entry of entries){
    const bytes=await readFile(path.join(source,entry.filename));
    const decoded=await page.evaluate(async base64=>{
      const raw=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
      const buffer=await decoder.decodeAudioData(raw.buffer),data=buffer.getChannelData(0);
      if(buffer.numberOfChannels!==1)throw new Error('Expected mono supplied audio');
      const pcm=new Uint8Array(data.length*2),view=new DataView(pcm.buffer);
      for(let i=0;i<data.length;i++){
        if(!Number.isFinite(data[i]))throw new Error('Non-finite decoded sample');
        const value=Math.max(-1,Math.min(1,data[i]));
        view.setInt16(i*2,Math.round(value*(value<0?32768:32767)),true);
      }
      let binary='';for(let i=0;i<pcm.length;i+=8192)binary+=String.fromCharCode(...pcm.subarray(i,i+8192));
      return {rate:buffer.sampleRate,frames:buffer.length,pcm:btoa(binary)};
    },bytes.toString('base64'));
    const seconds=decoded.frames/decoded.rate;
    if(decoded.rate!==11025||Math.abs(seconds-entry.expectedSeconds)>.002)throw new Error('Unexpected decoded duration: '+entry.resource+' '+seconds);
    const keys=Object.keys(bindings).filter(k=>bindings[k]===entry.resource);
    if(keys.length)await copyFile(path.join(source,entry.filename),path.join(output,entry.resource+'.mp3'));
    for(const key of keys)bank[key]={rate:decoded.rate,pcm:decoded.pcm,priority:priorities[entry.resource]??4};
    inventory.push({...entry,sourceSha256:hash(bytes),bytes:bytes.length,frames:decoded.frames,rate:decoded.rate,seconds,keys,
      ...(keys.length?{asset:'web/assets/audio/'+entry.resource+'.mp3',pcmSha256:hash(Buffer.from(decoded.pcm,'base64'))}:{})});
  }
}finally{await browser.close();}
if(Object.keys(bank).length!==Object.keys(bindings).length)throw new Error('Incomplete sound bank');
await writeFile(path.join(root,'web/js/soundbank.js'),'/* User-supplied authorized recordings; outside MIT code grant. See docs/AUDIO_MOTION.md. */\nglobalThis.DemonStarSounds='+JSON.stringify(bank)+';\n');
await writeFile(path.join(root,'docs/audio-manifest.json'),JSON.stringify({
  provenance:'User supplied J:\\DemonStar\\audio and explicitly authorized these MP3s for game sound effects on 2026-10-09. License evidence is the user statement; no independent license verification is claimed.',
  decoder:'Existing local Chrome Web Audio, 11025 Hz mono signed 16-bit PCM; no synthesis, TTS, normalization or filtering; supplied MP3 copies remain byte-identical.',
  mappingSha256:hash(Buffer.from(mapping)),bindings,inventory
},null,2)+'\n');
// Remove only this project's obsolete generated WAV assets, never source audio/.
for(const name of ['proton','ion','plasma','hit','explosion','heavyExplosion','bomb','pickup','menu','magnetic','nova','missionStart']){
  await unlink(path.join(output,name+'.wav')).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
console.log(JSON.stringify({decoded:inventory.length,bundled:Object.keys(bank).length,manifest:'docs/audio-manifest.json'}));
