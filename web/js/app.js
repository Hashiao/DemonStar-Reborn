/* SPDX-License-Identifier: MIT */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  function hideDialog(){const el=$('dialog');el.hidden=true;el.setAttribute('aria-modal','false');el.setAttribute('aria-hidden','true');}
  const { Game, DIFFICULTIES, STAGES, WEAPONS, W, H, clamp } = StarfallCore;
  const game=new Game(), renderer=new StarfallRenderer($('game')), audio=new StarfallAudio();
  let saved={best:[0,0,0,0],unlocked:[1,1,1,1],difficulty:1,sound:true,music:false};
  try { const s=JSON.parse(localStorage.getItem('demonstar-reborn-v1')||'null'); if(s && typeof s==='object'){
    saved.best=Array.from({length:4},(_,i)=>Math.max(0,Math.floor(Number(s.best?.[i])||0)));
    saved.unlocked=Array.from({length:4},(_,i)=>clamp(Math.floor(Number(s.unlocked?.[i])||1),1,18));
    saved.difficulty=clamp(Math.floor(Number(s.difficulty)||0),0,3);saved.sound=s.sound!==false;saved.music=s.music!==false;
  }} catch { /* Private browsing and corrupt saves are recoverable. */ }
  let selectedStage=1, pointer=null, previous=0, accumulator=0, toastTime=0, lastPhase='menu', hudTick=0, dialogReturn=null;
  const keys=new Set(); audio.enabled=saved.sound;audio.music=saved.music;
  const persist=()=>{try{localStorage.setItem('demonstar-reborn-v1',JSON.stringify(saved));}catch{}};
  const fmt=n=>String(Math.floor(n)).padStart(7,'0');
  function menuInfo(){ $('best').textContent=fmt(saved.best[saved.difficulty]);$('difficulty').textContent=`难度 · ${DIFFICULTIES[saved.difficulty].name}`;$('unlock-label').textContent=`${String(saved.unlocked[saved.difficulty]).padStart(2,'0')} / 18`;$('sound').textContent=`声音 ${saved.sound?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(saved.sound));$('start').innerHTML=`开始游戏 <span>关卡 ${String(selectedStage).padStart(2,'0')} →</span>`; }
  function saveScore(){if(game.score>saved.best[game.difficulty]){saved.best[game.difficulty]=game.score;persist();}}
  function clearInput(){keys.clear();pointer=null;}
  function toast(text,seconds=2){$('toast').textContent=text;$('toast').hidden=false;toastTime=seconds;}
  function start(stage=selectedStage){audio.unlock();hideDialog();$('menu').hidden=true;$('controls').hidden=false;$('hud').hidden=false;clearInput();game.start(saved.difficulty,stage);lastPhase='playing';previous=0;accumulator=0;updateHud();}
  function showMenu(){saveScore();game.phase='menu';$('menu').hidden=false;hideDialog();$('controls').hidden=true;$('hud').hidden=true;$('toast').hidden=true;clearInput();menuInfo();$('start').focus({preventScroll:true});}
  function dialog(tag,title,content,buttons){
    clearInput();$('dialog-tag').textContent=tag;$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;$('dialog-buttons').replaceChildren();
    for(const [label,action,secondary] of buttons){const b=document.createElement('button');b.textContent=label;b.className=secondary?'secondary':'primary';b.addEventListener('click',()=>{audio.unlock();action();});$('dialog-buttons').append(b);}
    $('dialog').hidden=false;$('dialog').setAttribute('aria-modal','true');$('dialog').setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('dialog-buttons').querySelector('button')?.focus({preventScroll:true}));
  }
  function resume(){game.resume();hideDialog();$('pause').focus({preventScroll:true});previous=0;accumulator=0;clearInput();audio.unlock();}
  function pause(){if(!game.pause())return;saveScore();dialog('游戏已暂停','暂时停靠',`<p>战机已悬停。准备好了就继续。</p><div class="dialog-setting">背景音乐 <button class="secondary" id="music-toggle">${saved.music?'开启':'关闭'}</button></div>`,[['继续飞行',resume],['返回主菜单',()=>dialog('返回主菜单','结束本次飞行？','<p>最高分与已解锁关卡会保留，本次战斗进度将结束。</p>',[['继续飞行',resume],['结束并返回',showMenu,true]]),true]]);$('music-toggle').onclick=()=>{saved.music=!saved.music;audio.music=saved.music;$('music-toggle').textContent=saved.music?'开启':'关闭';persist();};}
  function showHelp(){
    dialogReturn=game.phase==='playing'?'playing':game.phase;if(dialogReturn==='playing')game.pause();
    dialog('游戏说明','飞行指南','<ul class="guide"><li><b>移动</b>　单指拖动战场；<span class="keyboard-help">电脑使用 WASD 或方向键。</span>战机会自动开火。</li><li><b>炸弹</b>　点击右下角 ✦ <span class="keyboard-help">或按空格。</span>清除弹幕并对 Boss 造成伤害。</li><li><b>补给</b>　P 升级火力，I 离子火力，S 护盾，B 炸弹，＋ 增加生命。接触补给拾取。</li><li><b>躲避</b>　避开敌机与弹幕，装甲耗尽会损失生命并重置火力。</li><li><b>暂停</b>　点击 Ⅱ <span class="keyboard-help">或按 Esc / P。</span>切到后台会自动暂停。</li></ul><p class="dialog-footer">原作 18 关地图 · 4 档难度 · 离线存档<br>非官方 DemonStar 同人重制 · v0.1.0</p>',[['准备起飞',()=>{if(dialogReturn==='playing')resume();else hideDialog();}]]);
  }
  function showMissions(){
    dialog('原版战役','选择出击点',`<div class="mission-grid">${STAGES.map(s=>`<button data-stage="${s.id}" ${s.id>saved.unlocked[saved.difficulty]?'disabled':''}>${String(s.id).padStart(2,'0')}<small>${s.name}</small></button>`).join('')}</div><p class="dialog-footer">通过上一关即可解锁。各难度单独保存进度。</p>`,[['返回机库',()=>{hideDialog();},true]]);
    document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{selectedStage=Number(b.dataset.stage);hideDialog();menuInfo();});
  }
  function results(){
    saveScore();const won=game.phase==='cleared'||game.phase==='victory';
    if(won){saved.unlocked[game.difficulty]=Math.max(saved.unlocked[game.difficulty],Math.min(18,game.stage.id+1));persist();}
    const accuracy=game.shotsFired?Math.min(100,Math.round(game.shotsHit/game.shotsFired*100)):0;
    const content=`<div class="result-score">${fmt(game.score)}</div><div class="stat-row">击落敌机<b>${game.kills}</b></div><div class="stat-row">命中率<b>${accuracy}%</b></div><div class="stat-row">飞行时间<b>${Math.floor(game.totalTime/60)}:${String(Math.floor(game.totalTime%60)).padStart(2,'0')}</b></div><div class="stat-row">当前关卡<b>${game.stage.id} / 18</b></div>`;
    const actions=game.phase==='cleared'?[['下一关 →',()=>{game.nextStage();hideDialog();lastPhase='playing';updateHud();}]]:[['再次出击',()=>start(game.phase==='victory'?1:game.stage.id)]];
    actions.push(['返回机库',showMenu,true]);
    dialog(won?'任务完成':'战斗记录',game.phase==='victory'?'星海已重获自由':won?'防线已突破':'任务结束',content,actions);
  }
  function updateHud(){
    if(!game.player)return;
    // Avoid recreating accessibility text nodes every frame on mobile WebViews.
    const text=(id,value)=>{const e=$(id);if(e.textContent!==value)e.textContent=value;};
    const label=(id,value)=>{const e=$(id);if(e.getAttribute('aria-label')!==value)e.setAttribute('aria-label',value);};
    const p=game.player;text('score',fmt(game.score));text('lives','◆ '.repeat(p.lives).trim());label('lives',`剩余 ${p.lives} 条生命`);text('stage-label',`关卡 ${String(game.stage.id).padStart(2,'0')}`);
    text('weapon',`${WEAPONS[p.weapon]} · ${p.power} 级`);text('shield-label',`装甲 ${Math.ceil(p.energy)} / ${p.maxEnergy}${p.shield>0?' · 护盾':''}`);text('bomb-count',String(p.bombs).padStart(2,'0'));$('bomb').disabled=p.bombs<=0;label('bomb',`释放炸弹，剩余 ${p.bombs} 枚`);
    $('progress').style.width=`${Math.min(100,Math.round(game.elapsed/game.stage.duration*1000)/10)}%`;text('combo',game.combo>=5?`${game.combo} 连击 · ×${1+Math.floor(game.combo/10)}`:'');
    $('boss-hud').hidden=!game.boss;if(game.boss){text('boss-name',game.stage.boss);$('boss-health').style.width=`${Math.max(0,game.boss.hp/game.boss.maxHp*100)}%`;}
  }
  function frame(t){
    let dt=previous?Math.min(.1,(t-previous)/1000):0;previous=t;
    if(game.phase==='playing'){
      accumulator+=dt;
      const input={x:Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),y:Number(keys.has('ArrowDown')||keys.has('s'))-Number(keys.has('ArrowUp')||keys.has('w'))};
      let ticks=0;while(accumulator>=1/60&&ticks++<6){game.update(1/60,input);accumulator-=1/60;}
      audio.update(dt,game.phase==='playing');
    }else accumulator=0;
    for(const e of game.drainEvents()){
      audio.effect(e.type,e);
      if(e.type==='stage')toast(`进入第 ${String(e.stage).padStart(2,'0')} 关`);
      if(e.type==='boss')toast(`警报 · ${e.name}`,2.8);
      if(e.type==='pickup')toast({power:'火力升级',weapon:'质子武器',ion:'离子炮',plasma:'等离子炮',magnetic:'磁力脉冲',energy:'装甲修复',full:'火力全满',shield:'能量护盾',bomb:'超级炸弹',scatter:'散射炸弹',mega:'超级脉冲',missile:'导弹补给',homing:'追踪导弹',side:'侧向火力',rear:'后向火力',medal:'勋章 +1000',life:'备用战机 +1'}[e.item]||'获得补给',1);
    }
    if(game.phase!==lastPhase){if(['cleared','victory','gameover'].includes(game.phase))results();lastPhase=game.phase;}
    if(toastTime>0&&game.phase!=='paused'){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}
    renderer.draw(game,dt);hudTick+=dt;if(hudTick>.06){updateHud();hudTick=0;}requestAnimationFrame(frame);
  }
  $('start').onclick=()=>start();$('pause').onclick=pause;$('bomb').onclick=()=>{audio.unlock();game.useBomb();updateHud();};$('help').onclick=showHelp;$('desktop-help').onclick=showHelp;$('missions').onclick=showMissions;
  $('difficulty').onclick=()=>{saved.difficulty=(saved.difficulty+1)%4;selectedStage=1;persist();menuInfo();};
  $('sound').onclick=()=>{saved.sound=!saved.sound;audio.enabled=saved.sound;if(saved.sound)audio.unlock();else audio.suspend();persist();menuInfo();};
  $('screen').addEventListener('pointerdown',e=>{
    if(game.phase!=='playing'||e.target.closest('button')||!$('dialog').hidden||pointer!==null)return;
    audio.unlock();pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('screen').setPointerCapture(e.pointerId);
  });
  $('screen').addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||game.phase!=='playing')return;const rect=$('screen').getBoundingClientRect();game.move((e.clientX-pointer.x)*W/rect.width,(e.clientY-pointer.y)*640/rect.height);pointer.x=e.clientX;pointer.y=e.clientY;e.preventDefault();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$('screen').addEventListener(event,e=>{if(pointer?.id===e.pointerId)pointer=null;});
  $('screen').addEventListener('pointerup',e=>{if(game.phase==='menu'&&$('dialog').hidden&&!$('menu').hidden&&!e.target.closest('button'))start();});
  window.addEventListener('keydown',e=>{
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(key)&&game.phase==='playing')e.preventDefault();
    if(e.repeat)return;
    if(key==='Enter'&&game.phase==='menu'&&$('dialog').hidden){e.preventDefault();start();return;}
    if(key==='Escape'||key==='p'){if(game.phase==='playing')pause();else if(game.phase==='paused')resume();else if(!$('dialog').hidden)hideDialog();return;}
    if(key===' '&&game.phase==='playing'){game.useBomb();return;}keys.add(key);
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  function background(){clearInput();pause();audio.suspend();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)background();else previous=0;});window.addEventListener('blur',background);
  window.addEventListener('pagehide',()=>{saveScore();background();});
  globalThis.StarfallApp={game,background,back:()=>{if(game.phase==='playing')pause();else if(game.phase==='paused')resume();else if(!$('dialog').hidden)hideDialog();},start,showMenu,renderer};
  document.addEventListener('click',e=>{if(e.target.closest('button')&&saved.sound){audio.unlock();audio.effect('menu');}});
  menuInfo();requestAnimationFrame(frame);
})();
