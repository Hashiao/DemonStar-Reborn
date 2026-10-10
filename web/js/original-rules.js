/* SPDX-License-Identifier: MIT. Reimplemented from the documented 4.04 record format. */
(() => {
  'use strict';
  const C=globalThis.DemonStarCampaign,P=globalThis.DemonStarPlayerRules,A=globalThis.DemonStarEnemyArt;
  // 原作基础节拍为 35ms，渲染独立运行。
  // 4.04's base wait is 35 ms (0x41ae07). Rendering remains independent.
  const W=400,H=480,STEP=.035,TICK=1/STEP,SHOT_RULES=globalThis.DemonStarProjectileRules;
  // 出击演出独立按约 60Hz 标定，保留原作每演出帧下移 3；不加速战斗。
  // Calibrate launch presentation near 60Hz, retaining 3 source pixels per frame; combat stays unchanged.
  const LAUNCH_SPEED=3*(H/400)*60,HEALTH_BAR_MIN_HP=C.definitions[C.byId[17]].hp;
  // 按原作可见区域校准手机移动距离，不改变世界计时。
  // Match the classic 320x400 visible-area traversal in our 400x480 playfield.
  // This is mobile control calibration, not a change to enemy/world timing.
  const PLAYER_STEP_X=4*(W-32)/(320-32),PLAYER_STEP_Y=4*(H-104)/(400-104);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // 0x414940 的定点透视投影，深度输入先截为整数。
  // Fixed-point perspective from 0x414940, with integer depth input.
  const deathScale=fall=>65536/(65536+Math.floor(fall)*327);
  const rng=seed=>{let a=seed>>>0;const random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};random.state=()=>a;random.restore=value=>{a=value>>>0;};return random;};
  const MAX_PLAYERS=4;
  // 玩家 ID 稳定为 1–4；保留 player 作为一号玩家兼容入口。
  // Stable IDs 1–4 identify ownership; player remains the first-player compatibility entry.
  function createPlayer(id){
    const p={id,score:0,kills:0,shotsFired:0,shotsHit:0,x:200,y:400,r:10,lives:4,energy:16,maxEnergy:16,bombInventory:[0,0,0],medals:0,defaultWeapon:true,power:0,weapon:0,bank:8,thrust:0,shield:0,invincible:2.5,fire:0,baseFire:0,respawn:0,bombCooldown:0,missileAmmo:0,missileType:8,side:0,rear:0,sideDelay:10,sideBurst:0,sideGap:0,rearDelay:10,rearBurst:0,rearGap:0,shotPhase:0,mega:0,missileTimer:0};
    Object.defineProperty(p,'bombs',{enumerable:true,get(){return this.bombInventory.length;}});return p;
  }
  const checkpointFields={score:[0,1e12],kills:[0,1e9],shotsFired:[0,1e12],shotsHit:[0,1e12],lives:[0,99],energy:[0,16],weapon:[0,3],power:[0,6],missileAmmo:[0,1e9],missileType:[8,9],side:[0,4],rear:[0,4],shield:[0,60],fire:[0,60],baseFire:[0,60],missileTimer:[0,60],sideDelay:[0,60],sideBurst:[0,4],sideGap:[0,60],rearDelay:[0,60],rearBurst:[0,4],rearGap:[0,60],shotPhase:[0,1e12],bombCooldown:[0,60]};
  const clone=value=>JSON.parse(JSON.stringify(value));
  function validCheckpoint(s){
    const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
    if(!s||s.format!=='demonstar-stage'||s.version!==1||!integer(s.stage,1,18)||!integer(s.difficulty,0,3)||!integer(s.seed,0,Number.MAX_SAFE_INTEGER)||!integer(s.randomState,0,0xffffffff)||!['solo','local','lan'].includes(s.mode))return false;
    if(!Array.isArray(s.players)||s.players.length<1||s.players.length>MAX_PLAYERS||!s.players.some(p=>p&&p.lives>0))return false;
    if(!integer(s.supplyIndex,0,4)||!integer(s.supplyBombIndex,0,2))return false;
    for(const key of ['score','kills','shotsFired','shotsHit','totalTime'])if(!Number.isFinite(s[key])||s[key]<0||s[key]>1e12)return false;
    return s.players.every((p,i)=>p&&p.id===i+1&&typeof p.defaultWeapon==='boolean'&&Array.isArray(p.bombInventory)&&p.bombInventory.length<=6&&p.bombInventory.every(b=>integer(b,0,2))&&Object.keys(checkpointFields).every(k=>Number.isFinite(p[k])&&p[k]>=checkpointFields[k][0]&&p[k]<=checkpointFields[k][1])&&['lives','weapon','power','missileAmmo','missileType','side','rear'].every(k=>Number.isInteger(p[k]))&&(p.defaultWeapon?p.power===0:p.power>=1));
  }
  const intersects=(x1,y1,x2,y2,x,y,r)=>{const dx=x2-x1,dy=y2-y1,t=clamp(((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy||1),0,1);return(x1+dx*t-x)**2+(y1+dy*t-y)**2<=r*r;};
  const DIFFICULTIES=[{name:'容易',key:'easy',fire:1.3},{name:'一般',key:'normal',fire:1},{name:'较难',key:'hard',fire:.85},{name:'疯狂',key:'insane',fire:.7}];
  // 撞机和敌弹采用不同的原作伤害分支。
  // Original collision and projectile handlers use different rules.
  const projectileDamage=(base,difficulty)=>base<=0?base:difficulty===0?Math.max(1,Math.floor(base/2)):base+(difficulty===2?1:difficulty===3?2:0);
  const IMPACT={"40":1,"41":1,"44":1,"43":1,"42":10,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":1,"28":1,"29":0,"30":1,"31":10,"48":10,"49":10,"50":10,"32":0,"33":0,"34":0,"35":0,"36":1,"37":10,"38":10,"39":10,"45":10,"46":10,"47":3,"51":10,"52":10,"53":10,"54":0,"55":0,"56":1,"57":1,"58":10,"59":10,"60":3,"61":10};
  const collisionDamage=width=>width<=16?4:width<=32?12:16;
  const BIOMES=Array.from({length:18},(_,i)=>({name:`第 ${String(i+1).padStart(2,'0')} 关`,color:['#8badca','#b6916c','#709bbb','#a69a89','#c06153','#b34c34','#5784b0','#426ca0','#9aa1c4','#997657','#497bb4','#98968e','#68a770','#3d793c','#ac7343','#6a737b','#be4c46','#868d94'][i],bg:'#030508',ground:'#1a2329',accent:'#414d55'}));
  const STAGES=C.levels.map((l,i)=>({id:l.id,biome:i,name:BIOMES[i].name,subtitle:'原版战役',duration:Math.max(...l.events.map(e=>e[1]))/TICK,boss:`第 ${i+1} 关旗舰`,map:l}));
  const WEAPONS=['质子激光','离子炮','等离子炮','磁力脉冲'];
  const DROPS=['medal','energy','weapon','ion','plasma','bomb','scatter','shield','missile','homing','full','crystal','side','rear','magnetic','mega'];
  const DROP_NEXT=[-1,-1,3,4,2,6,5,-1,9,8,-1,-1,13,12,3,6];
  const DROP_WAIT=DROPS.map((_,i)=>i===14?240:i===15?250:180);
  class Gun {
    constructor(raw){this.raw=raw;this.delay=raw[4];this.wait=raw[5];this.cooldown=0;this.remaining=raw[7];this.angle=raw[8];this.active=false;this.arc=raw[13]||9999;this.gaps=raw[14];this.aim=!!raw[10];this.cycles=raw[16];}
    tick(enemy,game){
      const r=this.raw;if(this.delay>0){this.delay--;return;}
      if(this.cooldown<=1){if(this.cycles>0){this.cycles--;this.active=true;this.cooldown=Math.max(1,Math.round(r[6]*game.rules.fire));}else this.active=false;}else this.cooldown--;
      if(!this.active)return;if(this.wait>0){this.wait--;return;}this.wait=r[5];
      if(this.remaining<=0){this.active=false;this.remaining=r[7];this.aim=!!r[10];this.angle=r[8];this.arc=r[13];this.gaps=r[14];if(this.gaps<=1)this.arc=9999;else this.gaps--;return;}
      this.remaining--;
      if(this.arc<=0){this.angle=(this.angle+r[9])&2047;if(this.gaps<=1)this.arc=9999;else this.gaps--;return;}
      const x=enemy.x-enemy.def.width/2+r[0],y=enemy.y-enemy.def.height/2+r[1];
      if(this.aim){const p=game.targetPlayer(x,y);if(!p)return;this.angle=(Math.atan2(p.x-x,-(p.y-y))*1024/Math.PI+r[8])&2047;this.aim=false;}
      if(enemy.y>=0&&enemy.y<H+enemy.r&&game.enemyFireLock<=0&&!enemy.dying){
        const a=this.angle*Math.PI/1024,s=Math.max(1,r[12])*TICK;
        // 9/10 号弹绑定炮口，分别播放四/五帧，伤害取原始模板。
        // Types 9/10 attach to the muzzle for four/five frames (0x429722); keep original damage.
        const beamFrames=r[2]===10?5:4;
        const beam=r[2]===9||r[2]===10?{beam:true,beamFrames,owner:enemy.uid,offsetX:x-enemy.x,offsetY:y-enemy.y,age:0,life:beamFrames*STEP}:{};
        game.addBullet(x,y,Math.sin(a)*s,-Math.cos(a)*s,false,P.damage[r[2]],r[2]%3,{shotType:r[2],missile:r[2]===8,...beam});game.events?.push({type:'enemy-shot',shotType:r[2]});
      }
      this.angle=(this.angle+r[9])&2047;this.arc--;
    }
  }
  class Game {
    constructor(seed=Date.now()){this.seed=seed;this.random=rng(seed);this.events=[];this.phase='menu';}
    start(difficulty=1,stage=1,presentation=false,options={}){
      // 无界面测试可跳过演出，正式 App 总是开启。
      // Headless combat callers may omit presentation; the app always enables it.
      this.presentation=presentation;
      this.difficulty=clamp(Math.floor(difficulty),0,3);this.rules=DIFFICULTIES[this.difficulty];this.random=rng(this.seed);
      this.score=0;this.kills=0;this.combo=0;this.shotsFired=0;this.shotsHit=0;this.totalTime=0;this.events=[];this.supplyIndex=0;this.supplyBombIndex=0;
      this.players=Array.from({length:clamp(Math.floor(Number(options.playerCount)||1),1,MAX_PLAYERS)},(_,i)=>createPlayer(i+1));
      this.player=this.players[0];this.mode=options.mode==='lan'?'lan':this.players.length>1?'local':'solo';
      this.loadStage(clamp(Math.floor(stage),1,18));
    }
    loadStage(id){this.stage=STAGES[clamp(Math.floor(id),1,18)-1];this.elapsed=0;this.scroll=0;this.previousScroll=0;this.cursor=0;this.frame=0;this.pendingTime=0;this.dropSequence=0;this.enemySerial=0;this.homingCursor=0;this.recordEvents=[...this.stage.map.events].sort((a,b)=>a[1]-b[1]);this.enemies=[];this.bullets=[];this.specials=[];this.enemyFireLock=0;this.bossRadioTicks=0;this.pickups=[];this.particles=[];this.boss=null;this.bossSpawned=false;this.flash=0;this.shake=0;this.bombRing=0;this.phase='playing';for(const p of this.players){p.x=p.px=this.spawnX(p);p.y=p.py=H-70;p.invincible=2.5;p.respawn=0;p.bank=8;p.thrust=0;delete p.lastBombAction;}this.beginPresentation();this.stageEntry=this.captureStageEntry();this.events.push({type:'stage',stage:this.stage.id,deferredLaunch:this.presentation});}
    // 关卡档固定在入关时，读档重新开始该关，避免奖励与当前战斗状态混用。
    // Stage saves capture entry state; loading restarts the stage without mixing awarded bonuses into it.
    captureStageEntry(){
      const saved={format:'demonstar-stage',version:1,stage:this.stage.id,difficulty:this.difficulty,mode:this.mode,seed:this.seed,randomState:this.random.state(),supplyIndex:this.supplyIndex,supplyBombIndex:this.supplyBombIndex,players:this.players.map(p=>{const s={id:p.id,defaultWeapon:p.defaultWeapon,bombInventory:p.bombInventory.slice()};for(const k in checkpointFields)s[k]=p[k];return s;})};
      for(const k of ['score','kills','shotsFired','shotsHit','totalTime'])saved[k]=this[k];return saved;
    }
    checkpoint(){return this.stageEntry?clone(this.stageEntry):null;}
    loadCheckpoint(value,presentation=this.presentation){
      if(!validCheckpoint(value))return false;
      const saved=clone(value);this.seed=saved.seed;this.start(saved.difficulty,saved.stage,presentation,{mode:saved.mode,playerCount:saved.players.length});
      for(const s of saved.players){const p=this.playerById(s.id);p.defaultWeapon=s.defaultWeapon;p.bombInventory=s.bombInventory.slice();for(const k in checkpointFields)p[k]=s[k];}
      for(const k of ['score','kills','shotsFired','shotsHit','totalTime','supplyIndex','supplyBombIndex'])this[k]=saved[k];
      this.random.restore(saved.randomState);this.stageEntry=saved;return true;
    }
    spawnX(p){return this.players.length===1?W/2:W*(p.id/(this.players.length+1));}
    playerById(id){return this.players?.find(p=>p.id===id);}
    livePlayers(){return this.players.filter(p=>p.connected!==false&&p.lives>0&&p.respawn<=0);}
    targetPlayer(x,y){return this.livePlayers().reduce((best,p)=>!best||Math.hypot(p.x-x,p.y-y)<Math.hypot(best.x-x,best.y-y)?p:best,null)||this.players.find(p=>p.connected!==false&&p.lives>0)||this.player;}
    nextStage(){if(this.phase!=='cleared'||this.stage.id>=18)return false;this.loadStage(this.stage.id+1);return true;}
    beginPresentation(){
      this.effects=[];this.wrecks=[];this.stageBonus=null;this.stageBonuses=[];this.launch=null;
      for(const p of this.players){p.medals=0;p.mega=0;p.megaTick=0;}
      if(this.presentation){this.phase='launch';this.launch={ticks:0,carrierY:-64,previousY:-64};}
    }
    pause(){if(['playing','launch','aftermath'].includes(this.phase)){this.resumePhase=this.phase;this.phase='paused';return true;}return false;}
    resume(){if(this.phase==='paused'){this.pendingTime=0;if(this.players.every(p=>p.lives<=0||p.connected===false)){this.phase='gameover';this.events.push({type:'gameover'});}else this.phase=this.resumePhase||'playing';return true;}return false;}
    drainEvents(){return this.events.splice(0);}
    move(dx,dy,p=this.player){if(this.phase==='playing'&&p.lives>0){p.x=clamp(p.x+dx,16,W-16);p.y=clamp(p.y+dy,64,H-40);}}
    addBullet(x,y,vx,vy,friendly=false,damage=1,style=0,extra={}){if(this.bullets.length>1800)return;const playerId=friendly?(extra.playerId??this.player.id):undefined;this.bullets.push({x,y,px:x,py:y,vx,vy,friendly,damage,style,r:3,life:5,...(friendly?{playerId}:{}),...extra});if(friendly){this.shotsFired++;const p=this.playerById(playerId);if(p)p.shotsFired++;}}
    emitPlayerShot(type,x,y,angle=0,extra={}){
      const rule=SHOT_RULES.shots[type],speed=rule?rule.speed:type>=51&&type<=53?17:12;
      const style=type>=26&&type<=28?1:type>=29&&type<=37||type>=48&&type<=50?2:type>=54?3:0;
      const homing=type===39,a=angle*Math.PI/1024;
      this.addBullet(x,y,Math.sin(a)*speed*TICK,-Math.cos(a)*speed*TICK,true,P.damage[type],style,{shotType:type,defaultShot:type===15,missile:type===38||homing,homing,carryTicks:rule?.carryTicks||0,flightAngle:angle,speedStep:speed,...(homing?{targetUid:this.acquireHomingTarget()?.uid,life:(SHOT_RULES.homing.lifetimeTicks+1)*STEP}:{}),...extra});
    }
    acquireHomingTarget(){
      // 原作 0x40fc90 循环分配活动目标；不按距离抢换已锁定目标。
      // Original 0x40fc90 cycles active targets; it does not replace a lock with the nearest enemy.
      const eligible=this.enemies.filter(e=>this.targetable(e)).sort((a,b)=>a.uid-b.uid);
      const target=eligible.find(e=>e.uid>(this.homingCursor||0))||eligible[0];
      if(target)this.homingCursor=target.uid;return target;
    }
    steerMissile(b){
      let target=this.enemies.find(e=>e.uid===b.targetUid&&this.targetable(e));
      if(!target){target=this.acquireHomingTarget();b.targetUid=target?.uid;}
      if(target){
        const desired=(Math.round(Math.atan2(target.x-b.x,b.y-target.y)*1024/Math.PI)+2048)%2048;
        let delta=desired-b.flightAngle;if(delta>1024)delta-=2048;if(delta<-1024)delta+=2048;
        const step=SHOT_RULES.homing.turnStep;
        b.flightAngle=(b.flightAngle+Math.sign(delta)*step+2048)%2048;
        // 0x428993 在转动后再检查 64 阈值并对齐，避免丢掉原作的近角度吸附。
        // 0x428993 snaps within 64 units AFTER turning; retain that final alignment step.
        if(Math.abs(desired-b.flightAngle)<=SHOT_RULES.homing.snapThreshold)b.flightAngle=desired;
      }
      const a=b.flightAngle*Math.PI/1024;b.vx=Math.sin(a)*b.speedStep*TICK;b.vy=-Math.cos(a)*b.speedStep*TICK;
    }
    firePlayer(part='all',p=this.player){
      if(p.connected===false||p.lives<=0||p.respawn>0)return;
      if(part!=='enhancement')for(const [type,muzzle] of P.slots[0].levels[0]){const [x,y]=P.muzzles[muzzle];this.emitPlayerShot(type,p.x-16+x,p.y-16+y,0,{playerId:p.id});}
      if(part!=='base'&&!p.defaultWeapon){
        for(const [type,muzzle] of P.slots[p.weapon+1].levels[p.power-1]){
          const [x,y]=P.muzzles[muzzle];let angle=({18:-146,19:146,20:-234,21:234,22:-146,23:146,24:-234,25:234})[type]||0;
          // 等离子辅助弹沿用原作交替的十六相位扇形。
          // Plasma auxiliary rays use the original alternating 16-phase fan layout.
          if(type>=32&&type<=37)angle=P.plasmaPhases[type][p.shotPhase++&15];
          this.emitPlayerShot(type,p.x-16+x,p.y-16+y,angle,{playerId:p.id});
        }
      }
      this.events.push({type:'shot',weapon:p.weapon,playerId:p.id});
    }
    fireAuxiliary(p=this.player){
      for(const key of ['side','rear']){
        if(!p[key])continue;
        if(p[key+'Delay']>0){p[key+'Delay']--;continue;}
        if(p[key+'Burst']<=0){p[key+'Delay']=10;p[key+'Burst']=p[key];continue;}
        if(p[key+'Gap']>0){p[key+'Gap']--;continue;}
        p[key+'Burst']--;p[key+'Gap']=1;
        if(key==='side'){this.emitPlayerShot(51,p.x,p.y,1536,{playerId:p.id});this.emitPlayerShot(52,p.x,p.y,512,{playerId:p.id});}else this.emitPlayerShot(53,p.x,p.y,1024,{playerId:p.id});
      }
    }
    triggerNova(p=this.player){
      const type=p.weapon,shot=[45,46,47,60][type],count=[16,32,64,64][type];
      for(let i=0;i<count;i++){
        const speed=type===0?6:type===1?4+[0,1,2,1][i%4]:4+i%4,a=i/count*Math.PI*2;
        this.addBullet(p.x,p.y,Math.sin(a)*speed*TICK,-Math.cos(a)*speed*TICK,true,P.damage[shot],type,{playerId:p.id,shotType:shot,nova:type,r:type===3?5:3,life:(type===0?58:Math.floor(350/speed))*STEP,homing:type===3,hitEnemies:[]});
      }
      this.events.push({type:'nova',weapon:type,playerId:p.id});
    }
    upgradeWeapon(type,full=false,p=this.player){
      const same=!p.defaultWeapon&&p.weapon===type;
      if(same&&p.power===6)this.triggerNova(p);
      p.power=full?6:same?Math.min(6,p.power+1):1;p.weapon=type;p.defaultWeapon=false;
    }
    spawnRecord(record){
      const d=C.definitions[C.byId[record[2]]],boss=!!(d.flags&1),scenery=!!(d.flags&16),ground=!!(d.flags&32);
      const e={uid:++this.enemySerial,def:d,record,x:record[0],y:-Math.max(192,d.height+64),r:Math.max(6,Math.min(d.width,d.height)*.38),hp:d.hp*(boss?2:1),maxHp:d.hp*(boss?2:1),boss,scenery,ground,dead:false,hit:0,time:0,speed:Math.max(1,d.speed),pathIndex:0,pathX:record[0],pathY:0,originX:record[0],guns:d.guns.map(g=>new Gun(g)),type:d.sprite};
      if(d.mode===9||d.mode===10){this.setPath(e,true);}else if(d.mode===3){e.x=record[0]<200?-d.width:W+d.width;e.y=100;}
      else if(d.mode===5){e.y=H+d.height;e.vy=-e.speed;}
      if(scenery)e.y=-d.height/2;
      const animation=A.animations[d.id];
      if(animation)e.animation={frame:animation.start,wait:animation.interval,pause:animation.pause,cycles:animation.cycles,direction:1};
      this.enemies.push(e);if(boss){this.boss=e;this.bossSpawned=true;this.bossRadioTicks=60;this.events.push({type:'boss',name:this.stage.boss});}
    }
    setPath(e,first=false){
      const d=e.def,point=d.path[e.pathIndex];if(!point){e.pathFinished=true;return;}
      const mirror=d.mode===10&&e.originX<200?-1:1;
      if(first){e.pathX=e.originX+point[0]*mirror;e.pathY=point[1]-(d.pathFlags&16?48:16);}
      else{e.pathX+=point[0]*mirror;e.pathY+=point[1];}
      if(e.pathIndex===d.speedNode){e.loopX=e.pathX;e.loopY=e.pathY;}
      e.pathIndex++;
    }
    moveEnemy(e,dt){
      const d=e.def;let speed=e.speed*TICK;
      if(e.scenery){e.y+=TICK*dt;return;}
      if(d.mode===9||d.mode===10){
        if(e.pathFinished){e.x+=(e.exitX||0)*speed*dt;e.y+=(e.exitY??1)*speed*dt;return;}
        const dx=e.pathX-e.x,dy=e.pathY-e.y,dist=Math.hypot(dx,dy);
        // 到指定路径节点后，每 tick 向出口速度逼近 1。
        // 0x410934: move with the current speed, then approach exitSpeed by
        // one unit per tick once the target's index reaches speedNode.
        if(e.pathIndex-1>=d.speedNode&&d.speedNode>=0)e.speed+=Math.sign(Math.max(1,d.exitSpeed)-e.speed);
        if(dist<=speed*dt+1){e.x=e.pathX;e.y=e.pathY;if(e.pathIndex>=d.path.length){if((d.pathFlags&4)&&d.speedNode>=0){e.pathIndex=d.speedNode+1;e.pathX=e.loopX??e.originX;e.pathY=e.loopY??120;}else this.finishPath(e);}else this.setPath(e);}
        else{e.x+=dx/dist*speed*dt;e.y+=dy/dist*speed*dt;}
      }else if(d.mode===3){e.x+=(e.originX<200?1:-1)*speed*dt;}
      else if(d.mode===5)e.y-=speed*dt;
      else if(d.mode===8){e.y=Math.min(d.height/2+42,e.y+speed*dt);}
      else{e.y+=speed*dt;}
    }
    finishPath(e){
      e.pathFinished=true;
      if(e.def.pathFlags&1){
        // 只在路径出口记录一次玩家位置，后续不继续追踪。
        // 0x410a03 snapshots the player exactly once, then enters state 2.
        // Subsequent updates only advance along this stored heading.
        const p=this.targetPlayer(e.x,e.y),a=Math.atan2(p.y-e.y,p.x-e.x);
        e.exitX=Math.cos(a);e.exitY=Math.sin(a);
      }else if(e.def.pathFlags&2){e.exitX=0;e.exitY=1;}
      else e.dead=true; // Original path end removes the object without a kill.
    }
    explode(x,y,color='#ffb05c',amount=16){for(let i=0;i<amount;i++){const a=this.random()*Math.PI*2,s=20+this.random()*110,life=.2+this.random()*.45;if(this.particles.length<350)this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,maxLife:life,color,size:1+this.random()*3});}}
    addEffect(row,x,y,size,ticks,ground=false){
      if(this.effects.length>=160)this.effects.shift();
      this.effects.push({row,x,y,size,ticks,age:0,ground});
    }
    impact(b,e){
      const effect=IMPACT[b.shotType]||0,heavy=effect!==0,short=effect===10;
      // 弹型模板 +44 决定小火花或大命中火球。
      // Original projectile-template +44 chooses S_EXPLO1 or S_SEXPNEW.
      this.addEffect(effect===3?2:heavy?1:0,clamp(b.x,e.x-e.def.width/2,e.x+e.def.width/2),e.y+e.def.height*.28,heavy?40:16,heavy?(short?16:24):12);
    }
    updateEffects(){
      for(const v of this.effects){v.age++;if(v.ground)v.y++;}
      this.effects=this.effects.filter(v=>v.age<v.ticks);
      for(const w of this.wrecks)w.y++;
      this.wrecks=this.wrecks.filter(w=>w.y-w.height/2<H);
      for(const v of this.particles){v.x+=v.vx*STEP;v.y+=v.vy*STEP;v.life-=STEP;}
      this.particles=this.particles.filter(v=>v.life>0);
    }
    spawnPickup(id,x,y,death=false){
      if(!Number.isInteger(id)||!DROPS[id]||x<0||x>=W||y<0||y>=H)return;
      let angle,speed;if(y>336){angle=[-176,-88,0,88,176][this.dropSequence%5];speed=6+Math.floor(this.random()*2);this.dropSequence=(this.dropSequence+1)&31;}else if(y<1){angle=1024;speed=4+Math.floor(this.random()*3);this.dropSequence=(this.dropSequence+1)&31;}else{angle=(this.dropSequence*64)&2047;speed=1+Math.floor(this.random()*3);this.dropSequence=(this.dropSequence+3)&31;}
      this.pickups.push({x,y,id,type:DROPS[id],time:0,r:10,angle,speed,deathDrop:death,cycleTicks:DROP_WAIT[id]});
    }
    updatePickup(item){
      if(DROP_NEXT[item.id]>=0&&--item.cycleTicks<0){item.id=DROP_NEXT[item.id];item.type=DROPS[item.id];item.cycleTicks=110;}
      if(item.speed<=2)item.angle=(item.angle+24)&2047;
      const a=item.angle*Math.PI/1024;item.x+=Math.sin(a)*item.speed;item.y-=Math.cos(a)*item.speed;
      if(item.speed>2)item.speed--;else{if(item.angle>512&&item.angle<1536)item.y++;if(item.x<45)item.x++;else if(item.x>W-45)item.x--;}
    }
    automaticDrops(e){
      // 0x200 标记触发额外补给，与地图掉落字段独立。
      // Enemy flag 0x200 calls 0x423c70 independently of its map drop field.
      const sequence=[2,3,4,13,14],limit=this.stage.id<=6?3:5,p=this.targetPlayer(e.x,e.y);
      const weapon=sequence[this.supplyIndex];this.supplyIndex=(this.supplyIndex+1)%limit;
      if(p.bombs<[6,3,2,1][this.difficulty]){this.spawnPickup([5,6,15][this.supplyBombIndex],e.x,e.y);this.supplyBombIndex=(this.supplyBombIndex+1)%3;}
      if(p.energy<12)this.spawnPickup(p.energy<4?1:11,e.x,e.y);
      this.spawnPickup(weapon,e.x,e.y);
    }
    targetable(e){const d=e.def,inside=e.x>=0&&e.x<W&&e.y>=0&&e.y<H;return !e.dead&&!e.dying&&!e.scenery&&(e.entered||inside)&&e.x+d.width/2>0&&e.x-d.width/2<W&&e.y+d.height/2>0&&e.y-d.height/2<H;}
    killEnemy(e,p=this.player){
      if(e.dead||e.dying||e.scenery)return;e.killerId=p.id;if(e.boss)e.hp=0;
      // 0x40fdb0 只让带 0x80 且非地面的对象进入坠毁；其余 Boss 原地爆炸。
      // 0x40fdb0 gates falling on 0x80 without ground 0x40; other Bosses explode in place.
      if(e.boss&&(e.def.flags&0xc0)===0x80){e.hp=0;e.dying=true;e.deathTicks=0;e.fall=0;e.fallSpeed=.25;this.events.push({type:'boss-dying',playerId:p.id});return;}
      this.finishEnemy(e);
    }
    finishEnemy(e){
      if(e.dead)return;e.dead=true;this.kills++;this.score+=e.def.score;const killer=this.playerById(e.killerId)||this.player;killer.kills++;killer.score+=e.def.score;
      const ground=!!(e.def.flags&0x40),large=e.def.width>=32,size=e.boss?112:large?Math.max(48,Math.min(96,e.def.width)):28;
      const scale=e.dying?deathScale(e.fall):1,x=W/2+(e.x-W/2)*scale,y=H/2+(e.y-H/2)*scale;
      this.addEffect(ground?3:2,x,y,size,e.boss?36:large?24:18,ground);
      this.explode(x,y,'#ffb05c',e.boss?85:16);
      // 必须同时有 0x40/0x80 才留残骸；残骸不再战斗、掉落或计分。
      // 0x4113d2: both 0x40 and 0x80 are required. Remnants cannot fire,
      // collide, receive damage, score or drop equipment a second time.
      if((e.def.flags&0xc0)===0xc0){
        if(this.wrecks.length>=120)this.wrecks.shift();
        this.wrecks.push({x:e.x,y:e.y,width:e.def.width,height:e.def.height,sprite:e.def.sprite});
      }
      this.events.push({type:'explosion',heavy:!!e.boss,ground});this.spawnPickup(e.record[5],e.x,e.y);if(e.def.flags&0x200)this.automaticDrops(e);if(e.boss)this.defeatBoss();
    }
    updateEnemyState(e){
      if(e.def.sprite==='S_ENEMY28A'&&!e.dying)e.animationFrame=((e.animationFrame||0)+1)%6;
      if(e.animation&&!e.dying)this.updateEnemyAnimation(e);
      if(e.x>=0&&e.x<W&&e.y>=0&&e.y<H)e.entered=true;
      // 濒死阈值按基础 HP 计算，包括出生时翻倍的 Boss。
      // Original warnings compare against base HP, including for doubled Boss HP.
      e.critical=e.hp>0&&e.hp<Math.floor(e.def.hp/4);e.burning=e.boss&&(e.dying||e.hp<Math.floor(e.def.hp/16));
      e.criticalTicks=e.critical?(e.criticalTicks||0)+1:0;
      if(e.dying){e.deathTicks++;if(e.fall>120){this.finishEnemy(e);return;}e.fall+=e.fallSpeed;e.fallSpeed=Math.min(4,e.fallSpeed+.25);return;}
      if((e.def.flags&0x800)&&e.entered){e.engineTicks=(e.engineTicks||0)-1;if(e.engineTicks<=0){e.engineTicks=120;const f=e.def.flags,variant=f&0x100000?2:f&0x200000?3:f&0x400000?4:f&0x800000?5:f&0x4000000?6:1;this.events.push({type:'boss-engine',variant});}}
      if(e.def.flags&0x400){
        const p=this.targetPlayer(e.x,e.y),target=(Math.round(Math.atan2(p.x-e.x,-(p.y-e.y))*16/Math.PI)+32)%32;
        const current=e.facing===undefined?16:e.facing,difference=(target-current+32)%32;
        e.facing=(current+(difference===0?0:difference<=16?1:-1)+32)%32;
      }else if(e.def.flags&0x100){const dx=e.x-e.px,dy=e.y-e.py;if(dx||dy)e.facing=(Math.round(Math.atan2(dx,-dy)*16/Math.PI)+32)%32;}
    }
    updateEnemyAnimation(e){
      const state=e.animation,rule=A.animations[e.def.id];
      if(state.cycles<=0||rule.loopFrames<2)return;
      if(state.pause>0){state.pause--;return;}
      if(state.wait>0){state.wait--;return;}
      const last=A.sprites[e.def.sprite].frames.length-1;
      state.frame+=state.direction;
      if(rule.pingPong&&state.frame<0){state.frame=0;state.direction=1;state.pause=rule.pauseStart;}
      if(state.frame>last){
        if(rule.pingPong){state.frame=last;state.direction=-1;state.pause=rule.pauseEnd;}
        else state.frame=last-rule.loopFrames+1;
        if(state.cycles<999)state.cycles--;
      }
      state.wait=rule.interval;
    }
    collect(item,p=this.player){
      if(item.dead||p.connected===false||p.lives<=0||p.respawn>0)return false;
      const t=item.type;
      if(['weapon','ion','plasma','magnetic'].includes(t))this.upgradeWeapon(['weapon','ion','plasma','magnetic'].indexOf(t),false,p);
      if(t==='full')this.upgradeWeapon(p.defaultWeapon?0:p.weapon,true,p);
      if(['bomb','scatter','mega'].includes(t)&&p.bombs<6)p.bombInventory.push(['bomb','scatter','mega'].indexOf(t));
      if(t==='energy')p.energy=p.maxEnergy;
      if(t==='crystal')p.energy=Math.min(p.maxEnergy,p.energy+2);
      if(t==='shield')p.shield=360*STEP;
      if(t==='missile'||t==='homing'){const type=t==='homing'?9:8;p.missileAmmo=p.missileType===type?p.missileAmmo+50:50;p.missileType=type;}
      if(t==='side'||t==='rear'){p[t]=p[t]?Math.min(4,p[t]+1):2;p[t+'Burst']=0;}
      if(t==='medal')p.medals++;
      item.dead=true;this.events.push({type:'pickup',item:t,playerId:p.id});return true;
    }
    deathDrops(p=this.player){
      if(p.missileAmmo>39)this.spawnPickup(8,p.x,p.y,true);if(p.bombs>3)this.spawnPickup(6,p.x,p.y,true);
      if(!p.defaultWeapon){const id=[2,3,4,4][p.weapon];if(p.power===6)this.spawnPickup(id,p.x,p.y,true);this.spawnPickup(id,p.x,p.y,true);}
    }
    collideEnemy(e,p=this.player){
      if(e.dead||e.dying||e.scenery||e.ground||p.connected===false||p.lives<=0||p.respawn>0||p.invincible>0||this.phase!=='playing')return false;
      this.hitPlayer(collisionDamage(e.def.width),'collision',p);
      e.hp-=305;e.hit=.06;if(e.hp<=0)this.killEnemy(e,p);
      return true;
    }
    hitPlayer(damage=1,source='projectile',p=this.player){
      if(p.connected===false||p.lives<=0||p.respawn>0||p.invincible>0||this.phase!=='playing')return false;
      if(p.shield>0)return true;
      const loss=source==='collision'?damage:projectileDamage(damage,this.difficulty);
      p.energy-=loss;this.shake=3;this.events.push({type:'hit',damage:loss,source,playerId:p.id});
      if(p.energy>0&&p.energy<4&&!p.defaultWeapon&&p.weapon<3&&p.power>1)p.power--;
      if(p.energy<=0){
        this.deathDrops(p);this.addEffect(2,p.x,p.y,48,24);this.explode(p.x,p.y,'#ff8552',35);this.events.push({type:'explosion',heavy:true,playerId:p.id});p.medals=0;
        p.lives--;p.energy=p.maxEnergy;p.power=0;p.weapon=0;p.defaultWeapon=true;p.fire=p.baseFire=0;p.side=p.rear=0;p.sideBurst=p.rearBurst=0;p.missileAmmo=0;p.missileType=8;p.mega=0;p.bombInventory=[0,0,0];p.bombCooldown=0;
        p.respawn=45*STEP;p.invincible=135*STEP;p.x=p.px=this.spawnX(p);p.y=p.py=H-70;p.bank=8;p.thrust=0;
        this.events.push({type:'player-death',playerId:p.id,lives:p.lives});
        if(this.players.every(player=>player.connected===false||player.lives<=0)){this.phase='gameover';this.events.push({type:'gameover'});}
      }
      return true;
    }
    useBomb(p=this.player){
      if(this.phase!=='playing'||p.connected===false||p.lives<=0||p.respawn>0||p.bombCooldown>1e-9||p.bombs<=0)return false;
      const type=p.bombInventory.pop();p.bombCooldown=35*STEP;p.invincible=Math.max(p.invincible,1);
      if(type===2){p.mega=4;p.megaTick=0;}else{
        const hits=[],count=type===0?1:32;
        for(let i=0;i<count;i++){const speed=type===0?8:4+Math.floor(this.random()*6);this.specials.push({playerId:p.id,type,x:p.x,y:p.y-10,px:p.x,py:p.y-10,angle:i/count*Math.PI*2,speed,ticks:0,fuse:type===0?10:18+Math.floor(this.random()*14),hits});}
      }
      this.events.push({type:'bomb',bombType:type,playerId:p.id});return true;
    }
    updateSpecials(){
      if(this.phase!=='playing')return;
      // 保持原有 4 秒持续时间与每四 tick 的 3×240 伤害预算。
      // Keep the existing 4 s duration and 3*240 damage per four-tick burst frozen.
      for(const p of this.livePlayers())if(p.mega>0){if((p.megaTick++||0)%4===0){this.addBullet(p.x,p.y-20,0,0,true,3*240,1,{playerId:p.id,shotType:61,pulse:true,playerBeam:true,age:-1,r:6,endY:0,damageApplied:false,life:4*STEP});this.events.push({type:'super-pulse',playerId:p.id});}}
      for(const s of this.specials){s.px=s.x;s.py=s.y;s.ticks++;
        if(s.exploded){s.remaining--;continue;}
        s.x+=Math.sin(s.angle)*s.speed;s.y-=Math.cos(s.angle)*s.speed;
        if(s.type===1)s.speed=Math.max(1,s.speed-.25);
        if(s.ticks<=s.fuse)continue;
        s.exploded=true;s.remaining=s.type===0?30:14;s.radius=s.type===0?100:32;
        this.enemyFireLock=Math.max(this.enemyFireLock,s.type===0?30:5);
        this.bullets=this.bullets.filter(b=>b.friendly);this.shake=s.type===0?5:2;
        for(const e of this.enemies){if(!this.targetable(e)||s.hits.includes(e.uid)||Math.hypot(e.x-s.x,e.y-s.y)>s.radius+e.r)continue;
          // 保留旧版单敌伤害上限，散射子弹共享上限。
          // Frozen v0.2.1 per-enemy damage budgets; scatter siblings share the cap.
          s.hits.push(e.uid);e.hp-=s.type===0?4500:2400;e.hit=.06;if(e.hp<=0)this.killEnemy(e,this.playerById(s.playerId)||this.player);
        }
        this.events.push({type:'explosion',heavy:s.type===0});
      }
      this.specials=this.specials.filter(s=>!s.exploded||s.remaining>0);
    }
    updatePlayerBeam(b){
      const p=this.playerById(b.playerId)||this.player;
      if(this.phase!=='playing'||p.connected===false||p.lives<=0||p.respawn>0||p.mega<=0||++b.age>=(b.beamFrames||4)){b.dead=true;return;}
      b.px=b.x;b.py=b.y;b.x=p.x;b.y=p.y-20;b.endY=0;
      // 原作 0x428e70/0x428ed0 从炮口向前扫描并在首个目标处截止。
      // Original 0x428e70/0x428ed0 scans forward from the muzzle and stops at the first target.
      let target=null,nearest=-Infinity;
      for(const e of this.enemies){
        if(!this.targetable(e)||e.y>=b.y||Math.abs(e.x-b.x)>e.r+b.r)continue;
        const edge=Math.min(b.y,e.y+e.r);if(edge>nearest){nearest=edge;target=e;}
      }
      if(target){b.endY=Math.max(0,nearest);if(!b.damageApplied){
        b.damageApplied=true;target.hp-=b.damage;target.hit=.06;this.shotsHit++;p.shotsHit++;
        this.addEffect(1,b.x,b.endY,40,16);
        if(target.hp<=0)this.killEnemy(target,p);else this.events.push({type:'enemy-hit'});
      }}
    }
    defeatBoss(){
      if(this.phase!=='playing')return;this.boss=null;this.bullets=[];this.flash=.35;
      this.stageBonuses=this.players.map(p=>{const eligible=p.lives>0&&p.connected!==false,bombs=eligible?p.bombs:0,medals=eligible?p.medals:0;return {playerId:p.id,bombs,medals,bombScore:bombs*1000,medalScore:medals*2000,total:bombs*1000+medals*2000};});
      this.stageBonus={bombs:0,medals:0,bombScore:0,medalScore:0,total:0,awarded:false};for(const row of this.stageBonuses)for(const key of ['bombs','medals','bombScore','medalScore','total'])this.stageBonus[key]+=row[key];
      this.events.push({type:'stage-complete',stage:this.stage.id,final:this.stage.id===18});
      if(this.presentation){this.phase='aftermath';this.aftermathTicks=45;}else this.completeStage();
    }
    completeStage(){
      if(!this.stageBonus||this.stageBonus.awarded)return;
      this.score+=this.stageBonus.total;for(const row of this.stageBonuses)this.playerById(row.playerId).score+=row.total;this.stageBonus.awarded=true;
      this.phase=this.stage.id===18?'victory':'cleared';this.events.push({type:this.phase,stage:this.stage.id,completionAnnounced:true});
    }
    presentationStep(){
      if(this.phase==='launch'){
        const s=this.launch;s.ticks++;
        if(s.ticks===26)this.events.push({type:'launch'});
        s.previousY=s.carrierY;if(s.ticks>=26)s.carrierY+=LAUNCH_SPEED*STEP;
        if(s.carrierY>H+64){this.phase='playing';this.launch=null;this.pendingTime=0;this.events.push({type:'mission-start'});}
      }else if(this.phase==='aftermath'){
        this.flash=Math.max(0,this.flash-STEP);this.shake=Math.max(0,this.shake-STEP*25);this.updateEffects();
        if(--this.aftermathTicks<=0)this.completeStage();
      }
    }
    update(dt,input={}){
      if(!['playing','launch','aftermath'].includes(this.phase)||!Number.isFinite(dt))return;
      this.pendingTime+=clamp(dt,0,.25);
      while(this.pendingTime+1e-9>=STEP&&['playing','launch','aftermath'].includes(this.phase)){this.pendingTime-=STEP;if(this.phase==='playing')this.step(input);else this.presentationStep();}
    }
    stepPlayer(p,input={}){
      if(p.connected===false||p.lives<=0)return;
      const dt=STEP;
      const hadShield=p.shield>0;
      for(const k of ['invincible','shield','mega','respawn','bombCooldown'])p[k]=Math.max(0,p[k]-dt);
      if(hadShield&&p.shield===0)this.events.push({type:'shield-lost',playerId:p.id});
      const dx=clamp(Number.isFinite(input.x)?input.x:0,-1,1),dy=clamp(Number.isFinite(input.y)?input.y:0,-1,1);
      if(p.respawn<=0)this.move(dx*PLAYER_STEP_X,dy*PLAYER_STEP_Y,p);
      p.bank+=clamp(8+dx*8-p.bank,-1,1);p.thrust+=clamp(-dy-p.thrust,-.25,.25);
      p.fire=Math.max(0,p.fire-dt);p.baseFire=Math.max(0,p.baseFire-dt);p.missileTimer=Math.max(0,p.missileTimer-dt);
      if(input.fire&&p.respawn<=0){
        if(p.baseFire<=1e-9){this.firePlayer('base',p);p.baseFire=4*STEP;}
        if(!p.defaultWeapon&&p.fire<=1e-9){this.firePlayer('enhancement',p);p.fire=(P.slots[p.weapon+1].cooldownTicks+1)*STEP;}
        this.fireAuxiliary(p);
        if(p.missileAmmo>0&&p.missileTimer<=1e-9){const type=p.missileType===9?39:38;this.emitPlayerShot(type,p.x-8,p.y,0,{playerId:p.id});this.emitPlayerShot(type,p.x+8,p.y,0,{playerId:p.id});p.missileAmmo--;p.missileTimer=17*STEP;}
      }
      // 炸弹按动作编号去重，网络重发和长按均不能重复消费。
      // Action sequence IDs deduplicate bomb retries and held network inputs.
      if(Number.isSafeInteger(input.bomb)&&input.bomb>(p.lastBombAction||0)){p.lastBombAction=input.bomb;this.useBomb(p);}
    }
    step(input={}){
      const dt=STEP;this.elapsed+=dt;this.totalTime+=dt;this.frame++;
      this.previousScroll=this.scroll;
      for(const obj of [...this.players,...this.enemies,...this.pickups]){obj.px=obj.x;obj.py=obj.y;}
      this.flash=Math.max(0,this.flash-dt);this.bombRing=Math.max(0,this.bombRing-dt);this.shake=Math.max(0,this.shake-dt*25);this.enemyFireLock=Math.max(0,this.enemyFireLock-1);
      if(this.bossRadioTicks>0&&--this.bossRadioTicks===0&&this.boss&&!this.boss.dying)this.events.push({type:'boss-radio'});
      for(const p of this.players)this.stepPlayer(p,input.players?input.players[p.id-1]||{}:p.id===1?input:{});
      if(!this.bossSpawned)this.scroll+=dt*TICK;
      while(this.cursor<this.recordEvents.length&&this.recordEvents[this.cursor][1]<=this.scroll){this.spawnRecord(this.recordEvents[this.cursor++]);}
      for(const e of this.enemies){if(e.dead)continue;e.time+=dt;e.hit=Math.max(0,e.hit-dt);if(!e.dying)this.moveEnemy(e,dt);this.updateEnemyState(e);if(e.dead||e.dying)continue;for(const gun of e.guns)gun.tick(e,this);for(const p of this.livePlayers())if(!e.scenery&&!e.ground&&e.y>0&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r)this.collideEnemy(e,p);}
      this.updateSpecials();
      for(const b of this.bullets){
        if(b.playerBeam){this.updatePlayerBeam(b);continue;}
        if(b.beam){
          const owner=this.enemies.find(e=>e.uid===b.owner&&!e.dead&&!e.dying);
          if(!owner||b.dead||++b.age>=(b.beamFrames||4)){b.dead=true;continue;}
          b.px=b.x;b.py=b.y;b.x=owner.x+b.offsetX;b.y=owner.y+b.offsetY;b.life-=dt;
          // 原作光束宽 8 像素、向下 480 像素，命中后不消失。
          // Original 0x428a77: vertical rectangle eight pixels wide, reaching
          // 480 pixels below the muzzle. Hitting does not consume the beam.
          for(const p of this.livePlayers())if(Math.abs(p.x-b.x)<=p.r+4&&p.y+p.r>=b.y&&p.y-p.r<=b.y+480)this.hitPlayer(b.damage,'projectile',p);
          continue;
        }
        if(b.homing&&b.shotType!==39){const targets=this.enemies.filter(e=>this.targetable(e));let target=null,dist=Infinity;for(const e of targets){const n=Math.hypot(e.x-b.x,e.y-b.y);if(n<dist){dist=n;target=e;}}if(target){const a=Math.atan2(target.y-b.y,target.x-b.x),s=Math.hypot(b.vx,b.vy);b.vx+=(Math.cos(a)*s-b.vx)*Math.min(1,dt*6);b.vy+=(Math.sin(a)*s-b.vy)*Math.min(1,dt*6);}}
        b.age=(b.age||0)+1;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.shotType===39){this.steerMissile(b);if(b.age>=SHOT_RULES.homing.lifetimeTicks){b.dead=true;this.addEffect(1,b.x,b.y,40,16);continue;}if(b.x<-16||b.x>W+16||b.y<-16||b.y>H+16){b.dead=true;continue;}}
        const rule=b.friendly&&SHOT_RULES.shots[b.shotType];
        if(rule?.acceleration){b.speedStep=Math.max(rule.minimumSpeed,b.speedStep+rule.acceleration);const a=b.flightAngle*Math.PI/1024;b.vx=Math.sin(a)*b.speedStep*TICK;b.vy=-Math.cos(a)*b.speedStep*TICK;}
        // 原作主炮继承前两步主机位移，追踪弹仅继承一步，普通导弹不继承。
        // Original main shots inherit two player displacements; homing missiles one, ordinary missiles none.
        if(b.carryTicks>0){const p=this.playerById(b.playerId)||this.player;b.x+=p.x-p.px;b.y+=p.y-p.py;b.carryTicks--;}
        if(b.friendly&&b.missile&&this.particles.length<350){const a=(b.flightAngle||0)*Math.PI/1024;this.particles.push({x:b.x-Math.sin(a)*4,y:b.y+Math.cos(a)*4,vx:0,vy:0,life:.28,maxLife:.28,size:1.6,smoke:true,color:'#aab0b8'});}
        if(b.nova!==undefined)for(const hostile of this.bullets){if(!hostile.friendly&&!hostile.dead&&intersects(b.px,b.py,b.x,b.y,hostile.x,hostile.y,b.r+hostile.r+4))hostile.dead=true;}
        if(b.friendly){for(const e of this.enemies){if(!this.targetable(e)||b.hitEnemies?.includes(e.uid))continue;if(intersects(b.px,b.py,b.x,b.y,e.x,e.y,e.r+b.r)){const p=this.playerById(b.playerId)||this.player;e.hp-=b.damage;e.hit=.06;if(b.hitEnemies)b.hitEnemies.push(e.uid);else b.dead=true;this.shotsHit++;p.shotsHit++;this.impact(b,e);if(e.hp<=0)this.killEnemy(e,p);else this.events.push({type:'enemy-hit'});if(b.dead)break;}}}
        else for(const p of this.livePlayers())if(!b.dead&&intersects(b.px,b.py,b.x,b.y,p.x,p.y,p.r+b.r)){if(this.hitPlayer(b.damage,'projectile',p))b.dead=true;}
        if(this.phase!=='playing')break;
      }
      for(const item of this.pickups){item.time+=dt;this.updatePickup(item);const p=this.livePlayers().filter(p=>item.speed<=2&&Math.abs(item.x-p.x)<16&&Math.abs(item.y-p.y)<16).sort((a,b)=>Math.hypot(item.x-a.x,item.y-a.y)-Math.hypot(item.x-b.x,item.y-b.y)||a.id-b.id)[0];if(p)this.collect(item,p);}
      this.updateEffects();
      this.enemies=this.enemies.filter(e=>!e.dead&&(e.boss||e.time<2100*STEP)&&(e.y<H+220)&&e.x>-350&&e.x<W+350);
      this.bullets=this.bullets.filter(b=>!b.dead&&b.life>0&&b.x>-40&&b.x<W+40&&b.y>-220&&b.y<H+40);
      this.pickups=this.pickups.filter(i=>!i.dead&&i.y<H+30);this.particles=this.particles.filter(v=>v.life>0);
    }
  }
  globalThis.StarfallCore={W,H,TICK,STEP,MAX_PLAYERS,createPlayer,validCheckpoint,deathScale,LAUNCH_SPEED,HEALTH_BAR_MIN_HP,PLAYER_STEP_X,PLAYER_STEP_Y,DROPS,DROP_NEXT,DROP_WAIT,Game,Gun,STAGES,BIOMES,WEAPONS,DIFFICULTIES,rng,clamp,intersects,projectileDamage,collisionDamage};
})();
