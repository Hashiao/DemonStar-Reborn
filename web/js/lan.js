/* SPDX-License-Identifier: MIT. 四人主机权威局域网会话 / Four-seat authoritative LAN session. */
(() => {
  'use strict';
  // 三色溢出弹与炮门动画需要双方采用同一规则和帧表。
  // Color overflow and shutter animation require matching rules and frame tables on both peers.
  const INPUT_VERSION=10,PROTOCOL='demonstar-lan-1',clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const idle=()=>({x:0,y:0,fire:false,bomb:0});
  const validRoster=list=>Array.isArray(list)&&list.length>=1&&list.length<=4&&list.every((m,i)=>m.slot===i+1&&typeof m.connected==='boolean'&&['android','ios','browser'].includes(m.platform));
  function token(){const bytes=new Uint8Array(16);if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
  function identity(){try{const key='demonstar-lan-device-v1',saved=globalThis.localStorage?.getItem(key);if(/^[a-f0-9]{32}$/.test(saved||''))return saved;const value=token();globalThis.localStorage?.setItem(key,value);return value;}catch{return token();}}
  class Session {
    constructor(native,game,options={}){
      this.native=native;this.game=game;this.maxPlayers=Number.isInteger(options.maxPlayers)?clamp(options.maxPlayers,2,4):4;this.clock=options.clock||Date.now;this.identity=options.identity||identity();this.change=options.change||(()=>{});this.onFrame=options.frame||(()=>{});this.onPause=options.pause||(()=>game.pause());this.role='offline';this.status='idle';this.localSlot=1;this.members=[];this.pending=new Map();this.session=0;this.lastRx=0;this.error=null;this.authenticated=false;this.native.on(event=>this.receive(event));
    }
    packet(type,data={}){return {protocol:PROTOCOL,type,...data};}
    send(peer,type,data={}){try{const packet=this.packet(type,data);if(this.role==='host'&&peer==='*'){for(const member of this.members)if(member.peer&&member.connected)this.native.send(member.peer,packet);}else this.native.send(peer,packet);}catch(error){this.error=error.message;this.change();}}
    publicMembers(){return this.members.map(m=>({slot:m.slot,connected:m.connected,platform:m.platform}));}
    async leave(){const session=++this.session;this.cancelReady();this.prepareToken=0;this.role='offline';this.status='idle';this.localSlot=1;this.members=[];this.pending.clear();this.error=null;this.busy=false;this.authenticated=false;try{await this.native.request('stop');}catch{}if(session===this.session)this.change();return session;}
    async host(){
      const session=await this.leave();if(session!==this.session)return;this.role='host';this.status='connecting';this.code=String(Math.floor(Math.random()*900000)+100000);this.epoch=0;this.sequence=0;this.frameSequence=0;this.bufferedEvents=[];this.lastSend=0;this.started=false;this.members=[{slot:1,token:this.identity,peer:null,connected:true,platform:this.native.capabilities.platform}];this.change();
      try{const info=await this.native.request('host');if(session!==this.session)return;this.addresses=info.addresses||[];this.status='lobby';this.change();}catch(error){if(session!==this.session)return;this.error=error.message;this.status='error';this.change();}
    }
    async join(host,code){
      const session=await this.leave();if(session!==this.session)return;this.role='client';this.hostAddress=host.trim();this.code=String(code).trim();this.epoch=-1;this.sequence=0;this.lastFrame=0;this.lastSend=0;this.lastRx=this.clock();this.started=false;this.retries=0;await this.connect();
    }
    async connect(){
      if(this.busy)return;
      const session=this.session;this.status='connecting';this.busy=true;this.authenticated=false;this.error=null;this.lastRx=this.clock();this.change();
      try{await this.native.request('join',{host:this.hostAddress});}catch(error){if(session!==this.session)return;this.lost(error.message);}finally{if(session===this.session)this.busy=false;}
    }
    lost(error='disconnected'){if(this.role!=='client')return;this.status='disconnected';this.authenticated=false;this.error=error;this.retryAt=this.clock()+1800;if(this.game.player)this.game.pause();this.change();}
    receive(event){
      if(this.role==='offline')return;
      if(event.type==='connected'){
        if(this.role==='host')this.pending.set(event.peer,this.clock());
        else if(event.peer==='host')this.send('host','hello',{code:this.code,token:this.identity,platform:this.native.capabilities.platform,inputVersion:INPUT_VERSION,stateVersion:DemonStarNetworkState.version});return;
      }
      if(event.type==='disconnected'){
        if(this.role==='client'){if(this.status!=='rejected')this.lost();return;}
        this.cancelReady();this.pending.delete(event.peer);const member=this.members.find(m=>m.peer===event.peer);if(!member)return;member.connected=false;member.input=idle();
        if(this.started){const p=this.game.playerById(member.slot);if(p)p.connected=false;this.onPause();this.flush();}else this.reindexLobby();this.broadcastRoster();this.change();return;
      }
      if(event.type==='error'){this.error=event.error;this.change();return;}
      if(event.type!=='message'||typeof event.data!=='string'||event.data.length>1048576)return;
      let p;try{p=JSON.parse(event.data);}catch{return;}
      if(p?.protocol!==PROTOCOL)return;
      this.role==='host'?this.hostPacket(event.peer,p):this.clientPacket(event.peer,p);
    }
    welcome(member){this.send(member.peer,'welcome',{inputVersion:INPUT_VERSION,stateVersion:DemonStarNetworkState.version,slot:member.slot,roster:this.publicMembers(),epoch:this.epoch,started:this.started,...(this.started?{sequence:++this.frameSequence,state:DemonStarNetworkState.encode(this.game)}:{})});}
    reindexLobby(){this.members=this.members.filter(m=>m.connected);this.members.forEach((m,i)=>m.slot=i+1);for(const member of this.members)if(member.peer)this.welcome(member);}
    broadcastRoster(){this.send('*','roster',{roster:this.publicMembers(),epoch:this.epoch});}
    hostPacket(peer,p){
      if(p.type==='hello'){
        if(p.inputVersion!==INPUT_VERSION||p.stateVersion!==DemonStarNetworkState.version){this.send(peer,'rejected',{reason:'protocol-version'});return;}
        if(p.code!==this.code||typeof p.token!=='string'||!/^[a-f0-9]{32}$/.test(p.token)){this.send(peer,'rejected',{reason:'room-code'});return;}
        let member=this.members.find(m=>m.token===p.token);
        if(member?.slot===1||!member&&(this.started||this.members.length>=this.maxPlayers)){this.send(peer,'rejected',{reason:this.started?'game-started':'room-full'});return;}
        if(!member){member={slot:this.members.length+1,token:p.token};this.members.push(member);}
        if(member.peer&&member.peer!==peer)this.native.request('drop',{peer:member.peer}).catch(()=>{});
        Object.assign(member,{peer,connected:true,platform:['android','ios'].includes(p.platform)?p.platform:'browser',lastRx:this.clock(),lastSeq:0,input:idle()});this.pending.delete(peer);
        if(this.started){const player=this.game.playerById(member.slot);if(player)player.connected=true;}
        this.welcome(member);this.broadcastRoster();this.change();return;
      }
      const member=this.members.find(m=>m.peer===peer&&m.connected);if(!member)return;member.lastRx=this.clock();
      if(p.type==='ready'){if(this.preparing&&p.token===this.preparing.token&&p.epoch===this.epoch){this.preparing.ready.add(member.slot);this.finishReady();}return;}
      if(p.type==='ping'){this.send(peer,'pong');return;}
      if(p.type==='pause'){if(p.epoch===this.epoch){this.onPause();this.flush();}return;}
      if(p.type!=='input'||p.epoch!==this.epoch||!Number.isSafeInteger(p.sequence)||p.sequence<=member.lastSeq)return;
      if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||typeof p.fire!=='boolean'||!Number.isSafeInteger(p.bomb)||p.bomb<0)return;
      if(p.moveSpeed!==undefined&&!StarfallCore.validMoveSpeed(p.moveSpeed))return;
      if(p.target!=null&&(!Number.isFinite(p.target.x)||!Number.isFinite(p.target.y)||p.target.x<16||p.target.x>384||p.target.y<64||p.target.y>440))return;
      member.lastSeq=p.sequence;member.input={x:clamp(p.x,-1,1),y:clamp(p.y,-1,1),fire:p.fire,bomb:p.bomb,...(p.moveSpeed?{moveSpeed:p.moveSpeed}:{}),...(p.target?{target:{x:p.target.x,y:p.target.y}}:{})};member.inputAt=this.clock();
    }
    clientPacket(peer,p){
      if(peer!=='host')return;this.lastRx=this.clock();
      if(p.type==='rejected'){this.reject(p.reason);return;}
      if(p.type==='welcome'){
        if(p.inputVersion!==INPUT_VERSION||p.stateVersion!==DemonStarNetworkState.version){this.reject('protocol-version');return;}
        if(!Number.isInteger(p.slot)||p.slot<2||p.slot>4||!Number.isSafeInteger(p.epoch)||p.epoch<0||!validRoster(p.roster))return;
        if(p.slot>this.maxPlayers||p.roster.length>this.maxPlayers){this.reject('player-limit');return;}this.authenticated=true;
        this.localSlot=p.slot;this.members=Array.isArray(p.roster)?p.roster:[];this.status=p.started?'playing':'lobby';this.retries=0;this.started=!!p.started;this.lastFrame=0;this.change();
      }
      if(!this.authenticated)return;
      if(p.type==='prepare'){if(p.epoch===this.epoch&&Number.isSafeInteger(p.token)&&p.token>(this.prepareToken||0)){this.prepareToken=p.token;(this.onPrepare||((done)=>done()))(()=>this.send('host','ready',{token:p.token,epoch:this.epoch}));}return;}
      if(p.type==='roster'){if(validRoster(p.roster)){if(p.roster.length>this.maxPlayers){this.reject('player-limit');return;}this.members=p.roster;this.change();}return;}
      if((p.type==='state'||p.type==='welcome')&&p.state){
        if(!Number.isSafeInteger(p.epoch)||p.epoch<this.epoch||!Number.isSafeInteger(p.sequence)||p.epoch===this.epoch&&p.sequence<=this.lastFrame)return;
        if(p.state.players?.length>this.maxPlayers){this.reject('player-limit');return;}
        const nextEpoch=p.epoch!==this.epoch,first=!this.started||!this.game.player;
        if(!DemonStarNetworkState.apply(this.game,p.state,!nextEpoch&&!first))return;
        this.epoch=p.epoch;this.lastFrame=p.sequence;this.started=true;this.status='playing';if(nextEpoch)this.sequence=0;this.onFrame({first,nextEpoch});
      }else if(p.type==='welcome'){
        if(p.inputVersion!==INPUT_VERSION||p.stateVersion!==DemonStarNetworkState.version){this.reject('protocol-version');return;}this.epoch=p.epoch;}
    }
    reject(reason){this.status='rejected';this.error=reason;this.retries=99;this.authenticated=false;this.native.request('stop').catch(()=>{});this.change();}
    start(difficulty=1,stage=1,options={}){
      if(this.role!=='host'||this.status!=='lobby'||this.members.length<2||this.members.some(m=>!m.connected))return false;
      this.game.start(difficulty,stage,true,{playerCount:this.members.length,mode:'lan',retainWeaponLevels:options.retainWeaponLevels===true});this.started=true;this.status='playing';this.flush();this.change();return true;
    }
    // 房主可在大厅或暂停时原子恢复关卡档；失败不改变会话。
    // Hosts restore stage checkpoints atomically from the lobby or pause; failure leaves the session intact.
    load(checkpoint){
      if(this.role!=='host'||!['lobby','playing'].includes(this.status)||this.started&&this.game.phase!=='paused'||this.members.length<2||this.members.some(m=>!m.connected)||!StarfallCore.validCheckpoint(checkpoint)||checkpoint.players.length!==this.members.length)return false;
      if(!this.game.loadCheckpoint({...checkpoint,mode:'lan'},true))return false;
      this.started=true;this.status='playing';this.flush();this.change();return true;
    }
    inputs(local=idle()){
      return {players:this.game.players.map(p=>{if(p.id===1)return local;const m=this.members.find(m=>m.slot===p.id);return m?.connected&&this.clock()-(m.inputAt||0)<300?m.input:idle();})};
    }
    stageEpoch(){if(this.entry!==this.game.stageEntry){this.entry=this.game.stageEntry;this.epoch++;for(const m of this.members){m.lastSeq=0;m.input=idle();}this.bufferedEvents=[];}}
    flush(){
      if(this.role!=='host'||!this.started)return;this.stageEpoch();this.send('*','state',{epoch:this.epoch,sequence:++this.frameSequence,state:DemonStarNetworkState.encode(this.game,this.bufferedEvents)});this.bufferedEvents=[];this.lastSend=this.clock();
    }
    // 准备屏保持全局暂停，所有已连接玩家确认后才恢复。
    // Keep the shared world paused until every connected player confirms readiness.
    beginReady(complete){
      if(this.role!=='host')return;this.cancelReady();this.game.pause();this.flush();
      const token=++this.readySerial||1;this.readySerial=token;this.preparing={token,ready:new Set(),complete};
      this.send('*','prepare',{epoch:this.epoch,token});
      (this.onPrepare||((done)=>done()))(()=>{if(this.preparing?.token===token){this.preparing.ready.add(1);this.finishReady();}});
    }
    finishReady(){const p=this.preparing;if(p&&this.members.every(m=>m.connected&&p.ready.has(m.slot))){this.preparing=null;p.complete();}}
    cancelReady(){this.preparing=null;}
    requestPause(){if(this.role==='client')this.send('host','pause',{epoch:this.epoch});else{this.onPause();this.flush();}}
    sendControls(local){if(this.role!=='client'||this.status!=='playing')return false;this.send('host','input',{epoch:this.epoch,sequence:++this.sequence,...local});this.lastSend=this.clock();return true;}
    update(dt,local=idle(),events=[]){
      const now=this.clock();
      if(this.role==='host'){
        this.bufferedEvents.push(...events);if(this.bufferedEvents.length>192)this.bufferedEvents.splice(0,this.bufferedEvents.length-192);
        for(const [peer,time] of this.pending)if(now-time>6000){this.pending.delete(peer);this.native.request('drop',{peer}).catch(()=>{});}
        for(const m of this.members)if(m.peer&&m.connected&&now-m.lastRx>6000)this.native.request('drop',{peer:m.peer}).catch(()=>{});
        if(this.started&&now-this.lastSend>=(this.game.phase==='paused'?500:50))this.flush();
        else if(!this.started&&now-(this.lastPing||0)>=1000){this.send('*','pong');this.lastPing=now;}
      }else if(this.role==='client'){
        if(this.status==='disconnected'&&!this.busy&&this.retries<5&&now>=this.retryAt){this.retries++;this.connect();}
        if(['playing','lobby','connecting'].includes(this.status)&&!this.busy&&now-this.lastRx>6000)this.lost('timeout');
        if(this.status==='playing'){this.game.pendingTime=Math.min(StarfallCore.STEP,(this.game.pendingTime||0)+dt);if(now-this.lastSend>=50){this.sendControls(local);return true;}}
        else if(this.status==='lobby'&&now-(this.lastPing||0)>=1000){this.send('host','ping');this.lastPing=now;}
      }
      return false;
    }
  }
  globalThis.DemonStarLAN={Session,PROTOCOL};
})();
