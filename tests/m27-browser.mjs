// M2.7 四项反馈与默认设置验收。 / M2.7 feedback and default-settings verification.
import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({locale:'zh-CN',viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.presentationReady()&&StarfallApp.renderer.enemyArtReady());
  const prefs=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('demonstar-reborn-v1')));
  let s=await prefs();assert.equal(s.enemyHealthBars,false);assert.equal(s.bossHealthBars,true);
  for(const old of [false,true]){
    await page.evaluate(old=>localStorage.setItem('demonstar-reborn-v1',JSON.stringify({language:'zh-CN',enemyHealthBars:old,best:[100,200,300,400],unlocked:[2,3,4,5]})),old);await page.reload();s=await prefs();assert.equal(s.enemyHealthBars,false);assert.equal(s.bossHealthBars,true);assert.deepEqual(s.best,[100,200,300,400]);
  }
  await page.locator('#settings').tap();assert.equal(await page.locator('#health-toggle').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('#boss-health-toggle').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'artifacts/m27-default-settings.png'});
  await page.locator('#health-toggle').tap();await page.locator('#boss-health-toggle').tap();await page.reload();s=await prefs();assert.equal(s.enemyHealthBars,true);assert.equal(s.bossHealthBars,false);
  await page.locator('#settings').tap();
  for(const locale of ['en','zh-Hant','zh-Hans']){
    await page.locator('#language').selectOption(locale);assert.equal(await page.locator('#health-toggle').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#boss-health-toggle').getAttribute('aria-pressed'),'false');await page.screenshot({path:`artifacts/m27-settings-${locale}.png`});
  }
  await page.locator('#health-toggle').tap();await page.locator('#boss-health-toggle').tap();await page.getByRole('button',{name:'返回机库',exact:true}).tap();
  const started=Date.now();await page.locator('#start').tap();await page.waitForFunction(()=>StarfallApp.game.phase==='playing');const launchSeconds=(Date.now()-started)/1000;assert.ok(launchSeconds<5.5,launchSeconds);
  await page.evaluate(()=>{const g=StarfallApp.game;g.recordEvents=[];g.enemies=[];g.events=[];g.player.invincible=0;g.spawnRecord([200,0,189,191,1,-1,0,0]);const e=g.enemies[0];e.x=e.px=200;e.y=e.py=180;e.entered=true;g.pause();});
  const tank=await page.evaluate(()=>{const r=StarfallApp.renderer,e=StarfallApp.game.enemies[0],draw=r.c.drawImage,calls=[];r.c.drawImage=function(...a){calls.push(a);return draw.apply(this,a);};r.framedObject(e,false);r.c.drawImage=draw;return {w:calls[0][7],h:calls[0][8],hp:e.maxHp};});assert.equal(tank.hp,700);assert.ok(Math.abs(tank.w/tank.h-44/87)<1e-8);await page.waitForTimeout(100);await page.screenshot({path:'artifacts/tanker-proportions.png'});
  await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.enemies=[];g.events=[];g.player.y=g.player.py=370;g.player.invincible=0;g.spawnRecord(g.stage.map.events.find(r=>r[2]===40));const b=g.boss;b.x=b.px=200;b.y=b.py=140;b.pathFinished=true;b.exitX=b.exitY=0;b.guns=[];b.entered=true;g.player.bombInventory=[2];g.useBomb();g.update(StarfallCore.STEP);g.pause();g.events=[];});
  await page.waitForTimeout(100);assert.ok(await page.locator('#boss-hud').isVisible());assert.equal(await page.evaluate(()=>StarfallApp.game.bullets.filter(b=>b.playerBeam).length),1);assert.equal(await page.evaluate(()=>StarfallApp.renderer.enemyHealthBars),false);await page.screenshot({path:'artifacts/blue-laser-aura.png'});
  const shapes=await page.evaluate(()=>{const r=StarfallApp.renderer,calls=[],draw=r.superCell;r.superCell=function(...a){calls.push(a);return draw.apply(this,a);};r.draw(StarfallApp.game,0);r.superCell=draw;return calls;});assert.ok(shapes.some(c=>c[0]>=4&&c[3]>=10&&c[4]>100));assert.ok(shapes.some(c=>c[0]<4&&c[3]===48&&c[4]===58));
  await page.evaluate(()=>StarfallApp.game.resume());await page.locator('#pause').tap();await page.locator('#boss-health-toggle').tap();assert.equal(await page.locator('#boss-hud').isVisible(),false);await page.locator('#health-toggle').tap();assert.equal(await page.locator('#boss-hud').isVisible(),false);await page.locator('#boss-health-toggle').tap();assert.ok(await page.locator('#boss-hud').isVisible());
  for(const [width,height] of [[320,568],[844,390],[768,1024],[1366,1024]]){
    await page.setViewportSize({width,height});await page.locator('#language').selectOption('en');await page.locator('#boss-health-toggle').click();await page.locator('#boss-health-toggle').click();await page.getByRole('button',{name:'Resume flight',exact:true}).click();await page.locator('#pause').tap();
  }
  assert.deepEqual(errors,[]);const report={status:'passed',defaults:'Boss only',old_shared_switch_migrates_once:true,independent_persistent_toggles:true,three_languages:true,ordinary_enemy_threshold_hp:905,tanker:tank,launch_wall_seconds:launchSeconds,blue_laser_and_player_aura:true,five_layouts:true,errors};await writeFile('artifacts/m27-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
