/* SPDX-License-Identifier: MIT. Reimplemented from the documented 4.04 record format. */
(() => {
  'use strict';
  const C=globalThis.DemonStarCampaign;
  const W=400,H=480,TICK=60;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rng=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
  const intersects=(x1,y1,x2,y2,x,y,r)=>{const dx=x2-x1,dy=y2-y1,t=clamp(((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy||1),0,1);return(x1+dx*t-x)**2+(y1+dy*t-y)**2<=r*r;};
  const DIFFICULTIES=[{name:'容易',key:'easy',fire:1.3,damage:.7},{name:'一般',key:'normal',fire:1,damage:1},{name:'较难',key:'hard',fire:.85,damage:1.25},{name:'疯狂',key:'insane',fire:.7,damage:1.5}];
  const BIOMES=Array.from({length:18},(_,i)=>({name:`第 ${String(i+1).padStart(2,'0')} 关`,color:['#8badca','#b6916c','#709bbb','#a69a89','#c06153','#b34c34','#5784b0','#426ca0','#9aa1c4','#997657','#497bb4','#98968e','#68a770','#3d793c','#ac7343','#6a737b','#be4c46','#868d94'][i],bg:'#030508',ground:'#1a2329',accent:'#414d55'}));
  const STAGES=C.levels.map((l,i)=>({id:l.id,biome:i,name:BIOMES[i].name,subtitle:'原版战役',duration:Math.max(...l.events.map(e=>e[1]))/TICK,boss:`第 ${i+1} 关旗舰`,map:l}));
  const WEAPONS=['质子激光','离子炮','等离子炮','磁力脉冲'];
  const DROPS=['weapon','ion','plasma','magnetic','full','bomb','scatter','mega','missile','homing','energy','shield','side','rear','medal','life'];
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
      if(enemy.y>=0&&enemy.y<H+enemy.r){const a=this.angle*Math.PI/1024,s=Math.max(1,r[12])*TICK;game.addBullet(x,y,Math.sin(a)*s,-Math.cos(a)*s,false,1+(r[2]>=7?1:0),r[2]%3,{shotType:r[2]});}
      this.angle=(this.angle+r[9])&2047;this.arc--;
    }
  }
  class Game {
    constructor(seed=Date.now()){this.seed=seed;this.random=rng(seed);this.events=[];this.phase='menu';}
    start(difficulty=1,stage=1){
      this.difficulty=clamp(Math.floor(difficulty),0,3);this.rules=DIFFICULTIES[this.difficulty];this.random=rng(this.seed);
      this.score=0;this.kills=0;this.combo=0;this.shotsFired=0;this.shotsHit=0;this.totalTime=0;this.events=[];
      this.player={x:200,y:400,r:10,lives:3,energy:10,maxEnergy:10,bombs:3,bombType:0,power:1,weapon:0,shield:0,invincible:2.5,fire:0,missiles:0,homing:0,side:0,rear:0,mega:0,missileTimer:0};
      this.loadStage(clamp(Math.floor(stage),1,18));
    }
    loadStage(id){this.stage=STAGES[id-1];this.elapsed=0;this.scroll=0;this.cursor=0;this.frame=0;this.recordEvents=[...this.stage.map.events].sort((a,b)=>a[1]-b[1]);this.enemies=[];this.bullets=[];this.pickups=[];this.particles=[];this.boss=null;this.bossSpawned=false;this.flash=0;this.shake=0;this.bombRing=0;this.phase='playing';this.player.x=200;this.player.y=H-70;this.player.invincible=2.5;this.events.push({type:'stage',stage:id});}
    nextStage(){if(this.phase!=='cleared'||this.stage.id>=18)return false;this.loadStage(this.stage.id+1);return true;}
    pause(){if(this.phase==='playing'){this.phase='paused';return true;}return false;}
    resume(){if(this.phase==='paused'){this.phase='playing';return true;}return false;}
    drainEvents(){return this.events.splice(0);}
    move(dx,dy){if(this.phase==='playing'){this.player.x=clamp(this.player.x+dx,16,W-16);this.player.y=clamp(this.player.y+dy,18,H-18);}}
    addBullet(x,y,vx,vy,friendly=false,damage=1,style=0,extra={}){if(this.bullets.length>1800)return;this.bullets.push({x,y,px:x,py:y,vx,vy,friendly,damage,style,r:friendly?3:3,life:5,...extra});if(friendly)this.shotsFired++;}
    firePlayer(){
      const p=this.player,n=p.power;
      if(p.weapon===0){const count=1+Math.floor(n/2);for(let i=0;i<count;i++){const a=(i-(count-1)/2)*.13;this.addBullet(p.x,p.y-15,Math.sin(a)*600,-Math.cos(a)*600,true,55,0);}}
      if(p.weapon===1){for(let i=0;i<1+Math.floor(n/2);i++){const x=(i-Math.floor(n/2)/2)*8;this.addBullet(p.x+x,p.y-17,0,-650,true,42+n*5,1);}}
      if(p.weapon===2){this.addBullet(p.x-3,p.y-17,0,-780,true,50+n*9,2);if(n>=4)this.addBullet(p.x+3,p.y-17,0,-780,true,50+n*9,2);}
      if(p.weapon===3){for(let i=0;i<1+Math.floor(n/3);i++)this.addBullet(p.x+(i-.5)*12,p.y-16,0,-330,true,80+n*12,3,{homing:true});}
      if(p.side>0){this.addBullet(p.x-12,p.y,-400,-80,true,45,0);this.addBullet(p.x+12,p.y,400,-80,true,45,0);}
      if(p.rear>0)this.addBullet(p.x,p.y+15,0,450,true,45,1);
      if(p.mega>0){for(let i=-1;i<=1;i++)this.addBullet(p.x+i*7,p.y-20,0,-950,true,240,2);}
      this.events.push({type:'shot',weapon:p.weapon});
    }
    spawnRecord(record){
      const d=C.definitions[C.byId[record[2]]],boss=!!(d.flags&1),scenery=!!(d.flags&16),ground=!!(d.flags&32);
      const e={def:d,record,x:record[0],y:-Math.max(192,d.height+64),r:Math.max(6,Math.min(d.width,d.height)*.38),hp:d.hp*(boss?2:1),maxHp:d.hp*(boss?2:1),boss,scenery,ground,dead:false,hit:0,time:0,speed:Math.max(1,d.speed),pathIndex:0,pathX:record[0],pathY:0,originX:record[0],guns:d.guns.map(g=>new Gun(g)),type:d.sprite};
      if(d.mode===9||d.mode===10){this.setPath(e,true);}else if(d.mode===3){e.x=record[0]<200?-d.width:W+d.width;e.y=100;}
      else if(d.mode===5){e.y=H+d.height;e.vy=-e.speed;}
      if(scenery)e.y=-d.height/2;
      this.enemies.push(e);if(boss){this.boss=e;this.bossSpawned=true;this.events.push({type:'boss',name:this.stage.boss});}
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
        if(e.pathFinished){if(d.pathFlags&1){const a=Math.atan2(this.player.y-e.y,this.player.x-e.x);e.x+=Math.cos(a)*speed*dt;e.y+=Math.sin(a)*speed*dt;}else e.y+=speed*dt;return;}
        const dx=e.pathX-e.x,dy=e.pathY-e.y,dist=Math.hypot(dx,dy);
        if(dist<=speed*dt+1){e.x=e.pathX;e.y=e.pathY;if(e.pathIndex>=d.path.length){if((d.pathFlags&4)&&d.speedNode>=0){e.pathIndex=d.speedNode+1;e.pathX=e.loopX??e.originX;e.pathY=e.loopY??120;}else e.pathFinished=true;}else this.setPath(e);}
        else{e.x+=dx/dist*speed*dt;e.y+=dy/dist*speed*dt;}
        if(e.pathIndex>d.speedNode&&d.speedNode>=0)e.speed=Math.max(1,d.exitSpeed);
      }else if(d.mode===3){e.x+=(e.originX<200?1:-1)*speed*dt;}
      else if(d.mode===5)e.y-=speed*dt;
      else if(d.mode===8){e.y=Math.min(d.height/2+42,e.y+speed*dt);}
      else{e.y+=speed*dt;}
    }
    explode(x,y,color='#ffb05c',amount=16){for(let i=0;i<amount;i++){const a=this.random()*Math.PI*2,s=20+this.random()*110,life=.2+this.random()*.45;if(this.particles.length<350)this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,maxLife:life,color,size:1+this.random()*3});}}
    killEnemy(e){if(e.dead||e.scenery)return;e.dead=true;this.kills++;this.score+=e.def.score;this.explode(e.x,e.y);this.events.push({type:'explosion'});if(e.record[5]>=0){this.pickups.push({x:e.x,y:e.y,type:DROPS[e.record[5]]||'medal',time:0,r:10});}if(e.boss)this.defeatBoss();}
    collect(item){
      const p=this.player,t=item.type;
      if(['weapon','ion','plasma','magnetic'].includes(t)){const next=t==='weapon'?Math.floor(item.time/2)%3:['weapon','ion','plasma','magnetic'].indexOf(t);if(next===p.weapon){if(p.power>=6){for(let i=0;i<24;i++){const a=i/24*Math.PI*2;this.addBullet(p.x,p.y,Math.sin(a)*300,Math.cos(a)*300,true,130,p.weapon);}}else p.power++;}else{p.weapon=next;p.power=1;}}
      if(t==='full')p.power=6;
      if(['bomb','scatter','mega'].includes(t)){p.bombs=Math.min(9,p.bombs+1);p.bombType=['bomb','scatter','mega'].indexOf(t);}
      if(t==='energy')p.energy=p.maxEnergy;
      if(t==='crystal')p.energy=Math.min(p.maxEnergy,p.energy+1);
      if(t==='shield')p.shield=12;
      if(t==='missile')p.missiles+=20;
      if(t==='homing')p.homing+=20;
      if(t==='side')p.side=25;if(t==='rear')p.rear=25;
      if(t==='life')p.lives=Math.min(9,p.lives+1);
      this.score+=t==='medal'?1000:100;item.dead=true;this.events.push({type:'pickup',item:t});
    }
    hitPlayer(damage=1){const p=this.player;if(p.invincible>0||p.shield>0||this.phase!=='playing')return;p.energy-=damage*this.rules.damage;p.invincible=.65;this.shake=3;this.events.push({type:'hit'});if(p.energy<=0){p.lives--;p.energy=p.maxEnergy;p.power=1;p.side=0;p.rear=0;p.missiles=0;p.homing=0;p.invincible=3;this.explode(p.x,p.y,'#ff8552',35);if(p.lives<=0){this.phase='gameover';this.events.push({type:'gameover'});}}}
    useBomb(){const p=this.player;if(this.phase!=='playing'||p.bombs<=0)return false;p.bombs--;p.invincible=Math.max(p.invincible,1);this.bullets=this.bullets.filter(b=>b.friendly);this.flash=.5;this.bombRing=.8;this.shake=5;if(p.bombType===2)p.mega=4;else for(const e of this.enemies){if(e.scenery||e.dead||e.y<0||e.y>H)continue;e.hp-=p.bombType===1?2400:4500;if(e.hp<=0)this.killEnemy(e);}this.events.push({type:'bomb'});return true;}
    defeatBoss(){if(this.phase!=='playing')return;const b=this.boss;if(b)this.explode(b.x,b.y,'#ffd894',85);this.boss=null;this.bullets=[];this.flash=.6;this.phase=this.stage.id===18?'victory':'cleared';this.events.push({type:this.phase});}
    update(dt,input={}){
      if(this.phase!=='playing')return;dt=clamp(dt,0,.05);if(!dt)return;this.elapsed+=dt;this.totalTime+=dt;this.frame++;
      const p=this.player;this.flash=Math.max(0,this.flash-dt);this.bombRing=Math.max(0,this.bombRing-dt);this.shake=Math.max(0,this.shake-dt*25);
      for(const k of ['invincible','shield','side','rear','mega'])p[k]=Math.max(0,p[k]-dt);
      let dx=input.x||0,dy=input.y||0,mag=Math.hypot(dx,dy);if(mag>1){dx/=mag;dy/=mag;}this.move(dx*240*dt,dy*240*dt);
      p.fire-=dt;if(p.fire<=0){this.firePlayer();p.fire+=p.weapon===2?.075:.15;}
      p.missileTimer-=dt;if(p.missileTimer<=0&&(p.missiles>0||p.homing>0)){const home=p.homing>0;p[home?'homing':'missiles']--;this.addBullet(p.x,p.y-12,0,-330,true,280,3,{homing:home,missile:true});p.missileTimer=.4;}
      if(!this.bossSpawned)this.scroll+=dt*TICK;
      while(this.cursor<this.recordEvents.length&&this.recordEvents[this.cursor][1]<=this.scroll){this.spawnRecord(this.recordEvents[this.cursor++]);}
      for(const e of this.enemies){if(e.dead)continue;e.time+=dt;e.hit=Math.max(0,e.hit-dt);this.moveEnemy(e,dt);for(const gun of e.guns)gun.tick(e,this);if(!e.scenery&&!e.ground&&e.y>0&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+p.r)this.hitPlayer(3);}
      for(const b of this.bullets){
        if(b.homing){const targets=this.enemies.filter(e=>!e.dead&&!e.scenery&&e.y>0&&e.y<H);let target=null,dist=Infinity;for(const e of targets){const n=Math.hypot(e.x-b.x,e.y-b.y);if(n<dist){dist=n;target=e;}}if(target){const a=Math.atan2(target.y-b.y,target.x-b.x),s=Math.hypot(b.vx,b.vy);b.vx+=(Math.cos(a)*s-b.vx)*Math.min(1,dt*6);b.vy+=(Math.sin(a)*s-b.vy)*Math.min(1,dt*6);}}
        b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.friendly){for(const e of this.enemies){if(e.dead||e.scenery)continue;if(intersects(b.px,b.py,b.x,b.y,e.x,e.y,e.r+b.r)){e.hp-=b.damage;e.hit=.06;b.dead=true;this.shotsHit++;if(e.hp<=0)this.killEnemy(e);break;}}}
        else if(intersects(b.px,b.py,b.x,b.y,p.x,p.y,p.r+b.r)){b.dead=true;this.hitPlayer(b.damage);}
        if(this.phase!=='playing')break;
      }
      for(const item of this.pickups){item.time+=dt;item.y+=dt*38;if(Math.hypot(item.x-p.x,item.y-p.y)<19)this.collect(item);}
      for(const v of this.particles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.life-=dt;}
      this.enemies=this.enemies.filter(e=>!e.dead&&(e.boss||e.time<35)&&(e.y<H+220)&&e.x>-350&&e.x<W+350);
      this.bullets=this.bullets.filter(b=>!b.dead&&b.life>0&&b.x>-40&&b.x<W+40&&b.y>-220&&b.y<H+40);
      this.pickups=this.pickups.filter(i=>!i.dead&&i.y<H+30);this.particles=this.particles.filter(v=>v.life>0);
    }
  }
  globalThis.StarfallCore={W,H,TICK,Game,Gun,STAGES,BIOMES,WEAPONS,DIFFICULTIES,rng,clamp,intersects};
})();
