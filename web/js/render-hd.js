/* SPDX-License-Identifier: MIT. See docs/ART.md for generated asset provenance. */
(() => {
  const {W,H,STEP,DROPS,rng,HEALTH_BAR_MIN_HP}=StarfallCore;
  const enemyArt=DemonStarEnemyArt,presentationArt=DemonStarPresentationArt,campaignArt=DemonStarCampaignArt,enemyShots=DemonStarEnemyShots;
  const load=src=>{const im=new Image();im.src=src;return im;};
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.time=0;this.effects=load('assets/combat-effects-hd.png');this.playerWeapons=load(DemonStarWeaponArt.asset);this.attacks=load('assets/enemy-attacks-hd.png');this.enemyAtlases={};for(const name in enemyArt.sprites)this.enemyAtlases[name]=load(enemyArt.sprites[name].asset);this.tintCache=new Map();this.enemyHealthBars=false;this.superWeapon=load('assets/pulse-laser-hd.png');this.launchCarrier=load('assets/launch-carrier-hd.png');this.launchDoors=load('assets/launch-doors-hd.png');this.blasts=load('assets/blast-animation-hd.png');this.wreckAtlas=load('assets/ground-wrecks-hd.png');this.ships=load('assets/ships-hd.png');this.bosses=load('assets/bosses-07-18-hd.png');this.hangar=load('assets/hangar-hd.png');this.mission1=load('assets/mission1-hd.png');this.weapons=load('assets/weapons-hd.png');this.pickups=load('assets/pickups-hd.png');this.playerMotion=load('assets/player-motion-hd.png');this.carriers=load('assets/supply-carriers-hd.png');this.terrain=[load('assets/terrain-01-06-hd.png'),load('assets/terrain-07-12-hd.png'),load('assets/terrain-13-18-hd.png')];this.mission1Names=['S_ENEMY14','S_ENEMY20','S_ENEMY21','S_ENEMY34A','S_ASTER1A','S_ASTER2A','S_ASTER3A','S_ENBON1','S_ENBON3','S_SPTNKRA','S_ENEMY22','S_ENEMY28A','S_PIPE1','S_PIPE2','S_PIPE3','S_BHOLE1A'];const r=rng(654);this.stars=Array.from({length:100},()=>[r()*W,r()*H,r()*1.3+.3]);this.resize();}
    prepareStage(id=1){
      if(!this.campaignAtlases){this.campaignAtlases=new Map();this.shotAtlases=new Map(Object.keys(enemyShots.assets).map(path=>[path,load(path)]));this.oreImages=new Map();this.missingSprites=new Set();this.missingShotTypes=new Set();}
      if(this.artStage===id)return;
      // 只保留当前关的重绘图集，同时释放对应染色缓存，避免手机解码全部 18 关素材。
      // Retain only this stage's redraw atlases and tint caches, avoiding full-campaign decoded memory.
      const needed=new Set(campaignArt.stageAssets[id]);
      for(const [path,image] of this.campaignAtlases)if(!needed.has(path)){this.tintCache.delete(image);this.campaignAtlases.delete(path);}
      for(const path of needed)if(!this.campaignAtlases.has(path))this.campaignAtlases.set(path,load(path));
      this.artStage=id;
    }
    campaignReady(id=this.artStage||1){this.prepareStage(id);return [...this.campaignAtlases.values(),...this.shotAtlases.values()].every(im=>im.complete&&im.naturalWidth>0);}
    enemyArtReady(){return Object.keys(enemyArt.sprites).every(name=>this.enemyAtlases[name].naturalWidth>0);}
    presentationReady(){return this.campaignReady()&&this.playerWeapons.naturalWidth>0&&this.launchCarrier.naturalWidth>0&&this.launchDoors.naturalWidth>0&&this.blasts.naturalWidth>0&&this.wreckAtlas.naturalWidth>0&&this.superWeapon.naturalWidth>0;}
    oreImage(name,spec){
      if(this.oreImages.has(name))return this.oreImages.get(name);
      const im=document.createElement('canvas');im.width=spec.width*4;im.height=spec.height*4;
      const c=im.getContext('2d'),random=rng([...name].reduce((a,v)=>a*31+v.charCodeAt(0),0));c.scale(4,4);
      c.beginPath();spec.polygon.forEach(([x,y],i)=>c[i?'lineTo':'moveTo'](x*spec.width,y*spec.height));c.closePath();c.clip();
      for(let i=0;i<spec.grains;i++){c.fillStyle=['#3c2b07','#74541a','#ac8128','#d3aa40','#ead077'][Math.floor(random()*5)];const size=.6+random()*.8;c.fillRect(random()*spec.width,random()*spec.height,size,size);}
      im.naturalWidth=im.width;im.naturalHeight=im.height;this.oreImages.set(name,im);return im;
    }
    campaignObject(e,red){
      const s=campaignArt.sprites[e.def.sprite],c=this.c;
      if(s.kind==='ore'){const image=this.oreImage(e.def.sprite,s);c.drawImage(red?this.redImage(image):image,e.x-s.width/2,e.y-s.height/2,s.width,s.height);return;}
      const source=this.campaignAtlases.get(s.asset);if(!source?.complete||!source.naturalWidth)return;
      const image=red?this.redImage(source):source;
      c.save();c.translate(e.x,e.y);
      // 底座固定，炮管绕原作轴心转动；其他方向对象的首帧朝向为 0。
      // Bases stay fixed and barrels pivot at original hubs; other directional art starts at heading zero.
      if(s.directional&&!s.head)c.rotate((e.facing??0)*Math.PI/16);
      c.drawImage(image,...s.crop,s.offset[0]-s.visible[0]/2,s.offset[1]-s.visible[1]/2,...s.visible);
      if(s.head){const h=s.head;c.translate(...h.offset);c.rotate((e.facing??0)*Math.PI/16);c.drawImage(image,...h.crop,-h.pivot[0]*h.size[0],-h.pivot[1]*h.size[1],...h.size);}
      c.restore();
    }
    enemyShot(b,at){
      const spec=enemyShots.shots[b.shotType];if(!spec){this.missingShotTypes.add(b.shotType);return;}
      const frame=Math.min(spec.frameCount-1,b.age||0),height=Math.max(0,H-at.y);
      if(spec.kind==='blue-beam'){this.attackCell(10+frame,at.x,at.y+height/2,[8,6,4,2][frame],height);this.attackCell(14+frame,at.x,at.y,8,8);return;}
      if(spec.kind==='orange-star'){this.attackCell(6+(b.age||0)%4,at.x,at.y,16,16);return;}
      const s=spec.frames[spec.kind==='red-beam'?frame:(b.age||0)%spec.frameCount],im=this.shotAtlases.get(s.asset);
      if(spec.kind==='red-beam'){this.cropped(im,s.crop,at.x+s.offset[0],at.y+height/2,s.size[0],height);const cap=spec.cap;this.cropped(this.shotAtlases.get(cap.asset),cap.crop,at.x+cap.offset[0],at.y+cap.offset[1],...cap.size);return;}
      // 敌弹按原作可见边界绘制；43/44 已有斜向姿态，不再通用旋转。
      // Use original visible bounds; types 43/44 already encode diagonal poses, so do not rotate them again.
      this.cropped(im,s.crop,at.x+s.offset[0],at.y+s.offset[1],...s.size);
    }
    superCell(frame,x,y,w,h){return this.cropped(this.superWeapon,DemonStarSuperweaponArt.frames[frame],x,y,w,h);}
    showsEnemyHealth(e){return this.enemyHealthBars&&!e.scenery&&!e.boss&&!e.dead&&e.maxHp>=HEALTH_BAR_MIN_HP&&e.entered;}
    cropped(image,b,x,y,w,h,angle=0){if(!image.naturalWidth)return false;const c=this.c;c.save();c.translate(x,y);if(angle)c.rotate(angle);c.drawImage(image,...b,-w/2,-h/2,w,h);c.restore();return true;}
    blast(v){const frame=Math.min(5,Math.floor(v.age/v.ticks*6));this.cropped(this.blasts,presentationArt.blasts[v.row*6+frame],v.x,v.y,v.size,v.size);}
    wreck(w){
      const n=w.sprite,index=/GASTNK2/.test(n)?7:/GASTNK|SHTTNK|SMLGAS/.test(n)?2:/GRDST/.test(n)?1:/LNDOIL/.test(n)?5:/TNK|TANK/.test(n)?4:/PKS|TRK|ORE/.test(n)?3:/BLDNG|SHIP|ENEMY/.test(n)?6:0;
      this.cropped(this.wreckAtlas,presentationArt.wrecks[index],w.x,w.y,w.width,w.height);
    }
    launchDraw(game,doors=false){
      const s=game.launch;if(!s)return;
      if(!doors){const a=game.phase==='paused'?1:Math.max(0,Math.min(1,game.pendingTime/STEP)),y=s.previousY+(s.carrierY-s.previousY)*a;if(s.ticks>=20&&this.launchCarrier.naturalWidth)this.c.drawImage(this.launchCarrier,-200,y,800,600);return;}
      const amount=s.ticks<20?s.ticks/20:s.ticks<26?1:Math.max(0,1-(s.ticks-26)/20);
      if(amount<=0)return;
      const h=H*.53;
      this.cropped(this.launchDoors,presentationArt.doors[0],W/2,-h/2+amount*h,W,h);
      this.cropped(this.launchDoors,presentationArt.doors[1],W/2,H+h/2-amount*h,W,h);
    }
    framedObject(e,red){
      const spec=enemyArt.sprites[e.def.sprite],image=this.enemyAtlases[e.def.sprite];
      if(!spec||!image.naturalWidth)return false;
      const frame=spec.directional?(e.facing??16):(e.animation?.frame||0),b=spec.frames[frame],scale=1.1;
      this.c.drawImage(red?this.redImage(image):image,b[0],b[1],b[2],b[3],e.x+(b[4]-b[6]/2)*scale,e.y+(b[5]-b[7]/2)*scale,b[6]*scale,b[7]*scale);
      return true;
    }
    attackCell(index,x,y,w,h,red=false){
      if(!this.attacks)this.attacks=load('assets/enemy-attacks-hd.png');
      if(!this.attacks.naturalWidth)return false;
      this.c.drawImage(red?this.redImage(this.attacks):this.attacks,...DemonStarCombatVisuals.attackCells[index],x-w/2,y-h/2,w,h);return true;
    }
    resize(){
      const screen=this.canvas.parentElement,w=screen.clientWidth,h=screen.clientHeight,wide=w>h&&w>=600;
      const controlHeight=Math.min(180,Math.max(124,h*.19)),side=Math.min(170,Math.max(108,w*.14));
      const scale=Math.max(.1,Math.min((wide?w-side*2:w)/W,(wide?h-36:h-controlHeight-82)/H));
      const x=(w-W*scale)/2,y=wide?(h-H*scale)/2:Math.max(8,(h-controlHeight-72-H*scale)/2);
      const stickSize=Math.min(wide?112:120,wide?side-12:w*.29),buttonSize=Math.min(68,Math.max(48,w*.145));
      this.layout={w,h,x,y,scale,wide};this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);
      const values={'field-x':x,'field-y':y,'field-w':W*scale,'field-h':H*scale,'field-unit':scale,'control-height':controlHeight,'stick-size':stickSize,'stick-x':wide?Math.max(8,(x-stickSize)/2):Math.max(18,w*.09),'stick-y':wide?h*.61-stickSize/2:h-controlHeight+10,'button-size':buttonSize,'actions-right':wide?Math.max(10,(x-buttonSize)/2):Math.max(18,w*.055),'actions-y':wide?h*.43-buttonSize/2:h-controlHeight+29};
      for(const key in values)screen.style.setProperty('--'+key,values[key]+'px');screen.dataset.wide=String(wide);
      screen.style.setProperty('--hud-unit',Math.max(1.15,scale)+'px');
    }
    cell(image,index,cols,rows,x,y,w,h,rotation=0){if(!image.complete||!image.naturalWidth)return false;const c=this.c,cw=image.naturalWidth/cols,ch=image.naturalHeight/rows;c.save();c.translate(x,y);if(rotation)c.rotate(rotation);c.drawImage(image,index%cols*cw,Math.floor(index/cols)*ch,cw,ch,-w/2,-h/2,w,h);c.restore();return true;}
    playerShot(b,at,spec){
      const crop=DemonStarWeaponArt.cells[spec.cell];
      // 黄色侧弹一张原图包含两个并排弹体，按独立边界组合高清笔画，不增加伤害次数。
      // Each original yellow side sprite contains two pellets; compose their HD strokes without doubling hits.
      if(spec.parts){for(const [dx,dy,w,h,angle] of spec.parts)this.cropped(this.playerWeapons,crop,at.x+dx,at.y+dy,w,h,angle);return;}
      // 红色辅助弹保持朝上；追踪弹对应原作 16 向姿态，避免整套弹体都随航向转动。
      // Red auxiliary pellets stay upright; homing missiles use 16 original headings, not universal sprite rotation.
      const angle=b.shotType===39?(((b.flightAngle+2)>>7)&15)*Math.PI/8:0;
      this.cropped(this.playerWeapons,crop,at.x,at.y,spec.width,spec.height,angle);
    }
    effectCell(index,x,y,w,h,angle=0){if(!this.effects.naturalWidth)return false;const c=this.c,b=DemonStarCombatVisuals.cells[index];c.save();c.translate(x,y);c.rotate(angle);c.drawImage(this.effects,...b,-w/2,-h/2,w,h);c.restore();return true;}
    redImage(image){if(!image.naturalWidth)return image;let tinted=this.tintCache.get(image);if(!tinted){tinted=document.createElement('canvas');tinted.width=image.naturalWidth;tinted.height=image.naturalHeight;const c=tinted.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,45,30,.64)';c.fillRect(0,0,tinted.width,tinted.height);tinted.complete=true;tinted.naturalWidth=tinted.width;tinted.naturalHeight=tinted.height;this.tintCache.set(image,tinted);}return tinted;}
    terrainDraw(stage,scroll){const c=this.c,idx=stage-1,im=this.terrain[Math.floor(idx/6)],cell=idx%6;if(im?.complete&&im.naturalWidth){const cw=im.naturalWidth/3,ch=im.naturalHeight/2,sy=Math.floor(cell/3)*ch,sx=cell%3*cw,y=scroll%H;c.drawImage(im,sx,sy,cw,ch,0,y-H,W,H);c.drawImage(im,sx,sy,cw,ch,0,y,W,H);}else{c.fillStyle='#010205';c.fillRect(0,0,W,H);for(const [x,y,s] of this.stars){c.fillStyle='#9aa293';c.globalAlpha=s*.4;c.fillRect(x,(y+scroll)%H,s,s);}c.globalAlpha=1;}}
    object(e){const c=this.c,d=e.def,w=d.width,h=d.height;
      c.save();c.translate(e.x,e.y);if(e.dying){c.translate((d.flags&0x40)?0:e.fall*.12,e.fall*.55);c.rotate((d.flags&0x40)?0:e.fall*.004);}else if(e.facing!==undefined&&campaignArt.routes[d.sprite]?.kind!=='campaign'&&!enemyArt.sprites[d.sprite]?.directional)c.rotate((e.facing-16)*Math.PI/16);c.translate(-e.x,-e.y);
      const red=e.critical&&e.criticalTicks%10<3;
      this.objectBody(e,red);c.restore();
      if(e.burning){const n=e.dying?9:5;for(let i=0;i<n;i++){const x=e.x+Math.sin(i*2.4)*w*.34,y=e.y+Math.cos(i*3.1)*h*.3+(e.dying?e.fall*.55:0);this.effectCell(16+((Math.floor(e.time*12)+i)%2),x,y,18+Math.sin(e.time*23+i)*3,28+Math.sin(e.time*19+i)*5);}}
      if(this.showsEnemyHealth(e)){const width=Math.min(52,Math.max(24,w*.8)),x=e.x-width/2,y=e.y-h*.6-5;c.fillStyle='#080c12dc';c.fillRect(x-1,y-1,width+2,4);c.fillStyle=e.critical?'#ff5343':'#88b6ca';c.fillRect(x,y,width*Math.max(0,e.hp/e.maxHp),2);}
    }
    objectBody(e,red){
      const d=e.def,w=d.width,h=d.height,route=campaignArt.routes[d.sprite],im=image=>red?this.redImage(image):image;
      // 每个原型都有显式路由；未知名称只记录诊断，不再替换成红色飞机。
      // Every prototype has an explicit route; unknown names are diagnosed, never replaced with red fighters.
      if(!route){this.missingSprites.add(d.sprite);return;}
      switch(route.kind){
        case 'campaign':this.campaignObject(e,red);break;
        case 'framed':this.framedObject(e,red);break;
        case 'spinner':this.attackCell(e.animationFrame||0,e.x,e.y,w,h,red);break;
        case 'carrier':this.cell(im(this.carriers),route.index,2,2,e.x,e.y,w*1.2,h*1.2);break;
        case 'mission1':this.cell(im(this.mission1),route.index,4,4,e.x,e.y,w*1.1,h*1.1);break;
        case 'boss1':this.cell(im(this.ships),route.index,4,4,e.x,e.y,w*1.12,h*1.12);break;
        case 'boss2':this.cell(im(this.bosses),route.index,4,3,e.x,e.y,w*1.13,h*1.13);break;
      }
    }
    player(x,y,power,time,scale=1,state={bank:8,thrust:0}){
      const c=this.c,bank=Math.max(0,Math.min(16,Math.round(state.bank??8))),thrust=state.thrust||0;
      const flicker=1+.15*Math.sin(time*57)+.08*Math.sin(time*103),length=(thrust>0?16+thrust*10:14+thrust*7)*flicker;
      const spread=5.8*(1-Math.abs(bank-8)*.035),shift=(bank-8)*.2;
      for(const side of [-1,1]){
        const fx=x+(side*spread+shift)*scale,fy=y+(14+length*.27)*scale;
        if(!this.cell(this.playerMotion,thrust>.15?18:thrust<-.15?19:17,5,4,fx,fy,13*scale,length*scale)){
          const g=c.createLinearGradient(fx,fy-length/2,fx,fy+length/2);g.addColorStop(0,'#fffbe1');g.addColorStop(.3,'#ffe462');g.addColorStop(.75,'#fa6c12');g.addColorStop(1,'#ce271000');c.fillStyle=g;c.fillRect(fx-2*scale,fy-length/2,4*scale,length);
        }
      }
      if(!this.cell(this.playerMotion,bank,5,4,x,y,40*scale,40*scale*(1-thrust*.025)))this.cell(this.ships,0,4,4,x,y,39*scale,39*scale);
    }
    draw(game,dt){const c=this.c,l=this.layout;if(game.phase!=='paused')this.time+=dt;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#090e16';c.fillRect(0,0,l.w,l.h);const active=game.phase!=='menu';this.prepareStage(game.stage?.id||1);
      if(!active&&this.hangar.complete&&this.hangar.naturalWidth){const scale=Math.max(l.w/this.hangar.naturalWidth,l.h/this.hangar.naturalHeight),w=this.hangar.naturalWidth*scale,h=this.hangar.naturalHeight*scale;c.drawImage(this.hangar,(l.w-w)/2,(l.h-h)/2,w,h);c.fillStyle='#02030a55';c.fillRect(0,0,l.w,l.h);return;}
      const alpha=game.phase==='playing'?Math.max(0,Math.min(1,game.pendingTime/STEP)):1;
      const position=o=>({x:o.px===undefined?o.x:o.px+(o.x-o.px)*alpha,y:o.py===undefined?o.y:o.py+(o.y-o.py)*alpha});
      c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);c.beginPath();c.rect(0,0,W,H);c.clip();this.terrainDraw(game.stage?.id||1,active?(game.previousScroll??game.scroll)+(game.scroll-(game.previousScroll??game.scroll))*alpha:this.time*25);
      if(active){
        if(game.shake)c.translate(Math.sin(this.time*111)*game.shake,Math.cos(this.time*98)*game.shake*.5);
        this.launchDraw(game);
        for(const w of game.wrecks||[])this.wreck(w);
        const object=e=>{const at=position(e);c.save();c.translate(at.x-e.x,at.y-e.y);this.object(e);c.restore();};
        for(const e of game.enemies.filter(e=>e.scenery||e.ground))object(e);
        for(const e of game.enemies.filter(e=>!e.scenery&&!e.ground))object(e);
        for(const item of game.pickups){const at=position(item);this.cell(this.pickups,item.id??DROPS.indexOf(item.type),4,5,at.x,at.y,32,32);}
        for(const b of game.bullets){
          if(b.playerBeam){if(game.player.mega>0){const at=position(game.player),frame=Math.max(0,Math.min(3,b.age)),height=Math.max(0,at.y-20-b.endY);this.superCell(4+frame,at.x,b.endY+height/2,[12,10,8,5][frame],height);}continue;}
          if(!b.friendly){this.enemyShot(b,position(b));continue;}
          const visual=DemonStarCombatVisuals.shot(b.shotType);if(b.friendly&&visual){this.playerShot(b,position(b),visual);continue;}
          if(b.nova!==undefined){const at=position(b);this.cell(this.weapons,[6,11,12,7][b.nova],4,4,at.x,at.y,b.nova===3?15:10,b.nova===3?15:10);continue;}
          const sprite=b.missile?(b.homing?9:8):b.friendly?[0,3,4,7][b.style%4]:b.style===1?11:10;
          const width=b.defaultShot?4:b.missile?8:b.friendly?(b.style===3?12:7):9,height=b.defaultShot?13:b.missile?17:b.friendly?(b.style===2?24:b.style===3?12:18):9;
          const angle=b.friendly||b.missile?Math.atan2(b.vx,-b.vy):0;
          const at=position(b);if(b.friendly){const yellow=b.shotType>=16&&b.shotType<=25,sw=b.defaultShot?3:yellow?(b.shotType===16?1.5:4.5):width,sh=b.defaultShot?13:yellow?12:height;if(this.cropped(this.weapons,presentationArt.weapons[sprite],at.x,at.y,sw,sh,angle))continue;}
          c.fillStyle=b.friendly?['#ffd85d','#80bdff','#ff99ac','#ffad39'][b.style%4]:'#ffa958';c.fillRect(at.x-2,at.y-5,4,8);
        }
        const p=game.player,at=position(p);if(game.phase!=='gameover'&&p.respawn<=0&&(game.launch||p.mega>0||p.invincible<=0||Math.floor(this.time*14)%2===0))this.player(at.x,at.y,p.power,this.time,1,p);
        if(p.mega>0&&p.respawn<=0)this.superCell(game.frame%4,at.x,at.y-8,48,58);
        if(p.shield>0){c.strokeStyle='#83d8ffb0';c.lineWidth=2;c.beginPath();c.arc(at.x,at.y,23,0,Math.PI*2);c.stroke();}
        for(const v of game.particles){c.globalAlpha=Math.max(0,v.life/v.maxLife)*(v.smoke ? .45 : 1);c.fillStyle=v.color;if(v.smoke){c.beginPath();c.arc(v.x,v.y,v.size/2,0,Math.PI*2);c.fill();}else c.fillRect(v.x,v.y,v.size,v.size);}c.globalAlpha=1;
        for(const v of game.effects||[])this.blast(v);
        for(const s of game.specials){const at=position(s);if(!s.exploded){if(s.type===0)this.effectCell(9,at.x,at.y,49,17);else this.effectCell(18,at.x,at.y,9,11);}else{const ratio=s.remaining/(s.type===0?30:14);c.globalAlpha=Math.min(1,ratio*3);const size=s.type===0?70+(1-ratio)*135:18+(1-ratio)*50;this.effectCell(s.type===0?(ratio>.4?10:11):(ratio>.4?18:19),at.x,at.y,size,size);c.globalAlpha=1;}}
        if(game.flash>0){c.fillStyle=`rgba(255,222,172,${game.flash*.65})`;c.fillRect(0,0,W,H);}
        this.launchDraw(game,true);
      }
      c.restore();
      c.strokeStyle='#4a55604d';c.lineWidth=1;c.strokeRect(l.x-.5,l.y-.5,W*l.scale+1,H*l.scale+1);
    }
  }
  globalThis.StarfallRenderer=Renderer;
})();
