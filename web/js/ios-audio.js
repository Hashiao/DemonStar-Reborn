/* SPDX-License-Identifier: MIT. iOS 专用音频平滑与恢复；Android 使用原有实现。
 * iOS-only smoothing and recovery; Android retains the original implementation. */
(() => {
  const ATTACK=.004,RELEASE=.008,RADIO=new Set(['missionStart','bossWarning','fullPowerA','fullPowerB','missionComplete','stagePraise']);
  class IOSAudio extends StarfallAudio {
    static supported(){return !!globalThis.webkit?.messageHandlers?.demonstar;}
    constructor(canPlay=()=>true){super();this.canPlay=canPlay;this.halted=false;this.pauseSerial=0;this.pauseTimer=null;this.resuming=null;this.sources=new Set();}
    unlock(){
      if(!this.enabled||!this.canPlay())return;
      this.halted=false;this.pauseSerial++;clearTimeout(this.pauseTimer);
      if(this.ctx?.state==='closed')this.reset();
      if(!this.ctx){super.unlock();return;}
      const ready=()=>{if(this.halted||!this.canPlay()){this.suspend();return;}this.setVolume(this.volume);this.ensureAmbience();};
      if(this.ctx.state==='suspended'||this.ctx.state==='interrupted'){
        if(!this.resuming)this.resuming=this.ctx.resume().then(ready).catch(()=>{}).finally(()=>{this.resuming=null;});
      }else if(this.ctx.state==='running')ready();
    }
    setVolume(value){this.volume=value;if(!this.master)return;const now=this.ctx.currentTime,p=this.master.gain,target=this.halted?0:.4*value;if(p.value===target)return;p.cancelScheduledValues(now);p.setValueAtTime(p.value,now);p.linearRampToValueAtTime(target,now+RELEASE);}
    releaseSlot(source){this.active=this.active.filter(s=>s!==source);this.voices=this.active.length;if(this.missionSource===source)this.missionSource=null;if(this.ambient===source)this.ambient=null;}
    sample(kind,volume=1,loop=false){
      if(this.halted||!this.canPlay()||!this.enabled||!this.ctx||this.ctx.state!=='running')return null;
      const asset=DemonStarSounds[kind];if(!asset)return null;const priority=asset.priority||0;
      // 保持原作三路与同类上限；释放尾音不再占用逻辑槽位。
      // Preserve the three-slot and per-kind limits; releasing tails no longer occupy logical slots.
      const same=this.active.filter(s=>s.kind===kind),limit=['proton','ion','plasma'].includes(kind)?2:1;
      if(!loop){if(same.length>=limit)this.stopSource(same[0]);if(this.active.length>=3){const weakest=this.active.reduce((a,b)=>a.priority>b.priority?a:b);if(weakest.priority<=priority)return null;this.stopSource(weakest);}}
      const buffer=this.buffers[kind]||this.makeBuffer(kind),source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),now=this.ctx.currentTime,target=volume*(this.missionSource&&!RADIO.has(kind)?.4:1),duration=buffer.length/buffer.sampleRate;
      Object.assign(source,{buffer,loop,kind,priority,level:target,gainNode:gain,began:now,ends:loop?Infinity:now+duration});source.connect(gain);gain.connect(this.master);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(target,now+Math.min(ATTACK,duration/2));
      if(!loop){gain.gain.setValueAtTime(target,now+Math.max(duration/2,duration-RELEASE));gain.gain.linearRampToValueAtTime(0,now+duration);this.active.push(source);}
      this.voices=this.active.length;this.sources.add(source);
      source.onended=()=>{if(source.finished)return;source.finished=true;this.releaseSlot(source);this.sources.delete(source);source.disconnect();gain.disconnect();};source.start();return source;
    }
    stopSource(source){
      if(!source||source.finished||source.releasing)return;
      source.releasing=true;this.releaseSlot(source);
      if(this.ctx.state==='running'){
        const now=this.ctx.currentTime,p=source.gainNode.gain,level=source.level*Math.max(0,Math.min(1,(now-source.began)/ATTACK,(source.ends-now)/RELEASE));
        p.cancelScheduledValues(now);p.setValueAtTime(level,now);p.linearRampToValueAtTime(0,now+RELEASE);
        try{source.stop(now+RELEASE);}catch{source.onended();}
      }else{try{source.stop();}catch{}source.onended();}
    }
    suspend(){
      this.halted=true;const serial=++this.pauseSerial;clearTimeout(this.pauseTimer);if(!this.ctx)return;
      if(this.ctx.state==='running'){
        this.setVolume(this.volume);
        this.pauseTimer=setTimeout(()=>{if(serial!==this.pauseSerial||!this.halted)return;this.ctx.suspend().then(()=>{if(!this.halted&&this.canPlay())this.unlock();}).catch(()=>{});},RELEASE*1000+4);
      }else if(this.ctx.state==='interrupted')this.ctx.suspend().catch(()=>{});
    }
    reset(){this.pauseSerial++;clearTimeout(this.pauseTimer);for(const s of [...this.sources]){try{s.stop();}catch{}s.onended();}this.ctx?.close?.().catch(()=>{});this.ctx=this.master=this.compressor=null;this.resuming=null;}
  }
  class IOSMusic extends DemonStarMusicPlayer {
    // 同一 JS 轮次只发送最终状态，避免“恢复旧曲→切菜单曲”。
    // Send only the final state of a JS turn, avoiding resume-old-track then switch-to-menu.
    syncNative(){if(this.backend!=='ios-native'||this.nativePending||this.syncQueued)return;this.syncQueued=true;Promise.resolve().then(()=>{this.syncQueued=false;super.syncNative();});}
  }
  globalThis.DemonStarIOSAudio=IOSAudio;globalThis.DemonStarIOSMusic=IOSMusic;
})();
