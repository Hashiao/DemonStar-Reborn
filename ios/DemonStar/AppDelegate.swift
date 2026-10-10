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
    func applicationDidBecomeActive(_ application: UIApplication) { application.isIdleTimerDisabled = true }
}

final class GameViewController: UIViewController, WKNavigationDelegate {
    private var web: WKWebView!
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .portrait }
    override var shouldAutorotate: Bool { true }
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.03, green: 0.055, blue: 0.085, alpha: 1)
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        // 游戏仅在开始/菜单交互后解锁音乐。 / The game unlocks BGM on start/menu interaction.
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
            // 原生首选语言通过本地 URL 传递，无网络或消息桥接。
            // Pass the native preferred language through a local URL, without a network or message bridge.
            var localizedURL = URLComponents(url: url, resolvingAgainstBaseURL: false)
            localizedURL?.fragment = "system-language=" + (Locale.preferredLanguages.first ?? "en")
            web.loadFileURL(localizedURL?.url ?? url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }
    func suspend() { web?.evaluateJavaScript("window.StarfallApp && StarfallApp.background()", completionHandler: nil) }
    // 显式 CI 参数测试真实打包 WebView，无网络桥接。 / Explicit CI flag tests the packaged WebView, without a network bridge.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard ProcessInfo.processInfo.arguments.contains("--smoke-test") else { return }
        // 冷启动后布局可能改变；等待布局和资源稳定，再按逻辑帧测试操作。
        // Cold WKWebView startup can resize after didFinish. Wait for layout/assets,
        // then measure held/released input in simulation frames, not host wall time.
        let script = """
        (function(){
          var phase=0,stable=0,size='',startFrame=0,releasedX=0,releasedShots=0,sawLaunch=false;
          var initialLocale=DemonStarI18n.locale,preferredLanguage=DemonStarI18n.preferred();
          function pointer(id,type,x){var el=document.getElementById(id),r=el.getBoundingClientRect(),e=new Event(type,{bubbles:true,cancelable:true});e.pointerId=id==='fire'?21:22;e.clientX=r.left+r.width*x;e.clientY=r.top+r.height*.5;el.dispatchEvent(e);}
          var timer=setInterval(function(){try{
            var g=StarfallApp.game,renderer=StarfallApp.renderer,l=renderer.layout,nextSize=l.w+','+l.h;
            if(nextSize===size)stable++;else{size=nextSize;stable=0;}
            window.smokeProgress={probePhase:phase,gamePhase:g.phase,frame:g.frame||0,hidden:document.hidden,stable:stable,size:nextSize,ships:!!renderer.ships.naturalWidth,pickups:!!renderer.pickups.naturalWidth,carriers:!!renderer.carriers.naturalWidth,effects:!!renderer.effects.naturalWidth,musicReady:StarfallApp.music.audio.readyState,musicTime:StarfallApp.music.audio.currentTime,musicPaused:StarfallApp.music.audio.paused,musicError:StarfallApp.music.error,audioState:StarfallApp.audio.ctx?StarfallApp.audio.ctx.state:null};
            if(g.phase==='launch')sawLaunch=true;
            if(document.hidden||stable<10||l.w<100||l.h<100||!renderer.ships.naturalWidth||!renderer.pickups.naturalWidth||!renderer.carriers.naturalWidth||!renderer.effects.naturalWidth||!renderer.attacks.naturalWidth||!renderer.enemyArtReady()||!renderer.presentationReady())return;
            if(phase===0){StarfallApp.start(1);phase=1;return;}
            if(phase===1){if(g.phase!=='playing'||g.frame<6)return;pointer('fire','pointerdown',.5);pointer('joystick','pointerdown',.8);startFrame=g.frame;phase=2;return;}
            if(phase===2){if(g.frame-startFrame<20)return;pointer('fire','pointerup',.5);pointer('joystick','pointerup',.5);document.getElementById('bomb').click();releasedX=g.player.x;releasedShots=g.shotsFired;startFrame=g.frame;phase=3;return;}
            if(g.frame-startFrame<10||StarfallApp.music.audio.readyState<2||StarfallApp.music.audio.currentTime<=0)return;
            var result={launchSeen:sawLaunch,presentationReady:renderer.presentationReady(),phase:g.phase,score:g.score,stage:g.stage.id,elapsed:g.totalTime,bullets:g.bullets.length,shotsFired:g.shotsFired,playerX:g.player.x,lives:g.player.lives,energy:g.player.energy,bombs:g.player.bombs,releaseStops:g.player.x===releasedX&&g.shotsFired===releasedShots,assetsReady:!!renderer.pickups.naturalWidth,motionReady:!!renderer.playerMotion.naturalWidth,carriersReady:!!renderer.carriers.naturalWidth,soundbankReady:!!DemonStarSounds.missionStart,effectsReady:!!renderer.effects.naturalWidth,attacksReady:!!renderer.attacks.naturalWidth,enemyArtReady:renderer.enemyArtReady(),musicReady:StarfallApp.music.audio.readyState>=2,musicTrack:StarfallApp.music.track,musicTime:StarfallApp.music.audio.currentTime,musicError:StarfallApp.music.error,bankAfterRelease:g.player.bank,viewport:[innerWidth,innerHeight],frozenAfterProbe:true};
            // 通过真实设置控件切换三语，并确认暂停中的战斗状态不变。
            // Switch through the real settings control and verify paused combat is unchanged.
            var before=JSON.stringify({player:g.player,score:g.score,stage:g.stage.id,frame:g.frame});
            document.getElementById('pause').click();var languageChecks=[];
            ['zh-Hans','zh-Hant','en'].forEach(function(locale){
              var select=document.getElementById('language');select.value=locale;select.dispatchEvent(new Event('change',{bubbles:true}));
              var ok=document.documentElement.lang===locale&&g.phase==='paused'&&JSON.parse(localStorage.getItem('demonstar-reborn-v1')).language===locale&&document.getElementById('dialog-title').textContent===DemonStarI18n.t('pausedTitle')&&document.getElementById('bomb').getAttribute('aria-label')===DemonStarI18n.t('bombAria',{n:2});
              if(!ok)throw new Error('Native language switching failed: '+locale);languageChecks.push({locale:locale,passed:ok});
            });
            if(JSON.stringify({player:g.player,score:g.score,stage:g.stage.id,frame:g.frame})!==before)throw new Error('Language switch changed combat');
            var select=document.getElementById('language');select.value=initialLocale;select.dispatchEvent(new Event('change',{bubbles:true}));
            result.initialLocale=initialLocale;result.preferredLanguage=preferredLanguage;result.languageChecks=languageChecks;result.languagePreservesCombat=true;
            StarfallApp.music.suspend();window.smokeResult=JSON.stringify(result);clearInterval(timer);
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
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(navigationAction.request.url?.isFileURL == true ? .allow : .cancel)
    }
}
