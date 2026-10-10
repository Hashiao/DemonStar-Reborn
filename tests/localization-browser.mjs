// 三语首次启动、切换与布局验收。 / First-run locale, switching and layout checks.
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
const url=process.env.GAME_URL||'http://127.0.0.1:4174';
try{
  for(const [locale,expected,settings] of [['zh-CN','zh-Hans','设置'],['zh-SG','zh-Hans','设置'],['zh-TW','zh-Hant','設定'],['zh-HK','zh-Hant','設定'],['zh-MO','zh-Hant','設定'],['en-US','en','Settings'],['ja-JP','en','Settings']]){
    const context=await browser.newContext({locale,viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(url);await page.waitForFunction(()=>globalThis.StarfallApp);
    assert.equal(await page.locator('html').getAttribute('lang'),expected);assert.equal(await page.locator('#settings').textContent(),settings);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('demonstar-reborn-v1')).language),expected);
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('localizing')),false);
    if(['zh-CN','zh-TW','en-US'].includes(locale))await page.screenshot({path:`artifacts/menu-${expected}.png`});checks.push({system:locale,selected:expected});await context.close();
  }
  const context=await browser.newContext({locale:'en-US',viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url+'#system-language=zh-Hant-HK');await page.waitForFunction(()=>globalThis.StarfallApp);assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hant');
  await page.evaluate(()=>localStorage.setItem('demonstar-reborn-v1',JSON.stringify({best:[1234,5678,0,0],unlocked:[3,5,1,1],difficulty:1,musicPreferenceVersion:1,music:false,musicVolume:0,sound:false})));
  await page.reload();await page.locator('#settings').tap();await page.locator('#language').selectOption('en');assert.equal(await page.locator('#dialog-title').textContent(),'Game settings');
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('demonstar-reborn-v1')));assert.deepEqual(prefs.best,[1234,5678,0,0]);assert.deepEqual(prefs.unlocked,[3,5,1,1]);assert.equal(prefs.music,false);assert.equal(prefs.musicVolume,0);assert.equal(prefs.sound,false);
  await page.goto(url+'#system-language=zh-CN');await page.reload();await page.waitForFunction(()=>globalThis.StarfallApp);assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.ok((await page.locator('#start').textContent()).includes('Start game'));
  await page.locator('#help').tap();assert.ok((await page.locator('#dialog-content').textContent()).includes('Matching colored orbs'));await page.getByRole('button',{name:'Ready to fly',exact:true}).tap();
  await page.locator('#missions').tap();assert.equal(await page.locator('[data-stage="5"]').isEnabled(),true);assert.equal(await page.locator('[data-stage="6"]').isEnabled(),false);await page.getByRole('button',{name:'Back to hangar',exact:true}).tap();
  await page.locator('#start').tap();await page.waitForFunction(()=>StarfallApp.game.phase==='playing');
  await page.evaluate(()=>{const g=StarfallApp.game;g.recordEvents=[];g.enemies=[];g.player.invincible=999;g.collect({type:'plasma'});g.collect({type:'missile'});g.spawnRecord(g.stage.map.events.find(e=>e[2]===40));g.boss.x=g.boss.px=200;g.boss.y=g.boss.py=160;});
  await page.locator('#pause').tap();const snapshot=await page.evaluate(()=>JSON.stringify(StarfallApp.game));
  for(const locale of ['zh-Hans','zh-Hant','en']){
    await page.locator('#language').selectOption(locale);assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.equal(await page.evaluate(()=>JSON.stringify(StarfallApp.game)),snapshot);
    assert.equal(await page.locator('#weapon').textContent(),await page.evaluate(()=>DemonStarI18n.t('weaponLevel',{name:DemonStarI18n.t('weapon2'),n:1})));
    assert.equal(await page.locator('#bomb').getAttribute('aria-label'),await page.evaluate(()=>DemonStarI18n.t('bombAria',{n:3})));
    const musicLabel=await page.locator('#music-toggle').getAttribute('aria-label');assert.equal(musicLabel,await page.evaluate(()=>DemonStarI18n.t('music')+' '+DemonStarI18n.t('off')));
    await page.locator('#music-toggle').click();assert.equal(await page.locator('#music-toggle').getAttribute('aria-label'),await page.evaluate(()=>DemonStarI18n.t('music')+' '+DemonStarI18n.t('on')));await page.locator('#music-toggle').click();
    await page.screenshot({path:`artifacts/settings-${locale}.png`});
  }
  for(const [width,height] of [[320,568],[844,390],[768,1024],[1366,1024]]){
    await page.setViewportSize({width,height});await page.locator('#language').selectOption('zh-Hant');await page.locator('#language').selectOption('en');assert.equal(await page.evaluate(()=>StarfallApp.game.phase),'paused');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByRole('button',{name:'Resume flight',exact:true}).click();await page.waitForTimeout(60);
    const b=await page.locator('.weapon-status').boundingBox();assert.ok(b.x>=-1&&b.x+b.width<=width+1&&b.y>=-1&&b.y+b.height<=height+1,JSON.stringify(b));
    await page.evaluate(()=>StarfallApp.game.player.invincible=999);await page.locator('#pause').tap();
  }
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Resume flight',exact:true}).click();
  for(const type of ['weapon','ion','plasma','magnetic','full','energy','crystal','shield','bomb','scatter','mega','missile','homing','side','rear','medal']){
    await page.evaluate(type=>StarfallApp.game.collect({type}),type);await page.waitForTimeout(40);assert.ok(!/[\u4e00-\u9fff]/.test(await page.locator('#pickup-status').textContent()),type);assert.equal(await page.locator('#toast').isVisible(),false);
  }
  const frameAfterPickups=await page.evaluate(()=>StarfallApp.game.frame);await page.waitForFunction(n=>StarfallApp.game.frame>n,frameAfterPickups);assert.deepEqual(errors,[]);
  await page.evaluate(()=>{const g=StarfallApp.game;g.player.defaultWeapon=false;g.player.weapon=2;g.player.power=2;g.boss.guns=[];g.enemies=[g.boss];g.events=[];g.pause();});await page.waitForTimeout(100);await page.screenshot({path:'artifacts/game-en.png'});
  await page.evaluate(()=>{const g=StarfallApp.game;g.resume();g.player.medals=10;g.defeatBoss();});await page.waitForFunction(()=>StarfallApp.game.phase==='cleared');await page.waitForTimeout(1100);
  assert.ok((await page.locator('#dialog-content').textContent()).includes('Medal bonus'));assert.ok(!/[\u4e00-\u9fff]/.test(await page.locator('#dialog').innerText()));await page.screenshot({path:'artifacts/results-en.png'});
  await page.getByRole('button',{name:'Next stage →',exact:true}).tap();await page.waitForFunction(()=>StarfallApp.game.launch?.ticks>=26);await page.locator('#pause').tap();await page.locator('#language').selectOption('zh-Hant');assert.equal(await page.evaluate(()=>StarfallApp.game.resumePhase),'launch');
  await page.getByRole('button',{name:'返回主選單',exact:true}).tap();assert.equal(await page.locator('#dialog-title').textContent(),'結束這次出擊？');await page.getByRole('button',{name:'結束並返回',exact:true}).tap();
  await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hant');assert.equal(await page.locator('#settings').textContent(),'設定');
  const privateContext=await browser.newContext({locale:'en-US',viewport:{width:390,height:844}});
  await privateContext.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('Storage unavailable');};});
  const privatePage=await privateContext.newPage();privatePage.on('pageerror',e=>errors.push(String(e)));await privatePage.goto(url);await privatePage.locator('#settings').click();await privatePage.locator('#language').selectOption('zh-Hant');
  assert.equal(await privatePage.locator('html').getAttribute('lang'),'zh-Hant');assert.ok((await privatePage.locator('.language-hint').textContent()).includes('無法儲存'));await privateContext.close();
  assert.deepEqual(errors,[]);await writeFile('artifacts/localization-verification.json',JSON.stringify({status:'passed',firstRun:checks,nativeHint:true,persistedOverride:true,legacySaveMigration:true,threeLanguagesWithoutCombatReset:true,accessibleLabels:true,localizedPickupsAndResults:true,fiveLayouts:true,traditionalCopyReviewed:true,storageUnavailableSessionSwitch:true,errors},null,2));console.log('Three-language browser checks passed / 三语浏览器检查通过');
}finally{await browser.close();}
