import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
try{
  const page=await browser.newPage({viewport:{width:844,height:390},locale:'zh-CN'});page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.StarfallApp&&StarfallApp.renderer.presentationReady());
  await page.locator('#start').click();await page.evaluate(()=>{const g=StarfallApp.game;g.phase='playing';g.launch=null;g.events=[];g.recordEvents=[];g.pause();});await page.waitForTimeout(100);
  const appearance=selector=>page.locator(selector).first().evaluate(e=>{const s=getComputedStyle(e);return {backgroundImage:s.backgroundImage,backgroundSize:s.backgroundSize,backgroundPosition:s.backgroundPosition,backgroundColor:s.backgroundColor,borderColor:s.borderColor,boxShadow:s.boxShadow,width:s.width,height:s.height};});
  const solo={life:await appearance('#lives .ship-icon'),bomb:await appearance('#bomb-stock .bomb-icon-0'),energy:await appearance('#energy .filled')};
  for(const count of [2,4]){
    await page.evaluate(count=>{const app=StarfallApp;app.input.config.count=count;app.start();const g=app.game;g.phase='playing';g.launch=null;g.events=[];g.recordEvents=[];for(const [i,p] of g.players.entries()){p.lives=4-i;p.energy=[16,9,3,12][i];p.bombInventory=i===0?[0,1,2,0,1,2]:i===1?[2,1,0,2,1,0]:i===2?[]:[1];p.score=(i+1)*12340;p.invincible=0;}g.pause();},count);await page.waitForTimeout(100);
    assert.equal(await page.locator('#coop-hud .coop-player').count(),count);
    for(let i=0;i<count;i++){const p=page.locator(`#coop-hud [data-player="${i+1}"]`);assert.equal(await p.locator('.classic-lives .ship-icon').count(),3-i);assert.equal(await p.locator('.classic-energy i').count(),16);assert.equal(await p.locator('.classic-energy .filled').count(),[16,9,3,12][i]);assert.equal(await p.locator('.classic-bomb-stock .hud-sprite').count(),[6,6,0,1][i]);assert.ok(!(await p.textContent()).includes('能'));}
    assert.deepEqual(await appearance('#coop-hud [data-player="1"] .classic-lives .ship-icon'),solo.life);assert.deepEqual(await appearance('#coop-hud [data-player="1"] .classic-bomb-stock .bomb-icon-0'),solo.bomb);assert.deepEqual(await appearance('#coop-hud [data-player="1"] .classic-energy .filled'),solo.energy);
    for(const [width,height] of [[844,390],[480,900],[320,568],[768,1024]]){
      const before=await page.evaluate(()=>JSON.stringify(StarfallApp.game));await page.setViewportSize({width,height});await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>JSON.stringify(StarfallApp.game)),before);
      const bounds=await page.evaluate(()=>Array.from(document.querySelectorAll('#coop-hud .classic-score,#coop-hud .classic-status')).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));for(const r of bounds)assert.ok(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,JSON.stringify({count,width,height,r}));
      if(width===844||width===480)await page.screenshot({path:`artifacts/m210-classic-hud-${count}p-${width}.png`});
    }
    checks.push(`${count}p-original-spare-ships-typed-bombs-sixteen-energy-segments-four-layouts`);
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(80);
  }
  await page.evaluate(()=>{StarfallApp.input.config.count=1;StarfallApp.start();});await page.waitForFunction(()=>StarfallApp.game.phase==='playing');assert.equal(await page.locator('#lives .ship-icon').count(),3);assert.equal(await page.locator('#energy .filled').count(),16);assert.equal(await page.locator('#coop-hud').isVisible(),false);checks.push('return-to-unchanged-one-player-HUD');assert.deepEqual(errors,[]);
  const report={status:'passed',checks,errors};await writeFile('artifacts/m210-classic-hud-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
