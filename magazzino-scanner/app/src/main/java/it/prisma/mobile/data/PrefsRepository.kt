package it.prisma.mobile.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "prisma_mobile_prefs")

class PrefsRepository(private val context: Context) {

    private val dataStore = context.dataStore

    val synologyBaseFlow: Flow<String> = dataStore.data.map { prefs ->
        prefs[SYNOLOGY_BASE] ?: DEFAULT_SYNOLOGY
    }

    val qnapBaseFlow: Flow<String> = dataStore.data.map { prefs ->
        prefs[QNAP_BASE] ?: DEFAULT_QNAP
    }

    suspend fun setSynologyBase(value: String) {
        dataStore.edit { it[SYNOLOGY_BASE] = value.trim() }
    }

    suspend fun setQnapBase(value: String) {
        dataStore.edit { it[QNAP_BASE] = value.trim() }
    }

    companion object {
        private val SYNOLOGY_BASE = stringPreferencesKey("synology_base")
        private val QNAP_BASE = stringPreferencesKey("qnap_base")

        const val DEFAULT_SYNOLOGY = "http://192.168.1.10"
        const val DEFAULT_QNAP = "http://192.168.1.11"
    }
}
