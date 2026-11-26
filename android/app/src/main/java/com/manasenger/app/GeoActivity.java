package com.manasenger.app;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

/**
 * Opened by the site (manasenger-geo://start?k=KEY or manasenger-geo://stop) when the person
 * switches location sharing on the friends map on or off. Asks for location permission once
 * and starts / stops GeoService, which keeps sending the position even with the screen off.
 */
public class GeoActivity extends Activity {
    private static final int REQ = 71;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Uri data = getIntent().getData();
        String host = data == null ? "" : String.valueOf(data.getHost());
        SharedPreferences p = getSharedPreferences(GeoService.PREFS, MODE_PRIVATE);
        if (host.equals("stop")) {
            p.edit().remove("key").apply();
            stopService(new Intent(this, GeoService.class));
            finish();
            return;
        }
        String key = data == null ? null : data.getQueryParameter("k");
        if (key != null && key.matches("[A-Za-z0-9_-]{20,64}")) p.edit().putString("key", key).apply();
        if (p.getString("key", null) == null) { finish(); return; }
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission("android.permission.ACCESS_FINE_LOCATION") != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission("android.permission.ACCESS_COARSE_LOCATION") != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"}, REQ);
            return;
        }
        startGeo();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        boolean ok = false;
        for (int r : grantResults) if (r == PackageManager.PERMISSION_GRANTED) ok = true;
        if (ok) startGeo();
        finish();
    }

    private void startGeo() {
        Intent i = new Intent(this, GeoService.class);
        try {
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
        } catch (RuntimeException ignored) {
        }
        finish();
    }
}
