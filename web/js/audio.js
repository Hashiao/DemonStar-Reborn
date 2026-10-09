/* SPDX-License-Identifier: MIT. All tones and music are synthesized here. */
(() => {
  class AudioEngine {
    constructor(){this.enabled=true;this.music=false;this.ctx=null;this.clock=0;this.step=0;this.lastShot=0;this.lastExplosion=0;this.buffers={};this.voices=0;}
    unlock(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.16;this.master.connect(this.ctx.destination);}catch{this.enabled=false;}}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}
    tone(freq,duration=.1,type='triangle',volume=.25,end=freq){
      if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
      const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};
    }
    makeBuffer(kind){
      // Durations and broad spectral envelopes measured from local reference WAVs.
      // New deterministic noise/oscillator samples, never copied original PCM.
      const durations={proton:.262,ion:.233,plasma:.233,magnetic:.35,explosion:2.249,bomb:1.091,hit:1.094,pickup:.17,menu:.455};
      const duration=durations[kind]||.25,rate=22050,buffer=this.ctx.createBuffer(1,Math.ceil(rate*duration),rate),data=buffer.getChannelData(0);
      let seed=kind.split('').reduce((n,c)=>n+c.charCodeAt(0),97),low=0,phase=0;
      const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
      for(let i=0;i<data.length;i++){
        const t=i/rate,u=t/duration,n=noise();let v=0,env=0;
        if(['proton','ion','plasma','magnetic'].includes(kind)){
          const f=kind==='proton'?180-95*u:kind==='ion'?340-210*u:kind==='plasma'?210+120*u:460-260*u;
          phase+=Math.PI*2*f/rate;low+=.38*(n-low);
          const pulse=Math.sin(phase)+.35*Math.sin(phase*3);env=Math.exp(-u*(kind==='plasma'?3.2:5.5))*Math.min(1,t/.0015);
          v=(low*.95+pulse*.25)*(kind==='ion'?.7+.3*Math.sin(t*1250):1)*env;
        }else if(kind==='explosion'||kind==='bomb'||kind==='hit'){
          const cutoff=(kind==='hit'?2300:1700)*(1-u)+180,a=1-Math.exp(-2*Math.PI*cutoff/rate);low+=a*(n-low);phase+=Math.PI*2*(115-78*u)/rate;
          env=Math.pow(1-u,1.6)*Math.min(1,t/.006);v=(low*.85+Math.sin(phase)*.24)*env;
          if(kind==='bomb')v+=Math.sin(t*2*Math.PI*42)*Math.pow(1-u,2)*.36;
          if(kind==='hit')v+=(Math.sin(t*2100)+Math.sin(t*2921))*.08*Math.exp(-t*14);
        }else if(kind==='pickup'){phase+=Math.PI*2*(800+2200*u)/rate;v=(Math.sin(phase)+Math.sin(phase*1.5)*.2)*Math.pow(1-u,2)*.36;}
        else{low+=.2*(n-low);v=(low*.8+Math.sin(t*1880)*.1)*Math.exp(-t*18);}
        data[i]=Math.max(-.9,Math.min(.9,v));
      }
      this.buffers[kind]=buffer;return buffer;
    }
    sample(kind,volume=1){
      if(!this.enabled||!this.ctx||this.ctx.state!=='running'||this.voices>=28)return;
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers[kind]||this.makeBuffer(kind);gain.gain.value=volume;source.connect(gain);gain.connect(this.master);this.voices++;source.onended=()=>{this.voices--;source.disconnect();gain.disconnect();};source.start();
    }
    effect(type,event={}){
      const now=this.ctx?.currentTime||0;
      if(type==='shot'){if(now-this.lastShot<.055)return;this.lastShot=now;this.sample(['proton','ion','plasma','magnetic'][event.weapon||0],.55);}
      if(type==='explosion'){if(now-this.lastExplosion<.035)return;this.lastExplosion=now;this.sample('explosion',.65);}
      if(type==='pickup')this.sample('pickup',1.2);
      if(type==='bomb')this.sample('bomb',1.7);
      if(type==='hit')this.sample('hit',1.1);
      if(type==='menu')this.sample('menu',.8);
      if(type==='boss'){this.sample('hit',.7);this.tone(80,.8,'sawtooth',.12,48);}
      if(type==='cleared'||type==='victory'){this.tone(523,.6,'triangle',.4,1046);}
    }
    update(dt,active){if(!active||!this.music||!this.enabled)return;this.clock-=dt;if(this.clock>0)return;this.clock=.19;const notes=[110,110,164.81,130.81,110,196,164.81,130.81,98,98,146.83,123.47,98,164.81,146.83,123.47];const f=notes[this.step++%notes.length];this.tone(f,.16,'triangle',.16);if(this.step%4===0)this.tone(f*4,.27,'sine',.06);}
    suspend(){if(this.ctx?.state==='running')this.ctx.suspend().catch(()=>{});}
  }
  globalThis.StarfallAudio=AudioEngine;
})();
