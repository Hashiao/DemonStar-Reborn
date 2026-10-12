// 原生打包后的默认档位、独立速度和淡预警曲线。 / Packaged defaults, independent speeds and faint warning curve.
(function(){
 const {Game,STEP,PLAYER_STEP_X}=StarfallCore,input=new DemonStarInput.Input({count:2}),g=new Game(223);g.start(0,1,false,{playerCount:2});g.recordEvents=[];
 if(input.config.players.some(p=>p.moveSpeed!=='medium')||g.players.some(p=>p.moveSpeed!=='medium'))throw new Error('Default speed is not medium');
 input.config.players[0].moveSpeed='slow';input.config.players[1].moveSpeed='fast';input.move(0,1,0);input.move(1,1,0);const x=g.players.map(p=>p.x);g.update(STEP,input.sample([],g.players));const deltas=g.players.map((p,i)=>p.x-x[i]);if(Math.abs(deltas[0]-PLAYER_STEP_X*2/3)>1e-8||Math.abs(deltas[1]-PLAYER_STEP_X)>1e-8)throw new Error('Independent speed mismatch');
 const r=StarfallApp.renderer,oldContext=r.c,oldShot=r.enemyShot,canvas=document.createElement('canvas'),alphas=[];canvas.width=10;canvas.height=10;r.c=canvas.getContext('2d');
 try{r.enemyShot=()=>alphas.push(r.c.globalAlpha);for(const [ticks,fraction] of [[23,0],[15,0],[7,0],[4,0],[1,.8]])r.laserWarning({ticks,shotType:9,frames:4,pulses:[0,1,2,3],period:8},{x:0,y:0},fraction);}finally{r.c=oldContext;r.enemyShot=oldShot;}
 if(alphas.length!==5||alphas.slice(0,3).some(a=>Math.abs(a-.02)>1e-6)||alphas[3]<=.02||alphas[4]<=.85||alphas.some(a=>a>=1))throw new Error('Warning is not faint and accelerating');
 return {defaultSpeed:'medium',independentSpeeds:true,faintAcceleratingWarning:true,finalDarkenSeconds:.2,alphas};
})()
