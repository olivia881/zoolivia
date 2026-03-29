package it.promemoria.rifiuti;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VoiceAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
