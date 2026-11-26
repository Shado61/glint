package com.manasenger.app;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;

import com.google.androidbrowserhelper.trusted.DelegationService;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Notifications from Manasenger pass through here. Ordinary ones are shown as they are.
 * A call ("mncall." / "mngcall." in its tag) becomes a ringing call notification that opens
 * a full-screen call screen, even on the lock screen.
 */
public class CallService extends DelegationService {
    static final String CHANNEL = "mn_calls";
    private static final Pattern TAG = Pattern.compile("mn(g?)call\\.([A-Za-z0-9_-]+?)(?:\\.([A-Za-z0-9_-]{16}))?(?![A-Za-z0-9_-])");

    @SuppressLint("MissingPermission")
    @Override
    public boolean onNotifyNotificationWithChannel(String platformTag, int platformId, Notification notification, String channelName) {
        if (Build.VERSION.SDK_INT >= 26 && platformTag != null && platformTag.startsWith("mnlive.")) {
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null && nm.areNotificationsEnabled()) {
                    ensureLiveChannel(nm);
                    Intent open = new Intent(this, MainActivity.class);
                    open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    PendingIntent pi = PendingIntent.getActivity(this, platformTag.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    Notification.Builder b = Notification.Builder.recoverBuilder(this, notification);
                    b.setChannelId(LIVE);
                    b.setCategory(Notification.CATEGORY_CALL);
                    b.setOngoing(true);
                    b.setOnlyAlertOnce(true);
                    b.setUsesChronometer(true);
                    b.setShowWhen(true);
                    b.setWhen(System.currentTimeMillis());
                    b.setContentIntent(pi);
                    b.setColor(0xFF34C759);
                    b.setColorized(true);
                    nm.notify(platformTag, platformId, b.build());
                    return true;
                }
            } catch (RuntimeException e) { /* falls back to the ordinary notification below */ }
            return super.onNotifyNotificationWithChannel(platformTag, platformId, notification, channelName);
        }
        Matcher m = TAG.matcher(platformTag == null ? "" : platformTag);
        if (Build.VERSION.SDK_INT < 26 || !m.find()) {
            return super.onNotifyNotificationWithChannel(platformTag, platformId, notification, channelName);
        }
        try {
            boolean group = m.group(1) != null && m.group(1).length() > 0;
            String id = m.group(2);
            String code = m.group(3);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null || !nm.areNotificationsEnabled()) return false;
            ensureChannel(nm);
            Bundle ex = notification.extras;
            String title = text(ex, Notification.EXTRA_TITLE, "Manasenger");
            String body = text(ex, Notification.EXTRA_TEXT, group ? "Групповой звонок" : "Входящий звонок");
            Intent full = CallActivity.intent(this, group, id, code, title, body, platformTag, platformId);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(this, (platformTag + platformId).hashCode(), full, flags);
            Notification.Builder b = Notification.Builder.recoverBuilder(this, notification);
            b.setChannelId(CHANNEL);
            b.setCategory(Notification.CATEGORY_CALL);
            b.setFullScreenIntent(pi, true);
            b.setContentIntent(pi);
            b.setTimeoutAfter(45000);
            nm.notify(platformTag, platformId, b.build());
            return true;
        } catch (RuntimeException e) {
            return super.onNotifyNotificationWithChannel(platformTag, platformId, notification, channelName);
        }
    }

    @Override
    public void onCancelNotification(String platformTag, int platformId) {
        super.onCancelNotification(platformTag, platformId);
        CallActivity.closeFor(platformTag);
    }

    private static String text(Bundle ex, String key, String def) {
        if (ex == null) return def;
        CharSequence c = ex.getCharSequence(key);
        return c == null ? def : c.toString();
    }

    static final String LIVE = "mn_live";

    /** "a call is going on": quiet, always on top of the notification list, like a phone call */
    static void ensureLiveChannel(NotificationManager nm) {
        if (Build.VERSION.SDK_INT < 26 || nm.getNotificationChannel(LIVE) != null) return;
        NotificationChannel ch = new NotificationChannel(LIVE, "Идущий звонок", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Показывается, пока идёт звонок или голосовой чат");
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    static void ensureChannel(NotificationManager nm) {
        if (Build.VERSION.SDK_INT < 26 || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Звонки", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Входящие звонки Manasenger");
        AudioAttributes aa = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), aa);
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[]{0, 800, 600, 800, 600, 800});
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }
}
