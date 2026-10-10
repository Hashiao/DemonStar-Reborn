/* SPDX-License-Identifier: MIT. Local compressed BGM, one streaming media element. */
(() => {
  class MusicPlayer {
    constructor(options={}){this.clock=options.clock||Date.now;this.enabled=true;this.volume=.35;this.track=null;this.paused=false;this.unlocked=false;this.error=null;this.playFailure=null;this.audio=new Audio();this.audio.preload='metadata';this.audio.loop=true;this.audio.setAttribute('playsinline','');this.audio.addEventListener('error',()=>{this.error=this.audio.error?.code||'media-error';});this.select(DemonStarMusic.menu);}
    select(track){if(!DemonStarMusic.tracks[track])return;if(this.track===track){this.play();return;}this.audio.pause();this.track=track;this.error=this.playFailure=null;this.loadRetries=0;this.retryAt=this.clock()+5000;this.audio.src=DemonStarMusic.tracks[track];this.audio.load();this.play();}
    play(){if(this.enabled&&this.unlocked&&!this.paused){const track=this.track,promise=this.audio.play();if(promise?.catch)promise.catch(error=>{if(this.track===track&&error?.name!=='AbortError')this.playFailure=error?.name||'play-rejected';});}}
    unlock(){this.unlocked=true;this.play();}
    setEnabled(value){this.enabled=value;if(value)this.play();else this.audio.pause();}
    suspend(){this.paused=true;this.audio.pause();}
    resume(){this.paused=false;this.play();}
    stage(id){this.select(DemonStarMusic.stages[id-1]);}
    menu(){this.select(DemonStarMusic.menu);}
    results(){this.select(DemonStarMusic.results);}
    update(ducked){
      this.audio.volume=Math.max(0,Math.min(1,this.volume*(ducked?.38:1)));
      // 原生 WebKit 曾在换曲后停留 readyState=0；仅对未就绪的本地媒体限次重载。
      // Native WebKit stalled at readyState=0 after a track change; retry only unready local media, with a cap.
      if(this.enabled&&this.unlocked&&!this.paused&&this.volume>0&&!this.error&&this.audio.readyState<2&&this.loadRetries<2&&this.clock()>=this.retryAt){this.loadRetries++;this.retryAt=this.clock()+5000;this.audio.load();this.play();}
    }
  }
  globalThis.DemonStarMusicPlayer=MusicPlayer;
})();
