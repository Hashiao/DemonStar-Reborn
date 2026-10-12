/* SPDX-License-Identifier: MIT. 多设备玩家动作层 / Per-player device input. */
(() => {
  'use strict';
  const actions=['up','down','left','right','fire','bomb','pause'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),copy=v=>JSON.parse(JSON.stringify(v));
  // 圆形杆满幅斜推时两轴满速；径向幅度和死区仍控制轻推速度。
  // A fully tilted circular stick reaches both axis caps; radial magnitude/dead zone preserve partial speed.
  function stickAxes(x,y,deadZone=0){
    if(!Number.isFinite(x)||!Number.isFinite(y))return {x:0,y:0};
    const radius=Math.hypot(x,y);if(radius<=deadZone||!radius)return {x:0,y:0};
    const magnitude=(Math.min(1,radius)-deadZone)/(1-deadZone),peak=Math.max(Math.abs(x),Math.abs(y));
    return {x:x/peak*magnitude,y:y/peak*magnitude};
  }
  const tokenValid=t=>typeof t==='string'&&/^(key:[A-Za-z0-9]{1,32}|mouse:[0-4]|pad:(?:[0-9]|[12][0-9]|3[01]))$/.test(t);
  function defaults(index,count=1){
    const rows=[['KeyW','KeyS','KeyA','KeyD','KeyZ','KeyX','KeyP'],['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ControlRight','ShiftRight','Pause'],['Numpad8','Numpad2','Numpad4','Numpad6','Numpad0','NumpadDecimal','NumpadEnter'],['KeyI','KeyK','KeyJ','KeyL','KeyN','KeyM','KeyO']];
    const result={};actions.forEach((a,i)=>result[a]=['key:'+rows[index][i],'pad:'+([12,13,14,15,0,1,9][i])]);
    result.fire.push('mouse:0');result.bomb.push('mouse:2');
    if(index===0){result.bomb.push('key:Space');if(count===1){['up','down','left','right'].forEach((a,i)=>result[a].push('key:'+rows[1][i]));result.fire.push('key:KeyJ');result.bomb.push('key:KeyK');}}
    return result;
  }
  function preferences(value){
    const result={version:3,count:clamp(Math.floor(Number(value?.count)||1),1,4),doubleTapBomb:value?.doubleTapBomb===true,mousePlayer:clamp(Math.floor(Number(value?.mousePlayer)||0),0,4),players:[]};
    for(let i=0;i<4;i++){
      const v=value?.players?.[i]||{},bindings={};
      for(const action of actions)if(Array.isArray(v.bindings?.[action]))bindings[action]=v.bindings[action].filter(tokenValid).slice(0,12);
      // 旧实验设置给 P2 改过键后缺少鼠标类别；保留自定义鼠标键及明确空映射。
      // Legacy experimental P2 remaps omitted mouse defaults; preserve custom mouse tokens and explicit empty mappings.
      if(!([2,3].includes(value?.version))&&i>0)for(const [action,button] of [['fire',0],['bomb',2]])if(bindings[action]?.length&&bindings[action].length<12&&!bindings[action].some(t=>t.startsWith('mouse:')))bindings[action].push('mouse:'+button);
      // 按用户要求统一改为浮动摇杆；本版之后的手动选择仍可保存。
      // Reset every pre-release touch preference to floating; subsequent explicit choices remain persistent.
      result.players.push({moveSpeed:['slow','medium','fast'].includes(v.moveSpeed)?v.moveSpeed:'medium',touch:value?.version===3&&['fixed','floating','dpad','point','tilt'].includes(v.touch)?v.touch:'floating',tiltAngle:clamp(Number(v.tiltAngle)||6,3,30),tiltInvertX:v.tiltInvertX===true,tiltInvertY:v.tiltInvertY===true,fireMode:v.fireMode==='hold'?'hold':'toggle',size:clamp(Number(v.size)||1,.75,1.3),stickX:clamp(Number.isFinite(v.stickX)?v.stickX:.5,0,1),stickY:clamp(Number.isFinite(v.stickY)?v.stickY:.5,0,1),pad:Number.isInteger(v.pad)?clamp(v.pad,-1,15):i,bindings});
    }return result;
  }
  function keyToken(event){
    if(event.code)return 'key:'+event.code;
    const key=event.key||'',special={' ':'Space',Esc:'Escape'};
    return 'key:'+(special[key]||(/^[a-z]$/i.test(key)?'Key'+key.toUpperCase():/^[0-9]$/.test(key)?'Digit'+key:key));
  }
  class Input {
    constructor(config){this.config=preferences(config);this.count=this.config.count;this.keys=new Set();this.mouse=new Set();this.mouseTarget=null;this.sequence=0;this.states=Array.from({length:4},()=>({x:0,y:0,fire:new Set(),firePulse:false,fireLatched:false,fireActive:false,fireEnabled:true,previousPadFire:false,blockPadFire:false,padConnected:false,lives:null,bomb:0,previousBomb:false,previousPause:false}));this.padBlocked=new Set();this.setCount(this.count);}
    configure(config){this.config=preferences(config);this.setCount(this.config.count);}
    // 联机设备只有一套本机动作，归属于分配到的网络玩家；保留离线鼠标分配。
    // A network device has one local action stream for its assigned peer; retain its offline mouse assignment.
    get mouseOwner(){return this.localOnly&&this.config.mousePlayer?1:this.config.mousePlayer;}
    bindings(index){return Object.assign(defaults(index,this.count),this.config.players[index].bindings);}
    setCount(count){
      this.count=clamp(Math.floor(count)||1,1,4);const used=new Set(),conflicts=[];
      // 单人期间可用任一手柄；加入玩家时停用后加入方的重复分配，避免一只手柄驱动两架飞机。
      // Solo may use any controller; joining players lose duplicate assignments so one pad cannot drive two ships.
      for(let i=0;i<this.count;i++){const p=this.config.players[i];if(p.pad<0)continue;if(used.has(p.pad)){p.pad=-1;conflicts.push(i);}else used.add(p.pad);}
      this.clear();return conflicts;
    }
    // 暂停只清理实体输入；死亡、换关和模式变更还必须清除持续开火。
    // Pause clears physical input; death, stage changes and mode changes also clear latched fire.
    clear(preserveFire=false){this.keys.clear();this.mouse.clear();this.mouseTarget=null;this.pausePulse=false;for(const s of this.states){s.x=s.y=0;s.target=null;s.holdStart=null;s.holdNotified=false;s.fire.clear();s.firePulse=s.fireActive=false;s.bomb=0;s.previousBomb=s.previousPause=s.previousPadFire=false;if(!preserveFire){s.fireLatched=false;s.lives=null;}}for(let i=0;i<16;i++)this.padBlocked.add(i);}
    resetFire(index){const s=this.states[index];if(!s)return;s.fireLatched=s.fireActive=s.firePulse=false;s.fire.clear();s.target=null;s.holdStart=null;s.holdNotified=false;s.blockPadFire=true;for(const token of this.bindings(index).fire){if(token.startsWith('key:'))this.keys.delete(token);else if(token.startsWith('mouse:')&&this.mouseOwner===index+1)this.mouse.delete(Number(token.slice(6)));}}
    setFireMode(index,mode){if(!this.config.players[index]||!['toggle','hold'].includes(mode))return false;if(this.config.players[index].fireMode!==mode){this.config.players[index].fireMode=mode;this.resetFire(index);}return true;}
    firing(index){return this.config.players[index].fireMode==='toggle'?this.states[index].fireLatched:(this.states[index].fireActive||this.states[index].fire.size>0||this.states[index].firePulse);}
    mouseButton(button,down){if(down){if(!this.mouse.has(button)&&this.mouseOwner){const i=this.mouseOwner-1;for(const action of ['fire','bomb'])if(this.bindings(i)[action].includes('mouse:'+button)){this.pulse(i,action);if(action==='bomb')this.states[i].previousBomb=true;}}this.mouse.add(button);}else this.mouse.delete(button);}

    // 同屏限制只改变有效方式，不覆盖单人偏好。 / Local restrictions preserve solo preferences.
    mode(index){const mode=this.config.players[index].touch;if(this.count>1&&!this.localOnly){if(mode==='tilt')return 'floating';if(mode==='point'&&this.config.players.slice(0,index).some(p=>p.touch==='point'))return 'floating';}return this.motionFallback&&mode==='tilt'?'floating':mode;}
    point(index,x,y){if(this.mode(index)==='point'&&Number.isFinite(x)&&Number.isFinite(y))this.states[index].target={x:clamp(x,16,384),y:clamp(y,64,440)};}
    holdHints(now){const hints=[];for(let i=0;i<this.count;i++){const s=this.states[i];if(s.physicalFire&&s.fireEnabled&&this.config.players[i].fireMode==='toggle'&&s.fireLatched){if(s.holdStart==null)s.holdStart=now;if(!s.holdNotified&&now-s.holdStart>=1200){s.holdNotified=true;hints.push(i);}}else{s.holdStart=null;s.holdNotified=false;}}return hints;}
    commit(){for(const s of this.states){s.firePulse=false;s.bomb=0;}}
    move(index,x,y){this.states[index].x=clamp(Number.isFinite(x)?x:0,-1,1);this.states[index].y=clamp(Number.isFinite(y)?y:0,-1,1);}
    touchFire(index,id,down){const s=this.states[index];if(down){if(!s.fire.has(id))this.pulse(index,'fire');s.fire.add(id);}else s.fire.delete(id);}
    pulse(index,action){if(action==='bomb')this.states[index].bomb=++this.sequence;else if(action==='fire'){const s=this.states[index];if(!s.fireEnabled)return;if(this.config.players[index].fireMode==='toggle')s.fireLatched=!s.fireLatched;else s.firePulse=true;}}
    key(event,down,fireAllowed=true){const token=keyToken(event);if(down){if(!this.keys.has(token))for(let i=0;i<this.count;i++){const b=this.bindings(i);if(fireAllowed&&b.fire.includes(token))this.pulse(i,'fire');if(b.bomb.includes(token)){this.pulse(i,'bomb');this.states[i].previousBomb=true;}if(b.pause.includes(token)){this.pausePulse=true;this.states[i].previousPause=true;}}this.keys.add(token);this.mouseTarget=null;}else this.keys.delete(token);return token;}
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
      this.config.players[index].bindings[action]=this.bindings(index)[action].filter(t=>!t.startsWith(category+':')).concat(token);this.clear(true);this.resetFire(index);return true;
    }
    sample(pads=[],players=[],active=true){
      let pause=!!this.pausePulse;this.pausePulse=false;
      const inputs=Array.from({length:this.count},(_,index)=>{
        const config=this.config.players[index],s=this.states[index],map=this.bindings(index),pad=pads[config.pad];
        const actor=players[index];if(Number.isFinite(actor?.lives)){if(s.lives!==null&&actor.lives<s.lives)this.resetFire(index);s.lives=actor.lives;}
        s.fireEnabled=active&&(!actor||actor.lives!==0&&!(actor.respawn>0));
        const connected=!!pad&&pad.connected!==false;if(s.padConnected&&!connected)this.resetFire(index);s.padConnected=connected;
        const pressed=pad?.connected!==false&&pad?pad.buttons.map(b=>typeof b==='number'?b>.5:b.pressed||b.value>.5):[];
        const axes=pad?.axes||[],neutral=!pressed.some(Boolean)&&axes.every(a=>Math.abs(a)<.18);
        if(neutral)this.padBlocked.delete(config.pad);
        const ready=pad&&!this.padBlocked.has(config.pad);
        const held=action=>map[action].some(t=>t.startsWith('key:')?this.keys.has(t):t.startsWith('mouse:')?this.mouseOwner===index+1&&this.mouse.has(Number(t.slice(6))):ready&&pressed[Number(t.slice(4))]);
        const padFire=!!ready&&map.fire.some(t=>t.startsWith('pad:')&&pressed[Number(t.slice(4))]);if(!padFire)s.blockPadFire=false;if(s.fireEnabled&&padFire&&!s.previousPadFire&&!s.blockPadFire)this.pulse(index,'fire');s.previousPadFire=padFire;
        const stick=ready?stickAxes(axes[0]||0,axes[1]||0,.18):{x:0,y:0};
        let x=s.x+Number(held('right'))-Number(held('left'))+stick.x,y=s.y+Number(held('down'))-Number(held('up'))+stick.y;
        if(this.mode(index)==='tilt'&&this.tiltAxes){x+=this.tiltAxes.x;y+=this.tiltAxes.y;}
        if(x||y)s.target=null;
        let target=active&&this.mode(index)==='point'&&s.fireEnabled?s.target:null;
        // 鼠标与跟手共用引擎目标限速，靠近目标只缩短最后一步。
        // Mouse and follow-finger share engine target limits, shortening only the final step.
        if(active&&s.fireEnabled&&!x&&!y&&this.mouseOwner===index+1&&this.mouseTarget&&players[index])target={x:clamp(this.mouseTarget.x,16,384),y:clamp(this.mouseTarget.y,64,440)};
        x=clamp(x,-1,1);y=clamp(y,-1,1);
        const bomb=!!held('bomb'),paused=!!held('pause');if(bomb&&!s.previousBomb)this.pulse(index,'bomb');if(paused&&!s.previousPause)pause=true;s.previousBomb=bomb;s.previousPause=paused;
        s.fireActive=s.fireEnabled&&(s.fire.size>0||s.firePulse||map.fire.some(t=>t.startsWith('key:')?this.keys.has(t):t.startsWith('mouse:')?this.mouseOwner===index+1&&this.mouse.has(Number(t.slice(6))):padFire&&!s.blockPadFire));
        s.physicalFire=s.fireActive&&!s.firePulse;
        return {x,y,moveSpeed:config.moveSpeed,fire:config.fireMode==='toggle'?s.fireLatched:s.fireActive,bomb:s.bomb,...(target?{target:{...target}}:{})};
      });return {players:inputs,pause};
    }
    export(){return copy(this.config);}
  }
  globalThis.DemonStarInput={Input,preferences,defaults,actions,keyToken,tokenValid,stickAxes};
})();
