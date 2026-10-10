/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), I=DemonStarI18n, t=I.t;
  const VERSION='0.2.10', weaponName=n=>t('weapon'+n);
  let settingsContext='menu',pickupKey=null,storageAvailable=true;
  function hideDialog(){const el=$('dialog');el.hidden=true;el.setAttribute('aria-modal','false');el.setAttribute('aria-hidden','true');}
  const { Game, DIFFICULTIES, STAGES, WEAPONS, W, H, clamp } = StarfallCore;
  const game=new Game(), renderer=new StarfallRenderer($('game')), audio=new StarfallAudio(), music=new DemonStarMusicPlayer();
  let saved={language:I.detect(I.preferred()),best:[0,0,0,0],unlocked:[1,1,1,1],difficulty:1,sound:true,music:true,musicPreferenceVersion:1,enemyHealthBars:false,bossHealthBars:true,healthBarsVersion:1,musicVolume:.35,soundVolume:1};
  saved.haptics=true;
  try { const s=JSON.parse(localStorage.getItem('demonstar-reborn-v1')||'null'); if(s && typeof s==='object'){
    saved.language=I.resolve(s.language,I.preferred());saved.input=s.input;saved.haptics=s.haptics!==false;
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
  let selectedStage=1,previous=0,accumulator=0,toastTime=0,pickupTime=0,lastPhase='menu',hudTick=0,dialogReturn=null,touch,captureBinding=null,controlPlayer=0,roomOpen=false;
  const input=new DemonStarInput.Input(saved.input),saves=new DemonStarSaveStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
  // 当前开放单/双人；四人只保留底层协议能力。
  // Expose solo/two-player modes; four seats remain a protocol reserve.
  input.config.count=Math.min(2,input.config.count);if(input.config.mousePlayer>2)input.config.mousePlayer=0;input.setCount(input.config.count);
  const lan=new DemonStarLAN.Session(DemonStarNative,game,{maxPlayers:2,change:lanChanged,frame:receivedFrame,pause});
  saved.input=input.export();audio.enabled=saved.sound;music.setEnabled(saved.music);music.volume=saved.musicVolume;audio.volume=saved.soundVolume;renderer.enemyHealthBars=saved.enemyHealthBars;
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
  function clearInput(){input.clear();touch?.clear();}
  function toast(text,seconds=2){$('toast').textContent=text;$('toast').hidden=false;toastTime=seconds;}
  function enterRun(){roomOpen=false;audio.stopAll();audio.unlock();music.unlock();music.resume();music.stage(game.stage.id);hideDialog();$('menu').hidden=true;$('controls').hidden=false;$('hud').hidden=false;input.localOnly=lan.role!=='offline';input.setCount(lan.role==='offline'?game.players.length:1);touch.localSlot=lan.role==='client'?lan.localSlot:1;touch.partyCount=game.players.length;clearInput();touch.layout(renderer.layout);pickupTime=0;pickupKey=null;$('pickup-status').textContent='';$('weapon-icon').classList.remove('collected');lastPhase=game.phase;$('toast').hidden=true;previous=0;accumulator=0;updateHud();if(game.phase==='paused'){audio.suspend();music.suspend();showPauseDialog();}}
  function applyConnections(){if(lan.role==='host')for(const p of game.players)p.connected=lan.members.find(m=>m.slot===p.id)?.connected!==false;}
  function start(stage=selectedStage){if(lan.role==='client'){toast(t('lanHostOnly'));return;}game.start(saved.difficulty,stage,true,{playerCount:Math.min(2,lan.role==='host'?lan.members.length:input.config.count),mode:lan.role==='host'?'lan':'local'});applyConnections();enterRun();if(lan.role==='host')lan.flush();}
  function showMenu(){roomOpen=false;if(lan.role!=='offline')lan.leave();input.localOnly=false;input.setCount(input.config.count);touch.localSlot=1;touch.partyCount=input.count;audio.stopAll();audio.setScene('menu');saveScore();game.phase='menu';music.resume();music.menu();$('menu').hidden=false;hideDialog();$('controls').hidden=true;$('hud').hidden=true;$('toast').hidden=true;clearInput();menuInfo();$('start').focus({preventScroll:true});}
  function dialog(tag,title,content,buttons){
    roomOpen=false;captureBinding=null;
    $('dialog').classList.remove('classic-results');
    clearInput();$('dialog-tag').textContent=tag;$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;$('dialog-buttons').replaceChildren();
    for(const [label,action,secondary] of buttons){const b=document.createElement('button');b.textContent=label;b.className=secondary?'secondary':'primary';b.addEventListener('click',()=>{audio.unlock();action();});$('dialog-buttons').append(b);}
    $('dialog').hidden=false;$('dialog').setAttribute('aria-modal','true');$('dialog').setAttribute('aria-hidden','false');$('dialog').scrollTop=0;requestAnimationFrame(()=>($('dialog-content').querySelector('select,input,button')||$('dialog-buttons').querySelector('button'))?.focus({preventScroll:true}));
  }
  function resume(){if(lan.role==='client'){toast(t('lanHostOnly'));return;}game.resume();hideDialog();$('pause').focus({preventScroll:true});previous=0;accumulator=0;clearInput();audio.unlock();music.resume();if(lan.role==='host')lan.flush();}
  function settingsRows(){return `<label class="dialog-setting language-setting">${t('language')}<select id="language" aria-label="${t('language')}">${I.locales.map((locale,i)=>`<option value="${locale}" ${locale===I.locale?'selected':''}>${['简体中文','繁體中文','English'][i]}</option>`).join('')}</select></label><p class="language-hint">${t(storageAvailable?'languageHint':'languageSessionHint')}</p><div class="dialog-setting">${t('sfx')} <button class="secondary" id="sfx-toggle" aria-label="${t('sfx')} ${t(saved.sound?'on':'off')}" aria-pressed="${saved.sound}">${t(saved.sound?'on':'off')}</button></div><label class="dialog-setting">${t('sfxVolume')} <input id="sfx-volume" aria-label="${t('sfxVolume')}" type="range" min="0" max="100" value="${Math.round(saved.soundVolume*100)}"></label><div class="dialog-setting">${t('music')} <button class="secondary" id="music-toggle" aria-label="${t('music')} ${t(saved.music?'on':'off')}" aria-pressed="${saved.music}">${t(saved.music?'on':'off')}</button></div><label class="dialog-setting">${t('musicVolume')} <input id="music-volume" aria-label="${t('musicVolume')}" type="range" min="0" max="100" value="${Math.round(saved.musicVolume*100)}"></label><div class="dialog-setting">${t('healthBars')} <button class="secondary" id="health-toggle" aria-label="${t('healthBars')} ${t(saved.enemyHealthBars?'on':'off')}" aria-pressed="${saved.enemyHealthBars}">${t(saved.enemyHealthBars?'on':'off')}</button></div><p class="language-hint">${t('healthBarsHint')}</p><div class="dialog-setting">${t('bossHealthBars')} <button class="secondary" id="boss-health-toggle" aria-label="${t('bossHealthBars')} ${t(saved.bossHealthBars?'on':'off')}" aria-pressed="${saved.bossHealthBars}">${t(saved.bossHealthBars?'on':'off')}</button></div>`; }
  function bindSettings(){
    $('language').onchange=()=>changeLanguage($('language').value);
    $('control-settings').onclick=()=>showControls();$('stage-settings').onclick=showMissions;$('save-settings').onclick=()=>showSaves();$('lan-settings').onclick=showRoom;
    const toggle=(id,key,apply)=>{$(id).onclick=()=>{saved[key]=!saved[key];$(id).textContent=t(saved[key]?'on':'off');$(id).setAttribute('aria-pressed',String(saved[key]));$(id).setAttribute('aria-label',t({'health-toggle':'healthBars','boss-health-toggle':'bossHealthBars','music-toggle':'music','sfx-toggle':'sfx','haptic-toggle':'haptics'}[id])+' '+t(saved[key]?'on':'off'));apply();persist();};};
    toggle('boss-health-toggle','bossHealthBars',updateHud);
    toggle('haptic-toggle','haptics',()=>{});
    toggle('health-toggle','enemyHealthBars',()=>{renderer.enemyHealthBars=saved.enemyHealthBars;updateHud();});
    toggle('music-toggle','music',()=>{music.setEnabled(saved.music);});
    toggle('sfx-toggle','sound',()=>{audio.enabled=saved.sound;if(saved.sound)audio.unlock();else audio.stopAll();menuInfo();});
    $('music-volume').oninput=()=>{saved.musicVolume=Number($('music-volume').value)/100;music.volume=saved.musicVolume;music.update(!!audio.missionSource&&audio.enabled&&audio.volume>0);persist();};
    $('sfx-volume').oninput=()=>{saved.soundVolume=Number($('sfx-volume').value)/100;audio.volume=saved.soundVolume;if(audio.master)audio.master.gain.value=.4*audio.volume;persist();};
  }
  function extraSettings(){return `<div class="dialog-setting">${t('haptics')}<button id="haptic-toggle" class="secondary" aria-pressed="${saved.haptics}" aria-label="${t('haptics')} ${t(saved.haptics?'on':'off')}">${t(saved.haptics?'on':'off')}</button></div><p class="language-hint">${t('hapticsHint')}</p><div class="config-grid"><button id="control-settings" class="secondary">${t('inputSettings')}</button><button id="stage-settings" class="secondary" ${lan.role==='client'?'disabled':''}>${t('missionTitle')}</button><button id="save-settings" class="secondary">${t('saveMenu')}</button><button id="lan-settings" class="secondary">${t('lanTitle')}</button></div>`;}
  function showSettings(){settingsContext='menu';dialog(t('gameSettings'),t('gameSettings'),settingsRows()+extraSettings(),[[t('hangar'),hideDialog]]);bindSettings();}
  function showPauseDialog(){settingsContext='pause';dialog(t('pausedTag'),t('pausedTitle'),`<p>${t(lan.role==='client'?'lanHostOnly':'pausedBody')}</p>${settingsRows()}${extraSettings()}`,[[t(lan.role==='client'?'lanRoom':'resume'),lan.role==='client'?showRoom:resume],[t('mainMenu'),()=>dialog(t('mainMenu'),t('quitTitle'),`<p>${t('quitBody')}</p>`,[[t(lan.role==='client'?'backSettings':'resume'),lan.role==='client'?showPauseDialog:resume],[t('quit'),showMenu,true]]),true]]);bindSettings();}
  function pause(){if(lan.role==='client'){clearInput();lan.requestPause();return;}if(!game.pause())return;audio.suspend();music.suspend();saveScore();showPauseDialog();if(lan.role==='host')lan.flush();}
  function showHelp(){
    dialogReturn=['playing','launch','aftermath'].includes(game.phase)?'active':game.phase;if(dialogReturn==='active'){game.pause();audio.suspend();music.suspend();}
    dialog(t('helpTag'),t('helpTitle'),`<ul class="guide">${t('guideHtml')}</ul><p class="dialog-footer">${t('guideFooterHtml',{version:VERSION})}</p>`,[[t('ready'),()=>{if(dialogReturn==='active')resume();else hideDialog();}]]);
  }
  function showMissions(){
    if(lan.role==='client'){toast(t('lanHostOnly'));return;}
    const active=game.phase==='paused';
    dialog(t('campaign'),t('missionTitle'),`<div class="mission-grid">${STAGES.map(s=>`<button data-stage="${s.id}">${String(s.id).padStart(2,'0')}<small>${t('stageName',{n:s.id})}</small></button>`).join('')}</div><p class="dialog-footer">${t(active?'stageRestartHint':'freeStageHint')}</p>`,[[t(active?'backSettings':'hangar'),active?showPauseDialog:hideDialog,true]]);
    document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{selectedStage=Number(b.dataset.stage);if(active){saveScore();start(selectedStage);}else{hideDialog();menuInfo();}});
  }
  const backSettings=()=>settingsContext==='pause'?showPauseDialog():showSettings();
  function lanChanged(){if(lan.role==='offline')return;if(['disconnected','rejected','error'].includes(lan.status)){clearInput();audio.suspend();music.suspend();}if(roomOpen||['disconnected','rejected','error'].includes(lan.status))showRoom();}
  function receivedFrame(info){if(info.first||info.nextEpoch)enterRun();}
  function showRoom(){
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const errorKeys={'room-code':'lanBadCode','room-full':'lanFull','player-limit':'playerLimit','game-started':'lanStarted','local-network-permission':'lanPermission','timeout':'lanTimeout','disconnected':'lanDisconnected'};
    if(!DemonStarNative.available){dialog(t('lanTitle'),t('lanTitle'),`<p>${t('lanNativeOnly')}</p>`,[[t('backSettings'),backSettings]]);return;}
    const error=lan.error?`<p class="input-note" role="status">${t(errorKeys[lan.error]||'lanConnectError')}</p>`:'';
    if(lan.role==='offline'){
      dialog(t('lanTitle'),t('lanTitle'),`<p>${t('lanHint')}</p><button id="lan-host" class="secondary">${t('lanCreate')}</button><label class="dialog-setting">${t('lanAddress')}<input id="lan-address" inputmode="decimal" placeholder="192.168.1.2" maxlength="15"></label><label class="dialog-setting">${t('lanCode')}<input id="lan-code" inputmode="numeric" maxlength="6"></label><button id="lan-join" class="secondary">${t('lanJoin')}</button>`,[[t('backSettings'),backSettings]]);roomOpen=true;
      $('lan-host').onclick=()=>lan.host();$('lan-join').onclick=()=>{const host=$('lan-address').value.trim(),code=$('lan-code').value.trim();if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)||!/^\d{6}$/.test(code)){toast(t('lanEnterAddress'));return;}lan.join(host,code);};return;
    }
    const roster=lan.members.map(m=>`<li>${t('playerNumber',{n:Number(m.slot)||0})} · ${['android','ios'].includes(m.platform)?m.platform==='ios'?'iOS':'Android':t('lanTestPeer')} · ${t(m.connected?'lanConnected':'lanDisconnected')}</li>`).join('');
    const hostInfo=lan.role==='host'?`<p>${t('lanAddress')}: <b>${escape((lan.addresses||[]).join(' / ')||t('lanWaitingAddress'))}</b></p><p>${t('lanCode')}: <b class="room-code">${escape(lan.code)}</b></p>`:`<p>${t('lanAddress')}: ${escape(lan.hostAddress)}</p><p>${t('lanLocalPlayer',{n:lan.localSlot})}</p>`;
    const actions=[];
    if(lan.role==='host'&&!lan.started&&lan.status==='lobby')actions.push([t('lanStart'),()=>{if(lan.start(saved.difficulty,selectedStage))enterRun();else toast(t('lanNeedPlayers'));}]);
    if(lan.started&&lan.status==='playing')actions.push([t('backSettings'),()=>{roomOpen=false;if(game.phase==='paused')showPauseDialog();else hideDialog();}]);
    if(lan.role==='client'&&['disconnected','rejected','error'].includes(lan.status))actions.push([t('lanReconnect'),()=>{lan.retries=0;lan.connect();}]);
    actions.push([t('lanLeave'),showMenu,true]);
    dialog(t('lanTitle'),t('lanRoom'),`<p>${t('lanStatus'+lan.status)}</p>${hostInfo}${error}<ul class="room-roster">${roster}</ul><p>${t('lanHostRules')}</p>`,actions);roomOpen=true;
  }
  function persistInput(){saved.input=input.export();persist();touch.layout(renderer.layout);}
  function bindingName(token){if(token.startsWith('key:'))return token.slice(4).replace(/^Key/,'').replace(/^Digit/,'');if(token.startsWith('mouse:'))return t('mouseButton',{n:Number(token.slice(6))+1});return t('padButton',{n:Number(token.slice(4))+1});}
  function showControls(note=''){
    if(lan.role!=='offline')controlPlayer=0;
    captureBinding=null;const p=input.config.players[controlPlayer],select=(id,options,value)=>`<select id="${id}">${options.map(([v,label])=>`<option value="${v}" ${String(v)===String(value)?'selected':''}>${label}</option>`).join('')}</select>`;
    const body=`<label class="dialog-setting">${t('playerCount')}${select('player-count',[1,2].map(n=>[n,t('playerCountValue',{n})]),input.config.count)}</label><p>${t('localPlayersHint')}</p><label class="dialog-setting">${t('configurePlayer')}${select('control-player',[1,2].map(n=>[n-1,t('playerNumber',{n})]),controlPlayer)}</label><label class="dialog-setting">${t('touchMode')}${select('touch-mode',['fixed','floating','dpad'].map(m=>[m,t('touch'+m)]),p.touch)}</label><label class="dialog-setting">${t('stickSize')}<input id="stick-size-setting" type="range" min="75" max="130" value="${Math.round(p.size*100)}"></label><label class="dialog-setting">${t('stickHorizontal')}<input id="stick-x-setting" type="range" min="0" max="100" value="${Math.round(p.stickX*100)}"></label><label class="dialog-setting">${t('stickVertical')}<input id="stick-y-setting" type="range" min="0" max="100" value="${Math.round(p.stickY*100)}"></label><label class="dialog-setting">${t('mouseControl')}${select('mouse-player',[[0,t('off')],...(lan.role==='offline'?[1,2].map(n=>[n,t('playerNumber',{n})]):[[1,t('lanLocalPlayer',{n:lan.localSlot})]])],input.mouseOwner)}</label><label class="dialog-setting">${t('controller')}${select('gamepad-index',[[-1,t('off')],...[0,1,2,3].map(n=>[n,t('controllerNumber',{n:n+1})])],p.pad)}</label><p>${t('bindingHint')}</p><p class="input-note" id="binding-status" role="status">${note}</p>${DemonStarInput.actions.map(action=>`<div class="mapping-row"><span>${t('action'+action)}</span><button class="secondary" data-binding="${action}">${input.bindings(controlPlayer)[action].map(bindingName).join(' / ')||t('unbound')}</button></div>`).join('')}`;
    dialog(t('inputSettings'),t('inputSettings'),body,[[t('backSettings'),backSettings],[t('resetControls'),()=>{input.config.players[controlPlayer]=DemonStarInput.preferences().players[controlPlayer];persistInput();showControls();},true]]);
    $('player-count').disabled=game.phase==='paused'||lan.role!=='offline';$('control-player').disabled=lan.role!=='offline';if(lan.role!=='offline'){$('control-player').selectedOptions[0].textContent=t('lanLocalPlayer',{n:lan.localSlot});$('player-count').value='1';$('player-count').closest('label').nextElementSibling.textContent=t('lanInputHint');}$('player-count').onchange=()=>{input.config.count=Number($('player-count').value);const conflicts=input.setCount(input.config.count);persistInput();showControls(conflicts.length?t('controllerConflict'):'');};
    $('control-player').onchange=()=>{controlPlayer=Number($('control-player').value);showControls();};
    $('touch-mode').onchange=()=>{p.touch=$('touch-mode').value;clearInput();persistInput();};
    for(const [id,key,factor] of [['stick-size-setting','size',100],['stick-x-setting','stickX',100],['stick-y-setting','stickY',100]])$(id).oninput=()=>{p[key]=Number($(id).value)/factor;persistInput();};
    $('mouse-player').onchange=()=>{input.config.mousePlayer=Number($('mouse-player').value);clearInput();persistInput();};
    $('gamepad-index').onchange=()=>{const next=Number($('gamepad-index').value);if(next>=0&&input.config.players.some((other,i)=>i!==controlPlayer&&i<input.count&&other.pad===next)){showControls(t('controllerConflict'));return;}p.pad=next;clearInput();persistInput();};
    document.querySelectorAll('[data-binding]').forEach(b=>b.onclick=()=>{captureBinding={player:controlPlayer,action:b.dataset.binding};$('binding-status').textContent=t('bindingWaiting');});
  }
  function acceptBinding(token){if(!captureBinding)return;const {player,action}=captureBinding,ok=input.bind(player,action,token);if(ok)persistInput();showControls(t(ok?'bindingSaved':'bindingConflict'));}
  function showSaves(note=''){
    const active=game.phase==='paused',body=['auto','1','2','3'].map(id=>{const slot=saves.get(id),cp=slot?.checkpoint;return `<div class="save-row"><b>${t(id==='auto'?'autoSave':'saveSlot',{n:id})}</b><p>${cp?t('saveSummary',{stage:cp.stage,n:cp.players.length,score:cp.score}):t('emptySave')}</p><div class="config-grid"><button class="secondary" data-load="${id}" ${cp?'':'disabled'}>${t('loadSave')}</button>${id==='auto'?'':`<button class="secondary" data-save="${id}" ${active?'':'disabled'}>${t('writeSave')}</button>`}</div></div>`;}).join('');
    dialog(t('saveMenu'),t('saveMenu'),`<p>${t('saveEntryHint')}</p><p role="status">${note}</p>${body}`,[[t('backSettings'),backSettings]]);
    document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>showSaves(t(saves.write(b.dataset.save,game.checkpoint())?'saveWritten':'saveFailed')));
    document.querySelectorAll('[data-load]').forEach(b=>{if(lan.role==='client')b.disabled=true;b.onclick=()=>{if(lan.role==='client'){toast(t('lanHostOnly'));return;}const cp=saves.get(b.dataset.load)?.checkpoint;if(cp?.players.length>2){showSaves(t('playerLimit'));return;}if(lan.role==='host'&&cp?.players.length!==lan.members.length){showSaves(t('lanSaveCount'));return;}if(lan.role==='host'&&cp)cp.mode='lan';if(!game.loadCheckpoint(cp,true)){showSaves(t('saveFailed'));return;}applyConnections();saved.difficulty=game.difficulty;if(lan.role==='offline')input.config.count=game.players.length;persistInput();enterRun();if(lan.role==='host')lan.flush();};});
  }
  function results(){
    music.results();saveScore();const won=game.phase==='cleared'||game.phase==='victory';
    if(won){saved.unlocked[game.difficulty]=Math.max(saved.unlocked[game.difficulty],Math.min(18,game.stage.id+1));persist();}
    const accuracy=game.shotsFired?Math.min(100,Math.round(game.shotsHit/game.shotsFired*100)):0;
    // 通关沿用原作战场叠层与每位玩家的图标奖励框。
    // Stage completion uses the original battlefield overlay and per-player icon reward panels.
    const bonus=won?`<div class="result-players">${game.stageBonuses.map(row=>`<section class="result-player" data-player="${row.playerId}" aria-label="${t('playerNumber',{n:row.playerId})}"><h3>${t('playerNumber',{n:row.playerId})}</h3><div class="result-bonus"><div class="bonus-row" aria-label="${t('bonusBombs',{n:row.bombs})}"><span class="bonus-icons" aria-hidden="true"><i class="hud-sprite bomb-icon-0"></i><i class="hud-sprite bomb-icon-1"></i></span><b>${row.bombScore}</b></div><div class="bonus-row" aria-label="${t('bonusMedals',{n:row.medals})}"><i class="gear-icon result-medal" aria-hidden="true"></i><b>${row.medalScore}</b></div><div class="bonus-row bonus-total"><span>${t('resultTotal')}</span><b>${row.total}</b></div></div></section>`).join('')}</div>`:'';
    const content=won?bonus:`<div class="result-score">${fmt(game.score)}</div><div class="stat-row">${t('kills')}<b>${game.kills}</b></div><div class="stat-row">${t('accuracy')}<b>${accuracy}%</b></div><div class="stat-row">${t('flightTime')}<b>${Math.floor(game.totalTime/60)}:${String(Math.floor(game.totalTime%60)).padStart(2,'0')}</b></div><div class="stat-row">${t('currentStage')}<b>${game.stage.id} / 18</b></div>`;
    const actions=lan.role==='client'?[[t('lanRoom'),showRoom]]:game.phase==='cleared'?[[t('nextStage'),()=>{game.nextStage();music.stage(game.stage.id);music.resume();hideDialog();lastPhase=game.phase;clearInput();updateHud();if(lan.role==='host')lan.flush();}]]:[[t('retry'),()=>start(game.phase==='victory'?1:game.stage.id)]];
    actions.push([t('hangar'),showMenu,true]);
    dialog(t(won?'missionComplete':'combatLog'),t(won?'missionComplete':'gameOver'),content,actions);
    if(won)$('dialog').classList.add('classic-results');
  }
  function updateHud(){
    if(!game.player)return;
    // 避免逐帧重建无障碍文本，减少移动 WebView 开销。
    // Avoid recreating accessibility text nodes every frame on mobile WebViews.
    const text=(id,value)=>{const e=$(id);if(e.textContent!==value)e.textContent=value;};
    const label=(id,value)=>{const e=$(id);if(e.getAttribute('aria-label')!==value)e.setAttribute('aria-label',value);};
    const p=lan.role==='client'?game.playerById(lan.localSlot)||game.player:game.player;$('hud').style.visibility=game.launch&&game.launch.ticks<26?'hidden':'visible';$('controls').dataset.phase=game.phase;
    // 多人沿用 1P 的飞机余命、逐枚炸弹和 16 格能量，不改成文字状态表。
    // Multiplayer reuses 1P spare ships, individual bomb icons and sixteen energy segments.
    if(game.players.length>1){
      const html=game.players.map(p=>{const energy=p.lives>0?p.energy:0,bombs=p.lives>0?p.bombInventory:[];return `<div class="coop-player" data-player="${p.id}"><div class="classic-score coop-score"><span class="coop-label" aria-hidden="true">${p.id}UP</span><strong aria-label="${t('playerNumber',{n:p.id})} ${t('score',{n:p.score})}">${fmt(p.score)}</strong><span class="classic-lives" role="img" aria-label="${t('lives',{n:p.lives,spares:Math.max(0,p.lives-1)})}">${'<i class="hud-sprite ship-icon" aria-hidden="true"></i>'.repeat(Math.min(6,Math.max(0,p.lives-1)))}</span></div><div class="classic-status coop-status"><div class="classic-bomb-stock" role="img" aria-label="${t('bombsAria',{n:bombs.length})}">${bombs.map(n=>`<i class="hud-sprite bomb-icon-${n}" aria-hidden="true"></i>`).join('')}</div><div class="energy-row"><i class="hud-sprite ship-icon" aria-hidden="true"></i><span class="classic-energy" role="img" aria-label="${t('energy',{n:Math.ceil(energy),max:p.maxEnergy})}">${Array.from({length:16},(_,i)=>`<i class="${i<Math.ceil(energy)?'filled':''}" aria-hidden="true"></i>`).join('')}</span></div></div></div>`;}).join('');if($('coop-hud').innerHTML!==html)$('coop-hud').innerHTML=html;
    }
    $('fire').disabled=game.phase!=='playing';
    text('score',fmt(game.score));label('score',t('score',{n:game.score}));label('lives',t('lives',{n:p.lives,spares:Math.max(0,p.lives-1)}));text('stage-label',t('stage',{n:String(game.stage.id).padStart(2,'0')}));
    const lives=String(Math.min(6,Math.max(0,p.lives-1)));if($('lives').dataset.count!==lives){$('lives').innerHTML='<i class="hud-sprite ship-icon" aria-hidden="true"></i>'.repeat(Number(lives));$('lives').dataset.count=lives;}
    const stock=p.bombInventory.join(',');if($('bomb-stock').dataset.stock!==stock){$('bomb-stock').innerHTML=p.bombInventory.map(n=>`<i class="hud-sprite bomb-icon-${n}" aria-hidden="true"></i>`).join('');$('bomb-stock').dataset.stock=stock;}
    label('bomb-stock',t('bombsAria',{n:p.bombs}));label('energy',t('energy',{n:Math.ceil(p.energy),max:p.maxEnergy}));
    if(!$('energy').children.length)$('energy').innerHTML='<i aria-hidden="true"></i>'.repeat(16);
    Array.from($('energy').children).forEach((segment,i)=>segment.classList.toggle('filled',i<Math.ceil(p.energy)));
    text('weapon',p.defaultWeapon?t('baseWeapon'):t('weaponLevel',{name:weaponName(p.weapon),n:p.power}));
    const id=p.defaultWeapon?16:[2,3,4,14][p.weapon],colors=['#ffd661','#72baff','#ff737b','#ffac54'];
    const bluePilot=p.defaultWeapon&&(p.id===2||p.id===4);$('weapon-icon').style.backgroundImage=bluePilot?"url('assets/player2-motion-hd.png')":'';$('weapon-icon').style.backgroundSize=bluePilot?'1015.9420289855% 831.1111111111%':'';$('weapon-icon').style.backgroundPosition=bluePilot?'50% 91.4893617021%':`${id%4/3*100}% ${Math.floor(id/4)/4*100}%`;
    $('power-meter').style.color=p.defaultWeapon?'#9da8b5':colors[p.weapon];label('power-meter',t('powerAria',{n:p.power}));
    Array.from($('power-meter').children).forEach((segment,i)=>segment.classList.toggle('filled',i<p.power));
    text('shield-label',t(game.launch?'launch':game.phase==='aftermath'?'missionComplete':p.defaultWeapon?'chooseWeapon':p.power===6?'maxPower':'sameColor'));
    const gear=[p.missileAmmo?{id:p.missileType,text:t(p.missileType===9?'gearHoming':'gearMissile',{n:p.missileAmmo})} : null,p.side?{id:12,text:t('gearSide',{n:p.side})} : null,p.rear?{id:13,text:t('gearRear',{n:p.rear})} : null,p.shield>0?{id:7,text:t('gearShield')} : null].filter(Boolean);
    const gearKey=gear.map(g=>g.id+':'+g.text).join('|');if($('aux-equipment').dataset.key!==gearKey){$('aux-equipment').innerHTML=gear.map(g=>`<span><i class="gear-icon gear-${g.id}" aria-hidden="true"></i>${g.text}</span>`).join('');$('aux-equipment').dataset.key=gearKey;}
    text('bomb-count',String(p.bombs));$('bomb').disabled=game.phase!=='playing'||p.bombs<=0||p.bombCooldown>1e-9||p.respawn>0;label('bomb',t('bombAria',{n:p.bombs}));
    $('boss-hud').hidden=!game.boss||game.boss.dying||!saved.bossHealthBars;if(game.boss){text('boss-name',t('boss',{n:game.stage.id}));$('boss-health').style.width=`${Math.max(0,game.boss.hp/game.boss.maxHp*100)}%`;}
    touch?.update(game);
  }
  function frame(timestamp){
    let dt=previous?Math.min(.1,(timestamp-previous)/1000):0;previous=timestamp;
    const pads=gamepads();
    if(captureBinding){for(const pad of pads){if(!pad||pad.index!==input.config.players[captureBinding.player].pad)continue;const hit=pad.buttons.findIndex(b=>b.pressed);if(hit>=0){acceptBinding('pad:'+hit);break;}}}
    const commands=input.sample(pads,lan.role==='client'?[game.playerById(lan.localSlot)]:game.players||[]);
    if(commands.pause&&!captureBinding){if(['playing','launch','aftermath'].includes(game.phase))pause();else if(game.phase==='paused')resume();}
    if(lan.role!=='client'&&['playing','launch','aftermath'].includes(game.phase)){
      accumulator+=dt;
      const gameInput=lan.role==='host'&&lan.started?lan.inputs(commands.players[0]):commands;
      let ticks=0;const oldFrame=game.frame;while(accumulator>=1/60&&ticks++<6){game.update(1/60,gameInput);accumulator-=1/60;}if(game.frame!==oldFrame)input.commit();
    }else accumulator=0;
    audio.update(dt,game.phase!=='paused'&&game.phase!=='menu'&&!document.hidden);
    const events=game.drainEvents();for(const e of events){
      audio.effect(e.type,e);
      if(saved.haptics&&!document.hidden&&game.phase!=='paused'&&(lan.role==='offline'||e.playerId===lan.localSlot)&&['hit','bomb','player-death','pickup'].includes(e.type))DemonStarNative.haptic(e.type==='pickup'?'light':'heavy');
      if(e.type==='stage'){music.stage(e.stage);$('toast').hidden=true;if(!saves.write('auto',game.checkpoint()))toast(t('saveFailed'));}
      if(e.type==='mission-start')clearInput();
      if(e.type==='pickup'||e.type==='nova'){
        pickupKey=e.type==='nova'?'nova'+e.weapon:'pickup'+(e.item?e.item[0].toUpperCase()+e.item.slice(1):'Fallback');
        if(!I.messages.en[pickupKey])pickupKey='pickupFallback';
        $('pickup-status').textContent=t(pickupKey);pickupTime=1.4;$('weapon-icon').classList.add('collected');
      }
    }
    if(lan.update(dt,commands.players[0],lan.role==='host'?events:[])&&lan.role==='client')input.commit();
    if(game.phase!==lastPhase){if(['cleared','victory','gameover'].includes(game.phase))results();else if(lan.role==='client'&&lan.status==='playing'){if(game.phase==='paused'){audio.suspend();music.suspend();showPauseDialog();}else if(lastPhase==='paused'){roomOpen=false;hideDialog();clearInput();music.resume();}}lastPhase=game.phase;}
    if(toastTime>0&&game.phase!=='paused'){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}
    if(pickupTime>0&&game.phase!=='paused'){pickupTime-=dt;if(pickupTime<=0){$('pickup-status').textContent='';$('weapon-icon').classList.remove('collected');}}
    music.update(!!audio.missionSource&&audio.enabled&&audio.volume>0);renderer.draw(game,dt);hudTick+=dt;if(hudTick>.06){updateHud();hudTick=0;}requestAnimationFrame(frame);
  }
  function gamepads(){try{return Array.from(navigator.getGamepads?.()||[]);}catch{return [];}}
  $('settings').onclick=showSettings;$('start').onclick=()=>start();$('pause').onclick=pause;$('help').onclick=showHelp;$('desktop-help').onclick=showHelp;$('missions').onclick=showMissions;
  $('difficulty').onclick=()=>{saved.difficulty=(saved.difficulty+1)%4;selectedStage=1;persist();menuInfo();};
  $('sound').onclick=()=>{saved.sound=!saved.sound;audio.enabled=saved.sound;if(saved.sound)audio.unlock();else audio.suspend();persist();menuInfo();};
  const activeInput=()=>game.phase==='playing'&&$('dialog').hidden;
  touch=new DemonStarTouchControls(input,activeInput,()=>{audio.unlock();music.unlock();});touch.layout(renderer.layout);
  window.addEventListener('pointerdown',e=>{if(captureBinding&&e.pointerType==='mouse'){e.preventDefault();e.stopPropagation();acceptBinding('mouse:'+e.button);}},true);
  $('game').addEventListener('pointermove',e=>{if(!activeInput()||e.pointerType!=='mouse'||!input.mouseOwner)return;const l=renderer.layout;input.mouseTarget={x:clamp((e.clientX-l.x)/l.scale,16,W-16),y:clamp((e.clientY-l.y)/l.scale,64,H-40)};});
  $('game').addEventListener('pointerdown',e=>{if(!activeInput()||e.pointerType!=='mouse'||!input.mouseOwner)return;e.preventDefault();input.mouse.add(e.button);const i=input.mouseOwner-1;for(const a of ['fire','bomb'])if(input.bindings(i)[a].includes('mouse:'+e.button)){input.pulse(i,a);if(a==='bomb')input.states[i].previousBomb=true;}});
  window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')input.mouse.delete(e.button);});$('game').addEventListener('contextmenu',e=>{if(activeInput()&&input.mouseOwner)e.preventDefault();});
  $('screen').addEventListener('pointerup',e=>{if(game.phase==='menu'&&$('dialog').hidden&&!$('menu').hidden&&!e.target.closest('button'))start();});
  window.addEventListener('keydown',e=>{
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(captureBinding){e.preventDefault();if(key==='Escape')showControls();else if(!e.repeat)acceptBinding(DemonStarInput.keyToken(e));return;}
    if(e.target.closest?.('select,input'))return;
    if(activeInput())e.preventDefault();
    if(e.repeat)return;
    if(key==='Enter'&&game.phase==='menu'&&$('dialog').hidden){e.preventDefault();start();return;}
    if(key==='Escape'){back();e.preventDefault();return;}
    if(['playing','paused','launch','aftermath'].includes(game.phase))input.key(e,true);
  });
  window.addEventListener('keyup',e=>input.key(e,false));
  function background(){clearInput();pause();audio.suspend();music.suspend();}
  function foreground(){previous=0;if(['menu','cleared','victory','gameover'].includes(game.phase)||lan.status==='playing'&&['playing','launch','aftermath'].includes(game.phase)){music.resume();audio.unlock();}}
  function back(){if(['playing','launch','aftermath'].includes(game.phase))pause();else if(game.phase==='paused')resume();else if(['cleared','victory','gameover'].includes(game.phase))showMenu();else if(!$('dialog').hidden)hideDialog();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)background();else foreground();});window.addEventListener('blur',background);window.addEventListener('focus',foreground);
  window.addEventListener('pagehide',()=>{saveScore();background();});
  window.addEventListener('resize',()=>{clearInput();renderer.resize();touch.layout(renderer.layout);});
  globalThis.StarfallApp={game,i18n:I,input,touch,saves,lan,native:DemonStarNative,background,foreground,back,start,showMenu,showControls,showSaves,showMissions,showRoom,renderer,music,audio};
  document.addEventListener('click',e=>{if(e.target.closest('button')){music.unlock();if(saved.sound){audio.unlock();if(!['fire','bomb','start'].includes(e.target.closest('button').id))audio.effect('menu');}}});
  // 原生容器允许首屏播放；浏览器若拒绝，后续交互仍会再次尝试。
  // Native hosts allow startup playback; browser gesture handlers retry if autoplay is rejected.
  menuInfo();music.update(false);music.unlock();requestAnimationFrame(frame);
})();
