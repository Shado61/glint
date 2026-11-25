package com.manasenger.app;

import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/** Opens Manasenger. On the first start on Android 13+, asks for notifications first, so messages and calls come through. */
public class MainActivity extends LauncherActivity {
    private static final String PERM = "android.permission.POST_NOTIFICATIONS";
    private static final int REQ = 7;

    private boolean needsPermission() {
        if (Build.VERSION.SDK_INT < 33) return false;
        if (checkSelfPermission(PERM) == PackageManager.PERMISSION_GRANTED) return false;
        return !getSharedPreferences("mn", MODE_PRIVATE).getBoolean("askedNotif", false);
    }

    @Override
    protected boolean shouldLaunchImmediately() {
        return !needsPermission();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        boolean ask = needsPermission();
        super.onCreate(savedInstanceState);
        Updater.check(this);
        if (ask && !isFinishing()) {
            SharedPreferences.Editor e = getSharedPreferences("mn", MODE_PRIVATE).edit();
            e.putBoolean("askedNotif", true).apply();
            requestPermissions(new String[]{PERM}, REQ);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ && !isFinishing()) launchTwa();
    }
}
