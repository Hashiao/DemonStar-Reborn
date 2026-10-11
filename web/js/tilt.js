/* SPDX-License-Identifier: MIT. 倾斜方向键与中立位 / Tilt direction keys and neutral pose. */
(() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const delta=(a,b)=>(a-b+540)%360-180;
  class Tilt {
    constructor(native,clock=()=>Date.now()) {
      this.native=native;this.clock=clock;this.running=false;this.neutral=null;this.latest=null;this.axes={x:0,y:0};this.generation=0;
      native.on(e=>{if(e.type==='motion'&&this.running)this.receive(e);});
    }
    receive(e){
      const {x,y,z}=e;if(![x,y,z].every(Number.isFinite)||Math.hypot(x,y,z)<.1)return;
      this.latest={x:Math.atan2(x,Math.hypot(y,z))*180/Math.PI,y:Math.atan2(-y,-z)*180/Math.PI,orientation:e.orientation||0,time:this.clock()};
    }
    async start(){
      if(this.running)return;const run=++this.generation;this.latest=null;this.neutral=null;this.axes={x:0,y:0};
      if(this.native.available){await this.native.ready;if(run!==this.generation)return;this.running=true;try{await this.native.request('motion',{enabled:true});}catch(e){this.running=false;throw e;}}
      else {
        if(!globalThis.DeviceMotionEvent)throw new Error('motion-unavailable');
        if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw new Error('motion-permission');
        if(run!==this.generation)return;this.running=true;
        this.listener=e=>{const g=e.accelerationIncludingGravity;if(!g)return;const a=Number(globalThis.screen?.orientation?.angle??globalThis.orientation??0),r=a*Math.PI/180;
          // Web motion uses the same gravity sign as Android; convert to physical downward gravity.
          // Web 运动数据与 Android 同号，转换为物理向下的重力向量。
          this.receive({x:-g.x*Math.cos(r)-g.y*Math.sin(r),y:g.x*Math.sin(r)-g.y*Math.cos(r),z:-g.z,orientation:a});};
        globalThis.addEventListener('devicemotion',this.listener);
      }
    }
    stop(){this.generation++;this.running=false;this.neutral=null;this.latest=null;this.axes={x:0,y:0};if(this.listener){globalThis.removeEventListener('devicemotion',this.listener);this.listener=null;}if(this.native.available)this.native.request('motion',{enabled:false}).catch(()=>{});}
    fresh(){return this.running&&this.latest&&this.clock()-this.latest.time<600;}
    calibrate(){if(!this.fresh())return false;this.neutral={...this.latest};this.axes={x:0,y:0};return true;}
    sample(config){
      if(!this.fresh()||!this.neutral||this.latest.orientation!==this.neutral.orientation){this.axes={x:0,y:0};return this.axes;}
      const threshold=clamp(Number(config.tiltAngle)||10,3,30),release=Math.max(1,threshold-2);
      // 施密特死区只消除阈值抖动，输出始终是方向键的 -1/0/1。
      // Schmitt dead zone prevents threshold chatter; output remains digital -1/0/1.
      for(const axis of ['x','y']){const d=delta(this.latest[axis],this.neutral[axis])*(config[axis==='x'?'tiltInvertX':'tiltInvertY']?-1:1),old=this.axes[axis];this.axes[axis]=Math.abs(d)>=threshold?Math.sign(d):Math.abs(d)<=release||Math.sign(d)!==old?0:old;}
      return {...this.axes};
    }
  }
  globalThis.DemonStarTilt=Tilt;
})();
