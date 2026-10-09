import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.presentationReady());
  await page.evaluate(()=>{globalThis.cues=[];const sample=StarfallAudio.prototype.sample;StarfallAudio.prototype.sample=function(...args){const s=sample.apply(this,args);if(s)cues.push(args[0]);return s;};});
  await page.locator('#start').tap();await page.waitForFunction(()=>StarfallApp.game.launch?.ticks>=20);await page.screenshot({path:'artifacts/launch-doors.png'});
  await page.waitForFunction(()=>StarfallApp.game.launch?.ticks>=48);await page.locator('#pause').tap();
  const state=await page.evaluate(()=>JSON.stringify(StarfallApp.game.launch));await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>JSON.stringify(StarfallApp.game.launch)),state);
  assert.equal(await page.evaluate(()=>StarfallApp.game.frame),0);assert.equal(await page.evaluate(()=>cues.includes('missionStart')),false);
  await page.getByRole('button',{name:'继续飞行',exact:true}).tap();
  await page.screenshot({path:'artifacts/carrier-launch.png'});await page.waitForFunction(()=>StarfallApp.game.phase==='playing');await page.waitForFunction(()=>cues.includes('missionStart'));
  assert.equal(await page.evaluate(()=>cues.filter(x=>x==='missionStart').length),1);assert.ok(await page.evaluate(()=>cues.indexOf('playerLaunch')<cues.indexOf('missionStart')));
  assert.equal(await page.locator('#toast').isVisible(),false);
  await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.events=[];g.player.invincible=0;g.pause();
    for(const [i,type] of [15,16,27,30,31,50].entries()){g.emitPlayerShot(type,50+i*60,330);g.impact({shotType:type,x:50+i*60},{x:50+i*60,y:210,def:{width:40,height:40}});g.effects.at(-1).age=5;}
    for(let i=0;i<3;i++)g.addEffect(2,90+i*110,130,48+i*16,24);g.effects.slice(-3).forEach((e,i)=>e.age=5+i*4);
  });await page.waitForTimeout(120);await page.screenshot({path:'artifacts/hits-and-blasts.png'});
  const geometry=await page.evaluate(()=>{const r=StarfallApp.renderer,calls=[],draw=r.c.drawImage;r.c.drawImage=function(...a){if(a[0]===r.weapons)calls.push(a.slice(1));return draw.apply(this,a);};r.draw(StarfallApp.game,0);r.c.drawImage=draw;return calls;});
  assert.ok(geometry.some(a=>a[2]===51&&a[3]===224&&a[6]===3&&a[7]===13),'Default shots must map tight opaque art to 3 x 13, without atlas padding');
  await page.evaluate(()=>{const g=StarfallApp.game;g.start(1,2);g.recordEvents=[];g.events=[];g.player.invincible=0;g.wrecks=['G_STAT1A','G_GRDST2A','G_GASTNK1A','G_PKS1A','G_TNKSHT1A','G_LNDOIL1A','S_BLDNG1A','G_GASTNK2A'].map((sprite,i)=>({sprite,x:70+i%3*130,y:130+Math.floor(i/3)*105,width:i===7?75:60,height:i===7?92:60}));g.pause();});
  await page.waitForTimeout(100);await page.screenshot({path:'artifacts/ground-remnants.png'});
  const hud=[];
  for(const [width,height] of [[390,844],[844,390],[320,568],[768,1024],[1366,1024]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    const r=await page.evaluate(()=>{const rect=id=>{const b=document.querySelector(id).getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};return {bomb:rect('#bomb-stock i'),energy:rect('#energy'),bar:rect('.classic-status'),field:StarfallApp.renderer.layout};});
    assert.ok(r.bomb.w>=13&&r.bomb.h>=13);assert.ok(r.energy.h>=8.5&&r.energy.w>=75);assert.ok(r.bar.x>=0&&r.bar.right<=width&&r.bar.bottom<=height);hud.push({width,height,...r});
    if(width===844)await page.screenshot({path:'artifacts/hud-landscape.png'});
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{const g=StarfallApp.game;g.start();g.recordEvents=[];g.events=[];g.presentation=true;g.player.medals=10;g.addEffect(2,200,170,112,36);g.defeatBoss();});
  assert.equal(await page.locator('#dialog').isVisible(),false);await page.waitForFunction(()=>StarfallApp.game.phase==='cleared');await page.waitForTimeout(1200);
  assert.ok((await page.locator('#dialog-content').textContent()).includes('23000'));assert.equal(await page.evaluate(()=>StarfallApp.game.score),23000);await page.screenshot({path:'artifacts/stage-bonus.png'});
  await page.getByRole('button',{name:'下一关 →',exact:true}).tap();assert.equal(await page.evaluate(()=>StarfallApp.game.phase),'launch');assert.equal(await page.evaluate(()=>StarfallApp.game.player.medals),0);
  await page.evaluate(()=>StarfallApp.background());assert.equal(await page.evaluate(()=>StarfallApp.game.phase),'paused');assert.equal(await page.evaluate(()=>StarfallApp.game.resumePhase),'launch');
  assert.deepEqual(errors,[]);const report={status:'passed',checks:['doors-carrier-launch','launch-pause-resume','map-frozen-until-launch-completes','radio-after-carrier','no-entry-overlay','opaque-cropped-default-projectiles','impact-fireballs-and-death-blasts','ground-remnants','HUD-readable-in-five-layouts','aftermath-before-results','23000-original-bonus','next-stage-replays-launch','background-during-launch'],hud,errors};
  await writeFile('artifacts/presentation-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
