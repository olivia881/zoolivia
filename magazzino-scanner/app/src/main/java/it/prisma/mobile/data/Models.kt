package it.prisma.mobile.data

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
)

sealed class GiacenzaFetchResult {
    data class Success(val data: Giacenza) : GiacenzaFetchResult()
    data object NotFound : GiacenzaFetchResult()
    data object NetworkError : GiacenzaFetchResult()
    data class HttpError(val code: Int, val body: String?) : GiacenzaFetchResult()
    data class ParseError(val detail: String) : GiacenzaFetchResult()
}
