import UIKit
import WebKit

@UIApplicationMain
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = GameViewController()
        window?.makeKeyAndVisible()
        application.isIdleTimerDisabled = true
        return true
    }
    func applicationWillResignActive(_ application: UIApplication) {
        (window?.rootViewController as? GameViewController)?.suspend()
        application.isIdleTimerDisabled = false
    }
    func applicationDidBecomeActive(_ application: UIApplication) { application.isIdleTimerDisabled = true; (window?.rootViewController as? GameViewController)?.activate() }
}

final class GameViewController: UIViewController, WKNavigationDelegate {
    private var web: WKWebView!
    private var bridge: GameBridge!
    #if targetEnvironment(simulator)
    private var touchProbeLabel: UILabel?
    #endif
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .portrait }
    override var shouldAutorotate: Bool { true }
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.03, green: 0.055, blue: 0.085, alpha: 1)
        let configuration = WKWebViewConfiguration()
        bridge = GameBridge { [weak self] event in
            guard let self = self, self.web?.url?.isFileURL == true, let data = try? JSONSerialization.data(withJSONObject: event), let text = String(data: data, encoding: .utf8) else { return }
            self.web.evaluateJavaScript("window.DemonStarNative && DemonStarNative.receive(" + text + ")", completionHandler: nil)
        }
        configuration.userContentController.add(bridge, name: "demonstar")
        configuration.allowsInlineMediaPlayback = true
        // 首屏可播放，游戏继续尊重保存的静音与音量。 / Permit startup BGM while respecting saved mute/volume.
        configuration.mediaTypesRequiringUserActionForPlayback = []
        web = WKWebView(frame: .zero, configuration: configuration)
        web.isOpaque = false
        web.backgroundColor = view.backgroundColor
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.navigationDelegate = self
        web.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            // 原生首选语言仍通过本地 URL 传递。 / Continue passing the native language in the local URL.
            var localizedURL = URLComponents(url: url, resolvingAgainstBaseURL: false)
            localizedURL?.fragment = "system-language=" + (Locale.preferredLanguages.first ?? "en")
            web.loadFileURL(localizedURL?.url ?? url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }
    deinit { bridge?.suspendMusic(); bridge?.stop(); web?.configuration.userContentController.removeScriptMessageHandler(forName: "demonstar") }
    func suspend() { bridge?.suspendMusic(); web?.evaluateJavaScript("window.StarfallApp && StarfallApp.background()", completionHandler: nil) }
    func activate() { web?.evaluateJavaScript("window.StarfallApp && StarfallApp.foreground()", completionHandler: nil) }
    // 显式 CI 参数测试真实打包 WebView；常规烟测不主动建立局域网连接。
    // Explicit CI probes exercise the packaged WebView; the standard smoke test does not open LAN connections.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        #if targetEnvironment(simulator)
        if ProcessInfo.processInfo.arguments.contains("--touch-probe") { installTouchProbe(); return }
        // 仅模拟器显式参数读取 CI 放入沙盒的探针，不包含在 iPhoneOS 分支。
        // Only an explicit simulator argument loads the sandbox CI probe; excluded from iPhoneOS.
        if ProcessInfo.processInfo.arguments.contains("--lan-probe"),
           let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first,
           let script = try? String(contentsOf: dir.appendingPathComponent("lan-probe.js"), encoding: .utf8) {
            webView.evaluateJavaScript(script) { [weak self] _, error in
                if let error = error { self?.saveLANProbe(["status": "error", "error": error.localizedDescription]) }
                else { self?.collectLANProbe(attempts: 360) }
            }
            return
        }
        #endif
        guard ProcessInfo.processInfo.arguments.contains("--smoke-test") else { return }
        // 冷启动后布局可能改变；等待布局和资源稳定，再按逻辑帧测试操作。
        // Cold WKWebView startup can resize after didFinish. Wait for layout/assets,
        // then measure held/released input in simulation frames, not host wall time.
        let script = """
        (function(){
          var phase=0,stable=0,size='',startFrame=0,releasedX=0,releasedShots=0,sawLaunch=false,startupMusic=null;
          var initialLocale=DemonStarI18n.locale,preferredLanguage=DemonStarI18n.preferred();
          // 探针保留原生音乐请求/回复时序；观察原 Promise，不替换播放器或返回值。
          // Trace native music requests/replies in the probe; observe original promises without replacing playback/results.
          var musicTrace=[],musicStep='startup',traceStart=performance.now(),nativeRequest=StarfallApp.native.request;
          function traceMusic(value){musicTrace.push(Object.assign({ms:performance.now()-traceStart},value));if(musicTrace.length>80)musicTrace.shift();}
          StarfallApp.native.request=function(method,fields,timeout){var task=nativeRequest.apply(this,arguments);if(method==='music'){var at=performance.now();traceMusic({event:'request',step:musicStep,fields:fields});task.then(function(value){traceMusic({event:'reply',step:musicStep,elapsed:performance.now()-at,value:value});},function(error){traceMusic({event:'error',step:musicStep,elapsed:performance.now()-at,error:String(error)});});}return task;};
          function musicDiagnostic(){var m=StarfallApp.music;return {step:musicStep,hidden:document.hidden,gamePhase:StarfallApp.game.phase,desired:{enabled:m.enabled,paused:m.paused,volume:m.volume,ducked:m.ducked,track:m.track},nativePending:m.nativePending,syncQueued:!!m.syncQueued,nativeSignature:m.nativeSignature,nextPoll:m.nextPoll,now:m.clock(),bridgePending:StarfallApp.native.pending.size,snapshot:m.snapshot(),trace:musicTrace.slice()};}
          // 验收真实原生时钟、暂停/恢复和音量，不用 HTMLAudio 的代理数值。
          // Check the real native clock, pause/resume and volume, not HTMLAudio stand-ins.
          async function verifyMusic(){
            var m=StarfallApp.music,volume=m.volume;
            function wait(check,label){musicStep=label;return new Promise(function(resolve,reject){var began=Date.now();var poll=setInterval(function(){var state=m.snapshot();if(state.error){clearInterval(poll);reject(new Error(state.error));}else if(!m.nativePending&&check(state)){clearInterval(poll);resolve(state);}else if(Date.now()-began>8000){clearInterval(poll);reject(new Error('Native music state timeout: '+label+' '+JSON.stringify(state)));}},50);});}
            function delay(){return new Promise(function(resolve){setTimeout(resolve,350);});}
            m.suspend();var paused=await wait(function(s){return s.ready&&s.paused;},'pause-initial');await delay();
            var still=await StarfallApp.native.request('music',{action:'status'});
            if(Math.abs(still.currentTime-paused.currentTime)>.03)throw new Error('Paused native clock advanced');
            m.resume();await wait(function(s){return !s.paused&&s.currentTime>paused.currentTime+.1;},'resume-clock');
            m.setEnabled(false);await wait(function(s){return s.paused;},'mute');m.setEnabled(true);await wait(function(s){return !s.paused;},'unmute');
            StarfallApp.audio.stopMission();m.volume=.17;m.update(false);await wait(function(s){return Math.abs(s.volume-.17)<.001;},'volume-17');
            m.volume=0;m.update(false);await wait(function(s){return s.volume===0;},'volume-zero');
            m.volume=volume;m.suspend();await wait(function(s){return s.paused;},'pause-final');
            return {backend:'ios-native',pauseClockStable:true,resumeClockAdvanced:true,muteRespected:true,volumeRespected:true,zeroVolumeRespected:true};
          }
          function pointer(id,type,x){var el=document.getElementById(id),r=el.getBoundingClientRect(),e=new Event(type,{bubbles:true,cancelable:true});e.pointerId=id==='fire'?21:22;e.clientX=r.left+r.width*x;e.clientY=r.top+r.height*.5;el.dispatchEvent(e);}
          var timer=setInterval(function(){try{
            var g=StarfallApp.game,renderer=StarfallApp.renderer,l=renderer.layout,nextSize=l.w+','+l.h,ms=StarfallApp.music.snapshot();
            if(nextSize===size)stable++;else{size=nextSize;stable=0;}
            window.smokeProgress={probePhase:phase,gamePhase:g.phase,frame:g.frame||0,hidden:document.hidden,stable:stable,size:nextSize,ships:!!renderer.ships.naturalWidth,pickups:!!renderer.pickups.naturalWidth,carriers:!!renderer.carriers.naturalWidth,effects:!!renderer.effects.naturalWidth,musicBackend:ms.backend,musicReady:ms.ready,musicTime:ms.currentTime,musicPaused:ms.paused,musicError:StarfallApp.music.error,musicNetworkState:StarfallApp.music.audio.networkState,musicSrc:StarfallApp.music.audio.currentSrc,musicRequestedSrc:StarfallApp.music.audio.src,musicTrack:StarfallApp.music.track,musicEnabled:StarfallApp.music.enabled,musicUnlocked:StarfallApp.music.unlocked,musicPausedByApp:StarfallApp.music.paused,musicLoadRetries:StarfallApp.music.loadRetries,musicPlayFailure:StarfallApp.music.playFailure,audioState:StarfallApp.audio.ctx?StarfallApp.audio.ctx.state:null};
            if(g.phase==='launch')sawLaunch=true;
            if(document.hidden||stable<10||l.w<100||l.h<100||!renderer.ships.naturalWidth||!renderer.pickups.naturalWidth||!renderer.carriers.naturalWidth||!renderer.effects.naturalWidth||!renderer.attacks.naturalWidth||!renderer.enemyArtReady()||!renderer.presentationReady())return;
            if(ms.error)throw new Error('Native music: '+ms.error);if(phase===0){if(ms.backend!=='ios-native'||!ms.ready||ms.paused||ms.currentTime<=0)return;startupMusic=ms;document.getElementById('start').click();document.getElementById('setup-start').click();phase=1;return;}
            if(phase===1){if(g.phase!=='playing'||g.frame<6)return;g.player.invincible=999;pointer('fire','pointerdown',.5);pointer('joystick','pointerdown',.5);pointer('joystick','pointermove',.95);startFrame=g.frame;phase=2;return;}
            if(phase===2){if(g.frame-startFrame<20)return;pointer('fire','pointerup',.5);pointer('joystick','pointerup',.5);document.getElementById('bomb').click();releasedX=g.player.x;releasedShots=g.shotsFired;startFrame=g.frame;phase=3;return;}
            if(phase===3){
              if(g.frame-startFrame<10)return;
              if(!StarfallApp.input.firing(0)||g.shotsFired<=releasedShots)throw new Error('Toggle did not keep firing after release');
              document.getElementById('pause').click();document.getElementById('pause-settings').click();document.getElementById('control-settings').click();
              var fireMode=document.getElementById('fire-mode');fireMode.value='hold';fireMode.dispatchEvent(new Event('change',{bubbles:true}));
              if(StarfallApp.input.firing(0))throw new Error('Switching to hold retained old fire');
              StarfallApp.back();StarfallApp.back();Array.from(document.querySelectorAll('#dialog-buttons button')).find(function(b){return b.textContent===DemonStarI18n.t('resume');}).click();
              releasedX=g.player.x;releasedShots=g.shotsFired;startFrame=g.frame;phase=4;return;
            }
            if(g.frame-startFrame<10||ms.backend!=='ios-native'||!ms.ready||ms.paused||ms.currentTime<=0)return;
            var result={launchSeen:sawLaunch,presentationReady:renderer.presentationReady(),weaponArtReady:renderer.playerWeapons.naturalWidth>0,weaponSizes:{homing:[DemonStarWeaponArt.shots[39].width,DemonStarWeaponArt.shots[39].height],red:[29,30,31,48,49,50].map(function(t){return DemonStarWeaponArt.shots[t].width;}),blue:[26,27,28].map(function(t){return DemonStarWeaponArt.shots[t].height;})},phase:g.phase,score:g.score,stage:g.stage.id,elapsed:g.totalTime,bullets:g.bullets.length,shotsFired:g.shotsFired,playerX:g.player.x,lives:g.player.lives,energy:g.player.energy,bombs:g.player.bombs,releaseStops:g.player.x===releasedX&&g.shotsFired===releasedShots,assetsReady:!!renderer.pickups.naturalWidth,motionReady:!!renderer.playerMotion.naturalWidth,carriersReady:!!renderer.carriers.naturalWidth,soundbankReady:!!DemonStarSounds.missionStart,effectsReady:!!renderer.effects.naturalWidth,attacksReady:!!renderer.attacks.naturalWidth,enemyArtReady:renderer.enemyArtReady(),musicBackend:ms.backend,startupMusic:startupMusic,musicReady:ms.ready,musicTrack:StarfallApp.music.track,musicTime:ms.currentTime,musicError:StarfallApp.music.error,bankAfterRelease:g.player.bank,viewport:[innerWidth,innerHeight],frozenAfterProbe:true};
            // 通过真实设置控件切换三语，并确认暂停中的战斗状态不变。
            // Switch through the real settings control and verify paused combat is unchanged.
            var before=JSON.stringify({player:g.player,score:g.score,stage:g.stage.id,frame:g.frame});
            document.getElementById('pause').click();document.getElementById('pause-settings').click();document.getElementById('control-settings').click();
            var fireMode=document.getElementById('fire-mode');fireMode.value='toggle';fireMode.dispatchEvent(new Event('change',{bubbles:true}));
            if(StarfallApp.input.firing(0))throw new Error('Switching back to toggle revived old fire');
            result.fireModeChecks={toggleSurvivesRelease:true,pausedSwitchToHoldStops:true,switchBackToToggleStaysOff:true,floatingDefault:StarfallApp.input.config.players[0].touch==='floating'};
            StarfallApp.back();document.getElementById('settings-display').click();var languageChecks=[];
            // 两项血条独立，默认仅 Boss；开关不能改变战斗状态。
            // Health-bar switches are independent and default to Boss only, without changing combat.
            var regular=document.getElementById('health-toggle'),bossBar=document.getElementById('boss-health-toggle');
            result.healthBarDefaults={regular:regular.getAttribute('aria-pressed')==='true',boss:bossBar.getAttribute('aria-pressed')==='true'};
            if(result.healthBarDefaults.regular||!result.healthBarDefaults.boss)throw new Error('Wrong health-bar defaults');
            regular.click();if(bossBar.getAttribute('aria-pressed')!=='true')throw new Error('Regular toggle changed Boss bars');
            bossBar.click();if(regular.getAttribute('aria-pressed')!=='true')throw new Error('Boss toggle changed regular bars');
            regular.click();bossBar.click();result.independentHealthBarSwitches=true;StarfallApp.back();document.getElementById('settings-language').click();
            ['zh-Hans','zh-Hant','en'].forEach(function(locale){
              var select=document.getElementById('language');select.value=locale;select.dispatchEvent(new Event('change',{bubbles:true}));
              var ok=document.documentElement.lang===locale&&g.phase==='paused'&&JSON.parse(localStorage.getItem('demonstar-reborn-v1')).language===locale&&document.getElementById('dialog-title').textContent===DemonStarI18n.t('language')&&document.getElementById('bomb').getAttribute('aria-label')===DemonStarI18n.t('bombAria',{n:2});
              if(!ok)throw new Error('Native language switching failed: '+locale);languageChecks.push({locale:locale,passed:ok});
            });
            if(JSON.stringify({player:g.player,score:g.score,stage:g.stage.id,frame:g.frame})!==before)throw new Error('Language switch changed combat');
            var select=document.getElementById('language');select.value=initialLocale;select.dispatchEvent(new Event('change',{bubbles:true}));
            result.initialLocale=initialLocale;result.preferredLanguage=preferredLanguage;result.languageChecks=languageChecks;result.languagePreservesCombat=true;
            StarfallApp.music.suspend();clearInterval(timer);
            // 逐张解码打包的全战役图集，不同时保留整套图片。
            // Decode every packaged campaign atlas sequentially without retaining the full set.
            var paths=Object.keys(DemonStarCampaignArt.assets).concat(Object.keys(DemonStarEnemyShots.assets),Object.keys(DemonStarBossDeathArt.assets)),checked=[];
            function checkAtlas(index){
              if(index===paths.length){result.campaignArt={decoded:checked,prototypeRoutes:Object.keys(DemonStarCampaignArt.routes).length,enemyTypes:Object.keys(DemonStarEnemyShots.shots).length,bossDeathRoutes:Object.keys(DemonStarBossDeathArt.sprites).length};window.smokeResult=JSON.stringify(result);return;}
              // file URL 画布允许绘制但禁止像素回读；在原生端核对解码尺寸，像素覆盖由浏览器测试负责。
              // File-URL canvases permit drawing but reject pixel readback; verify decoded sizes here and pixels in browser tests.
              var image=new Image();image.onload=function(){try{var expected=(DemonStarCampaignArt.assets[paths[index]]||DemonStarEnemyShots.assets[paths[index]]||DemonStarBossDeathArt.assets[paths[index]]).size;if(!image.complete||image.naturalWidth!==expected[0]||image.naturalHeight!==expected[1])throw new Error('Wrong atlas dimensions: '+paths[index]);var canvas=document.createElement('canvas');canvas.width=canvas.height=64;canvas.getContext('2d').drawImage(image,0,0,64,64);checked.push(paths[index]);checkAtlas(index+1);}catch(e){window.smokeResult=JSON.stringify({error:'Atlas probe: '+String(e)});}};image.onerror=function(){window.smokeResult=JSON.stringify({error:'Atlas failed: '+paths[index]});};image.src=paths[index];
            }
            // 打包 WebKit 中验证目标移动及传感器不可用回退，不宣称模拟器有真实倾斜。
            // Verify target travel and unavailable-sensor fallback in packaged WebKit, not physical tilt.
            async function verifyAdvancedControls(){
              // 失败时记录真实音频时钟和上下文；不重置时钟、不跳过断言。
              // Record actual audio clocks/context on failure; never reset clocks or skip assertions.
              function waitFor(check,label){return new Promise(function(resolve,reject){var limit=Date.now()+8000;var poll=setInterval(function(){if(check()){clearInterval(poll);resolve();}else if(Date.now()>limit){clearInterval(poll);reject(new Error('Advanced controls timeout: '+label+' '+JSON.stringify({phase:g.phase,x:g.player.x,y:g.player.y,target:StarfallApp.input.states[0].target,mode:StarfallApp.input.mode(0),dialog:!document.getElementById('dialog').hidden,audio:sound&&sound.ctx?{state:sound.ctx.state,time:sound.ctx.currentTime,next:nextShot,round:round,sameContext:sound.ctx===probeContext,halted:sound.halted,canSample:sound.canSample(),lastShots:Array.from(sound.lastShots.entries())}:null})));}},40);});}
              function mode(value){StarfallApp.showControls();var select=document.getElementById('touch-mode');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));StarfallApp.back();StarfallApp.back();StarfallApp.back();}
              g.recordEvents=[];g.enemies=[];g.bullets=[];g.player.invincible=999;
              // 四难度验证同一机动上限；秒数为逻辑步换算。
              // Verify one mobility cap across four difficulties; seconds are simulation-step conversions.
              for(var difficulty=0;difficulty<4;difficulty++){
                var mobility=new StarfallCore.Game(19),hitX=0,hitY=0;mobility.start(difficulty);mobility.recordEvents=[];mobility.player.x=16;mobility.player.y=64;mobility.player.invincible=999;
                for(var tick=1;tick<=50;tick++){mobility.update(0.035,{x:1,y:1});if(!hitX&&mobility.player.x>=384-0.000001)hitX=tick;if(!hitY&&mobility.player.y>=440-0.000001)hitY=tick;}
                if(hitX!==48||hitY!==50)throw new Error('Wrong mobility traversal');
              }
              result.mobility={difficulties:4,horizontalTicks:48,verticalTicks:50,diagonalAxesRetainSpeed:true};
              // 简单难度预警原生运行验证，仅在显式 smoke-test 中执行。
              // Verify Easy warnings only in the explicit native smoke test.
              result.laserWarning=(() => {
               const {Game,STEP}=StarfallCore,g=new Game(222);g.start(0,1,false,{playerCount:2});g.recordEvents=[];g.spawnRecord([200,0,40,0,1,-1,0,0]);
               const e=g.enemies[0];Object.assign(e,{x:200,y:80,px:200,py:80,entered:true,pathFinished:true,exitX:0,exitY:0});e.guns=e.guns.filter(gun=>gun.raw[2]===9);e.guns[0].delay=20;g.player.x=199;g.player.invincible=0;
               g.update(STEP);if(g.laserWarnings.length!==1||g.player.energy!==16||g.bullets.length)throw new Error('Laser warning missing or harmful');
               const client=new Game(223);if(!DemonStarNetworkState.apply(client,DemonStarNetworkState.encode(g),false)||JSON.stringify(client.laserWarnings)!==JSON.stringify(g.laserWarnings))throw new Error('Laser warning snapshot mismatch');
               g.pause();const frame=g.frame;g.update(.25);if(g.frame!==frame)throw new Error('Paused warning advanced');g.setDifficulty(1);if(g.laserWarnings.length)throw new Error('Warning outside Easy');g.setDifficulty(0);if(g.laserWarnings[0].ticks!==20)throw new Error('Difficulty reset warning timer');g.resume();
               for(let i=0;i<19;i++){g.update(STEP);if(g.player.energy!==16)throw new Error('Warning damaged player');}g.update(STEP);if(g.player.energy!==14||g.laserWarnings.length||!g.bullets.some(b=>b.beam))throw new Error('Laser warning handoff failed');
               return {harmless:true,firstHit:true,pauseDifficulty:true,network:true,players:2};
              })();
              mode('point');var layout=renderer.layout;document.getElementById('game').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:812,pointerType:'touch',clientX:layout.x+100*layout.scale,clientY:layout.y+200*layout.scale}));
              var destination=StarfallApp.input.states[0].target;if(!destination||Math.abs(destination.x-100)>2||Math.abs(destination.y-200)>2)throw new Error('Point event not captured');
              await waitFor(function(){return Math.abs(g.player.x-destination.x)<0.01&&Math.abs(g.player.y-destination.y)<0.01;},'point-arrival');
              document.getElementById('game').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:812,pointerType:'touch',clientX:layout.x+300*layout.scale,clientY:layout.y+300*layout.scale}));
              await waitFor(function(){return g.player.x>110;},'follow-move');
              document.getElementById('game').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:812,pointerType:'touch',clientX:layout.x+300*layout.scale,clientY:layout.y+300*layout.scale}));
              var released={x:g.player.x,y:g.player.y};await new Promise(function(resolve){setTimeout(resolve,200);});
              if(StarfallApp.input.states[0].target!==null||g.player.x!==released.x||g.player.y!==released.y)throw new Error('Follow movement continued after release');
              StarfallApp.input.config.doubleTapBomb=true;g.player.bombInventory=[0,1,2];g.player.bombCooldown=0;g.player.respawn=0;
              for(var tap=0;tap<2;tap++)for(var eventType of ['pointerdown','pointerup'])document.getElementById('game').dispatchEvent(new PointerEvent(eventType,{bubbles:true,cancelable:true,pointerId:813,pointerType:'touch',clientX:layout.x+300*layout.scale,clientY:layout.y+300*layout.scale}));
              await waitFor(function(){return g.player.bombs===2;},'double-tap-bomb');StarfallApp.input.config.doubleTapBomb=false;
              var sound=StarfallApp.audio;
              if(!(sound instanceof DemonStarIOSAudio)||!(StarfallApp.music instanceof DemonStarIOSMusic))throw new Error('iOS audio adapters not selected');
              // 验证共用调度及双人射击保留；不代表扬声器听感实测。
              // Verify shared scheduling and protected two-player shots, not speaker listening quality.
              if(DemonStarIOSAudio.prototype.sample!==StarfallAudio.prototype.sample)throw new Error('Duplicated platform scheduler');
              // 菜单恢复异步完成后再测调度，避免未接受的首轮请求把下一次时钟变成 NaN。
              // Await asynchronous menu resume before scheduler assertions; rejected initial shots would produce a NaN clock.
              await waitFor(function(){return sound.canSample();},'audio-ready');
              sound.stopAll();sound.resetEffectTimers();var accepted=0,nextShot=sound.ctx.currentTime,probeContext=sound.ctx;
              for(var round=0;round<10;round++){
                await waitFor(function(){return sound.ctx.currentTime>=nextShot;},'audio-shot-clock');
                for(var effect of ['explosion','groundExplosion','heavyExplosion','hit','enemyShot','enemyMissile','enemyLaser','bossEngine1'])sound.sample(effect);
                for(var owner of [1,2]){var previous=sound.lastShots.get(owner);sound.effect('shot',{weapon:owner-1,playerId:owner});if(sound.lastShots.get(owner)!==previous)accepted++;}
                if(!Number.isFinite(sound.lastShots.get(1))||!Number.isFinite(sound.lastShots.get(2)))throw new Error('Ready audio rejected initial player shots');
                if(sound.active.filter(function(s){return s.voiceGroup==='world';}).length>8||sound.active.filter(function(s){return s.playerId>0;}).length>4)throw new Error('Unbounded audio voices');
                nextShot=Math.max(sound.lastShots.get(1),sound.lastShots.get(2))+0.09;
              }
              if(accepted!==20)throw new Error('Dense combat lost player shots');result.sharedAudio={sharedScheduler:true,shotsAccepted:accepted};
              sound.stopAll();var fading=sound.sample('hit');if(!fading)throw new Error('iOS sound did not start');sound.stopSource(fading);
              if(fading.finished||sound.active.indexOf(fading)>=0)throw new Error('iOS sound disconnected before release tail');
              await waitFor(function(){return fading.finished;},'audio-release-tail');
              document.getElementById('pause').click();await waitFor(function(){return sound.ctx.state==='suspended';},'audio-paused');
              StarfallApp.showControls();sound.unlock();await new Promise(function(resolve){setTimeout(resolve,80);});
              if(sound.ctx.state!=='suspended')throw new Error('Paused settings resumed battle audio');
              result.iosAudio={nativeAdapters:true,releaseTail:true,pausedSettingsSilent:true};mode('tilt');
              await waitFor(function(){return StarfallApp.input.motionFallback===true||!!document.getElementById('tilt-ready')&&!document.getElementById('tilt-ready').disabled;},'motion-ready');
              var fallback=StarfallApp.input.motionFallback===true;
              if(!fallback)document.getElementById('tilt-fallback').click();
              await waitFor(function(){return g.phase==='playing';},'motion-resume');
              document.getElementById('pause').click();StarfallApp.showControls();var select=document.getElementById('touch-mode');select.value='floating';select.dispatchEvent(new Event('change',{bubbles:true}));
              result.advancedControls={pointArrived:true,followReleaseStops:true,doubleTapBomb:true,motionRequestCompleted:true,floatingFallback:StarfallApp.input.mode(0)==='floating',simulatorMotionUnavailable:fallback};
              StarfallApp.music.suspend();
            }
            verifyMusic().then(function(checks){result.nativeMusicChecks=checks;return verifyAdvancedControls();}).then(function(){checkAtlas(0);}).catch(function(error){var failure=musicDiagnostic();
              // 失败仍算失败；额外观察 8 秒，以区分晚回复与真正丢失/卡住的原生请求。
              // Keep the failure; observe eight more seconds to distinguish late replies from lost/stalled native requests.
              setTimeout(function(){window.smokeResult=JSON.stringify({error:String(error),musicAtFailure:failure,musicAfterFailure:musicDiagnostic()});},8000);
            });
          }catch(error){window.smokeResult=JSON.stringify({error:String(error)});clearInterval(timer);}},50);
        })();
        """
        webView.evaluateJavaScript(script) { [weak self] _, _ in self?.collectSmokeResult(attempts: 180) }
    }
    private func collectSmokeResult(attempts: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.web.evaluateJavaScript("window.smokeResult || null") { result, error in
                if let text = result as? String { self?.saveSmokeResult(text) }
                else if attempts > 0 { self?.collectSmokeResult(attempts: attempts - 1) }
                else {
                    self?.web.evaluateJavaScript("JSON.stringify({error:'Timed out waiting for stable WKWebView input probe',progress:window.smokeProgress||null})") { progress, _ in
                        self?.saveSmokeResult(progress as? String ?? "{\"error\":\"WKWebView probe did not respond\"}")
                    }
                }
            }
        }
    }
    private func saveSmokeResult(_ text: String) {
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            try? text.write(to: dir.appendingPathComponent("smoke.json"), atomically: true, encoding: .utf8)
        }
    }
    #if targetEnvironment(simulator)
    // 仅显式模拟器 UI 测试提供状态读数；手势由 XCTest 从系统层发送。
    // Explicit simulator UI tests expose observations only; XCTest sends gestures through the system.
    private func installTouchProbe() {
        let label = UILabel(frame: CGRect(x: 0, y: view.safeAreaInsets.top, width: 100, height: 12))
        label.text = "Touch probe"; label.font = .systemFont(ofSize: 8); label.isAccessibilityElement = true
        label.accessibilityIdentifier = "touch-probe"; view.addSubview(label); touchProbeLabel = label
        let script = """
        (function(){var held={},holds={},selected=false,cancels=0;
          document.addEventListener('touchstart',function(e){Array.from(e.changedTouches).forEach(function(t){var el=t.target.closest('.touch-stick,.touch-actions button');if(el)held[t.identifier]={id:el.id,at:performance.now()};});},{passive:true});
          ['touchend','touchcancel'].forEach(function(type){document.addEventListener(type,function(e){Array.from(e.changedTouches).forEach(function(t){var h=held[t.identifier];if(h){holds[h.id]=Math.max(holds[h.id]||0,(performance.now()-h.at)/1000);if(type==='touchcancel')cancels++;delete held[t.identifier];}});},{passive:true});});
          setInterval(function(){var a=window.StarfallApp;if(!a)return;var g=a.game;if(g.phase==='playing'){g.recordEvents=[];g.enemies=[];g.bullets=[];g.players.forEach(function(p){p.invincible=999;});if(String(getSelection()))selected=true;}
            var rects={};['fire','bomb','joystick','fire-2','bomb-2','joystick-2'].forEach(function(id){var e=document.getElementById(id),r=e.getBoundingClientRect();rects[id]={x:r.x,y:r.y,w:r.width,h:r.height};});
            window.touchProbeResult={phase:g.phase,players:(g.players||[]).map(function(p){return {x:p.x,shots:p.shotsFired,bombs:p.bombs,fireMode:a.input.config.players[p.id-1].fireMode,latched:a.input.firing(p.id-1),touch:a.input.config.players[p.id-1].touch};}),holds:holds,selected:selected,cancels:cancels,rects:rects,guard:getComputedStyle(document.querySelector('#fire b')).webkitUserSelect};
          },100);
        })();
        """
        web.evaluateJavaScript(script) { [weak self] _, _ in self?.collectTouchProbe() }
    }
    private func collectTouchProbe() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            self?.web.evaluateJavaScript("window.touchProbeResult || null") { [weak self] result, _ in
                guard let self = self else { return }
                // 状态未变时不反复改写无障碍树；此处只用于显式模拟器测试。
                // Avoid accessibility-tree churn for unchanged observations; explicit simulator tests only.
                if let value = result as? [String: Any], let data = try? JSONSerialization.data(withJSONObject: value, options: .sortedKeys), let text = String(data: data, encoding: .utf8), self.touchProbeLabel?.accessibilityLabel != text {
                    self.touchProbeLabel?.accessibilityLabel = text
                    if value["phase"] as? String == "playing", let players = value["players"] as? [Any],
                       let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
                        try? data.write(to: dir.appendingPathComponent("touch-probe-\(players.count).json"), options: .atomic)
                    }
                }
                self.collectTouchProbe()
            }
        }
    }
    private func saveLANProbe(_ value: [String: Any]) {
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first,
           let data = try? JSONSerialization.data(withJSONObject: value) {
            try? data.write(to: dir.appendingPathComponent("lan-probe.json"), options: .atomic)
        }
    }
    private func collectLANProbe(attempts: Int, awaitingRun: Bool = true) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.web.evaluateJavaScript("window.lanProbeResult || null") { result, error in
                var remaining = attempts
                var waiting = awaitingRun
                if let value = result as? [String: Any] {
                    self?.saveLANProbe(value)
                    if let status = value["status"] as? String, status == "passed" || status == "error" { return }
                    // 客机冷启动不能消耗已入局的验收预算；大厅和对局各保留原有 360 次上限。
                    // Peer cold boot must not consume the active-run budget; lobby and gameplay each retain the 360-poll cap.
                    if waiting, let step = value["step"] as? Int, step >= 2 { remaining = 360; waiting = false }
                }
                if remaining > 0 { self?.collectLANProbe(attempts: remaining - 1, awaitingRun: waiting) }
                else { self?.saveLANProbe(["status": "error", "error": "Native LAN probe timed out", "awaitingRun": waiting, "lastProbe": result ?? NSNull()]) }
            }
        }
    }
    #endif
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(navigationAction.request.url?.isFileURL == true ? .allow : .cancel)
    }
}
