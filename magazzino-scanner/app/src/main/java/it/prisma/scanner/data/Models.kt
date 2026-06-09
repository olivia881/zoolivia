package it.prisma.scanner.data

enum class NasDestinazione {
    SYNOLOGY,
    QNAP,
}

data class Giacenza(
    val codice: String,
    val descrizione: String?,
    val giacenza: Int?,
    val lotto: String?,
    val scadenza: String?,
    val marca: String? = null,
    val numeroSerie: String? = null,
    val unitaMisura: String? = null,
)

sealed class GiacenzaFetchResult {
    data class Success(val data: Giacenza) : GiacenzaFetchResult()
    data object NotFound : GiacenzaFetchResult()
    data object NetworkError : GiacenzaFetchResult()
    data class HttpError(val code: Int, val body: String?) : GiacenzaFetchResult()
    data class ParseError(val detail: String) : GiacenzaFetchResult()
    data class ApiError(val message: String, val dettaglio: String?) : GiacenzaFetchResult()
}
