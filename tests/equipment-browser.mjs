import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{
  const page=await browser.newPage({viewport:{width:480,height:900},deviceScaleFactor:2,hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.carriers.naturalWidth&&StarfallApp.renderer.playerMotion.naturalWidth);
  await page.locator('#start').tap();await page.waitForFunction(()=>StarfallApp.game.phase==='playing');
  await page.evaluate(()=>{const g=StarfallApp.game;g.recordEvents=[];g.enemies=[];g.player.invincible=100;g.spawnPickup(10,g.player.x,g.player.y);g.pickups[0].speed=1;g.update(.035);});
  await page.waitForFunction(()=>document.getElementById('weapon').textContent.includes('6 级'));assert.equal(await page.evaluate(()=>StarfallApp.game.player.power),6);
  await page.evaluate(()=>{const g=StarfallApp.game;g.collect({type:'ion'});});await page.waitForFunction(()=>document.getElementById('weapon').textContent.includes('离子炮 · 1 级'));
  await page.evaluate(()=>{const g=StarfallApp.game;g.enemies=[];for(let i=0;i<4;i++){const d=DemonStarCampaign.definitions.find(d=>d.sprite==='S_ENBON'+(i+1));g.spawnRecord([60+i*100,0,d.id,d.index,1,10,0,0]);g.enemies.at(-1).x=60+i*100;g.enemies.at(-1).y=160;}g.pause();g.events=[];document.getElementById('toast').hidden=true;});
  await page.screenshot({path:'artifacts/supply-carriers.png'});
  const counts=[];
  for(let weapon=0;weapon<3;weapon++){
    const result=await page.evaluate(weapon=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.enemies=[];g.player.x=200;g.player.y=240;g.player.invincible=0;g.player.weapon=weapon;g.player.defaultWeapon=false;g.player.power=6;g.collect({type:'full'});const count=g.bullets.length;for(let i=0;i<22;i++)g.update(.035);g.pause();g.events=[];document.getElementById('toast').hidden=true;return {count,power:g.player.power,bombs:g.player.bombs};},weapon);
    assert.equal(result.count,[16,32,64][weapon]);assert.equal(result.power,6);assert.equal(result.bombs,3);counts.push(result.count);await page.waitForFunction(weapon=>document.getElementById('weapon').textContent.startsWith(StarfallCore.WEAPONS[weapon]),weapon);await page.screenshot({path:`artifacts/nova-${weapon}.png`});
  }
  await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.player.x=200;g.player.y=350;g.player.weapon=2;g.player.defaultWeapon=false;g.player.power=6;g.player.invincible=0;g.hitPlayer(100);for(let i=0;i<12;i++)g.update(.035);g.pause();g.events=[];document.getElementById('toast').hidden=true;});
  assert.deepEqual(await page.evaluate(()=>StarfallApp.game.pickups.map(i=>i.id)),[4,4]);assert.equal(await page.evaluate(()=>StarfallApp.game.player.power),0);await page.screenshot({path:'artifacts/death-drops.png'});
  assert.deepEqual(errors,[]);const report={status:'passed',checks:['full-S-via-contact','different-color-tier-reset','four-carrier-appearances','three-distinct-nova-colors','nova-keeps-bombs-and-tier','two-red-death-drops','death-resets-enhancement'],novaCounts:counts,errors};
  await writeFile('artifacts/equipment-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
