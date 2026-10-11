// 在真实 AudioContext 中验证密集混音，不替代真机听感验收。
// Exercise dense mixing in a real AudioContext; this is not physical listening certification.
(async function(Class){
 const audio=new Class(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 audio.scene='results';audio.unlock();await audio.ctx.resume();audio.master.gain.value=0;
 let shotStarts=0,shotRejects=0,crossPoolSteals=0,maxWorld=0,maxShots=0,worldRequest=false;
 const sample=audio.sample,stop=audio.stopSource;
 audio.sample=function(kind,...args){const s=sample.call(this,kind,...args);if(['proton','ion','plasma'].includes(kind)){if(s)shotStarts++;else shotRejects++;}return s;};
 audio.stopSource=function(s){if(worldRequest&&s?.playerId>0)crossPoolSteals++;return stop.call(this,s);};
 try{
  let nextShot=audio.ctx.currentTime;
  for(let n=0;n<20;n++){
   for(let wait=0;audio.ctx.currentTime<nextShot;wait++){if(wait>200)throw new Error('Audio clock stalled');await sleep(10);}
   worldRequest=true;for(const kind of ['explosion','groundExplosion','heavyExplosion','hit','enemyShot','enemyMissile','enemyLaser','bossEngine1'])audio.sample(kind);worldRequest=false;
   audio.effect('shot',{weapon:n%3,playerId:1});audio.effect('shot',{weapon:(n+1)%3,playerId:2});
   const world=audio.active.filter(s=>s.voiceGroup==='world').length,shots=audio.active.filter(s=>s.playerId>0).length;maxWorld=Math.max(maxWorld,world);maxShots=Math.max(maxShots,shots);
   if(world>8||shots>4)throw new Error('Unbounded voice pool');
   nextShot=Math.max(...audio.lastShots.values())+.09;
  }
  if(shotStarts!==40||shotRejects||crossPoolSteals)throw new Error('Player shots were lost: '+JSON.stringify({shotStarts,shotRejects,crossPoolSteals}));
  audio.stopAll();await sleep(40);if(audio.active.length||audio.sources.size)throw new Error('Stopped voices leaked');
  return {shotStarts,shotRejects,crossPoolSteals,maxWorld,maxShots,stoppedSources:audio.sources.size,sharedScheduler:Class.prototype.sample===StarfallAudio.prototype.sample};
 }finally{audio.stopAll();await audio.ctx.close();}
})
