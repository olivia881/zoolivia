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
        val id = ScanIdExtractor.extract(codice)
        if (id.isBlank()) {
            return@withContext GiacenzaFetchResult.ParseError("Codice QR vuoto o non valido")
        }
        val trimmed = baseUrl.trim().trimEnd('/')
        if (!trimmed.startsWith("http://", ignoreCase = true) &&
            !trimmed.startsWith("https://", ignoreCase = true)
        ) {
            return@withContext GiacenzaFetchResult.ParseError(
                "URL base non valido: usa http://IP:porta (es. http://10.193.87.34:8081)",
            )
        }
        val encoded = URLEncoder.encode(id, Charsets.UTF_8.name())
        val url = "$trimmed/giacenza.php?id=$encoded"
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
                return@withContext parseJson(body, id)
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
        if (errore.isNotBlank()) {
            val dettaglio = json.optString("dettaglio", "").ifBlank { null }
            if (errore.contains("non trovato", ignoreCase = true) ||
                errore.contains("mancante", ignoreCase = true)
            ) {
                return GiacenzaFetchResult.NotFound
            }
            return GiacenzaFetchResult.ApiError(errore, dettaglio)
        }
        val codice = if (json.has("codice") && !json.isNull("codice")) {
            json.get("codice").toString()
        } else {
            fallbackCodice
        }
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
        val marca = json.optString("marca", "").ifBlank { null }
        val g = Giacenza(
            codice = codice,
            descrizione = descrizione,
            giacenza = giacenza,
            lotto = lotto,
            scadenza = scadenza,
            marca = marca,
        )
        return GiacenzaFetchResult.Success(g)
    }
}
