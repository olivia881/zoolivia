package it.prisma.scanner.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import it.prisma.scanner.data.NasDestinazione
import it.prisma.scanner.ui.scanner.ScannerOverlay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onOpenSettings: () -> Unit,
) {
    val ui by viewModel.ui.collectAsStateWithLifecycle()
    val warehouse by viewModel.warehouse.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(ui.message) {
        val msg = ui.message ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(msg)
        viewModel.clearMessage()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("PrismaScanner") },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Impostazioni")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                ),
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        BoxWithScanner(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            showScanner = ui.showScanner,
            onBarcode = viewModel::onBarcodeScanned,
            onCloseScanner = viewModel::closeScanner,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "NAS attivo",
                    style = MaterialTheme.typography.titleMedium,
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    FilterChip(
                        selected = warehouse == NasDestinazione.SYNOLOGY,
                        onClick = { viewModel.setWarehouse(NasDestinazione.SYNOLOGY) },
                        label = { Text("Synology") },
                        modifier = Modifier.weight(1f),
                    )
                    FilterChip(
                        selected = warehouse == NasDestinazione.QNAP,
                        onClick = { viewModel.setWarehouse(NasDestinazione.QNAP) },
                        label = { Text("QNAP") },
                        modifier = Modifier.weight(1f),
                    )
                }

                Button(
                    onClick = { viewModel.openScanner() },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Scansiona codice / QR")
                }

                if (ui.loading) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.padding(8.dp))
                        Text("Consultazione in corso…")
                    }
                }

                ui.giacenza?.let { g ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                        ),
                    ) {
                        Column(
                            Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text("Risultato", style = MaterialTheme.typography.titleMedium)
                            InfoRow("Codice", g.codice)
                            InfoRow("Descrizione", g.descrizione ?: "—")
                            InfoRow("Giacenza", g.giacenza?.toString() ?: "—")
                            InfoRow("Lotto", g.lotto ?: "—")
                            InfoRow("Scadenza", g.scadenza ?: "—")
                        }
                    }
                }

                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Column {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun BoxWithScanner(
    modifier: Modifier,
    showScanner: Boolean,
    onBarcode: (String) -> Unit,
    onCloseScanner: () -> Unit,
    content: @Composable () -> Unit,
) {
    Box(modifier) {
        content()
        if (showScanner) {
            ScannerOverlay(
                onBarcode = onBarcode,
                onClose = onCloseScanner,
            )
        }
    }
}
