// 逐一检查 18 个 Boss；显示、预警、真实光束均使用同一炮口。 / Check every Boss: body, warning and live beam share one muzzle.
(() => {
 const {Game,STEP}=StarfallCore,C=DemonStarCampaign,r=StarfallApp.renderer,oldContext=r.c,oldWarning=r.laserWarning,oldShot=r.enemyShot;
 const definitions=C.definitions.filter(d=>d.flags&1),rows=[],sheets=[],details={},warnings=[],beams=[];
 const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const drawPanel=(canvas,index,e,mode,mounts,label)=>{const c=canvas.getContext('2d');r.c=c;c.save();c.translate(index*350,0);c.beginPath();c.rect(0,0,350,350);c.clip();c.fillStyle='#101d2b';c.fillRect(0,0,350,350);r.objectBody(e,false);
  for(const m of mounts){const at={x:e.x+m.x,y:e.y+m.y};if(mode==='orb')oldWarning.call(r,{shotType:m.type,ticks:3},at,0);else if(mode==='beam')oldShot.call(r,{shotType:m.type,age:1},at);else{c.strokeStyle=m.type===9?'#54baff':'#ff675c';c.lineWidth=.8;c.beginPath();c.arc(at.x,at.y,2.5,0,Math.PI*2);c.moveTo(at.x-5,at.y);c.lineTo(at.x+5,at.y);c.moveTo(at.x,at.y-5);c.lineTo(at.x,at.y+5);c.stroke();}}
  c.fillStyle='white';c.font='14px sans-serif';c.fillText(label+' / '+mode,8,20);c.restore();};
 try{
  r.laserWarning=function(w,at,...rest){warnings.push({gun:w.gun,type:w.shotType,...at});return oldWarning.call(this,w,at,...rest);};
  r.enemyShot=function(b,at){if(b.beam)beams.push({type:b.shotType,offsetX:b.offsetX,offsetY:b.offsetY,...at});return oldShot.call(this,b,at);};
  for(const [index,d] of definitions.entries()){
   const stage=C.levels.find(l=>l.events.some(v=>v[2]===d.id)).id,g=new Game(227);g.start(0,1);g.recordEvents=[];g.spawnRecord([200,0,d.id,0,1,-1,0,0]);const e=g.enemies[0];Object.assign(e,{x:220,y:150,px:180,py:130,entered:true,pathFinished:true,exitX:0,exitY:0});g.players.forEach(p=>p.invincible=999);
   const mounts=e.guns.map((gun,i)=>({gun,i,type:gun.raw[2],x:gun.raw[0]-d.width/2,y:gun.raw[1]-d.height/2})).filter(m=>[9,10].includes(m.type));const spec=DemonStarEnemyArt.bosses[d.sprite];
   if(!!spec!==!!mounts.length)throw new Error('Missing/unexpected Boss registration '+stage);
   for(const m of mounts){m.gun.delay=0;m.gun.wait=0;const anchor=spec.mounts.find(v=>v.gun===m.i);if(!anchor||anchor.shotType!==m.type)throw new Error('Missing mount '+stage+'/'+m.i);
    const [sx,sy]=anchor.art;const aligned=spec.patches.some(p=>{const [a,b,c,d,tx,ty]=p.matrix;return Math.abs(a*sx+c*sy+tx-m.x)<1e-6&&Math.abs(b*sx+d*sy+ty-m.y)<1e-6;});if(!aligned)throw new Error('Artwork does not meet original muzzle '+stage+'/'+m.i);
   }
   g.updateLaserWarnings();g.pendingTime=STEP*.5;r.c=oldContext;warnings.length=beams.length=0;r.draw(g,0);
   if(warnings.length!==mounts.length||warnings.some(w=>{const m=mounts.find(m=>m.i===w.gun);return !m||w.type!==m.type||Math.abs(w.x-200-m.x)>1e-7||Math.abs(w.y-140-m.y)>1e-7;}))throw new Error('Warning misses moving muzzle '+stage);
   for(const m of mounts)m.gun.tick(e,g);g.updateLaserWarnings();e.px=e.x-12;e.py=e.y-4;g.pendingTime=STEP*.25;warnings.length=beams.length=0;r.draw(g,0);
   if(warnings.length||beams.length!==mounts.length||beams.some(b=>Math.abs(b.x-211-b.offsetX)>1e-7||Math.abs(b.y-147-b.offsetY)>1e-7))throw new Error('First laser frame misses moving muzzle '+stage);
   for(const b of g.bullets.filter(b=>b.beam))if(!mounts.some(m=>m.type===b.shotType&&m.x===b.offsetX&&m.y===b.offsetY)||b.x!==e.x+b.offsetX||b.y!==e.y+b.offsetY)throw new Error('Physical muzzle changed '+stage);
   g.pause();beams.length=0;r.draw(g,0);if(beams.some(b=>b.x!==e.x+b.offsetX||b.y!==e.y+b.offsetY))throw new Error('Paused laser detached '+stage);
   const peer=new Game(228);if(!DemonStarNetworkState.apply(peer,DemonStarNetworkState.encode(g),false))throw new Error('Snapshot rejected '+stage);beams.length=0;r.draw(peer,0);if(beams.length!==mounts.length||beams.some(b=>b.x!==e.x+b.offsetX||b.y!==e.y+b.offsetY))throw new Error('Client laser detached '+stage);
   const panel=make(1050,350),shown={...e,x:175,y:135};for(const [i,mode] of ['mount','orb','beam'].entries())drawPanel(panel,i,shown,mode,mounts,'Stage '+stage);
   const sheetIndex=Math.floor(index/6);if(!sheets[sheetIndex])sheets[sheetIndex]=make(1050,2100);sheets[sheetIndex].getContext('2d').drawImage(panel,0,index%6*350);if([5,11].includes(stage))details['stage-'+stage]=panel.toDataURL('image/png').split(',')[1];
   rows.push({stage,id:d.id,laserMounts:mounts.length,registered:!!spec,movingWarning:true,firstFrameBeam:true,paused:true,client:true,physicalOffsetsUnchanged:true,mounts:mounts.map(({i,type,x,y})=>({gun:i,type,x,y}))});
  }
 }finally{r.c=oldContext;r.laserWarning=oldWarning;r.enemyShot=oldShot;}
 if(rows.length!==18||rows.reduce((n,s)=>n+s.laserMounts,0)!==33||rows.filter(s=>!s.laserMounts).length!==6)throw new Error('Incomplete Boss inventory');
 return {bosses:18,laserBosses:12,mounts:33,nonLaserBosses:6,rows,images:{...Object.fromEntries(sheets.map((c,i)=>['sheet-'+(i+1),c.toDataURL('image/png').split(',')[1]])),...details}};
})()
