package com.manasenger.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * TikTok inside Manasenger: the TikTok feed on top, the app's own tab bar
 * (Чаты, Контакты, Звонки, TikTok, ИИ, Настройки) underneath.
 */
public class TikTokActivity extends Activity {
    private WebView web;

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.rgb(24, 25, 28));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(24, 25, 28));

        // top bar: close TikTok and go back to the chats
        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(10), dp(6), dp(10), dp(6));
        TextView close = new TextView(this);
        close.setText("✕");
        close.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        close.setTextColor(Color.WHITE);
        close.setGravity(Gravity.CENTER);
        GradientDrawable cb = new GradientDrawable();
        cb.setColor(Color.argb(45, 255, 255, 255));
        cb.setCornerRadius(dp(20));
        close.setBackground(cb);
        close.setContentDescription("Закрыть TikTok");
        close.setOnClickListener(v -> goTab("chats"));
        top.addView(close, new LinearLayout.LayoutParams(dp(40), dp(40)));
        TextView title = new TextView(this);
        title.setText("TikTok");
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        title.setTextColor(Color.WHITE);
        title.setPadding(dp(14), 0, 0, 0);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        top.addView(title);
        root.addView(top, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String s = u.getScheme();
                if ("https".equals(s) || "http".equals(s)) return false;
                return true; // "open in the TikTok app" links and other schemes stay out
            }
        });
        root.addView(web, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setPadding(dp(6), dp(6), dp(6), dp(6));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.rgb(40, 42, 46));
        bg.setCornerRadius(dp(30));
        bar.setBackground(bg);
        String[][] tabs = {{"chats", "💬", "Чаты"}, {"contacts", "👤", "Контакты"}, {"calls", "📞", "Звонки"},
                {"tiktok", "♪", "TikTok"}, {"ai", "✦", "ИИ"}, {"settings", "⚙", "Настройки"}};
        for (String[] t : tabs) {
            TextView b = new TextView(this);
            b.setText(t[1] + "\n" + t[2]);
            b.setGravity(Gravity.CENTER);
            b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.5f);
            b.setMaxLines(2);
            b.setTextColor(t[0].equals("tiktok") ? Color.WHITE : Color.rgb(170, 172, 178));
            b.setPadding(0, dp(6), 0, dp(6));
            if (t[0].equals("tiktok")) {
                GradientDrawable on = new GradientDrawable();
                on.setColor(Color.argb(60, 255, 255, 255));
                on.setCornerRadius(dp(24));
                b.setBackground(on);
            }
            final String tab = t[0];
            b.setOnClickListener(v -> {
                if (tab.equals("tiktok")) {
                    web.loadUrl("https://www.tiktok.com/foryou");
                    return;
                }
                goTab(tab);
            });
            bar.addView(b, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        }
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bp.setMargins(dp(8), dp(6), dp(8), dp(8));
        root.addView(bar, bp);
        setContentView(root);

        open(getIntent());
    }

    private void open(Intent i) {
        Uri d = i == null ? null : i.getData();
        String u = d == null ? null : d.getQueryParameter("u");
        if (u == null || !u.matches("https://([\\w-]+\\.)?tiktok\\.com/.*")) u = "https://www.tiktok.com/foryou";
        web.loadUrl(u);
    }

    /** back to Manasenger on the chosen tab */
    private void goTab(String tab) {
        Intent i = new Intent(this, MainActivity.class);
        i.setAction(Intent.ACTION_VIEW);
        i.setData(Uri.parse(CallActivity.BASE + "/#tab/" + tab));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
        finish();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        open(intent);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else goTab("chats");
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
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
