// 真实打包 WebView 与原生 TCP 收发；不把模拟器振动调用当作手感验收。
// Packaged WebView/native TCP checks; emulator calls do not prove physical haptic feel.
import {execFileSync} from 'node:child_process';
import {createConnection,createServer} from 'node:net';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const adb=process.env.ADB||'K:/android/sdk/platform-tools/adb.exe',serial=process.env.ANDROID_SERIAL||'emulator-5554',pkg='io.github.hashiao.demonstar.debug';
const run=(...args)=>execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:30000}).trim(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,timeout=10000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await sleep(80);}throw new Error('Probe timed out');};
let ws,server,cdpPort,forwardPort,reversed=false;const sockets=[];let evaluate;
try{
  let pid;await until(()=>{try{pid=run('shell','pidof',pkg);return !!pid;}catch{return false;}});cdpPort=run('forward','tcp:0','localabstract:webview_devtools_remote_'+pid);forwardPort=Number(run('forward','tcp:0','tcp:37654'));
  let targets;await until(async()=>{try{targets=await (await fetch('http://127.0.0.1:'+cdpPort+'/json')).json();return targets.some(t=>t.url.startsWith('file:///android_asset/index.html'));}catch{return false;}});
  const target=targets.find(t=>t.url.startsWith('file:///android_asset/index.html'));ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let sequence=0;const pending=new Map();ws.addEventListener('message',event=>{const message=JSON.parse(event.data),p=pending.get(message.id);if(p){pending.delete(message.id);message.error?p.reject(new Error(JSON.stringify(message.error))):p.resolve(message.result);}});
  const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  evaluate=async expression=>{const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await until(()=>evaluate('!!window.StarfallApp && !!window.DemonStarNative'));
  const capability=await evaluate('DemonStarNative.ready');assert.equal(capability.platform,'android');assert.equal(capability.lan,true);assert.equal(typeof capability.haptics,'boolean');
  await until(()=>evaluate('StarfallApp.music.audio.currentTime > 0 && !StarfallApp.music.audio.paused'));
  const startupMusic=await evaluate('({phase:StarfallApp.game.phase,track:StarfallApp.music.track,time:StarfallApp.music.audio.currentTime})');assert.equal(startupMusic.phase,'menu');
  // 单独授予本次 debug 测试所需权限，不修改其他应用授权。
  // Grant only this debug application's permission for this transport probe.
  if(Number(run('shell','getprop','ro.build.version.sdk'))>=37)run('shell','pm','grant',pkg,'android.permission.ACCESS_LOCAL_NETWORK');
  await evaluate('window.nativeProbe={events:[]};DemonStarNative.on(e=>nativeProbe.events.push(e));true');
  const host=await evaluate('DemonStarNative.request("host")');assert.equal(host.port,37654);
  for(let i=0;i<3;i++){const socket=createConnection({host:'127.0.0.1',port:forwardPort});socket.received='';socket.on('data',bytes=>socket.received+=bytes.toString('utf8'));socket.on('error',()=>{});await new Promise(resolve=>socket.once('connect',resolve));sockets.push(socket);}
  await until(async()=>(await evaluate('nativeProbe.events.filter(e=>e.type==="connected").length'))===3);
  const peers=await evaluate('nativeProbe.events.filter(e=>e.type==="connected").map(e=>e.peer)');
  for(const [i,socket] of sockets.entries()){const packet=Buffer.from(JSON.stringify({kind:'probe',text:'玩家二',index:i})+'\n');socket.write(packet.subarray(0,23));socket.write(packet.subarray(23,26));socket.write(packet.subarray(26));}
  await until(async()=>(await evaluate('nativeProbe.events.filter(e=>e.type==="message").length'))===3);
  const messages=await evaluate('nativeProbe.events.filter(e=>e.type==="message").map(e=>JSON.parse(e.data))');assert.deepEqual(messages.map(p=>p.index).sort(),[0,1,2]);assert.ok(messages.every(p=>p.text==='玩家二'));
  await evaluate('DemonStarNative.send("*",{kind:"broadcast",value:123});true');await until(()=>sockets.every(s=>s.received.includes('"broadcast"')));
  sockets.forEach(s=>s.destroy());await evaluate('DemonStarNative.request("stop")');await evaluate('nativeProbe.events=[];true');
  let incoming;server=createServer(socket=>{incoming=socket;socket.received='';socket.on('data',bytes=>{socket.received+=bytes.toString('utf8');socket.write('{"kind":"host-reply"}\n');});socket.on('error',()=>{});sockets.push(socket);});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  run('reverse','tcp:37654','tcp:'+server.address().port);reversed=true;
  await evaluate('DemonStarNative.request("join",{host:"127.0.0.1"})');await evaluate('DemonStarNative.send("host",{kind:"client-probe"});true');await until(()=>incoming?.received.includes('client-probe'));await until(()=>evaluate('nativeProbe.events.some(e=>e.type==="message"&&JSON.parse(e.data).kind==="host-reply")'));
  await evaluate('DemonStarNative.haptic("heavy");true');
  const screenshot=await command('Page.captureScreenshot',{format:'png'});await mkdir('artifacts',{recursive:true});await writeFile('artifacts/m210-android-native.png',Buffer.from(screenshot.data,'base64'));
  const report={status:'passed',api:Number(run('shell','getprop','ro.build.version.sdk')),capability,startupMusic,checks:['native-capabilities','cold-menu-BGM','host-with-three-native-TCP-peers','fragmented-UTF8-lines','broadcast','native-client-connection','haptic-command-no-error'],scope:'One Android emulator and desktop TCP peers; not Android–iOS hotspot or physical vibration certification'};await writeFile('artifacts/m210-android-native.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(evaluate)try{await evaluate('DemonStarNative.request("stop")');}catch{}sockets.forEach(s=>s.destroy());if(server)server.close();if(ws)ws.close();try{if(cdpPort)run('forward','--remove','tcp:'+cdpPort);if(forwardPort)run('forward','--remove','tcp:'+forwardPort);if(reversed)run('reverse','--remove','tcp:37654');}catch{}}
