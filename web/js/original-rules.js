/* SPDX-License-Identifier: MIT. Reimplemented from the documented 4.04 record format. */
(() => {
  'use strict';
  const C=globalThis.DemonStarCampaign,P=globalThis.DemonStarPlayerRules,A=globalThis.DemonStarEnemyArt;
  // 4.04's base wait is 35 ms (0x41ae07). Rendering remains independent.
  const W=400,H=480,STEP=.035,TICK=1/STEP;
  // Match the classic 320x400 visible-area traversal in our 400x480 playfield.
  // This is mobile control calibration, not a change to enemy/world timing.
  const PLAYER_STEP_X=4*(W-32)/(320-32),PLAYER_STEP_Y=4*(H-104)/(400-104);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
  const intersects=(x1,y1,x2,y2,x,y,r)=>{const dx=x2-x1,dy=y2-y1,t=clamp(((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy||1),0,1);return(x1+dx*t-x)**2+(y1+dy*t-y)**2<=r*r;};
  const DIFFICULTIES=[{name:'容易',key:'easy',fire:1.3},{name:'一般',key:'normal',fire:1},{name:'较难',key:'hard',fire:.85},{name:'疯狂',key:'insane',fire:.7}];
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
      if(this.aim){this.angle=(Math.atan2(game.player.x-x,-(game.player.y-y))*1024/Math.PI+r[8])&2047;this.aim=false;}
      if(enemy.y>=0&&enemy.y<H+enemy.r&&game.enemyFireLock<=0&&!enemy.dying){
        const a=this.angle*Math.PI/1024,s=Math.max(1,r[12])*TICK;
        // Type 9 is a four-frame beam attached to its emitter (0x429722),
        // not a travelling bullet. Damage comes from its original template.
        const beam=r[2]===9?{beam:true,owner:enemy.uid,offsetX:x-enemy.x,offsetY:y-enemy.y,age:0,life:4*STEP}:{};
        game.addBullet(x,y,Math.sin(a)*s,-Math.cos(a)*s,false,P.damage[r[2]],r[2]%3,{shotType:r[2],missile:r[2]===8,...beam});game.events?.push({type:'enemy-shot',shotType:r[2]});
      }
      this.angle=(this.angle+r[9])&2047;this.arc--;
    }
  }
  class Game {
    constructor(seed=Date.now()){this.seed=seed;this.random=rng(seed);this.events=[];this.phase='menu';}
    start(difficulty=1,stage=1,presentation=false){
      // Headless combat callers may omit presentation; the app always enables it.
      this.presentation=presentation;
      this.difficulty=clamp(Math.floor(difficulty),0,3);this.rules=DIFFICULTIES[this.difficulty];this.random=rng(this.seed);
      this.score=0;this.kills=0;this.combo=0;this.shotsFired=0;this.shotsHit=0;this.totalTime=0;this.events=[];this.supplyIndex=0;this.supplyBombIndex=0;
      this.player={x:200,y:400,r:10,lives:4,energy:16,maxEnergy:16,bombInventory:[0,0,0],medals:0,defaultWeapon:true,power:0,weapon:0,bank:8,thrust:0,shield:0,invincible:2.5,fire:0,baseFire:0,respawn:0,bombCooldown:0,missileAmmo:0,missileType:8,side:0,rear:0,sideDelay:10,sideBurst:0,sideGap:0,rearDelay:10,rearBurst:0,rearGap:0,shotPhase:0,mega:0,missileTimer:0};
      Object.defineProperty(this.player,'bombs',{enumerable:true,get(){return this.bombInventory.length;}});
      this.loadStage(clamp(Math.floor(stage),1,18));
    }
    loadStage(id){this.stage=STAGES[id-1];this.elapsed=0;this.scroll=0;this.previousScroll=0;this.cursor=0;this.frame=0;this.pendingTime=0;this.dropSequence=0;this.enemySerial=0;this.recordEvents=[...this.stage.map.events].sort((a,b)=>a[1]-b[1]);this.enemies=[];this.bullets=[];this.specials=[];this.enemyFireLock=0;this.bossRadioTicks=0;this.pickups=[];this.particles=[];this.boss=null;this.bossSpawned=false;this.flash=0;this.shake=0;this.bombRing=0;this.phase='playing';this.player.x=this.player.px=200;this.player.y=this.player.py=H-70;this.player.invincible=2.5;this.player.bank=8;this.player.thrust=0;this.beginPresentation();this.events.push({type:'stage',stage:id,deferredLaunch:this.presentation});}
    nextStage(){if(this.phase!=='cleared'||this.stage.id>=18)return false;this.loadStage(this.stage.id+1);return true;}
    beginPresentation(){
      this.effects=[];this.wrecks=[];this.stageBonus=null;this.player.medals=0;this.launch=null;
      if(this.presentation){this.phase='launch';this.launch={ticks:0,carrierY:-64};}
    }
    pause(){if(['playing','launch','aftermath'].includes(this.phase)){this.resumePhase=this.phase;this.phase='paused';return true;}return false;}
    resume(){if(this.phase==='paused'){this.pendingTime=0;this.phase=this.resumePhase||'playing';return true;}return false;}
    drainEvents(){return this.events.splice(0);}
    move(dx,dy){if(this.phase==='playing'){this.player.x=clamp(this.player.x+dx,16,W-16);this.player.y=clamp(this.player.y+dy,64,H-40);}}
    addBullet(x,y,vx,vy,friendly=false,damage=1,style=0,extra={}){if(this.bullets.length>1800)return;this.bullets.push({x,y,px:x,py:y,vx,vy,friendly,damage,style,r:friendly?3:3,life:5,...extra});if(friendly)this.shotsFired++;}
    emitPlayerShot(type,x,y,angle=0,extra={}){
      let speed=type<=25?24:type<=31||type>=48&&type<=50?16:type<=33?20:type===34?21:type===35?22:type<=37?24:type===38?9:type===39?8:type>=51&&type<=53?17:12;
      const style=type>=26&&type<=28?1:type>=29&&type<=37||type>=48&&type<=50?2:type>=54?3:0;
      const a=angle*Math.PI/1024;this.addBullet(x,y,Math.sin(a)*speed*TICK,-Math.cos(a)*speed*TICK,true,P.damage[type],style,{shotType:type,defaultShot:type===15,missile:type===38||type===39,homing:type===39,...extra});
    }
    firePlayer(part='all'){
      const p=this.player;
      if(part!=='enhancement')for(const [type,muzzle] of P.slots[0].levels[0]){const [x,y]=P.muzzles[muzzle];this.emitPlayerShot(type,p.x-16+x,p.y-16+y);}
      if(part!=='base'&&!p.defaultWeapon){
        for(const [type,muzzle] of P.slots[p.weapon+1].levels[p.power-1]){
          const [x,y]=P.muzzles[muzzle];let angle=({18:-146,19:146,20:-234,21:234,22:-146,23:146,24:-234,25:234})[type]||0;
          // Plasma auxiliary rays use the original alternating 16-phase fan layout.
          if(type>=32&&type<=37)angle=P.plasmaPhases[type][p.shotPhase++&15];
          this.emitPlayerShot(type,p.x-16+x,p.y-16+y,angle);
        }
      }
      this.events.push({type:'shot',weapon:p.weapon});
    }
    fireAuxiliary(){
      const p=this.player;
      for(const key of ['side','rear']){
        if(!p[key])continue;
        if(p[key+'Delay']>0){p[key+'Delay']--;continue;}
        if(p[key+'Burst']<=0){p[key+'Delay']=10;p[key+'Burst']=p[key];continue;}
        if(p[key+'Gap']>0){p[key+'Gap']--;continue;}
        p[key+'Burst']--;p[key+'Gap']=1;
        if(key==='side'){this.emitPlayerShot(51,p.x,p.y,1536);this.emitPlayerShot(52,p.x,p.y,512);}else this.emitPlayerShot(53,p.x,p.y,1024);
      }
    }
    triggerNova(){
      const p=this.player,type=p.weapon,shot=[45,46,47,60][type],count=[16,32,64,64][type];
      for(let i=0;i<count;i++){
        const speed=type===0?6:type===1?4+[0,1,2,1][i%4]:4+i%4,a=i/count*Math.PI*2;
        this.addBullet(p.x,p.y,Math.sin(a)*speed*TICK,-Math.cos(a)*speed*TICK,true,P.damage[shot],type,{shotType:shot,nova:type,r:type===3?5:3,life:(type===0?58:Math.floor(350/speed))*STEP,homing:type===3,hitEnemies:[]});
      }
      this.events.push({type:'nova',weapon:type});
    }
    upgradeWeapon(type,full=false){
      const p=this.player,same=!p.defaultWeapon&&p.weapon===type;
      if(same&&p.power===6)this.triggerNova();
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
        // 0x410a03 snapshots the player exactly once, then enters state 2.
        // Subsequent updates only advance along this stored heading.
        const a=Math.atan2(this.player.y-e.y,this.player.x-e.x);
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
      // Enemy flag 0x200 calls 0x423c70 independently of its map drop field.
      const sequence=[2,3,4,13,14],limit=this.stage.id<=6?3:5;
      const weapon=sequence[this.supplyIndex];this.supplyIndex=(this.supplyIndex+1)%limit;
      if(this.player.bombs<[6,3,2,1][this.difficulty]){this.spawnPickup([5,6,15][this.supplyBombIndex],e.x,e.y);this.supplyBombIndex=(this.supplyBombIndex+1)%3;}
      if(this.player.energy<12)this.spawnPickup(this.player.energy<4?1:11,e.x,e.y);
      this.spawnPickup(weapon,e.x,e.y);
    }
    targetable(e){const d=e.def,inside=e.x>=0&&e.x<W&&e.y>=0&&e.y<H;return !e.dead&&!e.dying&&!e.scenery&&(e.entered||inside)&&e.x+d.width/2>0&&e.x-d.width/2<W&&e.y+d.height/2>0&&e.y-d.height/2<H;}
    killEnemy(e){if(e.dead||e.dying||e.scenery)return;if(e.boss){e.hp=0;e.dying=true;e.deathTicks=0;e.fall=0;e.fallSpeed=.25;this.events.push({type:'boss-dying'});return;}this.finishEnemy(e);}
    finishEnemy(e){
      if(e.dead)return;e.dead=true;this.kills++;this.score+=e.def.score;
      const ground=!!(e.def.flags&0x40),large=e.def.width>=32,size=e.boss?112:large?Math.max(48,Math.min(96,e.def.width)):28;
      this.addEffect(ground?3:2,e.x,e.y+(e.dying?e.fall*.55:0),size,e.boss?36:large?24:18,ground);
      this.explode(e.x,e.y,'#ffb05c',e.boss?85:16);
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
      // Original warnings compare against base HP, including for doubled Boss HP.
      e.critical=e.hp>0&&e.hp<Math.floor(e.def.hp/4);e.burning=e.boss&&(e.dying||e.hp<Math.floor(e.def.hp/16));
      e.criticalTicks=e.critical?(e.criticalTicks||0)+1:0;
      if(e.dying){e.deathTicks++;e.fall+=e.fallSpeed;e.fallSpeed=Math.min(4,e.fallSpeed+.25);if(e.fall>120)this.finishEnemy(e);return;}
      if((e.def.flags&0x800)&&e.entered){e.engineTicks=(e.engineTicks||0)-1;if(e.engineTicks<=0){e.engineTicks=120;const f=e.def.flags,variant=f&0x100000?2:f&0x200000?3:f&0x400000?4:f&0x800000?5:f&0x4000000?6:1;this.events.push({type:'boss-engine',variant});}}
      if(e.def.flags&0x400){
        const target=(Math.round(Math.atan2(this.player.x-e.x,-(this.player.y-e.y))*16/Math.PI)+32)%32;
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
    collect(item){
      const p=this.player,t=item.type;
      if(['weapon','ion','plasma','magnetic'].includes(t))this.upgradeWeapon(['weapon','ion','plasma','magnetic'].indexOf(t));
      if(t==='full')this.upgradeWeapon(p.defaultWeapon?0:p.weapon,true);
      if(['bomb','scatter','mega'].includes(t)&&p.bombs<6)p.bombInventory.push(['bomb','scatter','mega'].indexOf(t));
      if(t==='energy')p.energy=p.maxEnergy;
      if(t==='crystal')p.energy=Math.min(p.maxEnergy,p.energy+2);
      if(t==='shield')p.shield=360*STEP;
      if(t==='missile'||t==='homing'){const type=t==='homing'?9:8;p.missileAmmo=p.missileType===type?p.missileAmmo+50:50;p.missileType=type;}
      if(t==='side'||t==='rear'){p[t]=p[t]?Math.min(4,p[t]+1):2;p[t+'Burst']=0;}
      if(t==='medal')p.medals++;
      item.dead=true;this.events.push({type:'pickup',item:t});
    }
    deathDrops(){
      const p=this.player;if(p.missileAmmo>39)this.spawnPickup(8,p.x,p.y,true);if(p.bombs>3)this.spawnPickup(6,p.x,p.y,true);
      if(!p.defaultWeapon){const id=[2,3,4,4][p.weapon];if(p.power===6)this.spawnPickup(id,p.x,p.y,true);this.spawnPickup(id,p.x,p.y,true);}
    }
    collideEnemy(e){
      const p=this.player;
      if(e.dead||e.dying||e.scenery||e.ground||p.respawn>0||p.invincible>0||this.phase!=='playing')return false;
      this.hitPlayer(collisionDamage(e.def.width),'collision');
      e.hp-=305;e.hit=.06;if(e.hp<=0)this.killEnemy(e);
      return true;
    }
    hitPlayer(damage=1,source='projectile'){
      const p=this.player;if(p.respawn>0||p.invincible>0||this.phase!=='playing')return false;
      if(p.shield>0)return true;
      const loss=source==='collision'?damage:projectileDamage(damage,this.difficulty);
      p.energy-=loss;this.shake=3;this.events.push({type:'hit',damage:loss,source});
      if(p.energy>0&&p.energy<4&&!p.defaultWeapon&&p.weapon<3&&p.power>1)p.power--;
      if(p.energy<=0){
        this.deathDrops();this.addEffect(2,p.x,p.y,48,24);this.explode(p.x,p.y,'#ff8552',35);this.events.push({type:'explosion',heavy:true});p.medals=0;
        p.lives--;p.energy=p.maxEnergy;p.power=0;p.weapon=0;p.defaultWeapon=true;p.fire=p.baseFire=0;p.side=p.rear=0;p.sideBurst=p.rearBurst=0;p.missileAmmo=0;p.missileType=8;p.mega=0;p.bombInventory=[0,0,0];p.bombCooldown=0;
        p.respawn=45*STEP;p.invincible=135*STEP;p.x=p.px=W/2;p.y=p.py=H-70;p.bank=8;p.thrust=0;
        if(p.lives<=0){this.phase='gameover';this.events.push({type:'gameover'});}
      }
      return true;
    }
    useBomb(){
      const p=this.player;if(this.phase!=='playing'||p.respawn>0||p.bombCooldown>1e-9||p.bombs<=0)return false;
      const type=p.bombInventory.pop();p.bombCooldown=35*STEP;p.invincible=Math.max(p.invincible,1);
      if(type===2){p.mega=4;p.megaTick=0;}else{
        const hits=[],count=type===0?1:32;
        for(let i=0;i<count;i++){const speed=type===0?8:4+Math.floor(this.random()*6);this.specials.push({type,x:p.x,y:p.y-10,px:p.x,py:p.y-10,angle:i/count*Math.PI*2,speed,ticks:0,fuse:type===0?10:18+Math.floor(this.random()*14),hits});}
      }
      this.events.push({type:'bomb',bombType:type});return true;
    }
    updateSpecials(){
      if(this.phase!=='playing')return;
      const p=this.player;
      // Keep the existing 4 s duration and 3*240 damage per four-tick burst frozen.
      if(p.mega>0&&p.respawn<=0){if((p.megaTick++||0)%4===0){this.addBullet(p.x,p.y-20,0,-950,true,3*240,1,{shotType:61,pulse:true,r:18,hitEnemies:[]});this.events.push({type:'super-pulse'});}}
      for(const s of this.specials){s.px=s.x;s.py=s.y;s.ticks++;
        if(s.exploded){s.remaining--;continue;}
        s.x+=Math.sin(s.angle)*s.speed;s.y-=Math.cos(s.angle)*s.speed;
        if(s.type===1)s.speed=Math.max(1,s.speed-.25);
        if(s.ticks<=s.fuse)continue;
        s.exploded=true;s.remaining=s.type===0?30:14;s.radius=s.type===0?100:32;
        this.enemyFireLock=Math.max(this.enemyFireLock,s.type===0?30:5);
        this.bullets=this.bullets.filter(b=>b.friendly);this.shake=s.type===0?5:2;
        for(const e of this.enemies){if(!this.targetable(e)||s.hits.includes(e.uid)||Math.hypot(e.x-s.x,e.y-s.y)>s.radius+e.r)continue;
          // Frozen v0.2.1 per-enemy damage budgets; scatter siblings share the cap.
          s.hits.push(e.uid);e.hp-=s.type===0?4500:2400;e.hit=.06;if(e.hp<=0)this.killEnemy(e);
        }
        this.events.push({type:'explosion',heavy:s.type===0});
      }
      this.specials=this.specials.filter(s=>!s.exploded||s.remaining>0);
    }
    defeatBoss(){
      if(this.phase!=='playing')return;this.boss=null;this.bullets=[];this.flash=.35;
      const p=this.player;this.stageBonus={bombs:p.bombs,medals:p.medals,bombScore:p.bombs*1000,medalScore:p.medals*2000,total:p.bombs*1000+p.medals*2000,awarded:false};
      this.events.push({type:'stage-complete',stage:this.stage.id,final:this.stage.id===18});
      if(this.presentation){this.phase='aftermath';this.aftermathTicks=45;}else this.completeStage();
    }
    completeStage(){
      if(!this.stageBonus||this.stageBonus.awarded)return;
      this.score+=this.stageBonus.total;this.stageBonus.awarded=true;
      this.phase=this.stage.id===18?'victory':'cleared';this.events.push({type:this.phase,stage:this.stage.id,completionAnnounced:true});
    }
    presentationStep(){
      if(this.phase==='launch'){
        const s=this.launch;s.ticks++;
        if(s.ticks===26)this.events.push({type:'launch'});
        if(s.ticks>=26)s.carrierY+=3;
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
    step(input){
      const dt=STEP;this.elapsed+=dt;this.totalTime+=dt;this.frame++;
      this.previousScroll=this.scroll;
      for(const obj of [this.player,...this.enemies,...this.pickups]){obj.px=obj.x;obj.py=obj.y;}
      const p=this.player;this.flash=Math.max(0,this.flash-dt);this.bombRing=Math.max(0,this.bombRing-dt);this.shake=Math.max(0,this.shake-dt*25);this.enemyFireLock=Math.max(0,this.enemyFireLock-1);
      if(this.bossRadioTicks>0&&--this.bossRadioTicks===0&&this.boss&&!this.boss.dying)this.events.push({type:'boss-radio'});
      const hadShield=p.shield>0;
      for(const k of ['invincible','shield','mega','respawn','bombCooldown'])p[k]=Math.max(0,p[k]-dt);
      if(hadShield&&p.shield===0)this.events.push({type:'shield-lost'});
      const dx=clamp(Number.isFinite(input.x)?input.x:0,-1,1),dy=clamp(Number.isFinite(input.y)?input.y:0,-1,1);
      if(p.respawn<=0)this.move(dx*PLAYER_STEP_X,dy*PLAYER_STEP_Y);
      p.bank+=clamp(8+dx*8-p.bank,-1,1);p.thrust+=clamp(-dy-p.thrust,-.25,.25);
      p.fire=Math.max(0,p.fire-dt);p.baseFire=Math.max(0,p.baseFire-dt);p.missileTimer=Math.max(0,p.missileTimer-dt);
      if(input.fire&&p.respawn<=0){
        if(p.baseFire<=1e-9){this.firePlayer('base');p.baseFire=4*STEP;}
        if(!p.defaultWeapon&&p.fire<=1e-9){this.firePlayer('enhancement');p.fire=(P.slots[p.weapon+1].cooldownTicks+1)*STEP;}
        this.fireAuxiliary();
        if(p.missileAmmo>0&&p.missileTimer<=1e-9){const type=p.missileType===9?39:38;this.emitPlayerShot(type,p.x-8,p.y);this.emitPlayerShot(type,p.x+8,p.y);p.missileAmmo--;p.missileTimer=17*STEP;}
      }
      if(!this.bossSpawned)this.scroll+=dt*TICK;
      while(this.cursor<this.recordEvents.length&&this.recordEvents[this.cursor][1]<=this.scroll){this.spawnRecord(this.recordEvents[this.cursor++]);}
      for(const e of this.enemies){if(e.dead)continue;e.time+=dt;e.hit=Math.max(0,e.hit-dt);if(!e.dying)this.moveEnemy(e,dt);this.updateEnemyState(e);if(e.dead||e.dying)continue;for(const gun of e.guns)gun.tick(e,this);if(!e.scenery&&!e.ground&&e.y>0&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r)this.collideEnemy(e);}
      this.updateSpecials();
      for(const b of this.bullets){
        if(b.beam){
          const owner=this.enemies.find(e=>e.uid===b.owner&&!e.dead&&!e.dying);
          if(!owner||b.dead||++b.age>=4){b.dead=true;continue;}
          b.px=b.x;b.py=b.y;b.x=owner.x+b.offsetX;b.y=owner.y+b.offsetY;b.life-=dt;
          // Original 0x428a77: vertical rectangle eight pixels wide, reaching
          // 480 pixels below the muzzle. Hitting does not consume the beam.
          if(p.respawn<=0&&Math.abs(p.x-b.x)<=p.r+4&&p.y+p.r>=b.y&&p.y-p.r<=b.y+480)this.hitPlayer(b.damage);
          continue;
        }
        if(b.homing){const targets=this.enemies.filter(e=>this.targetable(e));let target=null,dist=Infinity;for(const e of targets){const n=Math.hypot(e.x-b.x,e.y-b.y);if(n<dist){dist=n;target=e;}}if(target){const a=Math.atan2(target.y-b.y,target.x-b.x),s=Math.hypot(b.vx,b.vy);b.vx+=(Math.cos(a)*s-b.vx)*Math.min(1,dt*6);b.vy+=(Math.sin(a)*s-b.vy)*Math.min(1,dt*6);}}
        b.age=(b.age||0)+1;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.nova!==undefined)for(const hostile of this.bullets){if(!hostile.friendly&&!hostile.dead&&intersects(b.px,b.py,b.x,b.y,hostile.x,hostile.y,b.r+hostile.r+4))hostile.dead=true;}
        if(b.friendly){for(const e of this.enemies){if(!this.targetable(e)||b.hitEnemies?.includes(e.uid))continue;if(intersects(b.px,b.py,b.x,b.y,e.x,e.y,e.r+b.r)){e.hp-=b.damage;e.hit=.06;if(b.hitEnemies)b.hitEnemies.push(e.uid);else b.dead=true;this.shotsHit++;this.impact(b,e);if(e.hp<=0)this.killEnemy(e);else this.events.push({type:'enemy-hit'});if(b.dead)break;}}}
        else if(!b.dead&&p.respawn<=0&&intersects(b.px,b.py,b.x,b.y,p.x,p.y,p.r+b.r)){if(this.hitPlayer(b.damage))b.dead=true;}
        if(this.phase!=='playing')break;
      }
      for(const item of this.pickups){item.time+=dt;this.updatePickup(item);if(p.respawn<=0&&item.speed<=2&&Math.abs(item.x-p.x)<16&&Math.abs(item.y-p.y)<16)this.collect(item);}
      this.updateEffects();
      this.enemies=this.enemies.filter(e=>!e.dead&&(e.boss||e.time<2100*STEP)&&(e.y<H+220)&&e.x>-350&&e.x<W+350);
      this.bullets=this.bullets.filter(b=>!b.dead&&b.life>0&&b.x>-40&&b.x<W+40&&b.y>-220&&b.y<H+40);
      this.pickups=this.pickups.filter(i=>!i.dead&&i.y<H+30);this.particles=this.particles.filter(v=>v.life>0);
    }
  }
  globalThis.StarfallCore={W,H,TICK,STEP,PLAYER_STEP_X,PLAYER_STEP_Y,DROPS,DROP_NEXT,DROP_WAIT,Game,Gun,STAGES,BIOMES,WEAPONS,DIFFICULTIES,rng,clamp,intersects,projectileDamage,collisionDamage};
})();
