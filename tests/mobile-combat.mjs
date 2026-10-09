import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const url=process.env.GAME_URL||'http://127.0.0.1:4173';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],failed=[],report=[];
async function open(context){
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status());});
  await page.goto(url);await page.waitForFunction(()=>StarfallApp.renderer.hangar.naturalWidth&&StarfallApp.renderer.ships.naturalWidth&&StarfallApp.renderer.pickups.naturalWidth&&StarfallApp.renderer.weapons.naturalWidth&&StarfallApp.renderer.playerMotion.naturalWidth&&StarfallApp.renderer.carriers.naturalWidth&&DemonStarSounds.missionStart);
  await page.evaluate(()=>{window.audioEvents=[];const sample=StarfallAudio.prototype.sample;StarfallAudio.prototype.sample=function(...args){const source=sample.apply(this,args);if(source)audioEvents.push(args[0]);return source;};});
  return page;
}
async function bounds(page){
  const result=await page.evaluate(()=>{
    const l=StarfallApp.renderer.layout;
    const controls=['joystick','fire','bomb','pause'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height};});
    return {l,controls,w:innerWidth,h:innerHeight};
  });
  for(const r of result.controls){assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.w<=result.w+1&&r.y+r.h<=result.h+1,JSON.stringify(result));}
  const {l}=result;assert.ok(l.x>=-1&&l.y>=-1&&l.x+400*l.scale<=result.w+1&&l.y+480*l.scale<=result.h+1);return result;
}
async function resetArena(page){await page.waitForFunction(()=>StarfallApp.game.phase==='playing');await page.evaluate(()=>{const g=StarfallApp.game;g.recordEvents=[];g.enemies=[];g.bullets=[];g.player.invincible=100;});}
try{
  const desktop=await browser.newContext({viewport:{width:1280,height:900}}),page=await open(desktop);
  await page.locator('#start').click();await resetArena(page);await page.waitForTimeout(200);
  await page.waitForFunction(()=>audioEvents.includes('missionStart'));assert.equal(await page.evaluate(()=>audioEvents.filter(x=>x==='missionStart').length),1);
  assert.equal(await page.evaluate(()=>StarfallApp.game.shotsFired),0);
  await page.keyboard.down('z');await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('z');await page.keyboard.up('ArrowRight');
  assert.ok(await page.evaluate(()=>StarfallApp.game.shotsFired)>=2);assert.ok(await page.evaluate(()=>StarfallApp.game.player.x)>200);
  await page.locator('#pause').click();const frozen=await page.evaluate(()=>StarfallApp.game.totalTime);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>StarfallApp.game.totalTime),frozen);
  await page.getByRole('button',{name:'继续飞行',exact:true}).click();await page.locator('#bomb').click();assert.equal(await page.evaluate(()=>StarfallApp.game.player.bombs),2);await bounds(page);
  // Isolate impact routing from the higher-priority radio/menu/bomb voices tested separately.
  await page.evaluate(()=>{StarfallApp.audio.stopAll();StarfallApp.game.specials=[];const g=StarfallApp.game,r=g.stage.map.events.find(r=>DemonStarCampaign.definitions[DemonStarCampaign.byId[r[2]]].sprite==='S_ENEMY14');g.enemies=[];g.bullets=[];g.spawnRecord(r);const e=g.enemies[0];e.x=200;e.y=200;e.pathFinished=true;e.speed=0;e.guns=[];g.addBullet(200,210,0,-400,true,1);});
  await page.waitForFunction(()=>audioEvents.includes('hit'));
  await page.evaluate(()=>{StarfallApp.game.addBullet(200,210,0,-400,true,5000);});await page.waitForFunction(()=>audioEvents.includes('explosion'));
  report.push({surface:'desktop',keyboardFire:true,movement:true,pause:true,bomb:true,missionVoiceOnce:true,enemyHitSound:true,explosionSound:true});
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),phone=await open(mobile);
  await phone.screenshot({path:'artifacts/mobile-menu.png'});await phone.locator('.title h2').tap();await resetArena(phone);
  assert.equal(await phone.locator('#lives .ship-icon').count(),3);assert.equal(await phone.locator('#energy .filled').count(),16);assert.equal(await phone.locator('#bomb-stock i').count(),3);
  // Real simultaneous touch contacts: joystick movement and A held together.
  const session=await mobile.newCDPSession(phone),stick=await phone.locator('#joystick').boundingBox(),fire=await phone.locator('#fire').boundingBox();
  const points=[{x:stick.x+stick.width*.8,y:stick.y+stick.height*.5,id:1},{x:fire.x+fire.width/2,y:fire.y+fire.height/2,id:2}];
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await phone.waitForTimeout(300);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(60);
  const moved=await phone.evaluate(()=>({x:StarfallApp.game.player.x,shots:StarfallApp.game.shotsFired}));assert.ok(moved.x>200&&moved.x<265);assert.ok(moved.shots>=4);
  await phone.waitForTimeout(180);assert.equal(await phone.evaluate(()=>StarfallApp.game.player.x),moved.x);assert.equal(await phone.evaluate(()=>StarfallApp.game.shotsFired),moved.shots);
  // Dragging the battlefield must not reposition the aircraft.
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:100,y:300,id:3}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:330,y:450,id:3}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await phone.evaluate(()=>StarfallApp.game.player.x),moved.x);
  await phone.locator('#bomb').tap();assert.equal(await phone.evaluate(()=>StarfallApp.game.player.bombs),2);
  await phone.evaluate(()=>{const g=StarfallApp.game;for(let i=0;i<16;i++)g.spawnPickup(i,58+i%4*90,120+Math.floor(i/4)*55);});
  await phone.screenshot({path:'artifacts/mobile-game.png'});const portrait=await bounds(phone);assert.ok(portrait.l.x<1,'Tall phones should use the full playfield width');
  for(const [name,x,y] of [['left',-1,0],['right',1,0],['forward',0,-1],['reverse',0,1]]){
    await phone.evaluate(({x,y})=>{const g=StarfallApp.game;g.player.invincible=0;g.enemies=[];g.pickups=[];for(let i=0;i<16;i++)g.update(.035,{x,y});g.pause();},{x,y});
    await phone.screenshot({path:`artifacts/motion-${name}.png`});await phone.evaluate(()=>StarfallApp.game.resume());
  }
  await phone.evaluate(()=>StarfallApp.background());assert.equal(await phone.evaluate(()=>StarfallApp.game.phase),'paused');
  const snapshot=await phone.evaluate(()=>JSON.stringify({p:StarfallApp.game.player,score:StarfallApp.game.score,scroll:StarfallApp.game.scroll}));
  await phone.setViewportSize({width:844,height:390});await phone.waitForTimeout(80);await bounds(phone);
  assert.equal(await phone.evaluate(()=>JSON.stringify({p:StarfallApp.game.player,score:StarfallApp.game.score,scroll:StarfallApp.game.scroll})),snapshot);
  await phone.getByRole('button',{name:'继续飞行',exact:true}).tap();await phone.screenshot({path:'artifacts/phone-landscape.png'});await phone.evaluate(()=>StarfallApp.background());
  report.push({surface:'mobile390x844',realMultitouch:true,holdFire:true,releaseStops:true,noBattlefieldDrag:true,classicHUD:true,backgroundPause:true,rotationPreservesState:true});
  // Fresh paused state for each fold/tablet size; resize never restarts a stage.
  for(const [width,height,name] of [[768,900,'fold-open'],[1024,768,'tablet-landscape'],[320,568,'small-phone']]){
    const before=await phone.evaluate(()=>({score:StarfallApp.game.score,frame:StarfallApp.game.frame,stage:StarfallApp.game.stage.id}));
    await phone.setViewportSize({width,height});await phone.waitForTimeout(60);await bounds(phone);assert.deepEqual(await phone.evaluate(()=>({score:StarfallApp.game.score,frame:StarfallApp.game.frame,stage:StarfallApp.game.stage.id})),before);
    await phone.getByRole('button',{name:'继续飞行',exact:true}).tap();await phone.screenshot({path:`artifacts/${name}.png`});await phone.evaluate(()=>StarfallApp.background());report.push({surface:name,withinViewport:true,resizePreservesState:true});
  }
  const legacy=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});await legacy.addInitScript(()=>{
    delete window.PointerEvent;delete Element.prototype.replaceChildren;
    // Deleting Chromium's constructor alone does not stop its native pointer stream.
    // Old WebKit emits only touch events, so suppress trusted native pointer events here.
    for(const name of ['pointerdown','pointermove','pointerup','pointercancel'])document.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);
  });const old=await open(legacy);await old.locator('#start').tap();await resetArena(old);
  const touch=(name,end=false)=>old.evaluate(({name,end})=>{
    const ids=['joystick','fire'];for(let i=0;i<ids.length;i++){const el=document.getElementById(ids[i]),r=el.getBoundingClientRect(),ev=new Event(name,{bubbles:true,cancelable:true});Object.defineProperty(ev,'changedTouches',{value:[{identifier:i+8,target:el,clientX:r.x+r.width*(i?.5:.8),clientY:r.y+r.height*.5}]});el.dispatchEvent(ev);}
  },{name,end});
  await touch('touchstart');await old.waitForTimeout(220);await touch('touchcancel',true);await old.waitForTimeout(60);
  const state=await old.evaluate(()=>({x:StarfallApp.game.player.x,shots:StarfallApp.game.shotsFired}));assert.ok(state.x>200&&state.shots>0);await old.waitForTimeout(140);assert.deepEqual(await old.evaluate(()=>({x:StarfallApp.game.player.x,shots:StarfallApp.game.shotsFired})),state);
  await old.locator('#bomb').tap();assert.equal(await old.evaluate(()=>StarfallApp.game.player.bombs),2);
  await old.locator('#pause').tap();assert.equal(await old.evaluate(()=>StarfallApp.game.phase),'paused');report.push({surface:'legacy-API-fallback-in-Chromium',multiTouchFallback:true,cancelStops:true,actualIOS12:false});
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await writeFile('artifacts/browser-verification.json',JSON.stringify({status:'passed',report,errors,failed},null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
