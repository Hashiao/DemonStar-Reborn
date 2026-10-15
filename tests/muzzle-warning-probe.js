// 实绘蓄能光球：明暗/大小脉动递增、加速和发射消失。 / Render charging-orb amplitude, acceleration and emission removal.
(() => {
 const {STEP}=StarfallCore,r=StarfallApp.renderer,oldContext=r.c,oldShot=r.enemyShot,canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const c=canvas.getContext('2d'),at={x:48,y:48},rows=[];
 r.c=c;r.enemyShot=()=>{throw new Error('Charging orb drew a beam');};
 try{
  for(const shotType of [9,10]){
   const samples=[];
   for(let sample=0;sample<200;sample++){
    const time=sample/200;c.clearRect(0,0,96,96);r.laserWarning({shotType,ticks:(1-time)/STEP},at,0);const pixels=c.getImageData(0,0,96,96).data;let energy=0,extent=0,red=0,green=0;
    for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]){const distance=Math.hypot((i/4)%96+.5-48,Math.floor(i/384)+.5-48);if(distance>28.5)throw new Error('Orb escaped the muzzle region');energy+=(pixels[i]+pixels[i+1]+pixels[i+2])*pixels[i+3]/255;red+=pixels[i]*pixels[i+3];green+=pixels[i+1]*pixels[i+3];if(pixels[i+3]>20)extent=Math.max(extent,distance);}
    if(!energy||red<=green)throw new Error('Missing red charging orb');samples.push({time,energy,extent});
   }
   const peaks=samples.filter((s,i)=>i>0&&i<samples.length-1&&s.energy>samples[i-1].energy&&s.energy>samples[i+1].energy);
   if(peaks.length<5)throw new Error('Missing charging pulses');const intervals=peaks.slice(1).map((s,i)=>s.time-peaks[i].time);if(intervals.some((v,i)=>i&&v>=intervals[i-1]))throw new Error('Orb pulse frequency did not increase');
   const swing=(a,b,key)=>{const values=samples.filter(s=>s.time>=a&&s.time<b).map(s=>s[key]);return Math.max(...values)-Math.min(...values);};
   const early={light:swing(0,.35,'energy'),size:swing(0,.35,'extent')},late={light:swing(.75,1,'energy'),size:swing(.75,1,'extent')};
   if(late.light<=early.light*3||late.size<=early.size*2)throw new Error('Orb brightness/size amplitude did not grow');
   for(const ticks of [0,-1,30]){c.clearRect(0,0,96,96);r.laserWarning({shotType,ticks},at,0);if(c.getImageData(0,0,96,96).data.some(v=>v))throw new Error('Orb remains outside its warning window');}
   rows.push({type:shotType,peakTimes:peaks.map(s=>s.time),early,late});
  }
  if(JSON.stringify(rows[0].peakTimes)!==JSON.stringify(rows[1].peakTimes)||JSON.stringify(rows[0].late)!==JSON.stringify(rows[1].late))throw new Error('Laser colors use different warning orbs');
 }finally{r.c=oldContext;r.enemyShot=oldShot;}
 return {types:2,muzzleOnly:true,growingPulse:true,accelerating:true,emissionRestored:true,samples:rows};
})()
