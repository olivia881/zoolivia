package it.prisma.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import it.prisma.mobile.ui.home.HomeViewModel
import it.prisma.mobile.ui.theme.PrismaMobileTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PrismaMobileTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    val vm: HomeViewModel = viewModel()
                    PrismaMobileApp(viewModel = vm)
                }
            }
        }
    }
}
