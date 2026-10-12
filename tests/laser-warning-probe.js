// 原生 WebView 的预警、无伤害、暂停改难度和同步探针。 / Native WebView warning, harmlessness, pause/difficulty and sync probe.
(() => {
 const {Game,STEP}=StarfallCore,g=new Game(222);g.start(0,1,false,{playerCount:2});g.recordEvents=[];g.spawnRecord([200,0,40,0,1,-1,0,0]);
 const e=g.enemies[0];Object.assign(e,{x:200,y:80,px:200,py:80,entered:true,pathFinished:true,exitX:0,exitY:0});e.guns=e.guns.filter(gun=>gun.raw[2]===9);e.guns[0].delay=20;g.player.x=199;g.player.invincible=0;
 g.update(STEP);if(g.laserWarnings.length!==1||g.player.energy!==16||g.bullets.length)throw new Error('Laser warning missing or harmful');
 const client=new Game(223);if(!DemonStarNetworkState.apply(client,DemonStarNetworkState.encode(g),false)||JSON.stringify(client.laserWarnings)!==JSON.stringify(g.laserWarnings))throw new Error('Laser warning snapshot mismatch');
 g.pause();const frame=g.frame;g.update(.25);if(g.frame!==frame)throw new Error('Paused warning advanced');g.setDifficulty(1);if(g.laserWarnings.length)throw new Error('Warning outside Easy');g.setDifficulty(0);if(g.laserWarnings[0].ticks!==20)throw new Error('Difficulty reset warning timer');g.resume();
 for(let i=0;i<19;i++){g.update(STEP);if(g.player.energy!==16)throw new Error('Warning damaged player');}g.update(STEP);if(g.player.energy!==14||g.laserWarnings.length||!g.bullets.some(b=>b.beam))throw new Error('Laser warning handoff failed');
 return {harmless:true,firstHit:true,pauseDifficulty:true,network:true,players:2};
})()
