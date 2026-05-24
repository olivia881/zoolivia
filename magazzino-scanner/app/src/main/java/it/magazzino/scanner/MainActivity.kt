package it.magazzino.scanner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import it.magazzino.scanner.ui.home.HomeViewModel
import it.magazzino.scanner.ui.theme.MagazzinoTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MagazzinoTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    val vm: HomeViewModel = viewModel()
                    MagazzinoApp(viewModel = vm)
                }
            }
        }
    }
}
