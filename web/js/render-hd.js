/* SPDX-License-Identifier: MIT. See docs/ART.md for generated asset provenance. */
(() => {
  const {W,H,BIOMES,rng}=StarfallCore;
  const VIEW_H=640,TOP=75;
  const load=src=>{const im=new Image();im.src=src;return im;};
  class Renderer {
    constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.time=0;this.ships=load('assets/ships-hd.png');this.bosses=load('assets/bosses-07-18-hd.png');this.hangar=load('assets/hangar-hd.png');this.mission1=load('assets/mission1-hd.png');this.weapons=load('assets/weapons-hd.png');this.terrain=[load('assets/terrain-01-06-hd.png'),load('assets/terrain-07-12-hd.png'),load('assets/terrain-13-18-hd.png')];this.mission1Names=['S_ENEMY14','S_ENEMY20','S_ENEMY21','S_ENEMY34A','S_ASTER1A','S_ASTER2A','S_ASTER3A','S_ENBON1','S_ENBON3','S_SPTNKRA','S_ENEMY22','S_ENEMY28A','S_PIPE1','S_PIPE2','S_PIPE3','S_BHOLE1A'];const dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=VIEW_H*dpr;this.c.scale(dpr,dpr);const r=rng(654);this.stars=Array.from({length:100},()=>[r()*W,r()*H,r()*1.3+.3]);}
    cell(image,index,cols,rows,x,y,w,h,rotation=0){if(!image.complete||!image.naturalWidth)return false;const c=this.c,cw=image.naturalWidth/cols,ch=image.naturalHeight/rows;c.save();c.translate(x,y);if(rotation)c.rotate(rotation);c.drawImage(image,index%cols*cw,Math.floor(index/cols)*ch,cw,ch,-w/2,-h/2,w,h);c.restore();return true;}
    terrainDraw(stage,scroll){const c=this.c,idx=stage-1,im=this.terrain[Math.floor(idx/6)],cell=idx%6;if(im?.complete&&im.naturalWidth){const cw=im.naturalWidth/3,ch=im.naturalHeight/2,sy=Math.floor(cell/3)*ch,sx=cell%3*cw,y=scroll%H;c.drawImage(im,sx,sy,cw,ch,0,y-H,W,H);c.drawImage(im,sx,sy,cw,ch,0,y,W,H);}else{c.fillStyle='#010205';c.fillRect(0,0,W,H);for(const [x,y,s] of this.stars){c.fillStyle='#9aa293';c.globalAlpha=s*.4;c.fillRect(x,(y+scroll)%H,s,s);}c.globalAlpha=1;}}
    shipCell(name){if(name.startsWith('S_ENEMY1A'))return 2;if(name==='S_ENEMY2')return 3;if(name==='S_ENEMY4')return 4;if(name==='S_ENEMY10')return 5;if(name==='S_ENEMY18')return 6;if(name==='S_ENEMY21')return 7;if(name.startsWith('G_TNK')||name.includes('TURRET')||name.includes('TUR1'))return 14;if(name.includes('ROTA')||name.includes('ROTB'))return 15;const n=Number((name.match(/(?:ENEMY|SHIP)(\d+)/)||[])[1]||1);return [2,3,4,5,6,7][n%6];}
    object(e){const c=this.c,d=e.def,w=d.width,h=d.height;
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
    player(x,y,power,time,scale=1){const c=this.c;const flame=8+Math.sin(time*45)*4;c.fillStyle='#66baf8';c.beginPath();c.moveTo(x-7*scale,y+11*scale);c.lineTo(x-5*scale,y+(17+flame)*scale);c.lineTo(x-2*scale,y+12*scale);c.fill();c.beginPath();c.moveTo(x+2*scale,y+12*scale);c.lineTo(x+5*scale,y+(17+flame)*scale);c.lineTo(x+7*scale,y+11*scale);c.fill();this.cell(this.ships,0,4,4,x,y,39*scale,39*scale);}
    draw(game,dt){const c=this.c;if(game.phase!=='paused')this.time+=dt;c.fillStyle='#090e16';c.fillRect(0,0,W,VIEW_H);const active=game.phase!=='menu';
      if(!active&&this.hangar.complete&&this.hangar.naturalWidth){const scale=Math.max(W/this.hangar.naturalWidth,VIEW_H/this.hangar.naturalHeight),w=this.hangar.naturalWidth*scale,h=this.hangar.naturalHeight*scale;c.drawImage(this.hangar,(W-w)/2,(VIEW_H-h)/2,w,h);c.fillStyle='#02030a55';c.fillRect(0,0,W,VIEW_H);return;}
      c.save();c.translate(0,TOP);c.beginPath();c.rect(0,0,W,H);c.clip();this.terrainDraw(game.stage?.id||1,active?game.scroll:this.time*25);
      if(active){
        if(game.shake)c.translate(Math.sin(this.time*111)*game.shake,Math.cos(this.time*98)*game.shake*.5);
        for(const e of game.enemies.filter(e=>e.scenery||e.ground))this.object(e);
        for(const e of game.enemies.filter(e=>!e.scenery&&!e.ground))this.object(e);
        for(const item of game.pickups){const colors={weapon:'#ff573f',ion:'#57ff83',plasma:'#7899ff',magnetic:'#da77ef',energy:'#54e2dc',shield:'#82baff',bomb:'#ffbb6a',full:'#fff0a0',missile:'#dda677',homing:'#dedacd',side:'#fc99ba',rear:'#9ac5f5',scatter:'#ffaa68',mega:'#d5b2ff',medal:'#ffd860',life:'#ee6262'};const color=colors[item.type]||'#efcb5b';c.fillStyle='#11161b';c.beginPath();c.arc(item.x,item.y,11,0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();c.fillStyle=color;c.font='bold 12px monospace';c.textAlign='center';c.fillText({weapon:'P',ion:'I',plasma:'P',energy:'E',shield:'S',bomb:'B',full:'F',life:'+'}[item.type]||'✦',item.x,item.y+4);}
        for(const b of game.bullets){
          const sprite=b.missile?(b.homing?9:8):b.friendly?[0,3,4,7][b.style%4]:b.style===1?11:10;
          const width=b.missile?8:b.friendly?(b.style===3?12:7):9,height=b.missile?17:b.friendly?(b.style===2?24:b.style===3?12:18):9;
          const angle=b.friendly||b.missile?Math.atan2(b.vx,-b.vy):0;
          if(this.cell(this.weapons,sprite,4,4,b.x,b.y,width,height,angle))continue;
          c.fillStyle=b.friendly?['#ffd85d','#80bdff','#ff99ac','#ffad39'][b.style%4]:'#ffa958';c.fillRect(b.x-2,b.y-5,4,8);
        }
        const p=game.player;if(game.phase!=='gameover'&&(p.invincible<=0||Math.floor(this.time*14)%2===0))this.player(p.x,p.y,p.power,this.time);
        if(p.shield>0){c.strokeStyle='#83d8ffb0';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,23,0,Math.PI*2);c.stroke();}
        for(const v of game.particles){c.globalAlpha=Math.max(0,v.life/v.maxLife);c.fillStyle=v.color;c.fillRect(v.x,v.y,v.size,v.size);}c.globalAlpha=1;
        if(game.bombRing>0){c.strokeStyle=`rgba(255,210,120,${game.bombRing})`;c.lineWidth=10;c.beginPath();c.arc(p.x,p.y,(.8-game.bombRing)*1100+10,0,Math.PI*2);c.stroke();}
        if(game.flash>0){c.fillStyle=`rgba(255,222,172,${game.flash*.65})`;c.fillRect(0,0,W,H);}
      }
      c.restore();
      if(!active){c.save();c.translate(W/2,300);c.rotate(-.07);this.player(0,0,6,this.time,5.4);c.restore();c.strokeStyle='#976a5933';c.lineWidth=1;c.beginPath();c.arc(W/2,300,137,0,Math.PI*2);c.stroke();}
      c.strokeStyle='#62594d';c.lineWidth=1;c.beginPath();c.moveTo(0,TOP);c.lineTo(W,TOP);c.moveTo(0,TOP+H);c.lineTo(W,TOP+H);c.stroke();
    }
  }
  globalThis.StarfallRenderer=Renderer;
})();
