package it.promemoria.rifiuti;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.PowerManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.Locale;

/**
 * Sintesi vocale all'orario del promemoria anche con schermo spento (WakeLock breve).
 */
public class VoiceAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        final String text = intent.getStringExtra("voiceText");
        if (text == null || text.isEmpty()) {
            return;
        }

        final PendingResult pendingResult = goAsync();

        PowerManager pm = (PowerManager) context.getApplicationContext().getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wl = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "promemoria-rifiuti:tts"
        );
        wl.acquire(120 * 1000L);

        final Context appCtx = context.getApplicationContext();

        TextToSpeech[] ttsHolder = new TextToSpeech[1];
        ttsHolder[0] = new TextToSpeech(appCtx, status -> {
            if (status != TextToSpeech.SUCCESS) {
                releaseAll(wl, pendingResult, null);
                return;
            }
            TextToSpeech tts = ttsHolder[0];
            if (tts == null) {
                releaseAll(wl, pendingResult, null);
                return;
            }
            tts.setLanguage(Locale.ITALY);
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {}

                @Override
                public void onDone(String utteranceId) {
                    releaseAll(wl, pendingResult, tts);
                }

                @Override
                public void onError(String utteranceId) {
                    releaseAll(wl, pendingResult, tts);
                }
            });

            Bundle params = new Bundle();
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "promemoria");
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "promemoria");
        });
    }

    private static void releaseAll(PowerManager.WakeLock wl, PendingResult pending, TextToSpeech tts) {
        try {
            if (tts != null) {
                tts.stop();
                tts.shutdown();
            }
        } catch (Exception ignored) {}
        try {
            if (wl != null && wl.isHeld()) {
                wl.release();
            }
        } catch (Exception ignored) {}
        try {
            if (pending != null) {
                pending.finish();
            }
        } catch (Exception ignored) {}
    }
}
