/* SPDX-License-Identifier: MIT. 常驻滚动条与独立内容区 / Persistent scrollbar and independent content area. */
(() => {
  class DialogScroll {
    constructor(dialog,content,track){
      this.dialog=dialog;this.content=content;this.track=track;this.thumb=track.firstElementChild;
      const update=()=>this.update();content.addEventListener('scroll',update);window.addEventListener('resize',update);
      this.observer=new MutationObserver(()=>requestAnimationFrame(update));this.observer.observe(content,{childList:true,subtree:true,characterData:true,attributes:true});this.observer.observe(dialog,{attributes:true});
      if(globalThis.ResizeObserver){this.resize=new ResizeObserver(update);this.resize.observe(content);}
      track.addEventListener('pointerdown',e=>{if(track.hidden)return;e.preventDefault();const r=track.getBoundingClientRect();this.drag={id:e.pointerId};this.seek(e.clientY-r.top);try{track.setPointerCapture(e.pointerId);}catch{}});
      window.addEventListener('pointermove',e=>{if(this.drag?.id===e.pointerId){e.preventDefault();this.seek(e.clientY-track.getBoundingClientRect().top);}},{passive:false});
      for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>this.drag=null);
      track.addEventListener('keydown',e=>{const c=this.content,steps={ArrowDown:40,ArrowUp:-40,PageDown:c.clientHeight*.8,PageUp:-c.clientHeight*.8,Home:-c.scrollHeight,End:c.scrollHeight};if(steps[e.key]!==undefined){e.preventDefault();c.scrollTop+=steps[e.key];}});
    }
    seek(y){const c=this.content,h=this.track.clientHeight,thumb=this.thumb.offsetHeight;c.scrollTop=Math.max(0,Math.min(1,(y-thumb/2)/Math.max(1,h-thumb)))*(c.scrollHeight-c.clientHeight);}
    update(){
      const c=this.content,active=!this.dialog.hidden&&!this.dialog.classList.contains('classic-results')&&!this.dialog.classList.contains('quick-setup'),overflow=c.scrollHeight-c.clientHeight;
      this.track.hidden=!active||overflow<=2;if(this.track.hidden)return;
      const h=this.track.clientHeight,thumb=Math.max(24,h*c.clientHeight/c.scrollHeight),top=(h-thumb)*c.scrollTop/overflow;
      this.thumb.style.height=thumb+'px';this.thumb.style.transform=`translateY(${top}px)`;
      this.track.setAttribute('aria-valuemax',String(Math.ceil(overflow)));this.track.setAttribute('aria-valuenow',String(Math.round(c.scrollTop)));
    }
  }
  globalThis.DemonStarDialogScroll=DialogScroll;
})();
