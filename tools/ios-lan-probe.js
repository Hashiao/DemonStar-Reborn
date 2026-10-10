/* 双模拟器真实原生 TCP 探针，由显式 CI 参数加载。 / Native TCP probe for two simulators, explicitly loaded by CI. */
(function () {
  'use strict';
  var config=window.lanProbeConfig,step=0,until=0,startX=0,pausedFrame=0,actions=null,disconnected=false,joined=false,startupMusic=null;
  function report(status,extra){window.lanProbeResult=Object.assign({status:status,role:config.role,step:step},extra||{});}
  function fail(error){report('error',{error:String(error)});clearInterval(timer);}
  function clickLabel(key){var button=Array.from(document.querySelectorAll('#dialog-buttons button')).find(function(b){return b.textContent===DemonStarI18n.t(key);});if(!button)throw new Error('Missing button '+key);button.click();}
  report('starting');
  var timer=setInterval(function(){try{
    if(!window.StarfallApp||!StarfallApp.native.capabilities.lan||!StarfallApp.renderer.presentationReady())return;
    var app=StarfallApp,g=app.game,room=app.lan,p=g.players&&g.players[1];
    if(step===0){
      var ms=app.music.snapshot();if(ms.error)throw new Error(ms.error);if(ms.backend!=='ios-native'||!ms.ready||ms.paused||ms.currentTime<=0)return;startupMusic=ms;
      // 直接记录断线事件，避免繁忙模拟器的定时轮询漏掉短暂断线。
      // Capture the disconnect event directly so a busy simulator cannot miss it between polling ticks.
      if(config.role==='host')app.native.on(function(event){if(step>=3&&event.type==='disconnected')disconnected=true;});
      app.showRoom();
      if(config.role==='host')document.getElementById('lan-host').click();
      else{document.getElementById('lan-address').value='127.0.0.1';document.getElementById('lan-code').value=config.code;document.getElementById('lan-join').click();}
      step=1;report('connecting',{startupBGM:true,startupMusic:startupMusic});return;
    }
    if(room.status==='error'||room.status==='rejected')throw new Error(room.error);
    report('running',{gamePhase:g.phase,roomStatus:room.status,frame:g.frame||0,players:(g.players||[]).length,connected:room.members.map(function(m){return m.connected;}),shots:p?p.shotsFired:0,bombs:p?p.bombs:0,roomError:room.error});
    if(config.role==='host'){
      if(step===1&&room.status==='lobby'){
        report('lobby',{code:room.code,startupBGM:true,startupMusic:startupMusic});if(room.members.length!==2)return;
        clickLabel('lanStart');step=2;return;
      }
      if(step===2&&g.phase==='playing'){
        g.recordEvents=[];g.enemies=[];g.players.forEach(function(p){p.invincible=999;});startX=p.x;step=3;return;
      }
      if(step===3&&p.shotsFired>=4&&p.bombs===2&&p.x>startX){
        actions={shots:p.shotsFired,bombs:p.bombs,moved:p.x>startX};p.rear=4;document.getElementById('pause').click();pausedFrame=g.frame;step=4;return;
      }
      if(step===4){
        if(p.connected===false)disconnected=true;
        if(!disconnected||p.connected===false)return;
        g.score=12345;g.loadStage(2);room.flush();step=5;return;
      }
      if(step===5&&g.stage.id===2&&g.phase==='paused'){
        report('passed',{players:g.players.length,localSlot:room.localSlot,platforms:room.members.map(function(m){return m.platform;}),startupBGM:true,startupMusic:startupMusic,actions:actions,pausedFrame:pausedFrame,finalFrame:g.frame,stage:g.stage.id,score:g.score,rear:p.rear,reconnected:disconnected});clearInterval(timer);
      }
    }else{
      // 等待出击事件释放旧输入后再注入动作，与常规原生探针一致。
      // Wait until launch-event input cleanup finishes, matching the standard native probe.
      if(step===1&&g.phase==='playing'&&g.frame>=6){
        if(g.players.length!==2||room.localSlot!==2)throw new Error('Wrong client ownership');
        startX=p.x;app.input.move(0,.5,0);app.input.touchFire(0,41,true);app.input.pulse(0,'bomb');step=2;return;
      }
      if(step===2&&g.phase==='paused'&&p.rear===4){
        actions={shots:p.shotsFired,bombs:p.bombs,moved:p.x>startX};pausedFrame=g.frame;app.input.clear();step=3;until=Date.now()+800;
        app.native.request('stop').catch(fail);return;
      }
      if(step===3&&Date.now()>=until){step=4;room.connect().catch(fail);return;}
      if(step===4&&g.stage.id===2&&p.rear===4&&g.score===12345){joined=true;room.requestPause();step=5;return;}
      if(step===5&&g.phase==='paused'){
        report('passed',{players:g.players.length,localSlot:room.localSlot,platforms:room.members.map(function(m){return m.platform;}),startupBGM:true,startupMusic:startupMusic,actions:actions,pausedFrame:pausedFrame,finalFrame:g.frame,stage:g.stage.id,score:g.score,rear:p.rear,reconnected:joined});clearInterval(timer);
      }
    }
  }catch(error){fail(error);}},50);
})();
