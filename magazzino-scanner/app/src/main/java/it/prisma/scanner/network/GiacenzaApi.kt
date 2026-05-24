package it.prisma.scanner.network

import it.prisma.scanner.data.Giacenza
import it.prisma.scanner.data.GiacenzaFetchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

class GiacenzaApi(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build(),
) {

    suspend fun getGiacenza(baseUrl: String, codice: String): GiacenzaFetchResult = withContext(Dispatchers.IO) {
        val trimmed = baseUrl.trimEnd('/')
        val encoded = URLEncoder.encode(codice, Charsets.UTF_8.name())
        val url = "$trimmed/api/giacenza.php?codice=$encoded"
        val request = Request.Builder().url(url).get().build()
        try {
            client.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    return@withContext GiacenzaFetchResult.HttpError(response.code, body)
                }
                if (body.isBlank()) {
                    return@withContext GiacenzaFetchResult.ParseError("Risposta vuota")
                }
                return@withContext parseJson(body, codice)
            }
        } catch (_: java.io.IOException) {
            GiacenzaFetchResult.NetworkError
        } catch (e: Exception) {
            GiacenzaFetchResult.ParseError(e.message ?: "Errore sconosciuto")
        }
    }

    private fun parseJson(body: String, fallbackCodice: String): GiacenzaFetchResult {
        val json = JSONObject(body)
        if (json.optBoolean("non_trovato", false)) {
            return GiacenzaFetchResult.NotFound
        }
        val errore = json.optString("errore", "").ifBlank { json.optString("error", "") }
        if (errore.isNotBlank() && !json.has("giacenza") && !json.has("descrizione")) {
            return GiacenzaFetchResult.NotFound
        }
        val codice = json.optString("codice", fallbackCodice).ifBlank { fallbackCodice }
        val descrizione = json.optString("descrizione", "").ifBlank { null }
        val giacenza = if (json.has("giacenza") && !json.isNull("giacenza")) {
            when (val v = json.get("giacenza")) {
                is Int -> v
                is Number -> v.toInt()
                is String -> v.toIntOrNull()
                else -> null
            }
        } else {
            null
        }
        val lotto = json.optString("lotto", "").ifBlank { null }
        val scadenza = json.optString("scadenza", "").ifBlank { null }
        val g = Giacenza(
            codice = codice,
            descrizione = descrizione,
            giacenza = giacenza,
            lotto = lotto,
            scadenza = scadenza,
        )
        return GiacenzaFetchResult.Success(g)
    }
}
