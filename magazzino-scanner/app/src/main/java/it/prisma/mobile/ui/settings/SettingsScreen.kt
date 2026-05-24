package it.prisma.mobile.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import it.prisma.mobile.ui.home.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: HomeViewModel,
    onBack: () -> Unit,
) {
    val endpoints by viewModel.endpointsForSettings.collectAsStateWithLifecycle()
    var synologyText by remember { mutableStateOf("") }
    var qnapText by remember { mutableStateOf("") }

    LaunchedEffect(endpoints) {
        synologyText = endpoints.first
        qnapText = endpoints.second
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Indirizzi NAS") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Indietro",
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                ),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = "Inserisci l’URL base di ciascun NAS (senza barra finale). " +
                    "L’app chiama automaticamente /api/giacenza.php?codice=…",
                style = MaterialTheme.typography.bodyMedium,
            )
            OutlinedTextField(
                value = synologyText,
                onValueChange = { synologyText = it },
                label = { Text("Synology — URL base NAS") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("http://192.168.1.10") },
            )
            OutlinedTextField(
                value = qnapText,
                onValueChange = { qnapText = it },
                label = { Text("QNAP — URL base NAS") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("http://192.168.1.11") },
            )
            Button(
                onClick = {
                    viewModel.saveEndpoints(synologyText, qnapText)
                    onBack()
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Salva")
            }
        }
    }
}
