// 检查邻格碎块，包含旧裁切阳性对照及普通/闪红/激光帧。 / Check atlas fragments with legacy positive controls and normal/red/laser poses.
(async () => {
 const r=StarfallApp.renderer,{Game}=StarfallCore,old=r.c,canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d'),rows=[];let cases=0;
 const settings=[{id:40,stage:1,grid:[4,4,8],factor:1.12,regions:[[-32,42,23,6],[9,42,23,6]]},{id:235,stage:8,grid:[4,3,1],factor:1.13,regions:[[-61,-80,13,80]]},{id:240,stage:13,grid:[4,3,6],factor:1.13,regions:[[-65,-45,25,52]]}];
 const pixels=(regions,scale,fx,fy)=>regions.reduce((sum,[x,y,w,h])=>{const left=Math.floor(256+fx+x*scale),top=Math.floor(256+fy+y*scale),right=Math.ceil(256+fx+(x+w)*scale),bottom=Math.ceil(256+fy+(y+h)*scale),data=c.getImageData(left,top,right-left,bottom-top).data;for(let i=3;i<data.length;i+=4)if(data[i]>16)sum++;return sum;},0);
 const replacements=globalThis.DemonStarBossProbeImages,saved={ships:r.ships,bosses:r.bosses,attacks:r.attacks},decoded=[];
 try{
  // 原生 file:// 图片不可读回像素；仅测试态解码同包字节，保持 WebView 安全设置。
  // Native file:// images cannot be read back; decode identical package bytes only in tests, preserving WebView security settings.
  if(replacements){for(const key of Object.keys(saved)){if(!replacements[key]?.startsWith('data:image/png;base64,'))throw new Error('Missing packaged probe image '+key);const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Probe image decode failed'));im.src=replacements[key];});if(image.naturalWidth!==saved[key].naturalWidth||image.naturalHeight!==saved[key].naturalHeight)throw new Error('Probe image dimensions changed');decoded.push([key,image]);}for(const [key,image] of decoded)r[key]=image;r.bossCropCache?.clear();}
  // 解码等待期间主画面仍在刷新，完成后才切换测试画布，避免混入 file:// 绘制。
  // The main frame keeps rendering during decode; switch canvases only afterward to avoid mixing file:// draws.
  r.c=c;
  for(const s of settings){const g=new Game(228);g.start(0,1);g.recordEvents=[];g.spawnRecord([200,0,s.id,0,1,-1,0,0]);const e=g.enemies[0];e.x=e.y=0;const image=s.id===40?r.ships:r.bosses;if(!image.complete||!image.naturalWidth)throw new Error('Boss atlas not ready');
   c.clearRect(0,0,512,512);c.save();c.translate(256,256);c.scale(2,2);r.cell(image,s.grid[2],s.grid[0],s.grid[1],0,0,e.def.width*s.factor,e.def.height*s.factor);c.restore();const legacy=pixels(s.regions,2,0,0);if(!legacy)throw new Error('Fragment check has no positive control: '+s.id);
   let current=0;
   for(const scale of [1,1.5,2])for(const red of [false,true])for(const [fx,fy] of [[0,0],[.375,.625]])for(const frame of s.id===40?[-1,0,1,2,3]:[-1]){
    c.clearRect(0,0,512,512);c.save();c.translate(256+fx,256+fy);c.scale(scale,scale);r.objectBody(e,red);if(frame>=0){const raw=e.def.guns.find(g=>g[2]===9);r.enemyShot({shotType:9,age:frame},{x:raw[0]-e.def.width/2,y:raw[1]-e.def.height/2});}c.restore();
    if(!c.getImageData(250,250,12,12).data.some((v,i)=>i%4===3&&v>16))throw new Error('Boss body disappeared');const stray=pixels(s.regions,scale,fx,fy);if(stray)throw new Error('Stray Boss fragment '+s.id+' / '+scale+' / '+red+' / '+frame+': '+stray);current+=stray;cases++;
   }rows.push({stage:s.stage,id:s.id,legacyFragmentPixels:legacy,currentFragmentPixels:current});
  }
  const before=r.artStage;r.prepareStage(before===18?1:18);if(r.bossCropCache.size)throw new Error('Boss crop cache survives stage release');r.prepareStage(before);
 }finally{r.c=old;if(replacements){Object.assign(r,saved);r.bossCropCache?.clear();for(const [,image] of decoded)r.tintCache.delete(image);delete globalThis.DemonStarBossProbeImages;}}
 return {bosses:3,cases,isolatedTextures:true,legacyPositiveControls:true,stageCacheReleased:true,dataURLReadback:!!replacements,rows};
})()
