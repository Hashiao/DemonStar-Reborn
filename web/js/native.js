/* SPDX-License-Identifier: MIT. 原生消息与触感接口 / Native messages and haptics. */
(() => {
  'use strict';
  class Native {
    constructor(){this.pending=new Map();this.listeners=new Set();this.serial=Math.floor(Math.random()*1e8)+1;this.lastHaptic=0;this.available=!!(globalThis.DemonStarHost?.command||globalThis.webkit?.messageHandlers?.demonstar);this.capabilities={lan:false,haptics:false,platform:'browser'};this.ready=this.available?this.request('capabilities').then(value=>{this.capabilities=value;return value;}).catch(()=>this.capabilities):Promise.resolve(this.capabilities);}
    post(value){if(globalThis.DemonStarHost?.command)DemonStarHost.command(JSON.stringify(value));else if(globalThis.webkit?.messageHandlers?.demonstar)webkit.messageHandlers.demonstar.postMessage(value);else throw new Error('unsupported');}
    request(method,fields={},timeout=15000){
      if(!this.available)return Promise.reject(new Error('unsupported'));
      const requestId=++this.serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(requestId);reject(new Error('timeout'));},timeout);this.pending.set(requestId,{resolve,reject,timer});try{this.post({...fields,method,requestId});}catch(error){clearTimeout(timer);this.pending.delete(requestId);reject(error);}});
    }
    send(peer,packet){const data=typeof packet==='string'?packet:JSON.stringify(packet);if(data.length>1048576)throw new Error('packet-size');this.post({method:'send',requestId:0,peer,data});}
    receive(event){
      if(!event||typeof event!=='object')return;
      if(event.requestId){const pending=this.pending.get(event.requestId);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(event.requestId);if(event.error)pending.reject(new Error(event.error));else pending.resolve(event.value);return;}
      if(event.type)for(const listener of this.listeners)listener(event);
    }
    on(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
    haptic(kind='light'){
      if(!this.available||this.capabilities.haptics===false)return;const now=Date.now();if(now-this.lastHaptic<70)return;this.lastHaptic=now;try{this.post({method:'haptic',requestId:0,kind:kind==='heavy'?'heavy':'light'});}catch{/* 触感失败不影响战斗。 / Haptic failure must not interrupt combat. */}
    }
  }
  globalThis.DemonStarNative=new Native();globalThis.DemonStarNativeClass=Native;
})();
