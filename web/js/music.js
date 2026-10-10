/* SPDX-License-Identifier: MIT. 本地 MP3：iOS 原生播放，其余使用媒体元素。 / Local MP3: native iOS playback, media element elsewhere. */
(() => {
  class MusicPlayer {
    constructor(options={}){
      this.clock=options.clock||Date.now;this.native=options.native===undefined?globalThis.DemonStarNative:options.native;
      this.enabled=true;this.volume=.35;this.track=null;this.paused=false;this.unlocked=false;this.error=null;this.playFailure=null;this.ducked=false;
      this.nativeState=null;this.nativePending=false;this.nativeAgain=false;this.nativeSignature='';this.nextPoll=0;
      this.backend=this.native?.available?'pending':'media';this.audio=new Audio();this.audio.preload='metadata';this.audio.loop=true;this.audio.setAttribute('playsinline','');
      this.audio.addEventListener('error',()=>{if(this.backend==='media')this.error=this.audio.error?.code||'media-error';});
      this.select(DemonStarMusic.menu);
      this.ready=this.backend==='pending'?this.native.ready.then(capabilities=>{
        this.backend=capabilities.platform==='ios'&&capabilities.music?'ios-native':'media';
        if(this.backend==='media')this.loadMedia();this.play();
      }):Promise.resolve();
    }
    select(track){if(!DemonStarMusic.tracks[track])return;if(this.track===track){this.play();return;}this.audio.pause();this.track=track;this.error=this.playFailure=null;this.nativeSignature='';this.loadRetries=0;this.retryAt=this.clock()+5000;if(this.backend==='media')this.loadMedia();this.play();}
    loadMedia(){this.audio.src=DemonStarMusic.tracks[this.track];this.audio.volume=this.effectiveVolume();this.audio.load();}
    effectiveVolume(){return Math.max(0,Math.min(1,this.volume*(this.ducked?.38:1)));}
    wantsPlayback(){return this.enabled&&this.unlocked&&!this.paused;}
    play(){
      if(this.backend==='ios-native'){this.nativeSignature='';if(this.nativePending)this.nativeAgain=true;this.syncNative();return;}
      if(this.backend==='media'&&this.wantsPlayback()){const track=this.track,promise=this.audio.play();if(promise?.catch)promise.catch(error=>{if(this.track===track&&error?.name!=='AbortError')this.playFailure=error?.name||'play-rejected';});}
    }
    syncNative(){
      if(this.backend!=='ios-native'||this.nativePending)return;
      const state={action:'state',track:this.track,asset:DemonStarMusic.tracks[this.track],playing:this.wantsPlayback(),volume:this.effectiveVolume()},signature=JSON.stringify(state),changed=signature!==this.nativeSignature;
      if(!changed&&this.clock()<this.nextPoll)return;
      this.nativePending=true;
      this.native.request('music',changed?state:{action:'status'}).then(value=>{
        this.nativeState=value;if(changed){this.error=null;this.playFailure=null;this.nativeSignature=signature;}
      }).catch(error=>{this.error=error.message||'music-native-failed';if(changed)this.nativeSignature=signature;}).finally(()=>{
        this.nativePending=false;this.nextPoll=this.clock()+250;
        // 等待回复时的切曲/暂停不可丢失；计时只读取原生播放器，不用 JS 推算。
        // Preserve track/pause changes during a request; time comes from the native player, never JS estimates.
        const latest={action:'state',track:this.track,asset:DemonStarMusic.tracks[this.track],playing:this.wantsPlayback(),volume:this.effectiveVolume()};
        const again=this.nativeAgain;this.nativeAgain=false;if(again)this.nativeSignature='';
        if(again||JSON.stringify(latest)!==signature)this.syncNative();
      });
    }
    snapshot(){
      if(this.backend==='ios-native')return {...(this.nativeState||{}),backend:this.backend,ready:!!this.nativeState?.ready&&this.nativeState.track===this.track,error:this.error};
      return {backend:this.backend,track:this.track,ready:this.audio.readyState>=2,paused:this.audio.paused,currentTime:this.audio.currentTime,duration:this.audio.duration,volume:this.audio.volume,error:this.error};
    }
    unlock(){this.unlocked=true;this.play();}
    setEnabled(value){this.enabled=!!value;if(this.backend==='ios-native')this.syncNative();else if(value)this.play();else this.audio.pause();}
    suspend(){this.paused=true;this.audio.pause();this.syncNative();}
    resume(){this.paused=false;this.play();}
    stage(id){this.select(DemonStarMusic.stages[id-1]);}
    menu(){this.select(DemonStarMusic.menu);}
    results(){this.select(DemonStarMusic.results);}
    update(ducked){
      this.ducked=!!ducked;if(this.backend==='ios-native'){this.syncNative();return;}if(this.backend!=='media')return;
      this.audio.volume=this.effectiveVolume();
      // 未就绪的本地媒体限次重载；iOS 使用上面的原生路径。
      // Bound retries for unready local media; iOS uses the native path above.
      if(this.wantsPlayback()&&this.volume>0&&!this.error&&this.audio.readyState<2&&this.loadRetries<2&&this.clock()>=this.retryAt){this.loadRetries++;this.retryAt=this.clock()+5000;this.audio.load();this.play();}
    }
  }
  globalThis.DemonStarMusicPlayer=MusicPlayer;
})();
