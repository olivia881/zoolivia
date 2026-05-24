package it.prisma.mobile.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Navy = Color(0xFF001035)
private val Red = Color(0xFF8B0000)

private val LightColors = lightColorScheme(
    primary = Navy,
    onPrimary = Color.White,
    secondary = Red,
    onSecondary = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF90CAF9),
    onPrimary = Navy,
    secondary = Color(0xFFFF8A80),
    onSecondary = Navy,
)

@Composable
fun PrismaMobileTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
