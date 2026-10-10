/* SPDX-License-Identifier: MIT. 多设备玩家动作层 / Per-player device input. */
(() => {
  'use strict';
  const actions=['up','down','left','right','fire','bomb','pause'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),copy=v=>JSON.parse(JSON.stringify(v));
  const tokenValid=t=>typeof t==='string'&&/^(key:[A-Za-z0-9]{1,32}|mouse:[0-4]|pad:(?:[0-9]|[12][0-9]|3[01]))$/.test(t);
  function defaults(index,count=1){
    const rows=[['KeyW','KeyS','KeyA','KeyD','KeyZ','KeyX','KeyP'],['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ControlRight','ShiftRight','Pause'],['Numpad8','Numpad2','Numpad4','Numpad6','Numpad0','NumpadDecimal','NumpadEnter'],['KeyI','KeyK','KeyJ','KeyL','KeyN','KeyM','KeyO']];
    const result={};actions.forEach((a,i)=>result[a]=['key:'+rows[index][i],'pad:'+([12,13,14,15,0,1,9][i])]);
    if(index===0){result.fire.push('mouse:0');result.bomb.push('mouse:2','key:Space');if(count===1){['up','down','left','right'].forEach((a,i)=>result[a].push('key:'+rows[1][i]));result.fire.push('key:KeyJ');result.bomb.push('key:KeyK');}}
    return result;
  }
  function preferences(value){
    const result={version:1,count:clamp(Math.floor(Number(value?.count)||1),1,4),mousePlayer:clamp(Math.floor(Number(value?.mousePlayer)||0),0,4),players:[]};
    for(let i=0;i<4;i++){
      const v=value?.players?.[i]||{},bindings={};
      for(const action of actions)if(Array.isArray(v.bindings?.[action]))bindings[action]=v.bindings[action].filter(tokenValid).slice(0,12);
      result.players.push({touch:['fixed','floating','dpad'].includes(v.touch)?v.touch:'fixed',size:clamp(Number(v.size)||1,.75,1.3),stickX:clamp(Number.isFinite(v.stickX)?v.stickX:.5,0,1),stickY:clamp(Number.isFinite(v.stickY)?v.stickY:.5,0,1),pad:Number.isInteger(v.pad)?clamp(v.pad,-1,15):i,bindings});
    }return result;
  }
  function keyToken(event){
    if(event.code)return 'key:'+event.code;
    const key=event.key||'',special={' ':'Space',Esc:'Escape'};
    return 'key:'+(special[key]||(/^[a-z]$/i.test(key)?'Key'+key.toUpperCase():/^[0-9]$/.test(key)?'Digit'+key:key));
  }
  class Input {
    constructor(config){this.config=preferences(config);this.count=this.config.count;this.keys=new Set();this.mouse=new Set();this.mouseTarget=null;this.sequence=0;this.states=Array.from({length:4},()=>({x:0,y:0,fire:new Set(),firePulse:false,bomb:0,previousBomb:false,previousPause:false}));this.padBlocked=new Set();this.setCount(this.count);}
    configure(config){this.config=preferences(config);this.setCount(this.config.count);}
    bindings(index){return Object.assign(defaults(index,this.count),this.config.players[index].bindings);}
    setCount(count){
      this.count=clamp(Math.floor(count)||1,1,4);const used=new Set(),conflicts=[];
      // 单人期间可用任一手柄；加入玩家时停用后加入方的重复分配，避免一只手柄驱动两架飞机。
      // Solo may use any controller; joining players lose duplicate assignments so one pad cannot drive two ships.
      for(let i=0;i<this.count;i++){const p=this.config.players[i];if(p.pad<0)continue;if(used.has(p.pad)){p.pad=-1;conflicts.push(i);}else used.add(p.pad);}
      this.clear();return conflicts;
    }
    clear(){this.keys.clear();this.mouse.clear();this.mouseTarget=null;this.pausePulse=false;for(const s of this.states){s.x=s.y=0;s.fire.clear();s.firePulse=false;s.bomb=0;s.previousBomb=s.previousPause=false;}for(let i=0;i<16;i++)this.padBlocked.add(i);}
    commit(){for(const s of this.states){s.firePulse=false;s.bomb=0;}}
    move(index,x,y){const length=Math.hypot(x,y)||1;this.states[index].x=x/Math.max(1,length);this.states[index].y=y/Math.max(1,length);}
    touchFire(index,id,down){const s=this.states[index];if(down){s.fire.add(id);s.firePulse=true;}else s.fire.delete(id);}
    pulse(index,action){if(action==='bomb')this.states[index].bomb=++this.sequence;else if(action==='fire')this.states[index].firePulse=true;}
    key(event,down){const token=keyToken(event);if(down){if(!this.keys.has(token))for(let i=0;i<this.count;i++){const b=this.bindings(i);if(b.fire.includes(token))this.pulse(i,'fire');if(b.bomb.includes(token)){this.pulse(i,'bomb');this.states[i].previousBomb=true;}if(b.pause.includes(token)){this.pausePulse=true;this.states[i].previousPause=true;}}this.keys.add(token);this.mouseTarget=null;}else this.keys.delete(token);return token;}
    bind(index,action,token){
      if(!Number.isInteger(index)||index<0||index>=this.states.length||!actions.includes(action)||!tokenValid(token)||token==='key:Escape')return false;
      const category=token.split(':')[0];
      for(let i=0;i<this.config.players.length;i++)for(const other of actions){
        if(i>=this.count&&i!==index)continue;
        if(i===index&&other===action)continue;
        if(category==='pad'&&this.config.players[i].pad!==this.config.players[index].pad)continue;
        if(category==='mouse'&&i!==index)continue;
        if(this.bindings(i)[other].includes(token))return false;
      }
      this.config.players[index].bindings[action]=this.bindings(index)[action].filter(t=>!t.startsWith(category+':')).concat(token);this.clear();return true;
    }
    sample(pads=[],players=[]){
      let pause=!!this.pausePulse;this.pausePulse=false;
      const inputs=Array.from({length:this.count},(_,index)=>{
        const config=this.config.players[index],s=this.states[index],map=this.bindings(index),pad=pads[config.pad];
        const pressed=pad?.connected!==false&&pad?pad.buttons.map(b=>typeof b==='number'?b>.5:b.pressed||b.value>.5):[];
        const axes=pad?.axes||[],neutral=!pressed.some(Boolean)&&axes.every(a=>Math.abs(a)<.18);
        if(neutral)this.padBlocked.delete(config.pad);
        const ready=pad&&!this.padBlocked.has(config.pad);
        const held=action=>map[action].some(t=>t.startsWith('key:')?this.keys.has(t):t.startsWith('mouse:')?this.config.mousePlayer===index+1&&this.mouse.has(Number(t.slice(6))):ready&&pressed[Number(t.slice(4))]);
        const axis=n=>ready&&Number.isFinite(axes[n])&&Math.abs(axes[n])>.18?Math.sign(axes[n])*(Math.abs(axes[n])-.18)/.82:0;
        let x=s.x+Number(held('right'))-Number(held('left'))+axis(0),y=s.y+Number(held('down'))-Number(held('up'))+axis(1);
        if(this.config.mousePlayer===index+1&&this.mouseTarget&&players[index]&&!x&&!y){x=(this.mouseTarget.x-players[index].x)/18;y=(this.mouseTarget.y-players[index].y)/18;if(Math.hypot(x,y)<.12)x=y=0;}
        const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;
        const bomb=!!held('bomb'),paused=!!held('pause');if(bomb&&!s.previousBomb)this.pulse(index,'bomb');if(paused&&!s.previousPause)pause=true;s.previousBomb=bomb;s.previousPause=paused;
        return {x,y,fire:s.fire.size>0||s.firePulse||!!held('fire'),bomb:s.bomb};
      });return {players:inputs,pause};
    }
    export(){return copy(this.config);}
  }
  globalThis.DemonStarInput={Input,preferences,defaults,actions,keyToken,tokenValid};
})();
