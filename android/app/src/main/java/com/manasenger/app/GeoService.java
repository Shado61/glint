package com.manasenger.app;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Sends this phone's position to friends on the Manasenger map every few seconds while moving
 * (and at least every 30 seconds while standing still) — also with the screen off or the app closed.
 * Shows a permanent notification while it works; switching sharing off in the app stops it.
 *
 * Uses Google's Fused Location Provider: it mixes GPS, Wi-Fi and the motion sensors, so it is more precise in town
 * and much lighter on the battery than asking the GPS directly. Moving → a fix every 3 seconds;
 * standing still for a minute → every 15 seconds with less GPS. Phones without Google services (Huawei and others)
 * fall back to the system GPS/network as before.
 */
public class GeoService extends Service implements LocationListener {
    static final String PREFS = "mn_geo";
    private static final String CHANNEL = "mn_geo";
    private static final int NOTE = 7101;
    private LocationManager lm;
    private FusedLocationProviderClient fused;
    private boolean fusedFast;
    private long stillSince;
    private Location last;
    private final LocationCallback fusedCb = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult r) {
            Location l = r.getLastLocation();
            if (l == null) return;
            onLocationChanged(l);
            // moving or standing: change how often the phone is asked
            boolean moving = l.hasSpeed() && l.getSpeed() > 0.8f;
            long t = System.currentTimeMillis();
            if (moving) stillSince = 0; else if (stillSince == 0) stillSince = t;
            boolean fast = moving || stillSince == 0 || t - stillSince < 60000;
            if (fast != fusedFast) fusedRequest(fast);
        }
    };
    private long sentAt;
    private Location sentLoc;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable beat = new Runnable() {
        @Override
        public void run() {
            if (last != null && System.currentTimeMillis() - sentAt > 25000) send(last);
            h.postDelayed(this, 30000);
        }
    };

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private String key() {
        return getSharedPreferences(PREFS, MODE_PRIVATE).getString("key", null);
    }

    @SuppressLint("MissingPermission")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (key() == null || !allowed()) {
            stopSelf();
            return START_NOT_STICKY;
        }
        Notification n = note();
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NOTE, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            else startForeground(NOTE, n);
        } catch (RuntimeException e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (fused == null && lm == null) {
            if (hasPlay()) {
                fused = LocationServices.getFusedLocationProviderClient(this);
                fusedRequest(true);
                try {
                    fused.getLastLocation().addOnSuccessListener(l -> {
                        if (l != null && last == null) {
                            last = l;
                            send(l);
                        }
                    });
                } catch (RuntimeException ignored) {
                }
            } else {
                systemStart();
            }
            h.removeCallbacks(beat);
            h.postDelayed(beat, 30000);
        }
        return START_STICKY;
    }

    private boolean hasPlay() {
        try {
            return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this) == ConnectionResult.SUCCESS;
        } catch (Throwable e) {
            return false;
        }
    }

    @SuppressLint("MissingPermission")
    private void fusedRequest(boolean fast) {
        if (fused == null) return;
        fusedFast = fast;
        LocationRequest req = new LocationRequest.Builder(fast ? Priority.PRIORITY_HIGH_ACCURACY : Priority.PRIORITY_BALANCED_POWER_ACCURACY, fast ? 3000 : 15000)
                .setMinUpdateIntervalMillis(fast ? 2000 : 10000)
                .setMinUpdateDistanceMeters(fast ? 3 : 10)
                .setWaitForAccurateLocation(false)
                .build();
        try {
            fused.removeLocationUpdates(fusedCb);
            fused.requestLocationUpdates(req, fusedCb, Looper.getMainLooper())
                    .addOnFailureListener(e -> {
                        fused = null;
                        systemStart();
                    });
        } catch (RuntimeException e) {
            fused = null;
            systemStart();
        }
    }

    @SuppressLint("MissingPermission")
    private void systemStart() {
        if (lm != null) return;
        lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) return;
        for (String p : new String[]{LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER}) {
            try {
                if (lm.isProviderEnabled(p)) {
                    lm.requestLocationUpdates(p, 4000, 5, this, Looper.getMainLooper());
                    Location l = lm.getLastKnownLocation(p);
                    if (l != null && (last == null || l.getTime() > last.getTime())) last = l;
                }
            } catch (RuntimeException ignored) {
            }
        }
        if (last != null) send(last);
    }

    private boolean allowed() {
        if (Build.VERSION.SDK_INT < 23) return true;
        return checkSelfPermission("android.permission.ACCESS_FINE_LOCATION") == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission("android.permission.ACCESS_COARSE_LOCATION") == PackageManager.PERMISSION_GRANTED;
    }

    private Notification note() {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        Intent open = new Intent(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 7101, open, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "Геопозиция для друзей", NotificationManager.IMPORTANCE_LOW);
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this);
        }
        return b.setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Друзья видят, где вы")
                .setContentText("Manasenger обновляет геопозицию на карте друзей")
                .setOngoing(true)
                .setContentIntent(pi)
                .build();
    }

    @Override
    public void onLocationChanged(Location l) {
        if (l == null) return;
        if (last != null && l.getAccuracy() > 200 && last.getAccuracy() < l.getAccuracy() && l.getTime() - last.getTime() < 20000) return;
        last = l;
        long t = System.currentTimeMillis();
        float moved = sentLoc == null ? 1e9f : l.distanceTo(sentLoc);
        if (t - sentAt < 3000) return;
        if (moved < 8 && t - sentAt < 25000) return;
        send(l);
    }

    private void send(final Location l) {
        final String k = key();
        if (k == null) {
            stopSelf();
            return;
        }
        sentAt = System.currentTimeMillis();
        sentLoc = l;
        final String body = String.format(Locale.US, "{\"key\":\"%s\",\"lat\":%.6f,\"lng\":%.6f,\"acc\":%d}", k, l.getLatitude(), l.getLongitude(), Math.round(l.getAccuracy()));
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(CallActivity.BASE + "/api/map/bgloc").openConnection();
                c.setRequestMethod("POST");
                c.setConnectTimeout(10000);
                c.setReadTimeout(10000);
                c.setDoOutput(true);
                c.setRequestProperty("Content-Type", "application/json");
                OutputStream o = c.getOutputStream();
                o.write(body.getBytes(StandardCharsets.UTF_8));
                o.close();
                int code = c.getResponseCode();
                c.disconnect();
                if (code == 401) {
                    getSharedPreferences(PREFS, MODE_PRIVATE).edit().remove("key").apply();
                    h.post(this::stopSelf);
                }
            } catch (Exception ignored) {
            }
        }).start();
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onProviderDisabled(String provider) {
    }

    @Override
    public void onDestroy() {
        h.removeCallbacks(beat);
        if (fused != null) {
            try {
                fused.removeLocationUpdates(fusedCb);
            } catch (RuntimeException ignored) {
            }
        }
        if (lm != null) {
            try {
                lm.removeUpdates(this);
            } catch (RuntimeException ignored) {
            }
        }
        super.onDestroy();
    }
}
