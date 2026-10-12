import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:480,height:900},locale:'zh-CN'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173');await page.waitForFunction(()=>globalThis.StarfallApp&&StarfallApp.renderer.presentationReady());
 await page.evaluate(()=>{const a=StarfallApp;a.start(4);a.game.pause();a.renderer.prepareStage(4);});await page.waitForFunction(()=>StarfallApp.renderer.campaignReady(4));
 const result=await page.evaluate(()=>{
  const {Game,STEP}=StarfallCore,N=DemonStarNetworkState,r=StarfallApp.renderer,host=new Game(221),peer=new Game(222);host.start(1,4,false,{playerCount:2});host.recordEvents=[];
  const spawn=(g,id,x,y)=>{g.spawnRecord([x,0,id,0,1,-1,0,0]);const e=g.enemies.at(-1);Object.assign(e,{x,y,px:x,py:y,entered:true});return e;};
  for(const p of host.players)p.invincible=999;
  for(const [i,id] of [87,152,88,117,118].entries())spawn(host,id,40+i*75,100);
  host.update(STEP);N.apply(peer,N.encode(host),false);for(let i=0;i<6;i++)host.update(STEP);spawn(host,117,160,180);N.apply(peer,N.encode(host));
  const observations=[];let current,terrain;const drawObject=r.object.bind(r),drawTerrain=r.terrainDraw.bind(r);
  r.terrainDraw=(stage,scroll)=>{terrain=scroll;drawTerrain(stage,scroll);};
  r.object=e=>{const t=r.c.getTransform(),l=r.layout,y=((t.d*e.y+t.f)/r.dpr-l.y)/l.scale;current.offsets.push({id:e.def.id,expected:e.y-peer.scroll,actual:y-terrain});drawObject(e);};
  try{for(const alpha of [0,.5,1]){peer.pendingTime=STEP*alpha;current={alpha,offsets:[]};r.draw(peer,0);observations.push(current);}}finally{r.object=drawObject;r.terrainDraw=drawTerrain;}
  const g=StarfallApp.game;g.start(1,4);g.recordEvents=[];for(const p of g.players)p.invincible=999;
  for(const [id,x] of [[117,90],[118,310]]){const e=spawn(g,id,x,120);for(const gun of e.guns){gun.delay=0;gun.wait=0;gun.tick(e,g);}}
  const origins=g.bullets.map(b=>({type:b.shotType,x:b.x,y:b.y,vx:b.vx,vy:b.vy}));for(let i=0;i<10;i++)g.update(STEP);g.pause();r.draw(g,0);
  const canvas=document.createElement('canvas');canvas.width=400;canvas.height=480;const saved=r.c,c=canvas.getContext('2d');r.c=c;const pixels=[];
  try{for(const b of g.bullets){c.clearRect(0,0,400,480);r.enemyShot(b,b);const data=c.getImageData(0,0,400,480).data;let opaque=0;for(let i=3;i<data.length;i+=4)if(data[i]>128)opaque++;pixels.push({type:b.shotType,opaque});}}finally{r.c=saved;}
  return {observations,origins,shots:g.bullets.map(b=>({type:b.shotType,x:b.x,y:b.y})),smoke:g.particles.filter(p=>p.smoke).length,pixels,missing:[...r.missingSprites,...r.missingShotTypes]};
 });
 assert.ok(result.observations.every(row=>row.offsets.length===6&&row.offsets.every(o=>Math.abs(o.actual-o.expected)<.001)));
 assert.equal(result.origins.length,4);for(const [i,b] of result.shots.entries()){assert.ok(b.y>result.origins[i].y);assert.ok((b.x-result.origins[i].x)*(b.type===44?1:-1)>0);}
 assert.ok(result.smoke>0);assert.ok(result.pixels.every(p=>p.opaque>12));assert.deepEqual(result.missing,[]);assert.deepEqual(errors,[]);
 await page.screenshot({path:'artifacts/m221-ground-missiles.png'});await writeFile('artifacts/m221-ground-missiles-browser.json',JSON.stringify({status:'passed',...result,errors},null,2));console.log(JSON.stringify({status:'passed',terrainCases:result.observations.length,missiles:result.shots.length,smoke:result.smoke,errors}));
}finally{await browser.close();}
