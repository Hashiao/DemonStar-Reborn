/* SPDX-License-Identifier: MIT. 双人独立触点与布局 / Independent two-player touch routing. */
(() => {
  const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class TouchControls {
    constructor(input,active,unlock){
      this.input=input;this.active=active;this.unlock=unlock;this.groups=[];
      for(let i=0;i<2;i++){
        const suffix=i?'-2':'',stick=i?$('joystick').cloneNode(true):$('joystick'),actions=i?document.querySelector('.action-buttons').cloneNode(true):document.querySelector('.action-buttons');
        if(i){stick.querySelector('.direction-pad')?.remove();actions.querySelector('.touch-badge')?.remove();for(const e of [stick,...stick.querySelectorAll('[id]'),...actions.querySelectorAll('[id]')])e.id+='-2';$('controls').append(stick,actions);}
        stick.classList.add('touch-stick');actions.classList.add('touch-actions');actions.dataset.player=String(i+1);stick.dataset.player=String(i+1);
        const knob=$('stick-knob'+suffix);knob.classList.add('stick-knob');const zone=document.createElement('div');zone.className='touch-zone';$('controls').insertBefore(zone,$('controls').firstChild);
        const badge=document.createElement('span');badge.className='touch-badge';badge.textContent=String(i+1);actions.appendChild(badge);
        const pad=document.createElement('div');pad.className='direction-pad';
        for(const [symbol,name] of [['↖','upLeft'],['↑','up'],['↗','upRight'],['←','left'],['',''],['→','right'],['↙','downLeft'],['↓','down'],['↘','downRight']]){const b=document.createElement(name?'button':'span');b.textContent=symbol;if(name)b.dataset.direction=name;pad.appendChild(b);}stick.appendChild(pad);
        const group={index:i,stick,knob,actions,zone,pad,fire:$('fire'+suffix),bomb:$('bomb'+suffix),pointer:null,center:null};this.groups.push(group);group.fire.classList.add('fire-button');
        const down=e=>{if(!this.active()||i>=this.input.count||group.pointer!==null)return;e.preventDefault();this.unlock();group.pointer=e.pointerId;
          const rect=stick.getBoundingClientRect();group.center=this.input.config.players[i].touch==='floating'?{x:e.clientX,y:e.clientY}:{x:rect.left+rect.width/2,y:rect.top+rect.height/2};
          if(this.input.config.players[i].touch==='floating'){const screen=$('screen').getBoundingClientRect();stick.style.left=e.clientX-screen.left-rect.width/2+'px';stick.style.top=e.clientY-screen.top-rect.height/2+'px';}
          this.capture(e.currentTarget,e.pointerId);this.move(group,e);
        };stick.addEventListener('pointerdown',down);zone.addEventListener('pointerdown',down);
        group.fire.addEventListener('pointerdown',e=>{if(!this.active())return;e.preventDefault();this.unlock();this.input.touchFire(i,e.pointerId,true);group.fire.classList.add('held');this.capture(group.fire,e.pointerId);});
        group.fire.addEventListener('click',e=>{if(e.detail===0&&this.active())this.input.pulse(i,'fire');});
        group.bomb.addEventListener('pointerdown',e=>{if(!this.active())return;e.preventDefault();this.unlock();this.input.pulse(i,'bomb');});
        group.bomb.addEventListener('click',e=>{if(e.detail===0&&this.active())this.input.pulse(i,'bomb');});
      }
      window.addEventListener('pointermove',e=>{if(!this.active())return;for(const g of this.groups)if(g.pointer===e.pointerId){this.move(g,e);e.preventDefault();}},{passive:false});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{for(const g of this.groups){const owned=g.pointer===e.pointerId||this.input.states[g.index].fire.has(e.pointerId);if(g.pointer===e.pointerId){g.pointer=null;this.input.move(g.index,0,0);g.knob.style.transform='translate(0,0)';g.stick.style.left=g.home.x+'px';g.stick.style.top=g.home.y+'px';}this.input.touchFire(g.index,e.pointerId,false);g.fire.classList.toggle('held',this.input.states[g.index].fire.size>0);if(type==='pointercancel'&&owned)this.input.states[g.index].firePulse=false;}});
    }
    capture(el,id){try{el.setPointerCapture(id);}catch{/* 旧 WebKit 合成事件 / Legacy WebKit synthetic events. */}}
    move(g,e){const radius=g.stick.getBoundingClientRect().width*.36;let x=(e.clientX-g.center.x)/radius,y=(e.clientY-g.center.y)/radius,length=Math.hypot(x,y);
      if(length<.12)x=y=0;else if(this.input.config.players[g.index].touch==='dpad'){const angle=Math.round(Math.atan2(y,x)/(Math.PI/4))*Math.PI/4;x=Math.cos(angle);y=Math.sin(angle);}else if(length>1){x/=length;y/=length;}
      this.input.move(g.index,x,y);g.knob.style.transform=`translate(${x*radius*.65}px,${y*radius*.65}px)`;
    }
    clear(){for(const g of this.groups){g.pointer=null;g.knob.style.transform='translate(0,0)';g.fire.classList.remove('held');}if(this.lastLayout)this.layout(this.lastLayout);}
    layout(layout){
      this.lastLayout=layout;const {w,h,wide,x:fieldX}=layout,cooperative=this.input.count>1,controls=$('controls');controls.classList.toggle('cooperative',cooperative);$('screen').classList.toggle('multiplayer',(this.partyCount||this.input.count)>1);
      const height=Math.min(180,Math.max(124,h*.19));
      for(const g of this.groups){
        const i=g.index,c=this.input.config.players[i],visible=i===0||cooperative;g.stick.hidden=g.actions.hidden=!visible;g.zone.hidden=!visible||c.touch!=='floating';g.stick.dataset.mode=c.touch;g.pad.hidden=c.touch!=='dpad';g.knob.hidden=c.touch==='dpad';
        let zone,buttonSize,actionX,actionY,vertical=false;
        if(cooperative&&wide){const side=Math.max(100,fieldX);zone={x:i?w-side:0,y:h*.48,w:side,h:h*.5-15};buttonSize=Math.min(46,(side-20)/2);actionX=zone.x+side/2-buttonSize-4;actionY=h*.25;}
        else if(cooperative){const half=w/2;zone={x:i*half+4,y:h-height+15,w:half*.58,h:height-28};buttonSize=Math.min(48,Math.max(36,half*.24));actionX=(i+1)*half-buttonSize-8;actionY=h-height+20;vertical=true;}
        else if(wide){zone={x:4,y:h*.46,w:Math.max(104,fieldX-8),h:h*.49-12};buttonSize=Math.min(68,Math.max(48,w*.145));actionX=w-Math.max(10,(fieldX-buttonSize)/2)-buttonSize;actionY=h*.43-buttonSize/2;vertical=true;}
        else{zone={x:8,y:h-height+8,w:w*.49-12,h:height-20};buttonSize=Math.min(68,Math.max(48,w*.145));actionX=w-Math.max(18,w*.055)-buttonSize*2-24;actionY=h-height+29;}
        const size=Math.min(zone.w-8,zone.h-8,(cooperative?86:120)*c.size),sx=zone.x+4+(zone.w-size-8)*c.stickX,sy=zone.y+4+(zone.h-size-8)*c.stickY;g.home={x:sx,y:sy};
        Object.assign(g.stick.style,{left:sx+'px',top:sy+'px',width:size+'px',height:size+'px'});Object.assign(g.zone.style,{left:zone.x+'px',top:zone.y+'px',width:zone.w+'px',height:zone.h+'px'});
        Object.assign(g.actions.style,{left:actionX+'px',right:'auto',top:actionY+'px',flexDirection:vertical?'column-reverse':'row'});
        for(const b of [g.fire,g.bomb])Object.assign(b.style,{width:buttonSize+'px',height:buttonSize+'px',margin:'0'});
        g.fire.style[vertical?'marginBottom':'marginLeft']=cooperative?'10px':'14px';
      }
      this.localize();
    }
    localize(){const t=DemonStarI18n.t;for(const g of this.groups){const id=(this.localSlot||1)+g.index;g.stick.setAttribute('aria-label',t('playerControls',{n:id}));g.zone.setAttribute('aria-label',t('floatingArea',{n:id}));g.actions.querySelector('.touch-badge').textContent=String(id);for(const b of g.pad.querySelectorAll('button'))b.setAttribute('aria-label',t('direction'+b.dataset.direction));}}
    update(game){for(const g of this.groups){const id=(this.localSlot||1)+g.index,p=game.playerById(id),multi=(this.partyCount||this.input.count)>1;g.fire.disabled=!p||game.phase!=='playing'||p.lives<=0||p.respawn>0;g.bomb.disabled=g.fire.disabled||!p.bombs||p.bombCooldown>1e-9;g.fire.setAttribute('aria-label',DemonStarI18n.t(multi?'playerFire':'fireAria',{n:id}));g.bomb.setAttribute('aria-label',DemonStarI18n.t(multi?'playerBomb':'bombAria',{n:multi?id:p?.bombs||0,b:p?.bombs||0}));if(g.index)$('bomb-count-2').textContent=String(p?.bombs||0);}}
  }
  globalThis.DemonStarTouchControls=TouchControls;
})();
