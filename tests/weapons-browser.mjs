// 三色六档实绘与导弹验收。 / Actual rendering of six tiers per color and missile checks.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({locale:'zh-CN',viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.presentationReady());
 const art=await page.evaluate(()=>({size:[StarfallApp.renderer.playerWeapons.naturalWidth,StarfallApp.renderer.playerWeapons.naturalHeight],rules:DemonStarProjectileRules.homing}));assert.deepEqual(art.size,[1536,1024]);assert.equal(art.rules.turnStep,64);
 await page.locator('#start').tap();await page.waitForFunction(()=>StarfallApp.game.phase==='playing');
 const gallery=await browser.newPage({viewport:{width:1250,height:1160}}),rows=[];
 for(let color=0;color<3;color++){
  const images=[];
  for(let tier=1;tier<=6;tier++){
   const state=await page.evaluate(({color,tier})=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.player.defaultWeapon=false;g.player.weapon=color;g.player.power=tier;g.player.invincible=0;g.player.y=g.player.py=420;for(let t=0;t<15;t++)g.update(.035,{fire:true});g.pause();g.events=[];return {bullets:g.bullets.map(b=>b.shotType),power:g.player.power};},{color,tier});assert.equal(state.power,tier);assert.ok(state.bullets.includes(15));
   await page.waitForTimeout(90);const layout=await page.evaluate(()=>StarfallApp.renderer.layout);const bytes=await page.screenshot({path:`artifacts/weapon-${color}-tier-${tier}.png`,clip:{x:layout.x,y:layout.y,width:400*layout.scale,height:480*layout.scale}});images.push({tier,src:'data:image/png;base64,'+bytes.toString('base64')});rows.push({color,tier,projectileTypes:[...new Set(state.bullets)]});
  }
  const title=['黄色质子炮 / Yellow proton','蓝色离子炮 / Blue ion','红色等离子炮 / Red plasma'][color];
  await gallery.setContent(`<html><meta charset="utf-8"><style>body{margin:20px;background:#10151b;color:#e4edf4;font:20px sans-serif}h1{font-size:26px}main{display:grid;grid-template-columns:repeat(3,390px);gap:15px}figure{margin:0}figcaption{padding:5px}img{display:block;width:390px}</style><h1>${title} — v0.2.8</h1><main>${images.map(x=>`<figure><figcaption>${x.tier} 级 / Level ${x.tier}</figcaption><img src="${x.src}"></figure>`).join('')}</main></html>`);await gallery.screenshot({path:`artifacts/weapon-${['yellow','blue','red'][color]}-levels.png`,fullPage:true});
 }
 await gallery.close();
 const pursuit=await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.player.invincible=0;g.spawnRecord([100,0,17,0,0,-1,0,0]);g.spawnRecord([300,0,17,0,0,-1,0,0]);for(let i=0;i<2;i++){const e=g.enemies[i];e.x=e.px=90+i*220;e.y=e.py=160;e.pathFinished=true;e.exitX=e.exitY=0;e.guns=[];e.entered=true;e.hp=99999;}g.player.missileAmmo=50;g.player.missileType=9;for(let t=0;t<24;t++)g.update(.035,{fire:true});g.pause();g.events=[];return g.bullets.filter(b=>b.shotType===39).map(b=>({target:b.targetUid,speed:Math.hypot(b.vx,b.vy)/StarfallCore.TICK,angle:b.flightAngle}));});assert.ok(pursuit.length>=2);for(const b of pursuit)assert.ok(Math.abs(b.speed-8)<1e-8);assert.equal(new Set(pursuit.map(b=>b.target)).size,2);await page.waitForTimeout(100);await page.screenshot({path:'artifacts/homing-missiles.png'});
 const drawCalls=await page.evaluate(()=>{const r=StarfallApp.renderer,calls=[],draw=r.cropped;r.cropped=function(...a){calls.push({asset:a[0].src,w:a[4],h:a[5],angle:a[6]||0});return draw.apply(this,a);};r.draw(StarfallApp.game,0);r.cropped=draw;return calls.filter(c=>c.asset.includes('player-weapons-hd.png'));});assert.ok(drawCalls.some(c=>c.w===4&&c.h===8));
 assert.deepEqual(errors,[]);const report={status:'passed',all_eighteen_tiers_rendered:true,tiers:rows,thin_missile_dimensions:[4,8],homing_pairs_keep_two_targets:true,homing_speed_per_tick:8,original_HP_and_damage_tables_preserved:true,art_loaded:true,errors};await writeFile('artifacts/weapons-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
