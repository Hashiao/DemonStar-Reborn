// 验证兼容构建及真实触屏斜向输入。 / Verify the compatible bundle and real diagonal touch input.
import {createRequire} from 'node:module';import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>window.StarfallApp?.renderer.presentationReady());
 const core=await page.evaluate(await readFile('tests/mobility-probe.js','utf8'));assert.equal(core.cases,288);
 await page.evaluate(()=>{StarfallApp.input.config.players[0].touch='floating';StarfallApp.start();});await page.waitForFunction(()=>StarfallApp.game.phase==='playing');
 const cdp=await context.newCDPSession(page),r=await page.locator('#joystick').boundingBox(),cx=r.x+r.width/2,cy=r.y+r.height/2,offset=r.width*.36/Math.sqrt(2);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:29,x:cx,y:cy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:29,x:cx+offset,y:cy-offset}]});
 const input=await page.evaluate(()=>StarfallApp.input.sample().players[0]);assert.ok(Math.abs(input.x-1)<.002&&Math.abs(input.y+1)<.002);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const released=await page.evaluate(()=>StarfallApp.input.sample().players[0]);assert.equal(released.x,0);assert.equal(released.y,0);assert.deepEqual(errors,[]);
 const report={status:'passed',core,actualTouch:{fullDiagonal:true,releaseStops:true},errors,scope:'Built bundle: three speed tiers, four difficulties, eight input routes and three directions; actual Chromium touch. Traversal times are fixed-step logic, not physical phone timing.'};await writeFile('artifacts/m219-mobility-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,cases:core.cases,actualTouch:report.actualTouch}));
}finally{await browser.close();}
