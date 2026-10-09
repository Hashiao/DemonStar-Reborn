/* SPDX-License-Identifier: MIT. All tones and music are synthesized here. */
(() => {
  class AudioEngine {
    constructor(){this.enabled=true;this.music=true;this.ctx=null;this.clock=0;this.step=0;this.lastShot=0;}
    unlock(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.16;this.master.connect(this.ctx.destination);}catch{this.enabled=false;}}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}
    tone(freq,duration=.1,type='triangle',volume=.25,end=freq){
      if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
      const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};
    }
    effect(type){
      if(type==='shot'){const now=this.ctx?.currentTime||0;if(now-this.lastShot<.09)return;this.lastShot=now;this.tone(1050,.045,'triangle',.08,420);}
      if(type==='explosion')this.tone(90,.2,'sawtooth',.22,25);
      if(type==='pickup'){this.tone(659,.13,'sine',.4,1318);}
      if(type==='bomb'){this.tone(190,.8,'sawtooth',.6,22);this.tone(45,.75,'sine',.7,25);}
      if(type==='hit')this.tone(220,.45,'sawtooth',.4,35);
      if(type==='boss')this.tone(110,.7,'square',.17,82);
      if(type==='cleared'||type==='victory'){this.tone(523,.6,'triangle',.5,1046);}
    }
    update(dt,active){if(!active||!this.music||!this.enabled)return;this.clock-=dt;if(this.clock>0)return;this.clock=.19;const notes=[110,110,164.81,130.81,110,196,164.81,130.81,98,98,146.83,123.47,98,164.81,146.83,123.47];const f=notes[this.step++%notes.length];this.tone(f,.16,'triangle',.16);if(this.step%4===0)this.tone(f*4,.27,'sine',.06);}
    suspend(){if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
  }
  globalThis.StarfallAudio=AudioEngine;
})();
