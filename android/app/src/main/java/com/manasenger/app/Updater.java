package com.manasenger.app;

import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Keeps the Android app up to date: a few times a day it looks at the newest build on GitHub,
 * downloads it in the background, and shows "Update ready, tap to install"
 * (Android always asks the person before installing an app).
 */
public class Updater extends BroadcastReceiver {
    static final String INFO = "https://github.com/Shado61/glint/releases/download/apps/android-version.json";
    static final String CHANNEL = "mn_updates";
    private static final int NOTIF_ID = 7701;

    static long currentCode(Context c) {
        try {
            PackageInfo p = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    /** Called when the app opens; does nothing if it checked less than 6 hours ago. */
    static void check(final Context ctx) {
        final Context c = ctx.getApplicationContext();
        final SharedPreferences sp = c.getSharedPreferences("mn", Context.MODE_PRIVATE);
        if (System.currentTimeMillis() - sp.getLong("updChecked", 0) < 6 * 3600 * 1000L) return;
        sp.edit().putLong("updChecked", System.currentTimeMillis()).apply();
        new Thread(() -> {
            try {
                HttpURLConnection h = (HttpURLConnection) new URL(INFO).openConnection();
                h.setInstanceFollowRedirects(true);
                h.setConnectTimeout(10000);
                h.setReadTimeout(10000);
                if (h.getResponseCode() != 200) return;
                StringBuilder sb = new StringBuilder();
                BufferedReader r = new BufferedReader(new InputStreamReader(h.getInputStream(), "UTF-8"));
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
                r.close();
                Matcher mc = Pattern.compile("\"code\"\\s*:\\s*(\\d+)").matcher(sb);
                Matcher mu = Pattern.compile("\"url\"\\s*:\\s*\"([^\"]+)\"").matcher(sb);
                if (!mc.find() || !mu.find()) return;
                long code = Long.parseLong(mc.group(1));
                String url = mu.group(1);
                if (code <= currentCode(c) || !url.startsWith("https://github.com/Shado61/glint/")) return;
                if (sp.getLong("updCode", 0) == code && sp.getLong("updId", -1) >= 0) {
                    notifyReady(c, sp.getLong("updId", -1)); /* already downloaded earlier */
                    return;
                }
                DownloadManager dm = (DownloadManager) c.getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm == null) return;
                File old = new File(c.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Manasenger-update.apk");
                if (old.exists()) old.delete();
                DownloadManager.Request q = new DownloadManager.Request(Uri.parse(url));
                q.setTitle("Обновление Manasenger");
                q.setMimeType("application/vnd.android.package-archive");
                q.setNotificationVisibility(DownloadManager.Request.VISIBILITY_HIDDEN);
                q.setDestinationInExternalFilesDir(c, Environment.DIRECTORY_DOWNLOADS, "Manasenger-update.apk");
                long id = dm.enqueue(q);
                sp.edit().putLong("updId", id).putLong("updCode", code).putBoolean("updDone", false).apply();
            } catch (Exception ignored) {
            }
        }).start();
    }

    /** The download finished. */
    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
        long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
        SharedPreferences sp = ctx.getSharedPreferences("mn", Context.MODE_PRIVATE);
        if (id < 0 || id != sp.getLong("updId", -2)) return;
        notifyReady(ctx.getApplicationContext(), id);
    }

    static Intent installIntent(Context c, long id) {
        DownloadManager dm = (DownloadManager) c.getSystemService(Context.DOWNLOAD_SERVICE);
        Uri apk = dm == null ? null : dm.getUriForDownloadedFile(id);
        if (apk == null) return null;
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(apk, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        return i;
    }

    @SuppressWarnings("MissingPermission")
    static void notifyReady(Context c, long id) {
        Intent install = installIntent(c, id);
        if (install == null) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Обновления", NotificationManager.IMPORTANCE_DEFAULT));
        }
        PendingIntent pi = PendingIntent.getActivity(c, NOTIF_ID, install, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Обновление Manasenger готово")
                .setContentText("Нажмите, чтобы установить новую версию")
                .setContentIntent(pi)
                .setAutoCancel(true);
        try {
            nm.notify(NOTIF_ID, b.build());
        } catch (SecurityException ignored) {
        }
    }
}
