package it.promemoria.rifiuti;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

@CapacitorPlugin(name = "VoiceAlarm")
public class VoiceAlarmPlugin extends Plugin {

    private static final int MAX_ALARMS = 100;
    private static final int BASE_REQUEST = 50000;

    @PluginMethod
    public void cancelAll(PluginCall call) {
        cancelAllInternal();
        call.resolve();
    }

    @PluginMethod
    public void scheduleAlarms(PluginCall call) {
        JSArray arr = call.getArray("alarms");
        if (arr == null) {
            call.reject("Missing alarms array");
            return;
        }
        cancelAllInternal();
        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        try {
            int n = Math.min(arr.length(), MAX_ALARMS);
            for (int i = 0; i < n; i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                if (!o.has("when")) continue;
                long when = o.getLong("when");
                String voiceText = o.optString("voiceText", "");
                Intent intent = new Intent(ctx, VoiceAlarmReceiver.class);
                intent.putExtra("voiceText", voiceText);
                PendingIntent pi = PendingIntent.getBroadcast(ctx, BASE_REQUEST + i, intent, piFlags);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, when, pi);
                }
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Schedule failed: " + e.getMessage());
        }
    }

    private void cancelAllInternal() {
        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        int piFlags = PendingIntent.FLAG_NO_CREATE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        for (int i = 0; i < MAX_ALARMS; i++) {
            Intent intent = new Intent(ctx, VoiceAlarmReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, BASE_REQUEST + i, intent, piFlags);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }
    }
}
