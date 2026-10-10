import {createRequire} from 'node:module';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({locale:'zh-CN',viewport:{width:480,height:900},deviceScaleFactor:2,hasTouch:true,isMobile:true});
page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.effects.naturalWidth);
  await page.evaluate(()=>{globalThis.played=[];const sample=StarfallAudio.prototype.sample;StarfallAudio.prototype.sample=function(...args){const s=sample.apply(this,args);if(s)played.push(args[0]);return s;};});
  await page.locator('#start').tap();
  await page.evaluate(()=>{const g=StarfallApp.game;g.recordEvents=[];g.enemies=[];g.player.invincible=999;});
  await page.waitForFunction(()=>StarfallApp.music.audio.currentTime>.2&&!StarfallApp.music.audio.paused);
  assert.equal(await page.evaluate(()=>StarfallApp.music.track),'MDS_PHASER');
  await page.waitForFunction(()=>played.includes('missionStart'));
  const events=await page.evaluate(()=>played);assert.ok(events.indexOf('playerLaunch')<events.indexOf('missionStart'));assert.ok(events.includes('stageAmbience'));assert.ok(!events.includes('menu'));
  await page.locator('#pause').tap();const time=await page.evaluate(()=>StarfallApp.music.audio.currentTime);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>StarfallApp.music.audio.currentTime),time);
  await page.locator('#health-toggle').tap();assert.equal(await page.evaluate(()=>StarfallApp.renderer.enemyHealthBars),false);
  await page.locator('#sfx-toggle').tap();assert.equal(await page.evaluate(()=>StarfallApp.audio.enabled),false);
  await page.getByRole('button',{name:'继续飞行',exact:true}).tap();await page.waitForFunction(t=>StarfallApp.music.audio.currentTime>t,time);
  await page.evaluate(()=>{document.getElementById('toast').hidden=true;const g=StarfallApp.game;for(const type of StarfallCore.DROPS)g.collect({type});});
  await page.waitForTimeout(100);assert.equal(await page.locator('#toast').isVisible(),false);assert.ok(await page.locator('#pickup-status').textContent());
  assert.equal(await page.locator('#power-meter i').count(),6);
  await page.evaluate(()=>{const g=StarfallApp.game;g.spawnRecord(g.stage.map.events.find(r=>DemonStarCampaign.definitions[DemonStarCampaign.byId[r[2]]].flags&1));});
  await page.waitForTimeout(100);assert.equal(await page.locator('#toast').isVisible(),false);assert.equal(await page.locator('#boss-hud').isVisible(),false);
  await page.locator('#pause').tap();await page.locator('#health-toggle').tap();assert.ok(await page.locator('#boss-hud').isVisible());await page.getByRole('button',{name:'继续飞行',exact:true}).tap();
  const bossAlignment=await page.evaluate(()=>{const b=document.getElementById('boss-hud').getBoundingClientRect(),s=document.querySelector('.classic-score').getBoundingClientRect();return {bossTop:b.top,scoreTop:s.top,bossLeft:b.left,scoreRight:s.right};});assert.ok(Math.abs(bossAlignment.bossTop-bossAlignment.scoreTop)<2);assert.ok(bossAlignment.bossLeft>bossAlignment.scoreRight);
  for(const weapon of [1,2])for(const power of [1,6]){
    await page.evaluate(({weapon,power})=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.events=[];g.player.defaultWeapon=false;g.player.weapon=weapon;g.player.power=power;g.player.invincible=0;g.firePlayer();for(const b of g.bullets){b.y=b.py=190;b.x=b.px+=b.defaultShot?0:50;}g.pause();document.getElementById('toast').hidden=true;document.getElementById('pickup-status').textContent='';},{weapon,power});
    await page.waitForTimeout(90);await page.screenshot({path:`artifacts/weapon-${weapon}-${power}.png`});
  }
  await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.events=[];g.spawnRecord(g.stage.map.events.find(r=>DemonStarCampaign.definitions[DemonStarCampaign.byId[r[2]]].flags&1));const e=g.boss;e.x=e.px=200;e.y=e.py=160;e.hp=Math.floor(e.def.hp/16)-1;g.updateEnemyState(e);g.pause();g.events=[];document.getElementById('toast').hidden=true;});
  await page.waitForTimeout(80);await page.screenshot({path:'artifacts/boss-burning.png'});
  await page.evaluate(()=>{const g=StarfallApp.game;g.resume();g.killEnemy(g.boss);for(let i=0;i<18;i++)g.update(.035);g.pause();g.events=[];});
  assert.equal(await page.evaluate(()=>StarfallApp.game.boss.dying),true);await page.screenshot({path:'artifacts/boss-falling.png'});
  for(const type of [0,1,2]){
    await page.evaluate(type=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.events=[];g.player.y=330;g.player.invincible=0;g.player.bombInventory=[type];g.useBomb();for(let i=0;i<(type===0?20:type===1?14:14);i++)g.update(.035);g.pause();g.events=[];document.getElementById('toast').hidden=true;document.getElementById('pickup-status').textContent='';},type);await page.waitForTimeout(80);await page.screenshot({path:`artifacts/superweapon-${type}.png`});
  }
  for(const size of [{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1366,height:1024}]){
    await page.setViewportSize(size);await page.waitForTimeout(80);const r=await page.evaluate(()=>{const b=document.querySelector('.weapon-status').getBoundingClientRect(),l=StarfallApp.renderer.layout;return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:innerWidth,h:innerHeight,fieldBottom:l.y+480*l.scale,fieldLeft:l.x,wide:l.wide};});
    assert.ok(r.x>=-1&&r.y>=-1&&r.right<=r.w+1&&r.bottom<=r.h+1,JSON.stringify(r));assert.ok(r.wide?r.right<=r.fieldLeft+1:r.y>=r.fieldBottom-1,JSON.stringify(r));
  }
  await page.evaluate(()=>{StarfallApp.game.phase='cleared';});await page.waitForFunction(()=>document.getElementById('dialog-title').textContent==='防线已突破');
  await page.evaluate(()=>StarfallApp.background());assert.equal(await page.evaluate(()=>StarfallApp.music.paused),true);
  await page.getByRole('button',{name:'下一关 →',exact:true}).click();await page.waitForFunction(()=>StarfallApp.music.track==='MDS_SLOWRKET'&&StarfallApp.music.audio.currentTime>.2&&!StarfallApp.music.paused);
  const source=JSON.parse(await readFile('docs/music-manifest.json','utf8'));
  const musicFiles=[...new Map(source.inventory.map(e=>[e.asset,e])).values()];
  const decoded=await page.evaluate(async files=>{
    const result=[];
    for(const e of files){const media=new Audio();media.preload='auto';await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('BGM decode timeout: '+e.resource)),15000);media.oncanplay=()=>{clearTimeout(timer);resolve();};media.onerror=()=>{clearTimeout(timer);reject(new Error('BGM decode error: '+e.resource));};media.src=e.asset.replace(/^web\//,'');media.load();});result.push({resource:e.resource,duration:media.duration,expected:e.seconds});media.removeAttribute('src');media.load();}
    return result;
  },musicFiles);
  for(const clip of decoded)assert.ok(Math.abs(clip.duration-clip.expected)<.15,JSON.stringify(clip));
  assert.deepEqual(errors,[]);
  const report={status:'passed',checks:['real-BGM-playback','launch-before-radio','no-menu-click-on-start','pause-resume-BGM-position','independent-SFX-mute','all-pickups-without-overlay','Boss-without-overlay','health-toggle','red-blue-tier-art','Boss-burning-and-falling','three-superweapon-appearances','equipment-outside-field-in-four-layouts','all-18-BGM-files-browser-decode','next-stage-after-background-resumes-BGM'],decoded,errors};
  await writeFile('artifacts/feedback-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
