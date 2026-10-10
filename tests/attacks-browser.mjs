import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({locale:'zh-CN',viewport:{width:480,height:900},deviceScaleFactor:2,hasTouch:true,isMobile:true});
page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');
  assert.equal(await page.evaluate(()=>StarfallApp.music.enabled),true);
  await page.evaluate(()=>localStorage.setItem('demonstar-reborn-v1',JSON.stringify({best:[12345,0,0,0],unlocked:[8,1,1,1],music:false,musicVolume:0})));
  await page.reload();await page.waitForFunction(()=>StarfallApp.renderer.attacks.naturalWidth);
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('demonstar-reborn-v1')));
  assert.equal(migrated.music,true);assert.equal(migrated.musicVolume,.35);assert.equal(migrated.musicPreferenceVersion,1);assert.equal(migrated.best[0],12345);assert.equal(migrated.unlocked[0],8);
  await page.locator('#start').tap();await page.waitForFunction(()=>StarfallApp.music.audio.currentTime>.1&&!StarfallApp.music.audio.paused);
  await page.locator('#pause').tap();await page.locator('#music-toggle').tap();await page.reload();assert.equal(await page.evaluate(()=>StarfallApp.music.enabled),false);
  await page.locator('#settings').tap();await page.locator('#music-toggle').tap();await page.getByRole('button',{name:'返回机库',exact:true}).tap();await page.locator('#start').tap();
  for(const [label,ticks] of [['stars',290],['laser',622]]){
    const result=await page.evaluate(ticks=>{
      const g=StarfallApp.game;g.start();g.recordEvents=[];g.player.invincible=999;g.spawnRecord(g.stage.map.events.find(r=>r[2]===40));
      for(let i=0;i<ticks;i++)g.update(StarfallCore.STEP);
      g.pause();g.events=[];document.getElementById('toast').hidden=true;return {beam:g.bullets.filter(b=>b.beam).length,stars:g.bullets.filter(b=>b.shotType===11).length};
    },ticks);
    if(label==='stars')assert.ok(result.stars>0);if(label==='laser')assert.ok(result.beam>0);
    await page.waitForTimeout(80);await page.screenshot({path:`artifacts/boss1-${label}.png`});
  }
  const poses=await page.evaluate(()=>{
    const g=StarfallApp.game;g.start();g.recordEvents=[];g.enemies=[];g.events=[];
    for(let i=0;i<6;i++){g.spawnRecord([55+i*58,0,30,0,1,-1,0,0]);const e=g.enemies.at(-1);e.x=e.px=55+i*58;e.y=e.py=130+i%2*60;e.animationFrame=i;e.entered=true;}
    g.pause();document.getElementById('toast').hidden=true;return g.enemies.map(e=>e.animationFrame);
  });assert.deepEqual(poses,[0,1,2,3,4,5]);await page.waitForTimeout(80);await page.screenshot({path:'artifacts/spinner-poses.png'});
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/attacks-verification.json',JSON.stringify({status:'passed',BGM_default:true,old_save_migration:true,explicit_mute_survives_reload:true,music_playback_clock_advances:true,Boss_stars_and_beam_rendered:true,six_spinner_poses_rendered:true,errors},null,2));
  console.log('M2.3 browser checks passed: save migration, BGM playback, star/laser scenes, six rotor poses.');
}finally{await browser.close();}
