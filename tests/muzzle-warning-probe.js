// 两端实绘验证：红蓝激光共用局部红闪，亮度固定，频率递增，发射瞬间恢复。
// Packaged Canvas checks: both laser colors use a local red blink, fixed tint, rising frequency and immediate restoration.
(() => {
 const {Game,STEP}=StarfallCore,g=new Game(225);g.start(0,1);g.recordEvents=[];g.spawnRecord([200,0,40,0,1,-1,0,0]);
 const e=g.enemies[0];Object.assign(e,{x:200,y:80});const raw=e.guns.find(gun=>gun.raw[2]===9).raw;
 const r=StarfallApp.renderer,oldContext=r.c,oldShot=r.enemyShot,canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const c=canvas.getContext('2d');
 const w={offsetX:-e.def.width/2+raw[0],offsetY:-e.def.height/2+raw[1]},at={x:16,y:16},same=(a,b)=>a.every((v,i)=>v===b[i]);
 const base=()=>{c.clearRect(0,0,32,32);c.save();c.translate(at.x-w.offsetX-e.x,at.y-w.offsetY-e.y);r.objectBody(e,false);c.restore();};
 const sequences=[];r.c=c;r.enemyShot=()=>{throw new Error('Muzzle warning drew a beam');};
 try{
  base();const normal=c.getImageData(0,0,32,32).data;let reference;
  for(const shotType of [9,10]){
   const starts=[];let previous=false;
   for(let sample=0;sample<=200;sample++){
    const progress=sample/200;base();r.laserWarning({...w,shotType,ticks:(1-progress)/STEP},at,0,e);
    const pixels=c.getImageData(0,0,32,32).data,on=!same(pixels,normal);
    if(on){
     if(!reference)reference=pixels;else if(!same(reference,pixels))throw new Error('Warning tint fades or differs by laser color');
     let red=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]!==normal[i]||pixels[i+1]!==normal[i+1]||pixels[i+2]!==normal[i+2]||pixels[i+3]!==normal[i+3]){
      const x=(i/4)%32+.5-16,y=Math.floor(i/128)+.5-16;if(Math.hypot(x,y)>12.75)throw new Error('Warning escaped the muzzle');red+=pixels[i]-normal[i];
     }if(red<=0)throw new Error('Muzzle did not become red');
    }
    if(on&&!previous)starts.push(progress);previous=on;
    if(sample===200&&on)throw new Error('Muzzle remained red at emission');
   }
   if(starts.length!==5)throw new Error('Missing warning blinks');const intervals=starts.slice(1).map((v,i)=>v-starts[i]);
   if(intervals.some((v,i)=>i&&v>=intervals[i-1]))throw new Error('Blink frequency did not increase');sequences.push(starts);
  }
  for(const ticks of [0,-1,30]){base();r.laserWarning({...w,shotType:9,ticks},at,0,e);if(!same(normal,c.getImageData(0,0,32,32).data))throw new Error('Warning outside its time window');}
 }finally{r.c=oldContext;r.enemyShot=oldShot;}
 return {types:2,muzzleOnly:true,fixedRedTint:true,accelerating:true,emissionRestored:true,blinkStarts:sequences};
})()
