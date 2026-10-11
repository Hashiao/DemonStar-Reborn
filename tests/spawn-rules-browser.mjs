import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],cases=[];
await mkdir('artifacts',{recursive:true});
try{
  const page=await browser.newPage({viewport:{width:480,height:900},locale:'zh-CN'});
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.StarfallApp&&StarfallApp.renderer.presentationReady());
  for(const stage of [1,3])for(const players of [1,2])for(let difficulty=0;difficulty<4;difficulty++){
    await page.evaluate(({players,stage})=>{StarfallApp.input.config.count=players;StarfallApp.start(stage);},{players,stage});
    await page.waitForFunction(()=>StarfallApp.game.phase==='playing'&&StarfallApp.renderer.campaignReady());
    const state=await page.evaluate(({stage,players,difficulty})=>{
      const app=StarfallApp,g=app.game,C=DemonStarCampaign;g.start(difficulty,stage,false,{playerCount:players});for(const p of g.players)p.invincible=0;
      const ys=stage===1?[2520,2544]:[1144,1184];
      g.recordEvents=C.levels[stage-1].events.filter(r=>ys.includes(r[1])&&C.definitions[C.byId[r[2]]].sprite.startsWith('S_ENBON'));
      g.scroll=Math.max(...ys);g.dispatchRecords();const origins=g.enemies.map(e=>e.originX);
      for(let i=0;i<160;i++)for(const e of g.enemies)g.moveEnemy(e,StarfallCore.STEP);
      g.pause();app.renderer.draw(g,0);
      return {stage,players,difficulty,origins,positions:g.enemies.map(e=>[e.x,e.y]),missing:[...app.renderer.missingSprites]};
    },{stage,players,difficulty});
    assert.deepEqual(state.origins,players===2||difficulty===3?(stage===1?[336,80]:[280,80]):[stage===1?336:280]);
    assert.ok(state.positions.every(([x,y])=>x>=0&&x<400&&y>0&&y<480));assert.deepEqual(state.missing,[]);cases.push(state);
    if(difficulty===1)await page.screenshot({path:`artifacts/m217-stage${stage}-${players}p.png`});
  }
  const formation=await page.evaluate(()=>{
    const app=StarfallApp;app.input.config.count=1;app.start(3);const g=app.game;g.phase='playing';g.launch=null;g.player.invincible=0;g.recordEvents=DemonStarCampaign.levels[2].events.slice(79,84);
    g.scroll=1192;g.dispatchRecords();const before=g.enemies.map(e=>[e.x,e.y]);
    for(let i=0;i<80;i++)for(const e of g.enemies)g.moveEnemy(e,StarfallCore.STEP);
    g.pause();StarfallApp.renderer.draw(g,0);return {before,after:g.enemies.map(e=>[e.x,e.y])};
  });
  assert.deepEqual(formation.before,[[168,-192],[168,-224],[168,-256],[168,-288],[168,-320]]);
  assert.deepEqual(formation.after.map(p=>p[1]),[208,176,144,112,80]);
  await page.screenshot({path:'artifacts/m217-stage3-formation.png'});assert.deepEqual(errors,[]);
  const report={status:'passed',cases,formation,checks:['four-difficulties-solo-and-two-player-fixed-side-supplies','original-group-birth-offsets','visible-entry-rendering','no-missing-assets','no-page-errors'],scope:'Isolated source-map waves through the actual bundled game dispatcher and renderer; not full original-game playthroughs or hardware timing certification.'};
  await writeFile('artifacts/m217-spawn-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,cases:cases.length}));
}finally{await browser.close();}
