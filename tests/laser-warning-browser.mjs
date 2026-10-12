// 验证真正 Canvas 中的脉冲透明度、炮口与正式攻击交接。 / Verify real Canvas pulse opacity, muzzles and attack handoff.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:480,height:900},locale:'zh-CN'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>globalThis.StarfallApp&&StarfallApp.renderer.presentationReady());
 await page.evaluate(()=>{StarfallApp.start(5);StarfallApp.game.pause();StarfallApp.renderer.prepareStage(5);});await page.waitForFunction(()=>StarfallApp.renderer.campaignReady(5));
 const result=await page.evaluate(()=>{
  const {Game,STEP}=StarfallCore,r=StarfallApp.renderer,g=StarfallApp.game;g.start(0,5,false,{playerCount:1});g.recordEvents=[];g.spawnRecord([200,0,44,0,1,-1,0,0]);const e=g.enemies[0];Object.assign(e,{x:200,y:100,px:200,py:100,pathFinished:true,exitX:0,exitY:0,entered:true});e.guns=e.guns.filter(gun=>[9,10].includes(gun.raw[2]));for(const gun of e.guns){gun.delay=10;gun.wait=0;}for(const p of g.players)p.invincible=999;g.update(STEP);g.pause();
  const canvas=document.createElement('canvas');canvas.width=400;canvas.height=480;const c=canvas.getContext('2d'),original=r.c,draw=r.enemyShot.bind(r),samples=[],calls=[];
  r.c=c;r.enemyShot=(b,at)=>{calls.push({type:b.shotType,age:b.age,alpha:c.globalAlpha,x:at.x,y:at.y});draw(b,at);};
  try{for(const type of [9,10]){const w=g.laserWarnings.find(w=>w.shotType===type);for(let tick=29;tick>=1;tick--){c.clearRect(0,0,400,480);calls.length=0;r.laserWarning({...w,ticks:tick},{x:200,y:100},0);const data=c.getImageData(198,100,4,300).data;let max=0,count=0;for(let i=3;i<data.length;i+=4){max=Math.max(max,data[i]);if(data[i])count++;}samples.push({type,tick,max,count,call:calls[0]||null});}}
  }finally{r.c=original;r.enemyShot=draw;}
  const positions=[];r.enemyShot=(b,at)=>{if(r.c.globalAlpha<1)positions.push({type:b.shotType,x:at.x,y:at.y,alpha:r.c.globalAlpha});draw(b,at);};
  // 选取可见脉冲，然后移动炮口；暂停后重复绘制应保持相同提示。
  // Select a visible pulse and move its muzzle; repeated paused renders retain the same warning.
  for(const w of g.laserWarnings)w.ticks=7;e.x=e.px=250;r.draw(g,0);const first=positions.splice(0);r.draw(g,.5);const frozen=positions.splice(0);r.enemyShot=draw;
  const client=new Game(333);DemonStarNetworkState.apply(client,DemonStarNetworkState.encode(g),false);const network=JSON.stringify(client.laserWarnings)===JSON.stringify(g.laserWarnings);
  g.resume();let safety=30;while(!g.bullets.some(b=>b.beam)&&safety--)g.update(STEP);g.pause();const live=g.bullets.filter(b=>b.beam).map(b=>({type:b.shotType,damage:b.damage}));const remainingWarnings=g.laserWarnings.length;
  // 留一张真实预警画面供验收；不改 App 文案。
  // Leave a real warning scene for visual verification without adding product copy.
  g.bullets=[];for(const gun of e.guns){gun.volleyFired=false;gun.remaining=gun.raw[7];gun.delay=6;gun.wait=0;gun.active=false;gun.cooldown=0;}g.updateLaserWarnings();r.draw(g,0);
  return {samples,first,frozen,network,live,remainingWarnings,missing:[...r.missingSprites,...r.missingShotTypes]};
 });
 for(const type of [9,10]){const rows=result.samples.filter(s=>s.type===type);assert.equal(rows[0].max,0);assert.ok(rows.some(s=>s.tick<28&&s.max===0),'pulse dark interval');const visible=rows.filter(s=>s.count>0);assert.ok(visible.length>5);assert.ok(visible.every(s=>s.call.alpha>0&&s.call.alpha<1&&Math.abs(s.call.alpha-(.02+.98*Math.max(0,((1-s.tick*.035)-.8)/.2)**3))<1e-6));assert.ok(visible.at(-1).max>visible[0].max);assert.ok(visible.filter(s=>s.tick>=6).every(s=>Math.abs(s.call.alpha-.02)<1e-6),'only the final 0.2 seconds may darken');}
 assert.deepEqual(result.first,result.frozen);assert.ok(result.first.length>0);assert.ok(result.first.every(p=>p.x>180));assert.equal(result.network,true);assert.equal(result.remainingWarnings,0);assert.ok(result.live.some(b=>b.type===9)&&result.live.some(b=>b.type===10));assert.deepEqual(result.missing,[]);assert.deepEqual(errors,[]);
 await page.screenshot({path:'artifacts/m222-laser-warning.png'});await writeFile('artifacts/m222-laser-warning-browser.json',JSON.stringify({status:'passed',...result,errors},null,2));console.log(JSON.stringify({status:'passed',pulseSamples:result.samples.length,nativeArtTypes:2,network:result.network,errors}));
}finally{await browser.close();}
