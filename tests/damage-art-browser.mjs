import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({locale:'zh-CN',viewport:{width:480,height:900},deviceScaleFactor:2,hasTouch:true,isMobile:true});
page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.enemyArtReady());await page.locator('#start').tap();
  for(const [scene,ticks] of [['fighter-corrected',2110],['net-turrets',4030]]){
    const result=await page.evaluate(ticks=>{const g=StarfallApp.game;g.start();g.player.invincible=9999;for(let i=0;i<ticks;i++)g.update(StarfallCore.STEP);g.pause();g.events=[];document.getElementById('toast').hidden=true;return g.enemies.filter(e=>e.y>=0&&e.y<480).map(e=>e.def.sprite);},ticks);
    assert.ok(result.includes(scene==='fighter-corrected'?'S_ENEMY1A':'S_ASTSHT1B'));await page.waitForTimeout(100);await page.screenshot({path:`artifacts/${scene}.png`});
  }
  const geometry=await page.evaluate(()=>{
    const g=StarfallApp.game,r=StarfallApp.renderer;g.start();g.recordEvents=[];g.enemies=[];g.events=[];
    for(let i=0;i<24;i++){g.spawnRecord([60+i%4*90,0,61,0,1,-1,0,0]);const e=g.enemies.at(-1);e.x=e.px=60+i%4*90;e.y=e.py=65+Math.floor(i/4)*66;e.animation.frame=i;e.entered=true;}
    g.pause();document.getElementById('toast').hidden=true;
    const calls=[],draw=r.c.drawImage;r.c.drawImage=function(...args){calls.push(args.slice(1));return draw.apply(this,args);};
    for(const e of g.enemies)r.framedObject(e,false);r.c.drawImage=draw;return calls.map(a=>({w:a[6],h:a[7]}));
  });assert.ok(Math.abs(geometry[0].w/geometry[0].h-31/49)<1e-9);assert.ok(Math.abs(geometry[6].w/geometry[6].h-31/32)<1e-9);
  await page.waitForTimeout(80);await page.screenshot({path:'artifacts/asteroid-24-poses.png'});
  await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.events=[];Object.assign(g.player,{weapon:2,power:6,defaultWeapon:false,energy:5,invincible:0});g.addBullet(g.player.x,g.player.y,0,0,false,2);g.update(StarfallCore.STEP);g.pause();document.getElementById('toast').hidden=true;});
  await page.waitForFunction(()=>document.querySelectorAll('#power-meter .filled').length===5);assert.match(await page.locator('#weapon').textContent(),/5 级/);assert.equal(await page.evaluate(()=>StarfallApp.game.player.energy),3);assert.equal(await page.evaluate(()=>StarfallApp.game.player.invincible),0);await page.screenshot({path:'artifacts/damage-tier-five.png'});
  const damage=await page.evaluate(()=>[0,1,2,3].map(d=>{const g=new StarfallCore.Game(1);g.start(d);g.recordEvents=[];g.player.invincible=0;g.hitPlayer(12);return 16-g.player.energy;}));assert.deepEqual(damage,[6,12,13,14]);
  assert.deepEqual(errors,[]);
  const report={status:'passed',new_atlases_ready:true,actual_campaign_fighter_and_turret_scenes:true,asteroid_24_poses_and_original_aspect_ratios:true,critical_hit_HUD_six_to_five:true,no_regular_hit_invincibility:true,star_damage_by_difficulty:damage,errors};
  await writeFile('artifacts/damage-art-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
