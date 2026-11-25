package com.manasenger.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** The incoming call screen: comes up over the lock screen, rings, "Answer" opens the call in Manasenger. */
public class CallActivity extends Activity {
    static final String BASE = "https://glint-v57l.onrender.com";
    private static CallActivity current;

    private String tag, id, code;
    private int pid;
    private boolean group;
    private Ringtone ringtone;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());

    static Intent intent(Context c, boolean group, String id, String code, String title, String body, String tag, int pid) {
        Intent i = new Intent(c, CallActivity.class);
        i.putExtra("group", group).putExtra("id", id).putExtra("code", code).putExtra("title", title)
                .putExtra("body", body).putExtra("tag", tag).putExtra("pid", pid);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return i;
    }

    static void closeFor(String tag) {
        final CallActivity a = current;
        if (a != null && tag != null && tag.equals(a.tag)) a.runOnUiThread(a::finishCall);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        current = this;
        read(getIntent());
        startRinging();
        handler.postDelayed(this::finishCall, 45000);
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        read(i);
    }

    private void read(Intent i) {
        group = i.getBooleanExtra("group", false);
        id = i.getStringExtra("id");
        code = i.getStringExtra("code");
        tag = i.getStringExtra("tag");
        pid = i.getIntExtra("pid", 0);
        build(i.getStringExtra("title"), i.getStringExtra("body"));
    }

    private void build(String title, String body) {
        float d = getResources().getDisplayMetrics().density;
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0xFF3A3D45, 0xFF1A1B1E, 0xFF121315});
        root.setBackground(bg);
        root.setPadding((int) (24 * d), (int) (90 * d), (int) (24 * d), (int) (60 * d));

        TextView avatar = new TextView(this);
        String letter = title == null || title.isEmpty() ? "M" : title.substring(0, Math.min(1, title.length())).toUpperCase();
        avatar.setText(letter);
        avatar.setTextColor(Color.WHITE);
        avatar.setTextSize(44);
        avatar.setTypeface(Typeface.DEFAULT_BOLD);
        avatar.setGravity(Gravity.CENTER);
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(0xFF7D9CC4);
        avatar.setBackground(circle);
        root.addView(avatar, new LinearLayout.LayoutParams((int) (120 * d), (int) (120 * d)));

        TextView name = new TextView(this);
        name.setText(title == null ? "Manasenger" : title);
        name.setTextColor(Color.WHITE);
        name.setTextSize(28);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setGravity(Gravity.CENTER);
        name.setPadding(0, (int) (22 * d), 0, (int) (6 * d));
        root.addView(name);

        TextView sub = new TextView(this);
        sub.setText(body == null ? "Входящий звонок" : body);
        sub.setTextColor(0xCCFFFFFF);
        sub.setTextSize(17);
        sub.setGravity(Gravity.CENTER);
        root.addView(sub);

        View space = new View(this);
        root.addView(space, new LinearLayout.LayoutParams(1, 0, 1f));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);
        row.addView(round("✕", 0xFFFF3B4F, v -> decline(), d));
        View gap = new View(this);
        row.addView(gap, new LinearLayout.LayoutParams((int) (90 * d), 1));
        row.addView(round("✆", 0xFF2BD47D, v -> answer(), d));
        root.addView(row);

        LinearLayout labels = new LinearLayout(this);
        labels.setOrientation(LinearLayout.HORIZONTAL);
        labels.setGravity(Gravity.CENTER);
        labels.addView(label("Отклонить", d));
        View gap2 = new View(this);
        labels.addView(gap2, new LinearLayout.LayoutParams((int) (90 * d), 1));
        labels.addView(label(group ? "Войти" : "Ответить", d));
        root.addView(labels);

        setContentView(root);
    }

    private Button round(String text, int color, View.OnClickListener l, float d) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(30);
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(color);
        b.setBackground(g);
        b.setOnClickListener(l);
        b.setLayoutParams(new LinearLayout.LayoutParams((int) (76 * d), (int) (76 * d)));
        return b;
    }

    private TextView label(String text, float d) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextColor(0xCCFFFFFF);
        t.setTextSize(14);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, (int) (10 * d), 0, 0);
        t.setLayoutParams(new LinearLayout.LayoutParams((int) (76 * d), LinearLayout.LayoutParams.WRAP_CONTENT));
        return t;
    }

    private void startRinging() {
        try {
            Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            ringtone = RingtoneManager.getRingtone(this, uri);
            if (ringtone != null) {
                ringtone.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                if (Build.VERSION.SDK_INT >= 28) ringtone.setLooping(true);
                ringtone.play();
            }
        } catch (RuntimeException ignored) {
        }
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null) {
                long[] p = {0, 800, 700};
                if (Build.VERSION.SDK_INT >= 26) vibrator.vibrate(VibrationEffect.createWaveform(p, 0));
                else vibrator.vibrate(p, 0);
            }
        } catch (RuntimeException ignored) {
        }
    }

    private void stopRinging() {
        try { if (ringtone != null) ringtone.stop(); } catch (RuntimeException ignored) { }
        try { if (vibrator != null) vibrator.cancel(); } catch (RuntimeException ignored) { }
        ringtone = null;
        vibrator = null;
    }

    private void clearNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null && tag != null) nm.cancel(tag, pid);
    }

    private void answer() {
        stopRinging();
        clearNotification();
        if (Build.VERSION.SDK_INT >= 26) {
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        }
        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse(BASE + "/#" + (group ? "gcall=" : "call=") + id + "&a=1"));
        open.setClass(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(open);
        finish();
    }

    private void decline() {
        stopRinging();
        clearNotification();
        final String callId = id, callCode = code;
        if (!group && callId != null && callCode != null) {
            new Thread(() -> {
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(BASE + "/api/call/reject-code").openConnection();
                    c.setRequestMethod("POST");
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(8000);
                    c.setDoOutput(true);
                    c.setRequestProperty("Content-Type", "application/json");
                    byte[] b = ("{\"callId\":\"" + callId + "\",\"code\":\"" + callCode + "\"}").getBytes(StandardCharsets.UTF_8);
                    OutputStream o = c.getOutputStream();
                    o.write(b);
                    o.close();
                    c.getResponseCode();
                    c.disconnect();
                } catch (Exception ignored) {
                }
            }).start();
        }
        finish();
    }

    void finishCall() {
        stopRinging();
        if (!isFinishing()) finish();
    }

    @Override
    protected void onDestroy() {
        stopRinging();
        handler.removeCallbacksAndMessages(null);
        if (current == this) current = null;
        super.onDestroy();
    }
}
