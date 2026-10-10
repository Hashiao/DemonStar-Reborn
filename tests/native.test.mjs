import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/js/native.js',import.meta.url),'utf8');
function bridge(){const sent=[];let context;context=vm.createContext({setTimeout,clearTimeout,Date,console,DemonStarHost:{command(text){const request=JSON.parse(text);sent.push(request);if(request.method==='capabilities')queueMicrotask(()=>context.DemonStarNative.receive({requestId:request.requestId,value:{platform:'android',lan:true,haptics:true}}));}}});vm.runInContext(source,context);return {native:context.DemonStarNative,sent};}
test('native requests correlate replies and errors without confusing unsolicited peer messages',async()=>{
  const {native,sent}=bridge();await native.ready;assert.equal(native.capabilities.lan,true);let event;native.on(e=>event=e);const pending=native.request('host');const id=sent.at(-1).requestId;native.receive({type:'connected',peer:'peer-1'});assert.equal(event.peer,'peer-1');native.receive({requestId:id,value:{port:37654}});assert.equal((await pending).port,37654);
  const denied=native.request('join');native.receive({requestId:sent.at(-1).requestId,error:'local-network-permission'});await assert.rejects(denied,/local-network-permission/);
});
test('bridge timeouts release callbacks and disabled native APIs degrade without crashing',async()=>{
  const {native}=bridge();await native.ready;await assert.rejects(native.request('host',{},5),/timeout/);assert.equal(native.pending.size,0);const context=vm.createContext({setTimeout,clearTimeout,Date});vm.runInContext(source,context);assert.equal(context.DemonStarNative.available,false);await assert.rejects(context.DemonStarNative.request('host'),/unsupported/);context.DemonStarNative.haptic('heavy');
});
test('haptics are bounded and unsupported hardware receives no requests',async()=>{
  const {native,sent}=bridge();await native.ready;native.haptic('heavy');native.haptic('heavy');assert.equal(sent.filter(r=>r.method==='haptic').length,1);native.lastHaptic=0;native.capabilities.haptics=false;native.haptic('light');assert.equal(sent.filter(r=>r.method==='haptic').length,1);
});
test('outbound packets are serialized without a response callback and reject oversized content',async()=>{
  const {native,sent}=bridge();await native.ready;native.send('peer-1',{type:'input',x:1});assert.equal(sent.at(-1).requestId,0);assert.equal(JSON.parse(sent.at(-1).data).type,'input');assert.throws(()=>native.send('peer-1','x'.repeat(1048577)),/packet-size/);
});
