/* SPDX-License-Identifier: MIT. 主机画面快照，客户端不重复模拟战斗。 / Authoritative frames; clients do not resimulate combat. */
(() => {
  'use strict';
  const C=DemonStarCampaign,{STAGES,DIFFICULTIES,createPlayer,validCheckpoint,validWeaponLevels}=StarfallCore;
  const world='phase resumePhase score kills combo shotsFired shotsHit totalTime elapsed scroll previousScroll frame flash shake bombRing bossSpawned enemyFireLock bossRadioTicks aftermathTicks presentation mode retainWeaponLevels'.split(' ');
  const player='id score kills shotsFired shotsHit x y px py r lives energy maxEnergy medals defaultWeapon power weapon bank thrust shield invincible fire baseFire respawn bombCooldown missileAmmo missileType side rear sideDelay sideBurst sideGap rearDelay rearBurst rearGap shotPhase mega megaTick missileTimer connected moveSpeed'.split(' ');
  const enemy='uid x y px py r hp maxHp boss scenery ground dead hit time speed type entered critical criticalTicks burning dying deathTicks deathMode fall fallFixed fallDirection fallSpeed facing animationFrame'.split(' ');
  const bullet='wireId x y px py vx vy friendly damage style r life playerId shotType defaultShot missile homing carryTicks flightAngle speedStep targetUid age playerBeam beam beamFrames owner offsetX offsetY endY pulse nova dead'.split(' ');
  const special='wireId type playerId x y px py angle speed ticks fuse exploded remaining radius'.split(' ');
  const pickup='wireId id type x y px py time r angle speed deathDrop cycleTicks dead'.split(' ');
  const eventFields='type playerId stage deferredLaunch weapon item name variant heavy ground bombType damage source completionAnnounced lives final'.split(' ');
  const allowedEvents=new Set('stage mission-start pickup nova boss boss-engine boss-dying explosion hit enemy-hit shield-lost shot bomb super-pulse stage-complete gameover cleared victory player-death launch'.split(' '));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const pick=(value,keys)=>{const result={};for(const key of keys)if(value[key]!==undefined)result[key]=value[key];return result;};
  const finite=(v,depth=0)=>depth<8&&(v===null||typeof v==='boolean'||typeof v==='string'&&v.length<256||typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e13||typeof v==='object'&&(Array.isArray(v)?v.length<=4096:Object.keys(v).length<=64)&&Object.values(v).every(n=>finite(n,depth+1)));
  function encode(game,events=[]){
    let serial=game.networkSerial||0;const object=(o,fields)=>{if(!o.wireId)o.wireId=++serial;return pick(o,fields);};
    const state={version:2,stage:game.stage.id,difficulty:game.difficulty,world:pick(game,world),checkpoint:game.checkpoint(),players:game.players.map(p=>({...pick(p,player),bombInventory:p.bombInventory.slice(),weaponLevels:p.weaponLevels.slice()})),enemies:game.enemies.map(e=>({...pick(e,enemy),definition:e.def.id,...(e.animation?{animation:copy(e.animation)}:{})})),bullets:game.bullets.map(b=>object(b,bullet)),specials:game.specials.map(s=>object(s,special)),pickups:game.pickups.map(p=>object(p,pickup)),effects:copy(game.effects),wrecks:copy(game.wrecks),particles:copy(game.particles),launch:game.launch?copy(game.launch):null,stageBonus:game.stageBonus?copy(game.stageBonus):null,stageBonuses:copy(game.stageBonuses),bossId:game.boss?.uid||null,events:events.filter(e=>allowedEvents.has(e.type)).slice(-96).map(e=>pick(e,eventFields))};
    state.laserWarnings=copy(game.laserWarnings||[]);game.networkSerial=serial;return state;
  }
  function valid(s){
    if(!s||s.version!==2||!Number.isInteger(s.stage)||s.stage<1||s.stage>18||!Number.isInteger(s.difficulty)||s.difficulty<0||s.difficulty>3||!finite(s)||!validCheckpoint(s.checkpoint))return false;
    if(!s.world||typeof s.world.retainWeaponLevels!=='boolean'||!['menu','launch','playing','paused','aftermath','cleared','victory','gameover'].includes(s.world.phase)||!Number.isSafeInteger(s.world.frame)||s.world.frame<0)return false;
    for(const [key,max] of [['players',4],['enemies',2048],['bullets',1801],['specials',256],['pickups',512],['effects',160],['wrecks',120],['particles',350],['stageBonuses',4],['events',96]])if(!Array.isArray(s[key])||s[key].length>max)return false;
    if(!s.players.length||s.players.length!==s.checkpoint.players.length)return false;
    if(!s.players.every((p,i)=>p.id===i+1&&StarfallCore.validMoveSpeed(p.moveSpeed)&&validWeaponLevels(p.weaponLevels)&&Array.isArray(p.bombInventory)&&p.bombInventory.length<=StarfallCore.BOMB_CAPACITY&&p.bombInventory.every(n=>Number.isInteger(n)&&n>=0&&n<=2)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isInteger(p.lives)&&p.lives>=0&&p.lives<=99&&Number.isInteger(p.power)&&p.power>=0&&p.power<=6&&Number.isInteger(p.weapon)&&p.weapon>=0&&p.weapon<=3&&Number.isFinite(p.energy)&&p.energy>=0&&p.energy<=16&&typeof p.defaultWeapon==='boolean'))return false;
    for(const key of ['score','kills','shotsFired','shotsHit','totalTime','elapsed','scroll'])if(!Number.isFinite(s.world[key])||s.world[key]<0)return false;
    const bonusValid=b=>b&&['bombs','medals','bombScore','medalScore','total'].every(k=>Number.isFinite(b[k])&&b[k]>=0);
    if(s.stageBonus!==null&&!bonusValid(s.stageBonus)||!s.stageBonuses.every(bonusValid))return false;
    if(!Array.isArray(s.laserWarnings)||s.laserWarnings.length>128||!s.laserWarnings.every(w=>w&&[9,10].includes(w.shotType)&&w.frames===(w.shotType===9?4:5)&&Number.isInteger(w.ticks)&&w.ticks>=1&&w.ticks<=Math.ceil(1/StarfallCore.STEP)&&Number.isInteger(w.gun)&&w.gun>=0&&Number.isFinite(w.offsetX)&&Number.isFinite(w.offsetY)&&Array.isArray(w.pulses)&&w.pulses.length>0&&w.pulses.length<=64&&w.pulses[0]===0&&w.pulses.every((t,i)=>Number.isInteger(t)&&t>=0&&t<=256&&(!i||t>w.pulses[i-1]))&&w.period===w.pulses[w.pulses.length-1]+w.frames&&s.enemies.some(e=>e.uid===w.owner&&e.boss&&!e.dead&&!e.dying)))return false;
    if(!s.enemies.every(e=>Number.isInteger(e.definition)&&C.byId[e.definition]!==undefined&&Number.isFinite(e.x)&&Number.isFinite(e.y)))return false;
    if(!s.events.every(e=>allowedEvents.has(e.type)))return false;
    return true;
  }
  function apply(game,state,interpolate=true){
    if(!valid(state))return false;
    const smooth=interpolate&&game.stage?.id===state.stage&&game.phase==='playing'&&state.world.phase==='playing';
    // 地面与实体必须从同一份快照插值，不能混用房主的上一逻辑步。
    // Terrain and entities must interpolate from the same snapshot, not the host's preceding simulation tick.
    const previousScroll=smooth?game.scroll:state.world.scroll;
    const oldPlayers=new Map((game.players||[]).map(p=>[p.id,p])),oldEnemies=new Map((game.enemies||[]).map(e=>[e.uid,e])),oldBullets=new Map((game.bullets||[]).map(b=>[b.wireId,b]));
    const at=(next,old)=>{if(smooth&&old){next.px=old.x;next.py=old.y;}else{next.px=next.x;next.py=next.y;}return next;};
    const players=state.players.map(s=>{const p=createPlayer(s.id);Object.assign(p,pick(s,player));p.bombInventory=s.bombInventory.slice();p.weaponLevels=s.weaponLevels.slice();return at(p,oldPlayers.get(p.id));});
    const enemies=state.enemies.map(s=>at({...pick(s,enemy),def:C.definitions[C.byId[s.definition]],animation:s.animation?copy(s.animation):undefined,guns:[]},oldEnemies.get(s.uid)));
    // 新出现的贴地装置也对齐背景；独立行驶的炮台和掉落拾取物保持各自运动。
    // Align newly received terrain fixtures too; independently moving turrets and floating drops keep their own motion.
    if(smooth)for(const e of enemies)if(!e.dying&&(e.scenery||e.ground&&e.def.mode===8&&e.def.speed===1))e.py=e.y-(state.world.scroll-previousScroll);
    Object.assign(game,pick(state.world,world));game.stage=STAGES[state.stage-1];game.difficulty=state.difficulty;game.rules=DIFFICULTIES[state.difficulty];game.players=players;game.player=players[0];game.enemies=enemies;game.boss=enemies.find(e=>e.uid===state.bossId)||null;
    game.previousScroll=previousScroll;game.laserWarnings=copy(state.laserWarnings);
    game.bullets=state.bullets.map(s=>at(pick(s,bullet),oldBullets.get(s.wireId)));game.pickups=state.pickups.map(s=>pick(s,pickup));game.specials=state.specials.map(s=>pick(s,special));
    for(const key of ['effects','wrecks','particles','launch','stageBonus','stageBonuses'])game[key]=copy(state[key]);game.stageEntry=copy(state.checkpoint);game.pendingTime=0;game.events=game.events||[];game.events.push(...state.events.map(e=>pick(e,eventFields)));return true;
  }
  globalThis.DemonStarNetworkState={encode,apply,valid,version:2};
})();
