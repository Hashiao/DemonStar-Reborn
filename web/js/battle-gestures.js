/* SPDX-License-Identifier: MIT. 战场跟手与双击手势 / Battlefield follow and double-tap gestures. */
(() => {
  class BattleGestures {
    constructor(input,element,layout,active,release=()=>{},clock=()=>performance.now()){
      this.input=input;this.element=element;this.layout=layout;this.active=active;this.release=release;this.clock=clock;this.contacts=new Map();this.owner=null;this.lastTap=null;
      element.addEventListener('pointerdown',e=>this.down(e));
      window.addEventListener('pointermove',e=>this.move(e),{passive:false});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>this.up(e,type!=='pointerup'));
      for(const type of ['touchstart','touchmove','touchend','contextmenu','selectstart'])element.addEventListener(type,e=>{if(this.active()&&this.enabled()&&e.cancelable)e.preventDefault();},{passive:false});
    }
    follower(){for(let i=0;i<this.input.count;i++)if(this.input.mode(i)==='point')return i;return -1;}
    bombing(){return this.input.count===1&&this.input.config.doubleTapBomb===true;}
    enabled(){return this.follower()>=0||this.bombing();}
    position(e){const l=this.layout();return {x:(e.clientX-l.x)/l.scale,y:(e.clientY-l.y)/l.scale};}
    down(e){
      if(!this.active()||!this.enabled()||e.pointerType==='mouse'&&e.button!==0)return;
      const p=this.position(e);if(p.x<0||p.x>400||p.y<0||p.y>480)return;
      e.preventDefault();const contact={x:e.clientX,y:e.clientY,time:this.clock(),dragged:false};
      if(this.contacts.size){contact.dragged=true;for(const c of this.contacts.values())c.dragged=true;this.lastTap=null;}
      this.contacts.set(e.pointerId,contact);
      const index=this.follower();if(index>=0&&this.owner===null){this.owner={id:e.pointerId,index};this.input.point(index,p.x,p.y);}
      try{this.element.setPointerCapture(e.pointerId);}catch{/* 旧 WebKit 无捕获。 / Legacy WebKit has no capture. */}
    }
    move(e){const c=this.contacts.get(e.pointerId);if(!c)return;if(!this.active()){this.clear();return;}
      if(Math.hypot(e.clientX-c.x,e.clientY-c.y)>18)c.dragged=true;
      if(this.owner?.id===e.pointerId){const p=this.position(e);this.input.point(this.owner.index,p.x,p.y);}
      if(e.cancelable)e.preventDefault();
    }
    up(e,cancelled){const c=this.contacts.get(e.pointerId);if(!c)return;this.contacts.delete(e.pointerId);
      if(this.owner?.id===e.pointerId){this.input.states[this.owner.index].target=null;this.owner=null;}
      const now=this.clock(),tap=!cancelled&&this.active()&&this.bombing()&&!c.dragged&&now-c.time<=250&&Math.hypot(e.clientX-c.x,e.clientY-c.y)<=18;
      if(tap){const last=this.lastTap;if(last&&now-last.time<=320&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<=32){this.input.pulse(0,'bomb');this.lastTap=null;}else this.lastTap={x:e.clientX,y:e.clientY,time:now};}else this.lastTap=null;
      // 松手/取消立即发送停止，不能让联机端继续追逐旧目标。
      // Release/cancel sends a stop immediately, preventing peers from chasing stale targets.
      this.release();
    }
    clear(index){if(index!==undefined&&this.owner?.index!==index)return;if(this.owner)this.input.states[this.owner.index].target=null;this.owner=null;this.contacts.clear();this.lastTap=null;}
  }
  globalThis.DemonStarBattleGestures=BattleGestures;
})();
