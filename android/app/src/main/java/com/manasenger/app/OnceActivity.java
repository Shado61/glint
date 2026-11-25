package com.manasenger.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * A view-once photo, video, voice or circle, shown in a protected window:
 * screenshots and screen recordings of it come out black (FLAG_SECURE).
 */
public class OnceActivity extends Activity {
    private WebView web;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        Uri data = getIntent().getData();
        String path = data == null ? null : data.getQueryParameter("u");
        String kind = data == null ? "photo" : data.getQueryParameter("k");
        if (path == null || !path.startsWith("/once/") || !path.matches("/once/[A-Za-z0-9_-]{20,40}\\?n=1")) {
            finish();
            return;
        }
        if (kind == null) kind = "photo";
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(false);
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void close() {
                runOnUiThread(() -> finish());
            }
        }, "Mn");
        String label = kind.equals("video") ? "видео" : kind.equals("voice") ? "голосовое" : kind.equals("round") ? "видеосообщение" : "фото";
        String media;
        switch (kind) {
            case "video":
                media = "<video src='" + path + "' autoplay playsinline controls controlslist='nodownload' disablepictureinpicture onended='setTimeout(()=>Mn.close(),500)'></video>";
                break;
            case "round":
                media = "<video class='r' src='" + path + "' autoplay playsinline onended='setTimeout(()=>Mn.close(),500)'></video>";
                break;
            case "voice":
                media = "<div class='v'>🎤</div><audio src='" + path + "' autoplay controls onended='setTimeout(()=>Mn.close(),500)'></audio>";
                break;
            default:
                media = "<img src='" + path + "'>";
        }
        String html = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>html,body{margin:0;height:100%;background:#000;color:#fff;font:15px sans-serif;-webkit-user-select:none;user-select:none}"
                + ".top{position:fixed;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:14px 14px 10px 16px;z-index:2}"
                + ".x{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.15);color:#fff;font-size:22px}"
                + ".b{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px}"
                + "img,video{max-width:100%;max-height:100%;object-fit:contain;-webkit-touch-callout:none;pointer-events:none}video[controls]{pointer-events:auto}"
                + "video.r{width:80vw;height:80vw;border-radius:50%;object-fit:cover;transform:scaleX(-1)}"
                + ".v{width:110px;height:110px;border-radius:50%;display:grid;place-items:center;font-size:48px;background:linear-gradient(135deg,#ff9a4c,#e8457c)}</style></head>"
                + "<body oncontextmenu='return false'><div class='top'><span>🔥 Одноразовое " + label + " · скриншот не сохранится</span><button class='x' onclick='Mn.close()'>✕</button></div>"
                + "<div class='b'>" + media + "</div></body></html>";
        web.loadDataWithBaseURL(CallActivity.BASE + "/", html, "text/html", "UTF-8", null);
        setContentView(web);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
        }
        super.onDestroy();
    }
}
