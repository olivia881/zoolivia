package it.prisma.scanner.ui.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import it.prisma.scanner.data.GiacenzaFetchResult
import it.prisma.scanner.data.NasDestinazione
import it.prisma.scanner.data.PrefsRepository
import it.prisma.scanner.data.Giacenza
import it.prisma.scanner.network.GiacenzaApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = false,
    val giacenza: Giacenza? = null,
    val message: String? = null,
    val showScanner: Boolean = false,
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = PrefsRepository(application)
    private val api = GiacenzaApi()

    private val _warehouse = MutableStateFlow(NasDestinazione.SYNOLOGY)
    val warehouse: StateFlow<NasDestinazione> = _warehouse.asStateFlow()

    private val _ui = MutableStateFlow(HomeUiState())
    val ui: StateFlow<HomeUiState> = _ui.asStateFlow()

    val synologyBase: StateFlow<String> = prefs.synologyBaseFlow.stateIn(
        viewModelScope,
        SharingStarted.Eagerly,
        PrefsRepository.DEFAULT_SYNOLOGY,
    )

    val qnapBase: StateFlow<String> = prefs.qnapBaseFlow.stateIn(
        viewModelScope,
        SharingStarted.Eagerly,
        PrefsRepository.DEFAULT_QNAP,
    )

    val endpointsForSettings = combine(synologyBase, qnapBase) { s, q -> s to q }
        .stateIn(
            viewModelScope,
            SharingStarted.Eagerly,
            PrefsRepository.DEFAULT_SYNOLOGY to PrefsRepository.DEFAULT_QNAP,
        )

    fun setWarehouse(tipo: NasDestinazione) {
        _warehouse.value = tipo
    }

    fun openScanner() {
        _ui.update {
            it.copy(
                showScanner = true,
                message = null,
                giacenza = null,
                loading = false,
            )
        }
    }

    fun closeScanner() {
        _ui.update { it.copy(showScanner = false) }
    }

    fun onBarcodeScanned(raw: String) {
        val code = raw.trim()
        _ui.update { it.copy(showScanner = false) }
        if (code.isNotEmpty()) {
            fetchGiacenza(code)
        }
    }

    fun fetchGiacenza(codice: String) {
        viewModelScope.launch {
            val base = when (_warehouse.value) {
                NasDestinazione.SYNOLOGY -> synologyBase.value
                NasDestinazione.QNAP -> qnapBase.value
            }
            _ui.update {
                it.copy(loading = true, message = null, giacenza = null)
            }
            val result = api.getGiacenza(base, codice)
            _ui.update { state ->
                when (result) {
                    is GiacenzaFetchResult.Success -> state.copy(
                        loading = false,
                        giacenza = result.data,
                        message = null,
                    )
                    is GiacenzaFetchResult.NotFound -> state.copy(
                        loading = false,
                        giacenza = null,
                        message = "Codice non trovato.",
                    )
                    is GiacenzaFetchResult.NetworkError -> state.copy(
                        loading = false,
                        giacenza = null,
                        message = "Rete non disponibile o NAS non raggiungibile.",
                    )
                    is GiacenzaFetchResult.HttpError -> state.copy(
                        loading = false,
                        giacenza = null,
                        message = "Errore server (${result.code}).",
                    )
                    is GiacenzaFetchResult.ParseError -> state.copy(
                        loading = false,
                        giacenza = null,
                        message = "Risposta non valida: ${result.detail}",
                    )
                }
            }
        }
    }

    fun clearMessage() {
        _ui.update { it.copy(message = null) }
    }

    fun saveEndpoints(synology: String, qnap: String) {
        viewModelScope.launch {
            prefs.setSynologyBase(synology)
            prefs.setQnapBase(qnap)
        }
    }
}
