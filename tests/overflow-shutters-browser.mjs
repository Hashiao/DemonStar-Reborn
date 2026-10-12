// 新炮门逐帧实绘与三色溢出弹回归。 / Actual shutter-frame rendering and color-overflow regression.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFile,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({locale:'zh-CN',viewport:{width:480,height:900}});page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>window.StarfallApp&&StarfallApp.renderer.presentationReady());
 const probe=await page.evaluate(await readFile(new URL('overflow-shutters-probe.js',import.meta.url),'utf8'));
 assert.equal(probe.cases,96);assert.equal(probe.cadenceCases,12);assert.deepEqual(probe.shutterFrames,[6,6,20]);assert.ok(probe.network&&probe.hostileDamagePreserved);
 await page.evaluate(()=>{StarfallApp.game.start(1,4);StarfallApp.game.pause();StarfallApp.renderer.prepareStage(4);});await page.waitForFunction(()=>StarfallApp.renderer.campaignReady(4));
 const art=await page.evaluate(()=>{
  const r=StarfallApp.renderer,old=r.c,canvas=document.createElement('canvas');canvas.width=canvas.height=120;const c=canvas.getContext('2d');r.c=c;const result=[];
  try{for(const id of [88,89,185]){const d=DemonStarCampaign.definitions[DemonStarCampaign.byId[id]],spec=DemonStarCampaignArt.sprites[d.sprite],hashes=[];for(let frame=0;frame<spec.frames.length;frame++){c.clearRect(0,0,120,120);r.campaignObject({def:d,x:60,y:60,animation:{frame}},false);const data=c.getImageData(0,0,120,120).data;let pixels=0,hash=2166136261;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]>128)pixels++;}if(pixels<100)throw new Error('Invisible shutter frame '+id+':'+frame);hashes.push(hash>>>0);}result.push({id,frames:hashes.length,distinct:new Set(hashes).size});}}finally{r.c=old;}return result;
 });
 for(const row of art)assert.equal(row.distinct,row.frames);
 // 所有引用关卡加载新图集，离开后释放；不改实际关卡或炮位数据。
 // Every referencing stage loads the atlas and releases it on exit; preserve campaign/gun data.
 const stages=[];for(let id=1;id<=18;id++){
  await page.evaluate(id=>{StarfallApp.game.start(1,id);StarfallApp.game.pause();StarfallApp.renderer.prepareStage(id);},id);await page.waitForFunction(id=>StarfallApp.renderer.campaignReady(id),id);
  stages.push(await page.evaluate(id=>({id,assets:[...StarfallApp.renderer.campaignAtlases.keys()].filter(p=>/ground-(covers|shutters)-hd/.test(p)),expected:DemonStarCampaignArt.stageAssets[id].filter(p=>/ground-(covers|shutters)-hd/.test(p))}),id));
 }for(const row of stages)assert.deepEqual(row.assets.sort(),row.expected.sort());
 await page.evaluate(()=>{const g=StarfallApp.game;g.start(1,4);g.recordEvents=[];g.enemies=[];for(const [id,x,y,frame] of [[88,100,140,0],[88,280,140,5],[89,100,250,0],[89,280,250,5],[185,100,360,0],[185,280,360,12]]){g.spawnRecord([x,0,id,0,1,-1,0,0]);Object.assign(g.enemies.at(-1),{x,y,px:x,py:y,entered:true,guns:[],animation:{frame}});}g.phase='paused';document.getElementById('menu').hidden=true;document.getElementById('dialog').hidden=true;StarfallApp.renderer.prepareStage(4);});await page.waitForFunction(()=>StarfallApp.renderer.campaignReady(4));await page.evaluate(()=>StarfallApp.renderer.draw(StarfallApp.game,0));await page.screenshot({path:'artifacts/m224-ground-shutters.png'});
 assert.deepEqual(errors,[]);await writeFile('artifacts/m224-overflow-shutters-browser.json',JSON.stringify({status:'passed',probe,art,stages,errors},null,2));console.log(JSON.stringify({status:'passed',overflowCases:probe.cases,renderedFrames:art.reduce((n,r)=>n+r.frames,0),stageAssetChecks:stages.length,errors}));
}finally{await browser.close();}
