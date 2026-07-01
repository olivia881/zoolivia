package it.prisma.scanner.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/** Colori brand PrismaScanner (icona / UI). */
object PrismaBrand {
    val Navy = Color(0xFF001035)
    val Red = Color(0xFF8B0000)
    /** Blu pulsante «Scansiona» (stile anteprima). */
    val ScanBlue = Color(0xFF1E88E5)
}

private val LightColors = lightColorScheme(
    primary = PrismaBrand.Navy,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE3F2FD),
    onPrimaryContainer = PrismaBrand.Navy,
    secondary = PrismaBrand.Red,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFFFEBEE),
    onSecondaryContainer = PrismaBrand.Red,
    background = Color(0xFFF8F9FC),
    onBackground = Color(0xFF1C1B1F),
    surface = Color.White,
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFE7E8F0),
    onSurfaceVariant = Color(0xFF44464F),
    outline = Color(0xFF757780),
)

@Composable
fun PrismaScannerTheme(
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = LightColors,
        content = content,
    )
}
