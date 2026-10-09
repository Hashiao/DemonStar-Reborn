package io.github.hashiao.demonstar;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.io.ByteArrayInputStream;

/** Offline game host. No JavaScript bridge, network permission, accounts or trackers. */
public final class MainActivity extends Activity {
    private WebView web;
    private boolean foreground;

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        web.setBackgroundColor(0xff08121d);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("file:///android_asset/");
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request.getUrl().toString().startsWith("file:///android_asset/")) return null;
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
        });
        FrameLayout host = new FrameLayout(this);
        host.setBackgroundColor(0xff08121d);
        host.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        if (Build.VERSION.SDK_INT >= 30) {
            host.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        setContentView(host);
        host.requestApplyInsets();
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::gameBack);
        web.loadUrl("file:///android_asset/index.html");
    }
    private void gameBack() { if (web != null) web.evaluateJavascript("window.StarfallApp && StarfallApp.back()", null); }
    // API 33+ uses the registered OnBackInvokedCallback above; this is only the legacy fallback.
    @SuppressLint("GestureBackNavigation")
    @Override public void onBackPressed() { gameBack(); }
    @Override protected void onPause() {
        foreground = false;
        if (web != null) { final WebView current = web; current.evaluateJavascript("window.StarfallApp && StarfallApp.background()", result -> { if (!foreground && web == current) current.onPause(); }); }
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); foreground = true; if (web != null) web.onResume(); }
    @Override protected void onDestroy() { if (web != null) { web.stopLoading(); web.destroy(); web = null; } super.onDestroy(); }
}
