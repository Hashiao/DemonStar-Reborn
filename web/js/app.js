/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  function hideDialog(){const el=$('dialog');el.hidden=true;el.setAttribute('aria-modal','false');el.setAttribute('aria-hidden','true');}
  const { Game, DIFFICULTIES, STAGES, WEAPONS, W, H, clamp } = StarfallCore;
  const game=new Game(), renderer=new StarfallRenderer($('game')), audio=new StarfallAudio(), music=new DemonStarMusicPlayer();
  let saved={best:[0,0,0,0],unlocked:[1,1,1,1],difficulty:1,sound:true,music:true,musicPreferenceVersion:1,enemyHealthBars:true,musicVolume:.35,soundVolume:1};
  try { const s=JSON.parse(localStorage.getItem('demonstar-reborn-v1')||'null'); if(s && typeof s==='object'){
    saved.best=Array.from({length:4},(_,i)=>Math.max(0,Math.floor(Number(s.best?.[i])||0)));
    saved.unlocked=Array.from({length:4},(_,i)=>clamp(Math.floor(Number(s.unlocked?.[i])||1),1,18));
    saved.difficulty=clamp(Math.floor(Number(s.difficulty)||0),0,3);saved.sound=s.sound!==false;
    // Enable BGM once when migrating pre-default-on saves. Later explicit
    // mute choices remain persistent, including a deliberately zero volume.
    saved.music=s.musicPreferenceVersion===1?s.music!==false:true;
    saved.musicVolume=clamp(Number.isFinite(s.musicVolume)&&(s.musicPreferenceVersion===1||s.musicVolume>0)?s.musicVolume:.35,0,1);saved.soundVolume=clamp(Number.isFinite(s.soundVolume)?s.soundVolume:1,0,1);saved.enemyHealthBars=s.enemyHealthBars!==false;
  }} catch { /* Private browsing and corrupt saves are recoverable. */ }
  let selectedStage=1, pointer=null, previous=0, accumulator=0, toastTime=0, pickupTime=0, lastPhase='menu', hudTick=0, dialogReturn=null, firePulse=false;
  const stick={x:0,y:0},firePointers=new Set();
  const keys=new Set(); audio.enabled=saved.sound;music.setEnabled(saved.music);music.volume=saved.musicVolume;audio.volume=saved.soundVolume;renderer.enemyHealthBars=saved.enemyHealthBars;
  const persist=()=>{try{localStorage.setItem('demonstar-reborn-v1',JSON.stringify(saved));}catch{}};
  persist();
  const fmt=n=>String(Math.floor(n)).padStart(7,'0');
  function menuInfo(){ $('best').textContent=fmt(saved.best[saved.difficulty]);$('difficulty').textContent=`难度 · ${DIFFICULTIES[saved.difficulty].name}`;$('unlock-label').textContent=`${String(saved.unlocked[saved.difficulty]).padStart(2,'0')} / 18`;$('sound').textContent=`音效 ${saved.sound?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(saved.sound));$('start').innerHTML=`开始游戏 <span>关卡 ${String(selectedStage).padStart(2,'0')} →</span>`; }
  function saveScore(){if(game.score>saved.best[game.difficulty]){saved.best[game.difficulty]=game.score;persist();}}
  function clearInput(){keys.clear();pointer=null;stick.x=stick.y=0;firePointers.clear();firePulse=false;$('stick-knob').style.transform='translate(0,0)';$('fire').classList.remove('held');}
  function toast(text,seconds=2){$('toast').textContent=text;$('toast').hidden=false;toastTime=seconds;}
  function start(stage=selectedStage){audio.unlock();music.unlock();music.resume();music.stage(stage);hideDialog();$('menu').hidden=true;$('controls').hidden=false;$('hud').hidden=false;clearInput();pickupTime=0;$('pickup-status').textContent='';$('weapon-icon').classList.remove('collected');game.start(saved.difficulty,stage);lastPhase='playing';previous=0;accumulator=0;updateHud();}
  function showMenu(){audio.stopAll();audio.setScene('menu');saveScore();game.phase='menu';music.resume();music.menu();$('menu').hidden=false;hideDialog();$('controls').hidden=true;$('hud').hidden=true;$('toast').hidden=true;clearInput();menuInfo();$('start').focus({preventScroll:true});}
  function dialog(tag,title,content,buttons){
    clearInput();$('dialog-tag').textContent=tag;$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;$('dialog-buttons').replaceChildren();
    for(const [label,action,secondary] of buttons){const b=document.createElement('button');b.textContent=label;b.className=secondary?'secondary':'primary';b.addEventListener('click',()=>{audio.unlock();action();});$('dialog-buttons').append(b);}
    $('dialog').hidden=false;$('dialog').setAttribute('aria-modal','true');$('dialog').setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('dialog-buttons').querySelector('button')?.focus({preventScroll:true}));
  }
  function resume(){game.resume();hideDialog();$('pause').focus({preventScroll:true});previous=0;accumulator=0;clearInput();audio.unlock();music.resume();}
  function settingsRows(){return `<div class="dialog-setting">音效 <button class="secondary" id="sfx-toggle" aria-pressed="${saved.sound}">${saved.sound?'开启':'关闭'}</button></div><label class="dialog-setting">音效音量 <input id="sfx-volume" aria-label="音效音量" type="range" min="0" max="100" value="${Math.round(saved.soundVolume*100)}"></label><div class="dialog-setting">背景音乐 <button class="secondary" id="music-toggle" aria-pressed="${saved.music}">${saved.music?'开启':'关闭'}</button></div><label class="dialog-setting">音乐音量 <input id="music-volume" aria-label="音乐音量" type="range" min="0" max="100" value="${Math.round(saved.musicVolume*100)}"></label><div class="dialog-setting">敌机血条 <button class="secondary" id="health-toggle" aria-pressed="${saved.enemyHealthBars}">${saved.enemyHealthBars?'开启':'关闭'}</button></div>`;}
  function bindSettings(){
    const toggle=(id,key,apply)=>{$(id).onclick=()=>{saved[key]=!saved[key];$(id).textContent=saved[key]?'开启':'关闭';$(id).setAttribute('aria-pressed',String(saved[key]));apply();persist();};};
    toggle('health-toggle','enemyHealthBars',()=>{renderer.enemyHealthBars=saved.enemyHealthBars;updateHud();});
    toggle('music-toggle','music',()=>{music.setEnabled(saved.music);});
    toggle('sfx-toggle','sound',()=>{audio.enabled=saved.sound;if(saved.sound)audio.unlock();else audio.stopAll();menuInfo();});
    $('music-volume').oninput=()=>{saved.musicVolume=Number($('music-volume').value)/100;music.volume=saved.musicVolume;music.update(!!audio.missionSource&&audio.enabled&&audio.volume>0);persist();};
    $('sfx-volume').oninput=()=>{saved.soundVolume=Number($('sfx-volume').value)/100;audio.volume=saved.soundVolume;if(audio.master)audio.master.gain.value=.4*audio.volume;persist();};
  }
  function showSettings(){dialog('游戏设置','游戏设置',settingsRows(),[['返回机库',hideDialog]]);bindSettings();}
  function pause(){if(!game.pause())return;audio.suspend();music.suspend();saveScore();dialog('游戏已暂停','暂时停靠',`<p>战机已悬停。准备好了就继续。</p>${settingsRows()}`,[['继续飞行',resume],['返回主菜单',()=>dialog('返回主菜单','结束本次飞行？','<p>最高分与已解锁关卡会保留，本次战斗进度将结束。</p>',[['继续飞行',resume],['结束并返回',showMenu,true]]),true]]);bindSettings();}
  function showHelp(){
    dialogReturn=game.phase==='playing'?'playing':game.phase;if(dialogReturn==='playing')game.pause();
    dialog('游戏说明','飞行指南','<ul class="guide"><li><b>移动</b>　左侧虚拟摇杆移动；<span class="keyboard-help">电脑使用 WASD 或方向键。</span>按住右侧 A 开火，松开停止；电脑按住 Z / J。</li><li><b>炸弹</b>　点击右侧 B <span class="keyboard-help">或按空格。</span>清除弹幕并对 Boss 造成伤害。</li><li><b>补给</b>　彩色球同色升档、换色回最低档；三色 S 直接满火力，满级再吃 S 或同色球触发清屏弹。E 补满能量，晶体恢复 2 格，M 导弹，B 炸弹。部分补给循环换色，接触拾取。</li><li><b>躲避</b>　避开敌机与弹幕，装甲耗尽会损失生命并重置火力。</li><li><b>暂停</b>　点击 Ⅱ <span class="keyboard-help">或按 Esc / P。</span>切到后台会自动暂停。</li></ul><p class="dialog-footer">原作 18 关地图 · 4 档难度 · 离线存档<br>非官方 DemonStar 同人重制 · v0.2.4</p>',[['准备起飞',()=>{if(dialogReturn==='playing')resume();else hideDialog();}]]);
  }
  function showMissions(){
    dialog('原版战役','选择出击点',`<div class="mission-grid">${STAGES.map(s=>`<button data-stage="${s.id}" ${s.id>saved.unlocked[saved.difficulty]?'disabled':''}>${String(s.id).padStart(2,'0')}<small>${s.name}</small></button>`).join('')}</div><p class="dialog-footer">通过上一关即可解锁。各难度单独保存进度。</p>`,[['返回机库',()=>{hideDialog();},true]]);
    document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{selectedStage=Number(b.dataset.stage);hideDialog();menuInfo();});
  }
  function results(){
    music.results();saveScore();const won=game.phase==='cleared'||game.phase==='victory';
    if(won){saved.unlocked[game.difficulty]=Math.max(saved.unlocked[game.difficulty],Math.min(18,game.stage.id+1));persist();}
    const accuracy=game.shotsFired?Math.min(100,Math.round(game.shotsHit/game.shotsFired*100)):0;
    const content=`<div class="result-score">${fmt(game.score)}</div><div class="stat-row">击落敌机<b>${game.kills}</b></div><div class="stat-row">命中率<b>${accuracy}%</b></div><div class="stat-row">飞行时间<b>${Math.floor(game.totalTime/60)}:${String(Math.floor(game.totalTime%60)).padStart(2,'0')}</b></div><div class="stat-row">当前关卡<b>${game.stage.id} / 18</b></div>`;
    const actions=game.phase==='cleared'?[['下一关 →',()=>{game.nextStage();music.stage(game.stage.id);music.resume();hideDialog();lastPhase='playing';updateHud();}]]:[['再次出击',()=>start(game.phase==='victory'?1:game.stage.id)]];
    actions.push(['返回机库',showMenu,true]);
    dialog(won?'任务完成':'战斗记录',game.phase==='victory'?'星海已重获自由':won?'防线已突破':'任务结束',content,actions);
  }
  function updateHud(){
    if(!game.player)return;
    // Avoid recreating accessibility text nodes every frame on mobile WebViews.
    const text=(id,value)=>{const e=$(id);if(e.textContent!==value)e.textContent=value;};
    const label=(id,value)=>{const e=$(id);if(e.getAttribute('aria-label')!==value)e.setAttribute('aria-label',value);};
    const p=game.player;text('score',fmt(game.score));label('score',`得分 ${game.score}`);label('lives',`剩余 ${p.lives} 条生命，备用战机 ${Math.max(0,p.lives-1)} 架`);text('stage-label',`关卡 ${String(game.stage.id).padStart(2,'0')}`);
    const lives=String(Math.min(6,Math.max(0,p.lives-1)));if($('lives').dataset.count!==lives){$('lives').innerHTML='<i class="hud-sprite ship-icon" aria-hidden="true"></i>'.repeat(Number(lives));$('lives').dataset.count=lives;}
    const stock=p.bombInventory.join(',');if($('bomb-stock').dataset.stock!==stock){$('bomb-stock').innerHTML=p.bombInventory.map(n=>`<i class="hud-sprite bomb-icon-${n}" aria-hidden="true"></i>`).join('');$('bomb-stock').dataset.stock=stock;}
    label('bomb-stock',`炸弹 ${p.bombs} 枚，后拾取先使用`);label('energy',`能量 ${Math.ceil(p.energy)} / ${p.maxEnergy}`);
    if(!$('energy').children.length)$('energy').innerHTML='<i aria-hidden="true"></i>'.repeat(16);
    Array.from($('energy').children).forEach((segment,i)=>segment.classList.toggle('filled',i<Math.ceil(p.energy)));
    text('weapon',p.defaultWeapon?'双联机炮':`${WEAPONS[p.weapon]} · ${p.power} 级`);
    const id=p.defaultWeapon?16:[2,3,4,14][p.weapon],colors=['#ffd661','#72baff','#ff737b','#ffac54'];
    $('weapon-icon').style.backgroundPosition=`${id%4/3*100}% ${Math.floor(id/4)/4*100}%`;
    $('power-meter').style.color=p.defaultWeapon?'#9da8b5':colors[p.weapon];label('power-meter',`增强等级 ${p.power} / 6`);
    Array.from($('power-meter').children).forEach((segment,i)=>segment.classList.toggle('filled',i<p.power));
    text('shield-label',p.defaultWeapon?'拾取颜色球选择武器':p.power===6?'同色或 S 触发清屏':'同色升档 · 换色重置');
    const gear=[p.missileAmmo?{id:p.missileType,text:`${p.missileType===9?'追踪':'导弹'} ${p.missileAmmo}`} : null,p.side?{id:12,text:`侧射 ${p.side}`} : null,p.rear?{id:13,text:`后射 ${p.rear}`} : null,p.shield>0?{id:7,text:'护盾'} : null].filter(Boolean);
    const gearKey=gear.map(g=>g.id+':'+g.text).join('|');if($('aux-equipment').dataset.key!==gearKey){$('aux-equipment').innerHTML=gear.map(g=>`<span><i class="gear-icon gear-${g.id}" aria-hidden="true"></i>${g.text}</span>`).join('');$('aux-equipment').dataset.key=gearKey;}
    text('bomb-count',String(p.bombs));$('bomb').disabled=p.bombs<=0||p.bombCooldown>1e-9||p.respawn>0;label('bomb',`B 释放炸弹，剩余 ${p.bombs} 枚`);
    $('boss-hud').hidden=!game.boss||!saved.enemyHealthBars;if(game.boss){text('boss-name',game.stage.boss);$('boss-health').style.width=`${Math.max(0,game.boss.hp/game.boss.maxHp*100)}%`;}
  }
  function frame(t){
    let dt=previous?Math.min(.1,(t-previous)/1000):0;previous=t;
    if(game.phase==='playing'){
      accumulator+=dt;
      const input={x:stick.x+Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:stick.y+Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w')),fire:firePointers.size>0||keys.has('z')||keys.has('j')||firePulse};
      let ticks=0;const oldFrame=game.frame;while(accumulator>=1/60&&ticks++<6){game.update(1/60,input);accumulator-=1/60;}if(game.frame!==oldFrame)firePulse=false;
    }else accumulator=0;
    audio.update(dt,game.phase!=='paused'&&game.phase!=='menu'&&!document.hidden);
    for(const e of game.drainEvents()){
      audio.effect(e.type,e);
      if(e.type==='stage'){music.stage(e.stage);toast(`任务开始 · 第 ${String(e.stage).padStart(2,'0')} 关`);}
      if(e.type==='pickup'||e.type==='nova'){const message=e.type==='nova'?['质子清屏','离子清屏','等离子清屏','磁力清屏'][e.weapon]:({weapon:'质子补给',ion:'离子补给',plasma:'等离子补给',magnetic:'磁力补给',energy:'装甲修复',full:'火力全满',shield:'能量护盾',bomb:'炸弹补给',scatter:'散射补给',mega:'脉冲补给',missile:'导弹补给',homing:'追踪补给',side:'侧向火力',rear:'后向火力',medal:'获得勋章',crystal:'能量 +2'}[e.item]||'获得补给');$('pickup-status').textContent=message;pickupTime=1.4;$('weapon-icon').classList.add('collected');}
    }
    if(game.phase!==lastPhase){if(['cleared','victory','gameover'].includes(game.phase))results();lastPhase=game.phase;}
    if(toastTime>0&&game.phase!=='paused'){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}
    if(pickupTime>0&&game.phase!=='paused'){pickupTime-=dt;if(pickupTime<=0){$('pickup-status').textContent='';$('weapon-icon').classList.remove('collected');}}
    music.update(!!audio.missionSource&&audio.enabled&&audio.volume>0);renderer.draw(game,dt);hudTick+=dt;if(hudTick>.06){updateHud();hudTick=0;}requestAnimationFrame(frame);
  }
  const bomb=()=>{audio.unlock();game.useBomb();updateHud();};
  $('settings').onclick=showSettings;$('start').onclick=()=>start();$('pause').onclick=pause;$('bomb').addEventListener('pointerdown',e=>{e.preventDefault();bomb();});$('bomb').onclick=e=>{if(e.detail===0)bomb();};$('help').onclick=showHelp;$('desktop-help').onclick=showHelp;$('missions').onclick=showMissions;
  $('difficulty').onclick=()=>{saved.difficulty=(saved.difficulty+1)%4;selectedStage=1;persist();menuInfo();};
  $('sound').onclick=()=>{saved.sound=!saved.sound;audio.enabled=saved.sound;if(saved.sound)audio.unlock();else audio.suspend();persist();menuInfo();};
  function updateStick(e){const rect=$('joystick').getBoundingClientRect(),radius=rect.width*.36;let x=(e.clientX-rect.left-rect.width/2)/radius,y=(e.clientY-rect.top-rect.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}if(length<.12)x=y=0;stick.x=x;stick.y=y;$('stick-knob').style.transform=`translate(${x*radius*.65}px,${y*radius*.65}px)`;}
  function capture(el,id){try{el.setPointerCapture(id);}catch{/* Synthetic events and old WebKit have no native capture. */}}
  $('joystick').addEventListener('pointerdown',e=>{if(game.phase!=='playing'||!$('dialog').hidden||pointer!==null)return;e.preventDefault();audio.unlock();pointer=e.pointerId;capture($('joystick'),e.pointerId);updateStick(e);});
  window.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||game.phase!=='playing')return;updateStick(e);e.preventDefault();},{passive:false});
  $('fire').addEventListener('pointerdown',e=>{if(game.phase!=='playing'||!$('dialog').hidden)return;e.preventDefault();audio.unlock();firePointers.add(e.pointerId);firePulse=true;$('fire').classList.add('held');capture($('fire'),e.pointerId);});
  $('fire').addEventListener('click',e=>{if(e.detail===0&&game.phase==='playing')firePulse=true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{if(pointer===e.pointerId){pointer=null;stick.x=stick.y=0;$('stick-knob').style.transform='translate(0,0)';}firePointers.delete(e.pointerId);$('fire').classList.toggle('held',firePointers.size>0);if(event==='pointercancel')firePulse=false;});
  $('screen').addEventListener('pointerup',e=>{if(game.phase==='menu'&&$('dialog').hidden&&!$('menu').hidden&&!e.target.closest('button'))start();});
  window.addEventListener('keydown',e=>{
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','z','j','x','k'].includes(key)&&game.phase==='playing')e.preventDefault();
    if(e.repeat)return;
    if(key==='Enter'&&game.phase==='menu'&&$('dialog').hidden){e.preventDefault();start();return;}
    if(key==='Escape'||key==='p'){if(game.phase==='playing')pause();else if(game.phase==='paused')resume();else if(!$('dialog').hidden)hideDialog();return;}
    if([' ','x','k'].includes(key)&&game.phase==='playing'){game.useBomb();updateHud();return;}if(['z','j'].includes(key)&&game.phase==='playing')firePulse=true;keys.add(key);
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  function background(){clearInput();pause();audio.suspend();music.suspend();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)background();else{previous=0;if(game.phase==='menu')music.resume();}});window.addEventListener('blur',background);window.addEventListener('focus',()=>{if(game.phase==='menu')music.resume();});
  window.addEventListener('pagehide',()=>{saveScore();background();});
  window.addEventListener('resize',()=>{clearInput();renderer.resize();});
  globalThis.StarfallApp={game,background,back:()=>{if(game.phase==='playing')pause();else if(game.phase==='paused')resume();else if(!$('dialog').hidden)hideDialog();},start,showMenu,renderer,music,audio};
  document.addEventListener('click',e=>{if(e.target.closest('button')){music.unlock();if(saved.sound){audio.unlock();if(!['fire','bomb','start'].includes(e.target.closest('button').id))audio.effect('menu');}}});
  menuInfo();requestAnimationFrame(frame);
})();
