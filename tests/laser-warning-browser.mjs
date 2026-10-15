// 验证真正 Canvas 中的炮口光球、炮口与正式攻击交接。 / Verify real Canvas charging muzzle orbs, muzzles and attack handoff.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:480,height:900},locale:'zh-CN'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>globalThis.StarfallApp&&StarfallApp.renderer.presentationReady());
 await page.evaluate(()=>{StarfallApp.start(5);StarfallApp.game.pause();StarfallApp.renderer.prepareStage(5);});await page.waitForFunction(()=>StarfallApp.renderer.campaignReady(5));
 const probe=await page.evaluate(await readFile('tests/muzzle-warning-probe.js','utf8'));assert.equal(probe.types,2);assert.ok(probe.colorMatched&&probe.muzzleOnly&&probe.growingPulse&&probe.accelerating&&probe.emissionRestored);
 const audit=await page.evaluate(await readFile('tests/boss-muzzle-probe.js','utf8'));for(const [name,png] of Object.entries(audit.images))await writeFile('artifacts/m227-'+name+'.png',Buffer.from(png,'base64'));delete audit.images;assert.equal(audit.bosses,18);assert.equal(audit.mounts,33);
 await page.evaluate(()=>StarfallApp.renderer.prepareStage(5));await page.waitForFunction(()=>StarfallApp.renderer.campaignReady(5));
 const result=await page.evaluate(()=>{
  const {Game,STEP}=StarfallCore,r=StarfallApp.renderer,g=StarfallApp.game;g.start(0,5,false,{playerCount:1});g.recordEvents=[];g.spawnRecord([200,0,44,0,1,-1,0,0]);const e=g.enemies[0];Object.assign(e,{x:200,y:100,px:200,py:100,pathFinished:true,exitX:0,exitY:0,entered:true});e.guns=e.guns.filter(gun=>[9,10].includes(gun.raw[2]));for(const gun of e.guns){gun.delay=10;gun.wait=0;}for(const p of g.players)p.invincible=999;g.update(STEP);g.pause();
  const draw=r.laserWarning,positions=[];r.laserWarning=function(w,at,fraction,enemy){positions.push({type:w.shotType,x:at.x,y:at.y,fraction});draw.call(this,w,at,fraction,enemy);};
  for(const w of g.laserWarnings)w.ticks=26;e.x=e.px=250;r.draw(g,0);const first=positions.splice(0);r.draw(g,.5);const frozen=positions.splice(0);
  r.laserWarningsEnabled=false;r.draw(g,0);const disabled=positions.splice(0);r.laserWarningsEnabled=true;r.laserWarning=draw;
  const client=new Game(333);DemonStarNetworkState.apply(client,DemonStarNetworkState.encode(g),false);const network=JSON.stringify(client.laserWarnings)===JSON.stringify(g.laserWarnings);
  g.resume();let safety=30;while(!g.bullets.some(b=>b.beam)&&safety--)g.update(STEP);g.pause();const live=g.bullets.filter(b=>b.beam).map(b=>({type:b.shotType,damage:b.damage}));const remainingWarnings=g.laserWarnings.length;
  // 留一张真实预警画面供验收；不改 App 文案。
  // Leave a real warning scene for visual verification without adding product copy.
  g.bullets=[];for(const gun of e.guns){gun.volleyFired=false;gun.remaining=gun.raw[7];gun.delay=2;gun.wait=0;gun.active=false;gun.cooldown=0;}g.updateLaserWarnings();r.draw(g,0);
  return {first,frozen,disabled,network,live,remainingWarnings,missing:[...r.missingSprites,...r.missingShotTypes]};
 });
 assert.deepEqual(result.first,result.frozen);assert.deepEqual(result.disabled,[]);assert.ok(result.first.length>0);assert.ok(result.first.every(p=>p.x>180));assert.equal(result.network,true);assert.equal(result.remainingWarnings,0);assert.ok(result.live.some(b=>b.type===9)&&result.live.some(b=>b.type===10));assert.deepEqual(result.missing,[]);assert.deepEqual(errors,[]);
 await page.screenshot({path:'artifacts/m227-laser-muzzles.png'});await writeFile('artifacts/m227-laser-muzzles-browser.json',JSON.stringify({status:'passed',probe,audit,...result,errors},null,2));console.log(JSON.stringify({status:'passed',probe,bosses:audit.bosses,mounts:audit.mounts,nativeArtTypes:2,network:result.network,errors}));
}finally{await browser.close();}
