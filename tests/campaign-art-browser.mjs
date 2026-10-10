// 真实关卡与全原型渲染验收。 / Actual-stage and complete-prototype rendering checks.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],stages=[],drawn=new Set();
const page=await browser.newPage({locale:'zh-CN',viewport:{width:480,height:900},deviceScaleFactor:2});page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174');await page.waitForFunction(()=>StarfallApp.renderer.presentationReady()&&StarfallApp.renderer.enemyArtReady());await page.locator('#start').click();
 for(let id=1;id<=18;id++){
  await page.evaluate(id=>{StarfallApp.game.start(1,id);StarfallApp.game.pause();StarfallApp.renderer.prepareStage(id);},id);await page.waitForFunction(id=>StarfallApp.renderer.campaignReady(id),id);
  const info=await page.evaluate(id=>{const r=StarfallApp.renderer,names=[...new Set(DemonStarCampaign.levels[id-1].events.map(row=>DemonStarCampaign.definitions[DemonStarCampaign.byId[row[2]]].sprite))];return {id,names,assets:[...r.campaignAtlases.keys()],decodedBytes:[...r.campaignAtlases.values()].reduce((n,im)=>n+im.naturalWidth*im.naturalHeight*4,0)};},id);
  const gallery=await page.evaluate(names=>{
   const r=StarfallApp.renderer,original=r.c,canvas=document.createElement('canvas'),cols=5,cell=180;canvas.width=cols*cell;canvas.height=Math.ceil(names.length/cols)*cell;r.c=canvas.getContext('2d');const c=r.c;c.fillStyle='#141b22';c.fillRect(0,0,canvas.width,canvas.height);
   for(let i=0;i<names.length;i++){const name=names[i],d=DemonStarCampaign.definitions.find(d=>d.sprite===name),s=DemonStarCampaignArt.sprites[name],scale=Math.min(2.4,140/Math.max(d.width,d.height,s?.width||0,s?.height||0));c.save();c.translate(i%cols*cell+90,Math.floor(i/cols)*cell+83);c.scale(scale,scale);r.objectBody({x:0,y:0,def:d,facing:0,animation:{frame:0}},false);c.restore();c.fillStyle='#d8e1e9';c.font='13px monospace';c.fillText(name,i%cols*cell+8,Math.floor(i/cols)*cell+164);}
   for(let i=0;i<names.length;i++){const pixels=c.getImageData(i%cols*cell,Math.floor(i/cols)*cell,cell,150).data;let visible=0;for(let p=0;p<pixels.length;p+=4)if(pixels[p]!==20||pixels[p+1]!==27||pixels[p+2]!==34)visible++;if(!visible)throw new Error('Invisible prototype: '+names[i]);}
   r.c=original;return canvas.toDataURL();
  },info.names);await writeFile(`artifacts/campaign-${String(id).padStart(2,'0')}-prototypes.png`,Buffer.from(gallery.split(',')[1],'base64'));info.names.forEach(n=>drawn.add(n));
  const scenes=[];for(const seconds of [60,120,180]){
   const result=await page.evaluate(({id,seconds})=>{const g=StarfallApp.game;g.start(1,id);g.player.invincible=99999;for(let i=0;i<Math.round(seconds/StarfallCore.STEP);i++)g.update(StarfallCore.STEP);g.pause();g.events=[];return {seconds,names:[...new Set(g.enemies.filter(e=>e.y>=0&&e.y<480).map(e=>e.def.sprite))]};},{id,seconds});
   await page.waitForTimeout(50);const l=await page.evaluate(()=>StarfallApp.renderer.layout);await page.screenshot({path:`artifacts/campaign-${String(id).padStart(2,'0')}-${seconds}s.png`,clip:{x:l.x,y:l.y,width:400*l.scale,height:480*l.scale}});scenes.push(result);
  }stages.push({...info,scenes});console.log(`Stage ${id}: ${info.names.length} prototypes, ${(info.decodedBytes/1048576).toFixed(1)} MiB campaign atlases`);
 }
 assert.equal(drawn.size,244);
 const turretChecks=await page.evaluate(()=>{
  const r=StarfallApp.renderer,original=r.c,c=document.createElement('canvas').getContext('2d'),checks=[];r.c=c;
  for(const [name,spec] of Object.entries(DemonStarCampaignArt.sprites).filter(([,s])=>s.head)){
   const def=DemonStarCampaign.definitions.find(d=>d.sprite===name),poses=[];for(let facing=0;facing<32;facing++){const calls=[],draw=c.drawImage;c.drawImage=function(...args){const m=c.getTransform();calls.push({transform:[m.a,m.b,m.c,m.d,m.e,m.f],crop:args.slice(1,5)});return draw.apply(this,args);};r.campaignObject({def,x:100,y:100,facing},false);c.drawImage=draw;if(calls.length!==2)throw new Error('Turret layers missing: '+name);poses.push(calls);}
   if(!poses.every(p=>JSON.stringify(p[0])===JSON.stringify(poses[0][0])))throw new Error('Base rotated: '+name);if(new Set(poses.map(p=>JSON.stringify(p[1].transform))).size!==32)throw new Error('Barrel headings missing: '+name);checks.push(name);
  }r.c=original;return checks;
 });assert.equal(turretChecks.length,5);
 const details=await page.evaluate(()=>{
  const r=StarfallApp.renderer,original=r.c,canvas=document.createElement('canvas');canvas.width=1000;canvas.height=360;r.c=canvas.getContext('2d');const c=r.c;c.fillStyle='#141b22';c.fillRect(0,0,1000,360);
  const types=Object.keys(DemonStarEnemyShots.shots).map(Number);for(let i=0;i<types.length;i++){const t=types[i],x=i%8*125+62,y=Math.floor(i/8)*160+62;c.save();c.beginPath();c.rect(x-50,y-50,100,110);c.clip();c.translate(x,y);c.scale(4,4);r.enemyShot({shotType:t,age:0},{x:0,y:0});c.restore();c.fillStyle='white';c.font='16px monospace';c.fillText(String(t),x-10,y+72);}
  r.c=original;return {image:canvas.toDataURL(),missingSprites:[...r.missingSprites],missingShotTypes:[...r.missingShotTypes]};
 });assert.deepEqual(details.missingSprites,[]);assert.deepEqual(details.missingShotTypes,[]);await writeFile('artifacts/enemy-projectiles-gallery.png',Buffer.from(details.image.split(',')[1],'base64'));
 // 原型覆盖与逐关缓存均受约束；所有场景来自真实原表，非随机替代关卡。
 // Coverage and per-stage caches are bounded; scenes use actual records rather than random replacement levels.
 for(const s of stages)assert.ok(s.decodedBytes<150*1048576);
 assert.deepEqual(errors,[]);const report={status:'passed',prototypesRendered:drawn.size,stages,enemyTypes:15,fixedBase32HeadingChecks:turretChecks,missingSprites:details.missingSprites,missingShotTypes:details.missingShotTypes,errors};await writeFile('artifacts/campaign-art-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:'passed',prototypesRendered:drawn.size,scenes:54,errors}));
}finally{await browser.close();}
