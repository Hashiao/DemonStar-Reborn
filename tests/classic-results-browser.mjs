import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
try{
  const page=await browser.newPage({viewport:{width:480,height:900}});page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>window.StarfallApp&&StarfallApp.renderer.presentationReady());
  for(const locale of ['zh-Hans','zh-Hant','en'])for(const count of [1,2]){
    await page.evaluate(({locale,count})=>{DemonStarI18n.select(locale);DemonStarI18n.apply();const app=StarfallApp;app.input.config.count=count;app.start(1);const g=app.game;g.phase='playing';g.launch=null;g.recordEvents=[];g.enemies=[];g.players.forEach(p=>p.invincible=0);g.player.medals=10;if(count===2){g.players[1].bombInventory=[1,2];g.players[1].medals=4;g.players[1].rear=3;}g.defeatBoss();for(let i=0;i<45;i++)g.update(StarfallCore.STEP);},{locale,count});
    await page.waitForSelector('.classic-results:not([hidden])');assert.equal(await page.locator('.result-player').count(),count);assert.deepEqual(await page.locator('.result-player').first().locator('.bonus-row b').allTextContents(),['3000','20000','23000']);if(count===2)assert.deepEqual(await page.locator('.result-player').nth(1).locator('.bonus-row b').allTextContents(),['2000','8000','10000']);
    assert.equal(await page.locator('.result-score,.classic-results .stat-row').count(),0);assert.equal(await page.locator('.bonus-icons .hud-sprite').count(),count*2);assert.equal(await page.locator('.result-medal').count(),count);
    for(const [width,height] of [[480,900],[320,568],[844,390],[768,1024]]){
      const state=await page.evaluate(()=>JSON.stringify(StarfallApp.game));await page.setViewportSize({width,height});await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>JSON.stringify(StarfallApp.game)),state);
      const info=await page.evaluate(()=>{const dialog=document.getElementById('dialog'),r=dialog.getBoundingClientRect(),style=getComputedStyle(dialog),nodes=Array.from(dialog.querySelectorAll('h2,.result-player,#dialog-buttons'));return {style:{background:style.backgroundColor,filter:style.backdropFilter},bounds:nodes.map(el=>{const b=el.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1;}),overflow:document.documentElement.scrollWidth>innerWidth};});assert.deepEqual(info.style,{background:'rgba(0, 0, 0, 0)',filter:'none'});assert.ok(info.bounds.every(Boolean));assert.equal(info.overflow,false);
      if(width===480&&locale==='en'){await page.waitForTimeout(1200);await page.screenshot({path:`artifacts/m210-results-${count}p.png`});}
    }
    checks.push(locale+'-'+count+'p-icons-values-transparent-overlay-four-layouts');
  }
  await page.getByRole('button',{name:'Next stage →',exact:true}).click();await page.waitForFunction(()=>StarfallApp.game.stage.id===2&&StarfallApp.game.phase==='launch');assert.equal(await page.locator('#dialog').isVisible(),false);assert.equal(await page.evaluate(()=>StarfallApp.game.players[1].rear),3);assert.equal(await page.evaluate(()=>StarfallApp.game.score),33000);
  await page.locator('#pause').click();assert.equal(await page.locator('#dialog').evaluate(e=>e.classList.contains('classic-results')),false);checks.push('next-stage-preserves-equipment-and-restores-normal-settings-style');
  assert.deepEqual(errors,[]);const report={status:'passed',checks,errors};await writeFile('artifacts/m210-classic-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
