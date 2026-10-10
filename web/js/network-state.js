/* SPDX-License-Identifier: MIT. 主机画面快照，客户端不重复模拟战斗。 / Authoritative frames; clients do not resimulate combat. */
(() => {
  'use strict';
  const C=DemonStarCampaign,{STAGES,DIFFICULTIES,createPlayer,validCheckpoint}=StarfallCore;
  const world='phase resumePhase score kills combo shotsFired shotsHit totalTime elapsed scroll previousScroll frame flash shake bombRing bossSpawned enemyFireLock bossRadioTicks aftermathTicks presentation mode'.split(' ');
  const player='id score kills shotsFired shotsHit x y px py r lives energy maxEnergy medals defaultWeapon power weapon bank thrust shield invincible fire baseFire respawn bombCooldown missileAmmo missileType side rear sideDelay sideBurst sideGap rearDelay rearBurst rearGap shotPhase mega megaTick missileTimer connected'.split(' ');
  const enemy='uid x y px py r hp maxHp boss scenery ground dead hit time speed type entered critical criticalTicks burning dying deathTicks fall fallSpeed facing animationFrame'.split(' ');
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
    const state={version:1,stage:game.stage.id,difficulty:game.difficulty,world:pick(game,world),checkpoint:game.checkpoint(),players:game.players.map(p=>({...pick(p,player),bombInventory:p.bombInventory.slice()})),enemies:game.enemies.map(e=>({...pick(e,enemy),definition:e.def.id,...(e.animation?{animation:copy(e.animation)}:{})})),bullets:game.bullets.map(b=>object(b,bullet)),specials:game.specials.map(s=>object(s,special)),pickups:game.pickups.map(p=>object(p,pickup)),effects:copy(game.effects),wrecks:copy(game.wrecks),particles:copy(game.particles),launch:game.launch?copy(game.launch):null,stageBonus:game.stageBonus?copy(game.stageBonus):null,stageBonuses:copy(game.stageBonuses),bossId:game.boss?.uid||null,events:events.filter(e=>allowedEvents.has(e.type)).slice(-96).map(e=>pick(e,eventFields))};
    game.networkSerial=serial;return state;
  }
  function valid(s){
    if(!s||s.version!==1||!Number.isInteger(s.stage)||s.stage<1||s.stage>18||!Number.isInteger(s.difficulty)||s.difficulty<0||s.difficulty>3||!finite(s)||!validCheckpoint(s.checkpoint))return false;
    if(!s.world||!['menu','launch','playing','paused','aftermath','cleared','victory','gameover'].includes(s.world.phase)||!Number.isSafeInteger(s.world.frame)||s.world.frame<0)return false;
    for(const [key,max] of [['players',4],['enemies',2048],['bullets',1801],['specials',256],['pickups',512],['effects',160],['wrecks',120],['particles',350],['stageBonuses',4],['events',96]])if(!Array.isArray(s[key])||s[key].length>max)return false;
    if(!s.players.length||s.players.length!==s.checkpoint.players.length)return false;
    if(!s.players.every((p,i)=>p.id===i+1&&Array.isArray(p.bombInventory)&&p.bombInventory.length<=6&&p.bombInventory.every(n=>Number.isInteger(n)&&n>=0&&n<=2)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isInteger(p.lives)&&p.lives>=0&&p.lives<=99&&Number.isInteger(p.power)&&p.power>=0&&p.power<=6&&Number.isInteger(p.weapon)&&p.weapon>=0&&p.weapon<=3&&Number.isFinite(p.energy)&&p.energy>=0&&p.energy<=16&&typeof p.defaultWeapon==='boolean'))return false;
    for(const key of ['score','kills','shotsFired','shotsHit','totalTime','elapsed','scroll'])if(!Number.isFinite(s.world[key])||s.world[key]<0)return false;
    const bonusValid=b=>b&&['bombs','medals','bombScore','medalScore','total'].every(k=>Number.isFinite(b[k])&&b[k]>=0);
    if(s.stageBonus!==null&&!bonusValid(s.stageBonus)||!s.stageBonuses.every(bonusValid))return false;
    if(!s.enemies.every(e=>Number.isInteger(e.definition)&&C.byId[e.definition]!==undefined&&Number.isFinite(e.x)&&Number.isFinite(e.y)))return false;
    if(!s.events.every(e=>allowedEvents.has(e.type)))return false;
    return true;
  }
  function apply(game,state,interpolate=true){
    if(!valid(state))return false;
    const smooth=interpolate&&game.stage?.id===state.stage&&game.phase==='playing'&&state.world.phase==='playing';
    const oldPlayers=new Map((game.players||[]).map(p=>[p.id,p])),oldEnemies=new Map((game.enemies||[]).map(e=>[e.uid,e])),oldBullets=new Map((game.bullets||[]).map(b=>[b.wireId,b]));
    const at=(next,old)=>{if(smooth&&old){next.px=old.x;next.py=old.y;}else{next.px=next.x;next.py=next.y;}return next;};
    const players=state.players.map(s=>{const p=createPlayer(s.id);Object.assign(p,pick(s,player));p.bombInventory=s.bombInventory.slice();return at(p,oldPlayers.get(p.id));});
    const enemies=state.enemies.map(s=>at({...pick(s,enemy),def:C.definitions[C.byId[s.definition]],animation:s.animation?copy(s.animation):undefined,guns:[]},oldEnemies.get(s.uid)));
    Object.assign(game,pick(state.world,world));game.stage=STAGES[state.stage-1];game.difficulty=state.difficulty;game.rules=DIFFICULTIES[state.difficulty];game.players=players;game.player=players[0];game.enemies=enemies;game.boss=enemies.find(e=>e.uid===state.bossId)||null;
    game.bullets=state.bullets.map(s=>at(pick(s,bullet),oldBullets.get(s.wireId)));game.pickups=state.pickups.map(s=>pick(s,pickup));game.specials=state.specials.map(s=>pick(s,special));
    for(const key of ['effects','wrecks','particles','launch','stageBonus','stageBonuses'])game[key]=copy(state[key]);game.stageEntry=copy(state.checkpoint);game.pendingTime=0;game.events=game.events||[];game.events.push(...state.events.map(e=>pick(e,eventFields)));return true;
  }
  globalThis.DemonStarNetworkState={encode,apply,valid,version:1};
})();
