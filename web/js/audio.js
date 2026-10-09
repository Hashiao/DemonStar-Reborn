/* SPDX-License-Identifier: MIT. Playback code; supplied audio has separate rights. */
(() => {
  class AudioEngine {
    constructor(){this.enabled=true;this.music=false;this.ctx=null;this.clock=0;this.step=0;this.lastShot=-Infinity;this.lastExplosion=-Infinity;this.lastHit=-Infinity;this.buffers={};this.voices=0;this.pendingMission=false;this.missionSource=null;this.fullPowerVoice=0;}
    unlock(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.4;this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.ratio.value=4;this.compressor.attack.value=.004;this.compressor.release.value=.12;this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);}catch{this.enabled=false;}}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}
    tone(freq,duration=.1,type='triangle',volume=.25,end=freq){
      if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
      const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};
    }
    makeBuffer(kind){
      const asset=globalThis.DemonStarSounds?.[kind];if(!asset)return null;
      const bytes=atob(asset.pcm),buffer=this.ctx.createBuffer(1,bytes.length/2,asset.rate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++){let value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);if(value&0x8000)value-=65536;data[i]=value/32768;}
      this.buffers[kind]=buffer;return buffer;
    }
    sample(kind,volume=1){
      const radio=['missionStart','bossWarning','fullPowerA','fullPowerB'].includes(kind);
      if(!this.enabled||!this.ctx||this.ctx.state!=='running'||(this.voices>=28&&!radio))return null;
      const buffer=this.buffers[kind]||this.makeBuffer(kind);if(!buffer)return null;
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;
      gain.gain.value=volume*(this.missionSource&&!radio?.4:1);source.connect(gain);gain.connect(this.master);this.voices++;
      source.onended=()=>{this.voices=Math.max(0,this.voices-1);if(this.missionSource===source)this.missionSource=null;source.disconnect();gain.disconnect();};source.start();return source;
    }
    stopMission(){this.pendingMission=false;if(this.missionSource){try{this.missionSource.stop();}catch{}this.missionSource=null;}}
    radio(kind){this.stopMission();this.missionSource=this.sample(kind,.95);}
    effect(type,event={}){
      const now=this.ctx?.currentTime||0;
      if(type==='stage'){this.stopMission();this.pendingMission=this.enabled;this.lastShot=this.lastHit=this.lastExplosion=-Infinity;}
      if(type==='shot'){if(now-this.lastShot<.055)return;this.lastShot=now;this.sample(['proton','ion','plasma','proton'][event.weapon||0],1.4);}
      if(type==='enemy-hit'){if(now-this.lastHit<.035)return;this.lastHit=now;this.sample('hit',.65);}
      if(type==='explosion'){if(now-this.lastExplosion<.035)return;this.lastExplosion=now;this.sample(event.heavy?'heavyExplosion':event.ground?'groundExplosion':'explosion',.7);}
      if(type==='pickup'){if(event.item==='full')this.radio(this.fullPowerVoice++%2?'fullPowerB':'fullPowerA');else this.sample(['energy','crystal','medal','shield'].includes(event.item)?event.item:'pickup',1.2);}
      if(type==='shield-lost')this.sample('shieldLost',1);
      if(type==='bomb')this.sample(['bomb','scatterBomb','megaBomb'][event.bombType||0],1.1);
      if(type==='nova')this.sample('nova',1.1);
      if(type==='hit')this.sample('hit',1.1);
      if(type==='menu')this.sample('menu',.8);
      if(type==='boss')this.radio('bossWarning');
      if(type==='cleared'||type==='victory'){this.stopMission();this.tone(523,.6,'triangle',.4,1046);}
    }
    update(dt,active){if(active&&this.pendingMission&&this.enabled&&this.ctx?.state==='running'){this.missionSource=this.sample('missionStart',.95);this.pendingMission=false;}if(!active||!this.music||!this.enabled)return;this.clock-=dt;if(this.clock>0)return;this.clock=.19;const notes=[110,110,164.81,130.81,110,196,164.81,130.81,98,98,146.83,123.47,98,164.81,146.83,123.47];const f=notes[this.step++%notes.length];this.tone(f,.16,'triangle',.16);if(this.step%4===0)this.tone(f*4,.27,'sine',.06);}
    suspend(){if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
  }
  globalThis.StarfallAudio=AudioEngine;
})();
