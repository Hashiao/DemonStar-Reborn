// 原生打包后的默认档位与独立速度。 / Packaged defaults and independent speeds.
(function(){
 const {Game,STEP,PLAYER_STEP_X}=StarfallCore,input=new DemonStarInput.Input({count:2}),g=new Game(223);g.start(0,1,false,{playerCount:2});g.recordEvents=[];
 if(input.config.players.some(p=>p.moveSpeed!=='medium')||g.players.some(p=>p.moveSpeed!=='medium'))throw new Error('Default speed is not medium');
 input.config.players[0].moveSpeed='slow';input.config.players[1].moveSpeed='fast';input.move(0,1,0);input.move(1,1,0);const x=g.players.map(p=>p.x);g.update(STEP,input.sample([],g.players));const deltas=g.players.map((p,i)=>p.x-x[i]);if(Math.abs(deltas[0]-PLAYER_STEP_X*2/3)>1e-8||Math.abs(deltas[1]-PLAYER_STEP_X)>1e-8)throw new Error('Independent speed mismatch');
 return {defaultSpeed:'medium',independentSpeeds:true};
})()
