// 打包引擎中的固定步长验收，不把逻辑时间冒充真机墙钟实测。
// Fixed-step checks in the packaged core, not physical-device wall-clock measurements.
(function(){
 const {Game,STEP}=StarfallCore,{Input}=DemonStarInput,rows=[],tiers={slow:[72,74],medium:[58,60],fast:[48,50]};
 if(new Input().config.players[0].moveSpeed!=='medium')throw new Error('Wrong default movement speed');
 for(const moveSpeed of ['slow','medium','fast'])for(const difficulty of [0,1,2,3])for(const mode of ['keyboard','fixed','floating','dpad','gamepad','tilt','mouse','point'])for(const axes of [[1,0],[0,1],[1,1]]){
  const [x,y]=axes,g=new Game(19),input=new Input(),pad={connected:true,axes:[0,0],buttons:[]};g.start(difficulty);g.recordEvents=[];g.player.x=16;g.player.y=64;g.player.invincible=999;input.config.players[0].touch=mode;input.config.players[0].moveSpeed=moveSpeed;
  if(mode==='keyboard'){if(x)input.keys.add('key:KeyD');if(y)input.keys.add('key:KeyS');}
  if(['fixed','floating','dpad'].includes(mode)){const radius=Math.hypot(x,y),group={index:0,center:{x:0,y:0},stick:{getBoundingClientRect:()=>({width:100})},knob:{style:{}}};DemonStarTouchControls.prototype.move.call({input},group,{clientX:36*x/radius,clientY:36*y/radius});}
  if(mode==='gamepad'){input.sample([pad],g.players);const radius=Math.hypot(x,y);pad.axes=[x/radius,y/radius];}
  if(mode==='tilt')input.tiltAxes={x,y};if(mode==='mouse'){input.config.mousePlayer=1;input.mouseTarget={x:x?384:16,y:y?440:64};}if(mode==='point')input.point(0,x?384:16,y?440:64);
  let hitX=0,hitY=0;for(let tick=1;tick<=74;tick++){g.update(STEP,input.sample(mode==='gamepad'?[pad]:[],g.players));if(x&&!hitX&&g.player.x>=384-1e-8)hitX=tick;if(y&&!hitY&&g.player.y>=440-1e-8)hitY=tick;}
  if(x&&hitX!==tiers[moveSpeed][0]||y&&hitY!==tiers[moveSpeed][1])throw new Error('Mobility mismatch: '+JSON.stringify({moveSpeed,difficulty,mode,x,y,hitX,hitY}));rows.push({moveSpeed,difficulty,mode,x,y,hitX,hitY});
 }
 return {cases:rows.length,defaultSpeed:'medium',tiers,horizontalTicks:48,verticalTicks:50,step:.035,diagonalAxesRetainSpeed:true,rows};
})()
