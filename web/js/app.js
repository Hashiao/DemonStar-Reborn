/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), I=DemonStarI18n, t=I.t;
  const VERSION='0.2.7', weaponName=n=>t('weapon'+n);
  let settingsContext='menu',pickupKey=null,storageAvailable=true;
  function hideDialog(){const el=$('dialog');el.hidden=true;el.setAttribute('aria-modal','false');el.setAttribute('aria-hidden','true');}
  const { Game, DIFFICULTIES, STAGES, WEAPONS, W, H, clamp } = StarfallCore;
  const game=new Game(), renderer=new StarfallRenderer($('game')), audio=new StarfallAudio(), music=new DemonStarMusicPlayer();
  let saved={language:I.detect(I.preferred()),best:[0,0,0,0],unlocked:[1,1,1,1],difficulty:1,sound:true,music:true,musicPreferenceVersion:1,enemyHealthBars:false,bossHealthBars:true,healthBarsVersion:1,musicVolume:.35,soundVolume:1};
  try { const s=JSON.parse(localStorage.getItem('demonstar-reborn-v1')||'null'); if(s && typeof s==='object'){
    saved.language=I.resolve(s.language,I.preferred());
    // 旧版合并开关一次性迁移为仅 Boss；之后分别尊重两项选择。
    // Migrate the old combined switch once to Boss-only, then preserve independent choices.
    saved.best=Array.from({length:4},(_,i)=>Math.max(0,Math.floor(Number(s.best?.[i])||0)));
    saved.unlocked=Array.from({length:4},(_,i)=>clamp(Math.floor(Number(s.unlocked?.[i])||1),1,18));
    saved.difficulty=clamp(Math.floor(Number(s.difficulty)||0),0,3);saved.sound=s.sound!==false;
    // 升级旧存档只开启一次 BGM，之后尊重静音和零音量设置。
    // Enable BGM once when migrating pre-default-on saves. Later explicit
    // mute choices remain persistent, including a deliberately zero volume.
    saved.music=s.musicPreferenceVersion===1?s.music!==false:true;
    saved.musicVolume=clamp(Number.isFinite(s.musicVolume)&&(s.musicPreferenceVersion===1||s.musicVolume>0)?s.musicVolume:.35,0,1);saved.soundVolume=clamp(Number.isFinite(s.soundVolume)?s.soundVolume:1,0,1);if(s.healthBarsVersion===1){saved.enemyHealthBars=s.enemyHealthBars===true;saved.bossHealthBars=s.bossHealthBars!==false;}
  }} catch { /* 隐私模式/损坏存档可恢复。Private browsing/corrupt saves are recoverable. */ }
  I.select(saved.language);I.apply();
  let selectedStage=1, pointer=null, previous=0, accumulator=0, toastTime=0, pickupTime=0, lastPhase='menu', hudTick=0, dialogReturn=null, firePulse=false;
  const stick={x:0,y:0},firePointers=new Set();
  const keys=new Set(); audio.enabled=saved.sound;music.setEnabled(saved.music);music.volume=saved.musicVolume;audio.volume=saved.soundVolume;renderer.enemyHealthBars=saved.enemyHealthBars;
  const persist=()=>{try{localStorage.setItem('demonstar-reborn-v1',JSON.stringify(saved));storageAvailable=true;}catch{storageAvailable=false;}};
  persist();
  const fmt=n=>String(Math.floor(n)).padStart(7,'0');
  function menuInfo(){ $('best').textContent=fmt(saved.best[saved.difficulty]);$('difficulty').textContent=t('difficulty',{name:t('difficulty'+saved.difficulty)});$('unlock-label').textContent=`${String(saved.unlocked[saved.difficulty]).padStart(2,'0')} / 18`;$('sound').textContent=t('soundMenu',{state:t(saved.sound?'onShort':'offShort')});$('sound').setAttribute('aria-pressed',String(saved.sound));$('start').innerHTML=`${t('start')} <span>${t('stage',{n:String(selectedStage).padStart(2,'0')})} →</span>`; }
  function changeLanguage(locale){
    if(!I.select(locale))return;
    // 只刷新文案并保存语言，不重启引擎或覆盖战斗/解锁数据。
    // Refresh copy and persist the locale without restarting combat or replacing progress.
    saved.language=I.locale;persist();I.apply();menuInfo();updateHud();
    if(pickupKey&&pickupTime>0)$('pickup-status').textContent=t(pickupKey);
    if(settingsContext==='pause')showPauseDialog();else showSettings();
    $('language').focus({preventScroll:true});
  }
  function saveScore(){if(game.score>saved.best[game.difficulty]){saved.best[game.difficulty]=game.score;persist();}}
  function clearInput(){keys.clear();pointer=null;stick.x=stick.y=0;firePointers.clear();firePulse=false;$('stick-knob').style.transform='translate(0,0)';$('fire').classList.remove('held');}
  function toast(text,seconds=2){$('toast').textContent=text;$('toast').hidden=false;toastTime=seconds;}
  function start(stage=selectedStage){audio.unlock();music.unlock();music.resume();music.stage(stage);hideDialog();$('menu').hidden=true;$('controls').hidden=false;$('hud').hidden=false;clearInput();pickupTime=0;pickupKey=null;$('pickup-status').textContent='';$('weapon-icon').classList.remove('collected');game.start(saved.difficulty,stage,true);lastPhase=game.phase;$('toast').hidden=true;previous=0;accumulator=0;updateHud();}
  function showMenu(){audio.stopAll();audio.setScene('menu');saveScore();game.phase='menu';music.resume();music.menu();$('menu').hidden=false;hideDialog();$('controls').hidden=true;$('hud').hidden=true;$('toast').hidden=true;clearInput();menuInfo();$('start').focus({preventScroll:true});}
  function dialog(tag,title,content,buttons){
    clearInput();$('dialog-tag').textContent=tag;$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;$('dialog-buttons').replaceChildren();
    for(const [label,action,secondary] of buttons){const b=document.createElement('button');b.textContent=label;b.className=secondary?'secondary':'primary';b.addEventListener('click',()=>{audio.unlock();action();});$('dialog-buttons').append(b);}
    $('dialog').hidden=false;$('dialog').setAttribute('aria-modal','true');$('dialog').setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('dialog-buttons').querySelector('button')?.focus({preventScroll:true}));
  }
  function resume(){game.resume();hideDialog();$('pause').focus({preventScroll:true});previous=0;accumulator=0;clearInput();audio.unlock();music.resume();}
  function settingsRows(){return `<label class="dialog-setting language-setting">${t('language')}<select id="language" aria-label="${t('language')}">${I.locales.map((locale,i)=>`<option value="${locale}" ${locale===I.locale?'selected':''}>${['简体中文','繁體中文','English'][i]}</option>`).join('')}</select></label><p class="language-hint">${t(storageAvailable?'languageHint':'languageSessionHint')}</p><div class="dialog-setting">${t('sfx')} <button class="secondary" id="sfx-toggle" aria-label="${t('sfx')} ${t(saved.sound?'on':'off')}" aria-pressed="${saved.sound}">${t(saved.sound?'on':'off')}</button></div><label class="dialog-setting">${t('sfxVolume')} <input id="sfx-volume" aria-label="${t('sfxVolume')}" type="range" min="0" max="100" value="${Math.round(saved.soundVolume*100)}"></label><div class="dialog-setting">${t('music')} <button class="secondary" id="music-toggle" aria-label="${t('music')} ${t(saved.music?'on':'off')}" aria-pressed="${saved.music}">${t(saved.music?'on':'off')}</button></div><label class="dialog-setting">${t('musicVolume')} <input id="music-volume" aria-label="${t('musicVolume')}" type="range" min="0" max="100" value="${Math.round(saved.musicVolume*100)}"></label><div class="dialog-setting">${t('healthBars')} <button class="secondary" id="health-toggle" aria-label="${t('healthBars')} ${t(saved.enemyHealthBars?'on':'off')}" aria-pressed="${saved.enemyHealthBars}">${t(saved.enemyHealthBars?'on':'off')}</button></div><p class="language-hint">${t('healthBarsHint')}</p><div class="dialog-setting">${t('bossHealthBars')} <button class="secondary" id="boss-health-toggle" aria-label="${t('bossHealthBars')} ${t(saved.bossHealthBars?'on':'off')}" aria-pressed="${saved.bossHealthBars}">${t(saved.bossHealthBars?'on':'off')}</button></div>`; }
  function bindSettings(){
    $('language').onchange=()=>changeLanguage($('language').value);
    const toggle=(id,key,apply)=>{$(id).onclick=()=>{saved[key]=!saved[key];$(id).textContent=t(saved[key]?'on':'off');$(id).setAttribute('aria-pressed',String(saved[key]));$(id).setAttribute('aria-label',t({'health-toggle':'healthBars','boss-health-toggle':'bossHealthBars','music-toggle':'music','sfx-toggle':'sfx'}[id])+' '+t(saved[key]?'on':'off'));apply();persist();};};
    toggle('boss-health-toggle','bossHealthBars',updateHud);
    toggle('health-toggle','enemyHealthBars',()=>{renderer.enemyHealthBars=saved.enemyHealthBars;updateHud();});
    toggle('music-toggle','music',()=>{music.setEnabled(saved.music);});
    toggle('sfx-toggle','sound',()=>{audio.enabled=saved.sound;if(saved.sound)audio.unlock();else audio.stopAll();menuInfo();});
    $('music-volume').oninput=()=>{saved.musicVolume=Number($('music-volume').value)/100;music.volume=saved.musicVolume;music.update(!!audio.missionSource&&audio.enabled&&audio.volume>0);persist();};
    $('sfx-volume').oninput=()=>{saved.soundVolume=Number($('sfx-volume').value)/100;audio.volume=saved.soundVolume;if(audio.master)audio.master.gain.value=.4*audio.volume;persist();};
  }
  function showSettings(){settingsContext='menu';dialog(t('gameSettings'),t('gameSettings'),settingsRows(),[[t('hangar'),hideDialog]]);bindSettings();}
  function showPauseDialog(){settingsContext='pause';dialog(t('pausedTag'),t('pausedTitle'),`<p>${t('pausedBody')}</p>${settingsRows()}`,[[t('resume'),resume],[t('mainMenu'),()=>dialog(t('mainMenu'),t('quitTitle'),`<p>${t('quitBody')}</p>`,[[t('resume'),resume],[t('quit'),showMenu,true]]),true]]);bindSettings();}
  function pause(){if(!game.pause())return;audio.suspend();music.suspend();saveScore();showPauseDialog();}
  function showHelp(){
    dialogReturn=['playing','launch','aftermath'].includes(game.phase)?'active':game.phase;if(dialogReturn==='active'){game.pause();audio.suspend();music.suspend();}
    dialog(t('helpTag'),t('helpTitle'),`<ul class="guide">${t('guideHtml')}</ul><p class="dialog-footer">${t('guideFooterHtml',{version:VERSION})}</p>`,[[t('ready'),()=>{if(dialogReturn==='active')resume();else hideDialog();}]]);
  }
  function showMissions(){
    dialog(t('campaign'),t('missionTitle'),`<div class="mission-grid">${STAGES.map(s=>`<button data-stage="${s.id}" ${s.id>saved.unlocked[saved.difficulty]?'disabled':''}>${String(s.id).padStart(2,'0')}<small>${t('stageName',{n:s.id})}</small></button>`).join('')}</div><p class="dialog-footer">${t('missionHint')}</p>`,[[t('hangar'),hideDialog,true]]);
    document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{selectedStage=Number(b.dataset.stage);hideDialog();menuInfo();});
  }
  function results(){
    music.results();saveScore();const won=game.phase==='cleared'||game.phase==='victory';
    if(won){saved.unlocked[game.difficulty]=Math.max(saved.unlocked[game.difficulty],Math.min(18,game.stage.id+1));persist();}
    const accuracy=game.shotsFired?Math.min(100,Math.round(game.shotsHit/game.shotsFired*100)):0;
    const bonus=won&&game.stageBonus?`<div class="result-bonus"><div class="stat-row">${t('bonusBombs',{n:game.stageBonus.bombs})}<b>+${game.stageBonus.bombScore}</b></div><div class="stat-row">${t('bonusMedals',{n:game.stageBonus.medals})}<b>+${game.stageBonus.medalScore}</b></div><div class="stat-row">${t('bonusTotal')}<b>+${game.stageBonus.total}</b></div></div>`:'';
    const content=`${bonus}<div class="result-score">${fmt(game.score)}</div><div class="stat-row">${t('kills')}<b>${game.kills}</b></div><div class="stat-row">${t('accuracy')}<b>${accuracy}%</b></div><div class="stat-row">${t('flightTime')}<b>${Math.floor(game.totalTime/60)}:${String(Math.floor(game.totalTime%60)).padStart(2,'0')}</b></div><div class="stat-row">${t('currentStage')}<b>${game.stage.id} / 18</b></div>`;
    const actions=game.phase==='cleared'?[[t('nextStage'),()=>{game.nextStage();music.stage(game.stage.id);music.resume();hideDialog();lastPhase=game.phase;clearInput();updateHud();}]]:[[t('retry'),()=>start(game.phase==='victory'?1:game.stage.id)]];
    actions.push([t('hangar'),showMenu,true]);
    dialog(t(won?'missionComplete':'combatLog'),t(game.phase==='victory'?'victory':won?'stageClear':'gameOver'),content,actions);
  }
  function updateHud(){
    if(!game.player)return;
    // 避免逐帧重建无障碍文本，减少移动 WebView 开销。
    // Avoid recreating accessibility text nodes every frame on mobile WebViews.
    const text=(id,value)=>{const e=$(id);if(e.textContent!==value)e.textContent=value;};
    const label=(id,value)=>{const e=$(id);if(e.getAttribute('aria-label')!==value)e.setAttribute('aria-label',value);};
    const p=game.player;$('hud').style.visibility=game.launch&&game.launch.ticks<26?'hidden':'visible';$('controls').dataset.phase=game.phase;
    $('fire').disabled=game.phase!=='playing';
    text('score',fmt(game.score));label('score',t('score',{n:game.score}));label('lives',t('lives',{n:p.lives,spares:Math.max(0,p.lives-1)}));text('stage-label',t('stage',{n:String(game.stage.id).padStart(2,'0')}));
    const lives=String(Math.min(6,Math.max(0,p.lives-1)));if($('lives').dataset.count!==lives){$('lives').innerHTML='<i class="hud-sprite ship-icon" aria-hidden="true"></i>'.repeat(Number(lives));$('lives').dataset.count=lives;}
    const stock=p.bombInventory.join(',');if($('bomb-stock').dataset.stock!==stock){$('bomb-stock').innerHTML=p.bombInventory.map(n=>`<i class="hud-sprite bomb-icon-${n}" aria-hidden="true"></i>`).join('');$('bomb-stock').dataset.stock=stock;}
    label('bomb-stock',t('bombsAria',{n:p.bombs}));label('energy',t('energy',{n:Math.ceil(p.energy),max:p.maxEnergy}));
    if(!$('energy').children.length)$('energy').innerHTML='<i aria-hidden="true"></i>'.repeat(16);
    Array.from($('energy').children).forEach((segment,i)=>segment.classList.toggle('filled',i<Math.ceil(p.energy)));
    text('weapon',p.defaultWeapon?t('baseWeapon'):t('weaponLevel',{name:weaponName(p.weapon),n:p.power}));
    const id=p.defaultWeapon?16:[2,3,4,14][p.weapon],colors=['#ffd661','#72baff','#ff737b','#ffac54'];
    $('weapon-icon').style.backgroundPosition=`${id%4/3*100}% ${Math.floor(id/4)/4*100}%`;
    $('power-meter').style.color=p.defaultWeapon?'#9da8b5':colors[p.weapon];label('power-meter',t('powerAria',{n:p.power}));
    Array.from($('power-meter').children).forEach((segment,i)=>segment.classList.toggle('filled',i<p.power));
    text('shield-label',t(game.launch?'launch':game.phase==='aftermath'?'missionComplete':p.defaultWeapon?'chooseWeapon':p.power===6?'maxPower':'sameColor'));
    const gear=[p.missileAmmo?{id:p.missileType,text:t(p.missileType===9?'gearHoming':'gearMissile',{n:p.missileAmmo})} : null,p.side?{id:12,text:t('gearSide',{n:p.side})} : null,p.rear?{id:13,text:t('gearRear',{n:p.rear})} : null,p.shield>0?{id:7,text:t('gearShield')} : null].filter(Boolean);
    const gearKey=gear.map(g=>g.id+':'+g.text).join('|');if($('aux-equipment').dataset.key!==gearKey){$('aux-equipment').innerHTML=gear.map(g=>`<span><i class="gear-icon gear-${g.id}" aria-hidden="true"></i>${g.text}</span>`).join('');$('aux-equipment').dataset.key=gearKey;}
    text('bomb-count',String(p.bombs));$('bomb').disabled=game.phase!=='playing'||p.bombs<=0||p.bombCooldown>1e-9||p.respawn>0;label('bomb',t('bombAria',{n:p.bombs}));
    $('boss-hud').hidden=!game.boss||!saved.bossHealthBars;if(game.boss){text('boss-name',t('boss',{n:game.stage.id}));$('boss-health').style.width=`${Math.max(0,game.boss.hp/game.boss.maxHp*100)}%`;}
  }
  function frame(timestamp){
    let dt=previous?Math.min(.1,(timestamp-previous)/1000):0;previous=timestamp;
    if(['playing','launch','aftermath'].includes(game.phase)){
      accumulator+=dt;
      const input={x:stick.x+Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:stick.y+Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w')),fire:firePointers.size>0||keys.has('z')||keys.has('j')||firePulse};
      let ticks=0;const oldFrame=game.frame;while(accumulator>=1/60&&ticks++<6){game.update(1/60,input);accumulator-=1/60;}if(game.frame!==oldFrame)firePulse=false;
    }else accumulator=0;
    audio.update(dt,game.phase!=='paused'&&game.phase!=='menu'&&!document.hidden);
    for(const e of game.drainEvents()){
      audio.effect(e.type,e);
      if(e.type==='stage'){music.stage(e.stage);$('toast').hidden=true;}
      if(e.type==='mission-start')clearInput();
      if(e.type==='pickup'||e.type==='nova'){
        pickupKey=e.type==='nova'?'nova'+e.weapon:'pickup'+(e.item?e.item[0].toUpperCase()+e.item.slice(1):'Fallback');
        if(!I.messages.en[pickupKey])pickupKey='pickupFallback';
        $('pickup-status').textContent=t(pickupKey);pickupTime=1.4;$('weapon-icon').classList.add('collected');
      }
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
  function capture(el,id){try{el.setPointerCapture(id);}catch{/* 合成事件和旧 WebKit 无原生捕获。Synthetic events/old WebKit lack native capture. */}}
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
    if(key==='Escape'||key==='p'){if(['playing','launch','aftermath'].includes(game.phase))pause();else if(game.phase==='paused')resume();else if(!$('dialog').hidden)hideDialog();return;}
    if([' ','x','k'].includes(key)&&game.phase==='playing'){game.useBomb();updateHud();return;}if(['z','j'].includes(key)&&game.phase==='playing')firePulse=true;keys.add(key);
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  function background(){clearInput();pause();audio.suspend();music.suspend();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)background();else{previous=0;if(game.phase==='menu')music.resume();}});window.addEventListener('blur',background);window.addEventListener('focus',()=>{if(game.phase==='menu')music.resume();});
  window.addEventListener('pagehide',()=>{saveScore();background();});
  window.addEventListener('resize',()=>{clearInput();renderer.resize();});
  globalThis.StarfallApp={game,i18n:I,background,back:()=>{if(['playing','launch','aftermath'].includes(game.phase))pause();else if(game.phase==='paused')resume();else if(!$('dialog').hidden)hideDialog();},start,showMenu,renderer,music,audio};
  document.addEventListener('click',e=>{if(e.target.closest('button')){music.unlock();if(saved.sound){audio.unlock();if(!['fire','bomb','start'].includes(e.target.closest('button').id))audio.effect('menu');}}});
  menuInfo();requestAnimationFrame(frame);
})();
