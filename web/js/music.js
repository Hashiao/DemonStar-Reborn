/* SPDX-License-Identifier: MIT. Local compressed BGM, one streaming media element. */
(() => {
  class MusicPlayer {
    constructor(){this.enabled=true;this.volume=.35;this.track=null;this.paused=false;this.unlocked=false;this.error=null;this.audio=new Audio();this.audio.preload='metadata';this.audio.loop=true;this.audio.setAttribute('playsinline','');this.audio.addEventListener('error',()=>{this.error=this.audio.error?.code||'media-error';});this.select(DemonStarMusic.menu);}
    select(track){if(!DemonStarMusic.tracks[track])return;if(this.track===track){this.play();return;}this.audio.pause();this.track=track;this.error=null;this.audio.src=DemonStarMusic.tracks[track];this.audio.load();this.play();}
    play(){if(this.enabled&&this.unlocked&&!this.paused){const promise=this.audio.play();if(promise?.catch)promise.catch(()=>{});}}
    unlock(){this.unlocked=true;this.play();}
    setEnabled(value){this.enabled=value;if(value)this.play();else this.audio.pause();}
    suspend(){this.paused=true;this.audio.pause();}
    resume(){this.paused=false;this.play();}
    stage(id){this.select(DemonStarMusic.stages[id-1]);}
    menu(){this.select(DemonStarMusic.menu);}
    results(){this.select(DemonStarMusic.results);}
    update(ducked){this.audio.volume=Math.max(0,Math.min(1,this.volume*(ducked?.38:1)));}
  }
  globalThis.DemonStarMusicPlayer=MusicPlayer;
})();
