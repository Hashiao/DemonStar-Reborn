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
        webView.evaluateJavaScript("StarfallApp.start(1)", completionHandler: nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            self?.web.evaluateJavaScript("(function(){var g=StarfallApp.game,r={phase:g.phase,score:g.score,stage:g.stage.id,elapsed:g.totalTime,bullets:g.bullets.length,assetsReady:StarfallApp.renderer.ships.complete&&StarfallApp.renderer.ships.naturalWidth>0,viewport:[innerWidth,innerHeight],frozenAfterProbe:true};g.pause();return JSON.stringify(r);})()") { result, error in
                let text = result as? String ?? "{\"error\":\"JavaScript probe failed\"}"
                if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
                    try? text.write(to: dir.appendingPathComponent("smoke.json"), atomically: true, encoding: .utf8)
                }
            }
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(navigationAction.request.url?.isFileURL == true ? .allow : .cancel)
    }
}
