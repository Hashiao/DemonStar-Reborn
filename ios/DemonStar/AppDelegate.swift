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
        configuration.mediaTypesRequiringUserActionForPlayback = .all
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
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }
    func suspend() { web?.evaluateJavaScript("window.StarfallApp && StarfallApp.background()", completionHandler: nil) }
    // Explicit CI launch argument: exercise the real packaged WKWebView, no network bridge.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard ProcessInfo.processInfo.arguments.contains("--smoke-test") else { return }
        // Cold WKWebView startup can resize after didFinish. Wait for layout/assets,
        // then measure held/released input in simulation frames, not host wall time.
        let script = """
        (function(){
          var phase=0,stable=0,size='',startFrame=0,releasedX=0,releasedShots=0;
          function pointer(id,type,x){var el=document.getElementById(id),r=el.getBoundingClientRect(),e=new Event(type,{bubbles:true,cancelable:true});e.pointerId=id==='fire'?21:22;e.clientX=r.left+r.width*x;e.clientY=r.top+r.height*.5;el.dispatchEvent(e);}
          var timer=setInterval(function(){try{
            var g=StarfallApp.game,renderer=StarfallApp.renderer,l=renderer.layout,nextSize=l.w+','+l.h;
            if(nextSize===size)stable++;else{size=nextSize;stable=0;}
            if(document.hidden||stable<10||l.w<100||l.h<100||!renderer.ships.naturalWidth||!renderer.pickups.naturalWidth)return;
            if(phase===0){StarfallApp.start(1);phase=1;return;}
            if(phase===1){if(g.frame<6)return;pointer('fire','pointerdown',.5);pointer('joystick','pointerdown',.8);startFrame=g.frame;phase=2;return;}
            if(phase===2){if(g.frame-startFrame<20)return;pointer('fire','pointerup',.5);pointer('joystick','pointerup',.5);document.getElementById('bomb').click();releasedX=g.player.x;releasedShots=g.shotsFired;startFrame=g.frame;phase=3;return;}
            if(g.frame-startFrame<10)return;
            var result={phase:g.phase,score:g.score,stage:g.stage.id,elapsed:g.totalTime,bullets:g.bullets.length,shotsFired:g.shotsFired,playerX:g.player.x,lives:g.player.lives,energy:g.player.energy,bombs:g.player.bombs,releaseStops:g.player.x===releasedX&&g.shotsFired===releasedShots,assetsReady:!!renderer.pickups.naturalWidth,motionReady:!!renderer.playerMotion.naturalWidth,soundbankReady:!!DemonStarSounds.missionStart,bankAfterRelease:g.player.bank,viewport:[innerWidth,innerHeight],frozenAfterProbe:true};
            g.pause();window.smokeResult=JSON.stringify(result);clearInterval(timer);
          }catch(error){window.smokeResult=JSON.stringify({error:String(error)});clearInterval(timer);}},50);
        })();
        """
        webView.evaluateJavaScript(script) { [weak self] _, _ in self?.collectSmokeResult(attempts: 60) }
    }
    private func collectSmokeResult(attempts: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.web.evaluateJavaScript("window.smokeResult || null") { result, error in
                if let text = result as? String { self?.saveSmokeResult(text) }
                else if attempts > 0 { self?.collectSmokeResult(attempts: attempts - 1) }
                else { self?.saveSmokeResult("{\"error\":\"Timed out waiting for stable WKWebView input probe\"}") }
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
