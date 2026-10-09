/* SPDX-License-Identifier: MIT. Runtime shims used by iOS 12 WKWebView. */
if(typeof globalThis==='undefined')window.globalThis=window;
if(!Element.prototype.replaceChildren)Element.prototype.replaceChildren=function(){while(this.firstChild)this.removeChild(this.firstChild);for(var i=0;i<arguments.length;i++)this.appendChild(arguments[i]);};
if(!window.PointerEvent){
  Element.prototype.setPointerCapture=function(){};
  (function(){
    var screen=document.getElementById('screen');
    var convert=function(type,event){for(var i=0;i<event.changedTouches.length;i++){var t=event.changedTouches[i],p=new Event(type,{bubbles:true,cancelable:true});p.pointerId=t.identifier;p.clientX=t.clientX;p.clientY=t.clientY;t.target.dispatchEvent(p);if(p.defaultPrevented)event.preventDefault();}};
    screen.addEventListener('touchstart',function(e){convert('pointerdown',e);},{passive:false});
    screen.addEventListener('touchmove',function(e){convert('pointermove',e);},{passive:false});
    screen.addEventListener('touchend',function(e){convert('pointerup',e);},{passive:false});
    screen.addEventListener('touchcancel',function(e){convert('pointercancel',e);},{passive:false});
  })();
}
