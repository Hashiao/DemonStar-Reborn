import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{
  const page=await browser.newPage({viewport:{width:768,height:1024},locale:'zh-CN'});
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.StarfallApp&&StarfallApp.renderer.presentationReady());
  // 直接验证四人世界渲染，触控和联机入口另行验收。
  // Probe four-player world rendering directly; touch UI and LAN are separate acceptance gates.
  await page.evaluate(()=>{StarfallApp.start();const g=StarfallApp.game;g.start(1,1,false,{playerCount:4});g.recordEvents=[];g.events=[];for(const p of g.players){p.invincible=0;p.bombInventory=[2];g.useBomb(p);}g.update(StarfallCore.STEP,{players:g.players.map(()=>({fire:true}))});g.pause();});
  const draws=await page.evaluate(()=>{
    const r=StarfallApp.renderer,ships=[],beams=[],labels=[],ship=r.player,beam=r.superCell,label=r.c.fillText;
    r.player=function(x,y,power,time,scale,p){ships.push({id:p.id,x,y});return ship.call(this,x,y,power,time,scale,p);};
    r.superCell=function(cell,x,y,w,h){beams.push({cell,x,y,w,h});return beam.call(this,cell,x,y,w,h);};
    r.c.fillText=function(text,x,y){labels.push(text);return label.call(this,text,x,y);};
    try{r.draw(StarfallApp.game,0);}finally{r.player=ship;r.superCell=beam;r.c.fillText=label;}
    return {ships,beams,labels};
  });
  assert.deepEqual(draws.ships.map(p=>p.id),[1,2,3,4]);assert.deepEqual(draws.labels,['1','2','3','4']);assert.equal(new Set(draws.ships.map(p=>p.x)).size,4);assert.equal(draws.beams.filter(p=>p.cell>=4).length,4);
  await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/m210-four-player-render.png'});
  const snapshot=await page.evaluate(()=>{const g=StarfallApp.game,s=g.checkpoint();g.loadCheckpoint(s,false);return {players:g.players.length,phase:g.phase,frame:g.frame,stage:g.stage.id};});assert.deepEqual(snapshot,{players:4,phase:'playing',frame:0,stage:1});
  await page.evaluate(()=>{StarfallApp.showMenu();StarfallApp.start();});await page.waitForFunction(()=>StarfallApp.game.phase==='playing');
  assert.equal(await page.evaluate(()=>StarfallApp.game.players.length),1);assert.deepEqual(errors,[]);
  const report={status:'passed',scope:'Renderer and stage checkpoint probe; touch and native LAN have separate acceptance tests',draws,snapshot,errors};await writeFile('artifacts/m210-multiplayer-render.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
