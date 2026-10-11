import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
await mkdir('artifacts',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:480,height:900},locale:'zh-CN'});
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');
 await page.waitForFunction(()=>globalThis.StarfallApp&&StarfallApp.renderer.presentationReady());
 for(const stage of [3,10]){
  await page.evaluate(stage=>{const a=StarfallApp;a.start(stage);a.game.pause();a.renderer.prepareStage(stage);},stage);
  await page.waitForFunction(()=>StarfallApp.renderer.campaignReady());
  const result=await page.evaluate(()=>{
   const a=StarfallApp,g=a.game,r=a.renderer,C=DemonStarCampaign;g.recordEvents=[];g.enemies=[];g.bullets=[];g.launch=null;g.effects=[];g.particles=[];g.phase='playing';
   for(const [i,id] of [10,11,11,11,12].entries()){g.spawnRecord([168,0,id,0,1,-1,0,0]);Object.assign(g.enemies.at(-1),{x:168,y:280-i*32,px:168,py:280-i*32,entered:true});}
   const normal=g.enemies.map(e=>[e.def.sprite,e.y]);g.pause();r.draw(g,0);
   return {stage:g.stage.id,normal,loaded:r.campaignAtlases.has('assets/snake-deaths-hd.png')};
  });
  assert.equal(result.loaded,true);assert.equal(result.normal.length,5);
  if(stage===3)await page.screenshot({path:'artifacts/m220-snake-intact.png'});
  const fallen=await page.evaluate(()=>{
   const a=StarfallApp,g=a.game,r=a.renderer,parts=g.enemies.slice();for(const e of [parts[0],parts[2],parts[4]]){g.killEnemy(e);for(let i=0;i<25;i++)g.updateEnemyState(e);}
   g.effects=[];g.particles=[];r.draw(g,0);
   const original=r.c,canvas=document.createElement('canvas');canvas.width=400;canvas.height=480;const c=canvas.getContext('2d');r.c=c;
   const counts=[];try{for(const e of [parts[0],parts[2],parts[4]]){c.clearRect(0,0,400,480);r.object(e);const pixels=c.getImageData(0,0,400,480).data;let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>128)opaque++;counts.push({name:e.def.sprite,opaque,dead:e.dead,dying:e.dying});}}finally{r.c=original;}
   const state=DemonStarNetworkState.encode(g),client=new StarfallCore.Game(1);const applied=DemonStarNetworkState.apply(client,state,false);
   return {counts,applied,clientDying:client.enemies.filter(e=>e.dying).length,missing:[...r.missingSprites]};
  });
  assert.ok(fallen.counts.every(e=>e.opaque>220&&e.dying&&!e.dead));assert.equal(fallen.applied,true);assert.equal(fallen.clientDying,3);assert.deepEqual(fallen.missing,[]);
  checks.push({...result,...fallen});if(stage===3)await page.screenshot({path:'artifacts/m220-snake-damaged.png'});
 }
 await page.evaluate(()=>{const a=StarfallApp;a.start(2);a.game.pause();a.renderer.prepareStage(2);});await page.waitForFunction(()=>StarfallApp.renderer.campaignReady());
 const chain=await page.evaluate(()=>{
  const a=StarfallApp,g=a.game,C=DemonStarCampaign;g.recordEvents=[];g.enemies=[];g.bullets=[];g.launch=null;g.effects=[];g.particles=[];g.phase='playing';
  const source=C.levels[1].events,center=source.find(r=>r[2]===101);
  const records=source.filter(r=>Math.max(Math.abs(r[0]-center[0]),Math.abs(r[1]-center[1]))<=70&&(C.definitions[C.byId[r[2]]].flags&0x20000));
  for(const record of records){g.spawnRecord(record);const e=g.enemies.at(-1);Object.assign(e,{x:200+record[0]-center[0],y:200+center[1]-record[1],entered:true});}
  const e=g.enemies.find(e=>e.record===center);g.killEnemy(e);
  const deaths=[];for(let frame=0;frame<30;frame++){for(const e of g.enemies)if(!e.dead)g.updateEnemyState(e);g.updateEffects();deaths.push(g.enemies.filter(e=>e.dead).length);}
  g.enemies=g.enemies.filter(e=>!e.dead);g.pause();a.renderer.draw(g,0);
  return {placed:records.length,deaths,remaining:g.enemies.length,wrecks:g.wrecks.length,missing:[...a.renderer.missingSprites],released:!a.renderer.campaignAtlases.has('assets/snake-deaths-hd.png')};
 });
 assert.ok(chain.placed>=5);assert.ok(chain.deaths.at(-1)>chain.deaths[0]);assert.ok(chain.wrecks>=5);assert.equal(chain.released,true);assert.deepEqual(chain.missing,[]);
 await page.screenshot({path:'artifacts/m220-ground-chain.png'});
 assert.deepEqual(errors,[]);const report={status:'passed',checks,chain,errors,scope:'Source formations, isolated destruction and renderer/LAN snapshots; not full original runs or hardware verification.'};
 await writeFile('artifacts/m220-structures-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
