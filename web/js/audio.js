/* SPDX-License-Identifier: MIT. Playback code; supplied recordings have separate rights. */
(() => {
  const RADIO=['missionStart','bossWarning','fullPowerA','fullPowerB','missionComplete','stagePraise'];
  const ENEMY={1:'enemyShot',2:'enemyShot',3:'enemyShot',4:'enemyShot',5:'enemyShot',6:'enemyShot',40:'enemyShot',7:'scatterBomb',41:'scatterBomb',8:'enemyMissile',43:'enemyMissile',44:'enemyMissile',9:'enemyLaser',10:'megaBomb',11:'enemyPulsar1',42:'enemyPulsar2'};
  class AudioEngine {
    constructor(){this.enabled=true;this.volume=1;this.ctx=null;this.master=null;this.buffers={};this.active=[];this.voices=0;this.pendingMission=false;this.missionDelay=0;this.launchPending=false;this.missionSource=null;this.ambient=null;this.scene='menu';this.cues=[];this.fullPowerVoice=0;this.lastShot=this.lastExplosion=this.lastHit=-Infinity;}
    unlock(){
      if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.4*this.volume;this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.ratio.value=4;this.compressor.attack.value=.004;this.compressor.release.value=.12;this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);}catch{this.enabled=false;return;}}
      if(this.ctx.state==='suspended')this.ctx.resume().then(()=>this.ensureAmbience()).catch(()=>{});else this.ensureAmbience();
    }
    makeBuffer(kind){const asset=globalThis.DemonStarSounds?.[kind];if(!asset)return null;const bytes=atob(asset.pcm),buffer=this.ctx.createBuffer(1,bytes.length/2,asset.rate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++){let value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);if(value&0x8000)value-=65536;data[i]=value/32768;}this.buffers[kind]=buffer;return buffer;}
    sample(kind,volume=1,loop=false){
      if(!this.enabled||!this.ctx||this.ctx.state!=='running')return null;
      const asset=DemonStarSounds[kind];if(!asset)return null;const priority=asset.priority||0;
      if(!loop){
        const same=this.active.filter(s=>s.kind===kind),limit=['proton','ion','plasma'].includes(kind)?2:1;
        if(same.length>=limit)this.stopSource(same[0]);
        if(this.active.length>=3){const weakest=this.active.reduce((a,b)=>a.priority>b.priority?a:b);if(weakest.priority<=priority)return null;this.stopSource(weakest);}
      }
      const buffer=this.buffers[kind]||this.makeBuffer(kind),source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=loop;source.kind=kind;source.priority=priority;
      gain.gain.value=volume*(this.missionSource&&!RADIO.includes(kind)?.4:1);source.connect(gain);gain.connect(this.master);
      if(!loop)this.active.push(source);this.voices=this.active.length;
      source.onended=()=>{if(source.finished)return;source.finished=true;this.active=this.active.filter(s=>s!==source);this.voices=this.active.length;if(this.missionSource===source)this.missionSource=null;if(this.ambient===source)this.ambient=null;source.disconnect();gain.disconnect();};source.start();return source;
    }
    stopSource(source){if(!source||source.finished)return;try{source.stop();}catch{}source.onended?.();}
    ensureAmbience(){if(this.ambient||!this.enabled||!this.ctx||this.ctx.state!=='running')return;const kind=this.scene==='stage'?'stageAmbience':this.scene==='menu'?'menuAmbience':null;if(kind)this.ambient=this.sample(kind,.22,true);}
    setScene(scene){if(this.scene===scene&&this.ambient)return;this.scene=scene;this.stopSource(this.ambient);this.ensureAmbience();}
    stopMission(){this.pendingMission=false;this.launchPending=false;this.missionDelay=0;this.stopSource(this.missionSource);this.missionSource=null;}
    stopAll(){this.cues=[];this.stopMission();for(const source of [...this.active])this.stopSource(source);this.stopSource(this.ambient);}
    radio(kind){this.stopMission();this.missionSource=this.sample(kind,.95);}
    effect(type,event={}){
      const now=this.ctx?.currentTime||0;
      if(type==='stage'){this.stopAll();this.setScene('stage');this.pendingMission=this.enabled&&!event.deferredLaunch;this.launchPending=this.enabled&&!event.deferredLaunch;this.lastShot=this.lastHit=this.lastExplosion=-Infinity;}
      if(type==='launch')this.launchPending=this.enabled;
      if(type==='mission-start'){this.pendingMission=this.enabled;this.missionDelay=0;}
      if(type==='shot'){if(now-this.lastShot<.055)return;this.lastShot=now;this.sample(['proton','ion','plasma','proton'][event.weapon||0],1.1);}
      if(type==='enemy-shot'&&ENEMY[event.shotType])this.sample(ENEMY[event.shotType],.8);
      if(type==='enemy-hit'){if(now-this.lastHit<.035)return;this.lastHit=now;this.sample('hit',.65);}
      if(type==='explosion'){if(now-this.lastExplosion<.035)return;this.lastExplosion=now;this.sample(event.heavy?'heavyExplosion':event.ground?'groundExplosion':'explosion',.7);}
      if(type==='pickup'){if(event.item==='full')this.radio(this.fullPowerVoice++%2?'fullPowerB':'fullPowerA');else this.sample(['energy','crystal','medal','shield'].includes(event.item)?event.item:'pickup',1);}
      if(type==='shield-lost')this.sample('shieldLost',1);
      if(type==='bomb'&&event.bombType!==2)this.sample(['bomb','scatterBomb'][event.bombType||0],1.1);
      if(type==='bomb'&&event.bombType===2)this.sample('pulseCharge',1);
      if(type==='super-pulse')this.sample('megaBomb',.85);
      if(type==='nova')this.sample('nova',1.1);
      if(type==='hit')this.sample('hit',1.1);
      if(type==='menu')this.sample('menu',.65);
      if(type==='boss-radio')this.radio('bossWarning');
      if(type==='boss-engine')this.sample('bossEngine'+event.variant,.55);
      if(type==='boss-dying'){this.stopMission();this.sample('bossFall',.8);}
      if(type==='stage-complete'||(type==='cleared'||type==='victory')&&!event.completionAnnounced){this.setScene('results');this.stopMission();const index=((event.stage||1)-1)%4;this.cues=[{delay:(type==='victory'||event.final?25:35)*.035,kind:index===1?'fullPowerB':index===3?'fullPowerA':'stagePraise'},{delay:75*.035,kind:'missionComplete'}];}
      if(type==='gameover'){this.stopAll();this.setScene('results');}
    }
    update(dt,active){
      if(!active||!this.enabled||!this.ctx||this.ctx.state!=='running')return;this.ensureAmbience();
      const due=[];this.cues=this.cues.filter(c=>{c.delay-=dt;if(c.delay<=0){due.push(c.kind);return false;}return true;});for(const kind of due)this.radio(kind);
      if(this.launchPending){const source=this.sample('playerLaunch',.85);if(source){this.missionDelay=source.buffer.length/source.buffer.sampleRate;this.launchPending=false;}return;}
      if(this.pendingMission){this.missionDelay-=dt;if(this.missionDelay<=0){this.missionSource=this.sample('missionStart',.95);this.pendingMission=false;}}
    }
    suspend(){if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
  }
  globalThis.StarfallAudio=AudioEngine;
})();
