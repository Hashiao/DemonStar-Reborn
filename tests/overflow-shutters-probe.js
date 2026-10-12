// 打包后验证溢出弹保留敌弹与炮门同步。 / Verify packaged overflow survival and shutter synchronization.
(function(){
 const {Game,STEP}=StarfallCore,N=DemonStarNetworkState;let cases=0;
 for(let difficulty=0;difficulty<4;difficulty++)for(const retainWeaponLevels of [false,true])for(const owner of [0,1])for(const weapon of [0,1,2])for(const full of [false,true]){
  const g=new Game(224);g.start(difficulty,4,false,{playerCount:2,retainWeaponLevels});g.recordEvents=[];g.players.forEach(p=>Object.assign(p,{x:40,y:440,invincible:999}));const p=g.players[owner];Object.assign(p,{x:200,y:300,weapon,power:6,defaultWeapon:false,weaponLevels:[6,6,6]});
  g.addBullet(200,282,0,0,false,2,0,{shotType:1});const hostile=g.bullets[0];g.collect({type:full?'full':['weapon','ion','plasma'][weapon]},p);if(g.bullets.filter(b=>b.friendly).length!==[16,32,64][weapon])throw new Error('Overflow count mismatch');
  for(let tick=0;tick<4;tick++)g.update(STEP);if(!g.bullets.includes(hostile)||hostile.dead)throw new Error('Color overflow cancelled a hostile shot');p.y=282;p.invincible=0;g.update(STEP);if(p.energy>=16)throw new Error('Crossing hostile shot lost damage');cases++;
 }
 const frames=[];
 for(const id of [88,89,185]){
  const host=new Game(224),peer=new Game(225);host.start(1,4,false,{playerCount:2});host.recordEvents=[];host.spawnRecord([200,0,id,0,1,-1,0,0]);const e=host.enemies[0];Object.assign(e,{x:200,y:100,entered:true});const seen=new Set();
  for(let tick=0;tick<550;tick++){host.updateEnemyState(e);seen.add(e.animation.frame);}const count=id===185?20:6;if(seen.size!==count)throw new Error('Shutter poses missing');if(!N.apply(peer,N.encode(host),false)||JSON.stringify(peer.enemies[0].animation)!==JSON.stringify(e.animation))throw new Error('Shutter LAN mismatch');frames.push(count);
 }
 return {cases,hostileDamagePreserved:true,shutterFrames:frames,network:true};
})()
