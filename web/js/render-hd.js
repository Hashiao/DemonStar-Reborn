/* SPDX-License-Identifier: MIT. See docs/ART.md for generated asset provenance. */
(() => {
  const {W,H,STEP,DROPS,rng}=StarfallCore;
  const load=src=>{const im=new Image();im.src=src;return im;};
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.time=0;this.ships=load('assets/ships-hd.png');this.bosses=load('assets/bosses-07-18-hd.png');this.hangar=load('assets/hangar-hd.png');this.mission1=load('assets/mission1-hd.png');this.weapons=load('assets/weapons-hd.png');this.pickups=load('assets/pickups-hd.png');this.playerMotion=load('assets/player-motion-hd.png');this.carriers=load('assets/supply-carriers-hd.png');this.terrain=[load('assets/terrain-01-06-hd.png'),load('assets/terrain-07-12-hd.png'),load('assets/terrain-13-18-hd.png')];this.mission1Names=['S_ENEMY14','S_ENEMY20','S_ENEMY21','S_ENEMY34A','S_ASTER1A','S_ASTER2A','S_ASTER3A','S_ENBON1','S_ENBON3','S_SPTNKRA','S_ENEMY22','S_ENEMY28A','S_PIPE1','S_PIPE2','S_PIPE3','S_BHOLE1A'];const r=rng(654);this.stars=Array.from({length:100},()=>[r()*W,r()*H,r()*1.3+.3]);this.resize();}
    resize(){
      const screen=this.canvas.parentElement,w=screen.clientWidth,h=screen.clientHeight,wide=w>h&&w>=600;
      const controlHeight=Math.min(180,Math.max(124,h*.19)),side=Math.min(170,Math.max(108,w*.14));
      const scale=Math.max(.1,Math.min((wide?w-side*2:w)/W,(wide?h-36:h-controlHeight-42)/H));
      const x=(w-W*scale)/2,y=wide?(h-H*scale)/2:Math.max(8,(h-controlHeight-32-H*scale)/2);
      const stickSize=Math.min(wide?112:120,wide?side-12:w*.29),buttonSize=Math.min(68,Math.max(48,w*.145));
      this.layout={w,h,x,y,scale,wide};this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);
      const values={'field-x':x,'field-y':y,'field-w':W*scale,'field-h':H*scale,'field-unit':scale,'control-height':controlHeight,'stick-size':stickSize,'stick-x':wide?Math.max(8,(x-stickSize)/2):Math.max(18,w*.09),'stick-y':wide?h*.61-stickSize/2:h-controlHeight+10,'button-size':buttonSize,'actions-right':wide?Math.max(10,(x-buttonSize)/2):Math.max(18,w*.055),'actions-y':wide?h*.43-buttonSize/2:h-controlHeight+29};
      for(const key in values)screen.style.setProperty('--'+key,values[key]+'px');screen.dataset.wide=String(wide);
    }
    cell(image,index,cols,rows,x,y,w,h,rotation=0){if(!image.complete||!image.naturalWidth)return false;const c=this.c,cw=image.naturalWidth/cols,ch=image.naturalHeight/rows;c.save();c.translate(x,y);if(rotation)c.rotate(rotation);c.drawImage(image,index%cols*cw,Math.floor(index/cols)*ch,cw,ch,-w/2,-h/2,w,h);c.restore();return true;}
    terrainDraw(stage,scroll){const c=this.c,idx=stage-1,im=this.terrain[Math.floor(idx/6)],cell=idx%6;if(im?.complete&&im.naturalWidth){const cw=im.naturalWidth/3,ch=im.naturalHeight/2,sy=Math.floor(cell/3)*ch,sx=cell%3*cw,y=scroll%H;c.drawImage(im,sx,sy,cw,ch,0,y-H,W,H);c.drawImage(im,sx,sy,cw,ch,0,y,W,H);}else{c.fillStyle='#010205';c.fillRect(0,0,W,H);for(const [x,y,s] of this.stars){c.fillStyle='#9aa293';c.globalAlpha=s*.4;c.fillRect(x,(y+scroll)%H,s,s);}c.globalAlpha=1;}}
    shipCell(name){if(name.startsWith('S_ENEMY1A'))return 2;if(name==='S_ENEMY2')return 3;if(name==='S_ENEMY4')return 4;if(name==='S_ENEMY10')return 5;if(name==='S_ENEMY18')return 6;if(name==='S_ENEMY21')return 7;if(name.startsWith('G_TNK')||name.includes('TURRET')||name.includes('TUR1'))return 14;if(name.includes('ROTA')||name.includes('ROTB'))return 15;const n=Number((name.match(/(?:ENEMY|SHIP)(\d+)/)||[])[1]||1);return [2,3,4,5,6,7][n%6];}
    object(e){const c=this.c,d=e.def,w=d.width,h=d.height;
      const carrier=['S_ENBON1','S_ENBON2','S_ENBON3','S_ENBON4'].indexOf(d.sprite);if(carrier>=0&&this.cell(this.carriers,carrier,2,2,e.x,e.y,w*1.2,h*1.2))return;
      const originalCell=this.mission1Names.indexOf(d.sprite);if(originalCell>=0&&this.cell(this.mission1,originalCell,4,4,e.x,e.y,w*1.1,h*1.1))return;
      if(e.scenery){this.scenery(e);return;}
      c.save();if(e.hit>0){c.globalAlpha=.65;}
      if(e.boss){const stage=Number(d.sprite.match(/^S2_BOSS(\d+)/)?.[1]||0);if(stage)this.cell(this.bosses,stage-1,4,3,e.x,e.y,w*1.13,h*1.13);else{const b=Number(d.sprite.match(/^S_BOSS(\d+)/)?.[1]||1);this.cell(this.ships,7+b,4,4,e.x,e.y,w*1.12,h*1.12);}}
      else if(/ASTER|ROID|ROCK|ROK/.test(d.sprite)){this.asteroid(e);}
      else{this.cell(this.ships,this.shipCell(d.sprite),4,4,e.x,e.y,w*1.15,h*1.15);}
      c.restore();
    }
    asteroid(e){const c=this.c,r=e.r,rand=rng(e.def.index+3);c.save();c.translate(e.x,e.y);c.rotate(e.time*.25);c.beginPath();for(let i=0;i<11;i++){const a=i/11*Math.PI*2,k=.72+rand()*.3;c.lineTo(Math.cos(a)*r*k,Math.sin(a)*r*k);}c.closePath();const g=c.createRadialGradient(-r*.4,-r*.4,2,0,0,r);g.addColorStop(0,'#a29381');g.addColorStop(.5,'#62564b');g.addColorStop(1,'#29262a');c.fillStyle=g;c.fill();c.strokeStyle='#a08b6c';c.stroke();for(let i=0;i<5;i++){c.fillStyle='#24232688';c.beginPath();c.arc((rand()-.5)*r,(rand()-.5)*r,2+rand()*r*.16,0,Math.PI*2);c.fill();}c.restore();}
    scenery(e){const c=this.c,d=e.def,x=e.x-d.width/2,y=e.y-d.height/2,w=d.width,h=d.height,n=d.sprite;if(n.includes('PIPE')){c.fillStyle='#434044';c.fillRect(x,y,w,h);c.fillStyle='#777278';c.fillRect(x+2,y+2,Math.max(2,w-4),Math.max(2,h-4));c.fillStyle='#35323a';for(let i=0;i<h;i+=8)c.fillRect(x,y+i,w,2);}else if(n.includes('HOLE')){const g=c.createRadialGradient(e.x,e.y,1,e.x,e.y,Math.max(w,h)/2);g.addColorStop(0,'#000');g.addColorStop(.6,'#05050a');g.addColorStop(.84,'#373467');g.addColorStop(1,'#08040b00');c.fillStyle=g;c.fillRect(x,y,w,h);}else if(n.includes('STREET')||n.includes('RUNWAY')||n.includes('RAIL')){c.fillStyle='#41444a';c.fillRect(x,y,w,h);c.strokeStyle='#717171';c.strokeRect(x+1,y+1,w-2,h-2);c.fillStyle='#a6a08f';for(let k=4;k<h;k+=17)c.fillRect(e.x-2,y+k,4,8);}else{c.fillStyle='#474a48';c.fillRect(x,y,w,h);c.fillStyle='#626461';c.fillRect(x+2,y+2,Math.max(2,w-5),Math.max(2,h-5));c.fillStyle='#282d31';c.fillRect(x+5,y+5,Math.max(3,w-12),Math.max(3,h-12));c.fillStyle='#8b8375';c.fillRect(x+8,y+8,Math.max(3,w-18),2);}}
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
    draw(game,dt){const c=this.c,l=this.layout;if(game.phase!=='paused')this.time+=dt;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#090e16';c.fillRect(0,0,l.w,l.h);const active=game.phase!=='menu';
      if(!active&&this.hangar.complete&&this.hangar.naturalWidth){const scale=Math.max(l.w/this.hangar.naturalWidth,l.h/this.hangar.naturalHeight),w=this.hangar.naturalWidth*scale,h=this.hangar.naturalHeight*scale;c.drawImage(this.hangar,(l.w-w)/2,(l.h-h)/2,w,h);c.fillStyle='#02030a55';c.fillRect(0,0,l.w,l.h);return;}
      const alpha=game.phase==='playing'?Math.max(0,Math.min(1,game.pendingTime/STEP)):1;
      const position=o=>({x:o.px===undefined?o.x:o.px+(o.x-o.px)*alpha,y:o.py===undefined?o.y:o.py+(o.y-o.py)*alpha});
      c.save();c.translate(l.x,l.y);c.scale(l.scale,l.scale);c.beginPath();c.rect(0,0,W,H);c.clip();this.terrainDraw(game.stage?.id||1,active?(game.previousScroll??game.scroll)+(game.scroll-(game.previousScroll??game.scroll))*alpha:this.time*25);
      if(active){
        if(game.shake)c.translate(Math.sin(this.time*111)*game.shake,Math.cos(this.time*98)*game.shake*.5);
        const object=e=>{const at=position(e);c.save();c.translate(at.x-e.x,at.y-e.y);this.object(e);c.restore();};
        for(const e of game.enemies.filter(e=>e.scenery||e.ground))object(e);
        for(const e of game.enemies.filter(e=>!e.scenery&&!e.ground))object(e);
        for(const item of game.pickups){const at=position(item);this.cell(this.pickups,item.id??DROPS.indexOf(item.type),4,5,at.x,at.y,32,32);}
        for(const b of game.bullets){
          if(b.nova!==undefined){const at=position(b);this.cell(this.weapons,[6,11,12,7][b.nova],4,4,at.x,at.y,b.nova===3?15:10,b.nova===3?15:10);continue;}
          const sprite=b.missile?(b.homing?9:8):b.friendly?[0,3,4,7][b.style%4]:b.style===1?11:10;
          const width=b.defaultShot?4:b.missile?8:b.friendly?(b.style===3?12:7):9,height=b.defaultShot?13:b.missile?17:b.friendly?(b.style===2?24:b.style===3?12:18):9;
          const angle=b.friendly||b.missile?Math.atan2(b.vx,-b.vy):0;
          const at=position(b);if(this.cell(this.weapons,sprite,4,4,at.x,at.y,width,height,angle))continue;
          c.fillStyle=b.friendly?['#ffd85d','#80bdff','#ff99ac','#ffad39'][b.style%4]:'#ffa958';c.fillRect(at.x-2,at.y-5,4,8);
        }
        const p=game.player,at=position(p);if(game.phase!=='gameover'&&p.respawn<=0&&(p.invincible<=0||Math.floor(this.time*14)%2===0))this.player(at.x,at.y,p.power,this.time,1,p);
        if(p.shield>0){c.strokeStyle='#83d8ffb0';c.lineWidth=2;c.beginPath();c.arc(at.x,at.y,23,0,Math.PI*2);c.stroke();}
        for(const v of game.particles){c.globalAlpha=Math.max(0,v.life/v.maxLife);c.fillStyle=v.color;c.fillRect(v.x,v.y,v.size,v.size);}c.globalAlpha=1;
        if(game.bombRing>0){c.strokeStyle=`rgba(255,210,120,${game.bombRing})`;c.lineWidth=10;c.beginPath();c.arc(p.x,p.y,(.8-game.bombRing)*1100+10,0,Math.PI*2);c.stroke();}
        if(game.flash>0){c.fillStyle=`rgba(255,222,172,${game.flash*.65})`;c.fillRect(0,0,W,H);}
      }
      c.restore();
      c.strokeStyle='#4a55604d';c.lineWidth=1;c.strokeRect(l.x-.5,l.y-.5,W*l.scale+1,H*l.scale+1);
    }
  }
  globalThis.StarfallRenderer=Renderer;
})();
