/* SPDX-License-Identifier: MIT. 共用调度，仅 iOS 启用平滑与恢复。
 * Shared scheduling, with iOS-only smoothing and recovery. */
(() => {
  const ATTACK=.004,RELEASE=.008;
  class IOSAudio extends StarfallAudio {
    static supported(){return !!globalThis.webkit?.messageHandlers?.demonstar;}
    constructor(canPlay=()=>true){super();this.canPlay=canPlay;this.halted=false;this.pauseSerial=0;this.pauseTimer=null;this.resuming=null;}
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
    canSample(){return !this.halted&&this.canPlay()&&super.canSample();}
    configureSource(source){
      const {gainNode:gain,began:now,level:target,loop,buffer}=source,duration=buffer.length/buffer.sampleRate;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(target,now+Math.min(ATTACK,duration/2));
      if(!loop){gain.gain.setValueAtTime(target,now+Math.max(duration/2,duration-RELEASE));gain.gain.linearRampToValueAtTime(0,now+duration);}
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
    reset(){this.pauseSerial++;clearTimeout(this.pauseTimer);for(const s of [...this.sources]){try{s.stop();}catch{}s.onended();}this.ctx?.close?.().catch(()=>{});this.ctx=this.master=this.compressor=this.output=null;this.resuming=null;this.resetEffectTimers();}
  }
  class IOSMusic extends DemonStarMusicPlayer {
    // 同一 JS 轮次只发送最终状态，避免“恢复旧曲→切菜单曲”。
    // Send only the final state of a JS turn, avoiding resume-old-track then switch-to-menu.
    syncNative(){if(this.backend!=='ios-native'||this.nativePending||this.syncQueued)return;this.syncQueued=true;Promise.resolve().then(()=>{this.syncQueued=false;super.syncNative();});}
  }
  globalThis.DemonStarIOSAudio=IOSAudio;globalThis.DemonStarIOSMusic=IOSMusic;
})();
