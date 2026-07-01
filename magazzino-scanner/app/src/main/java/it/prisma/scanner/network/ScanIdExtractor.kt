package it.prisma.scanner.network

/**
 * Estrae l'id numerico da un QR (solo cifre, oppure parametro id= in un URL).
 */
object ScanIdExtractor {

    fun extract(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return trimmed

        Regex("""(?i)[?&]id=(\d+)""").find(trimmed)?.groupValues?.getOrNull(1)?.let { return it }

        if (trimmed.all { it.isDigit() }) {
            return trimmed.trimStart('0').ifEmpty { "0" }
        }

        return trimmed
    }
}
