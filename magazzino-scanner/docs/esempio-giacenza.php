<?php
/**
 * Esempio minimale per Synology Web Station / QNAP: leggi SQLite e restituisci JSON.
 * Adatta $dbPath e le query alla tua struttura (tabella articoli, lotti, ecc.).
 */
header('Content-Type: application/json; charset=utf-8');

$codice = isset($_GET['codice']) ? trim((string) $_GET['codice']) : '';
if ($codice === '') {
    http_response_code(400);
    echo json_encode(['errore' => 'codice mancante']);
    exit;
}

$dbPath = '/volume1/webdata/magazzino.sqlite'; // <-- CAMBIA con il percorso reale sul NAS

if (!is_readable($dbPath)) {
    http_response_code(500);
    echo json_encode(['errore' => 'database non accessibile']);
    exit;
}

try {
    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    // ESEMPIO: tabella "articoli" con colonne codice, descrizione, giacenza, lotto, scadenza
    $stmt = $pdo->prepare(
        'SELECT codice, descrizione, giacenza, lotto, scadenza FROM articoli WHERE codice = :c LIMIT 1'
    );
    $stmt->execute([':c' => $codice]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo json_encode(['non_trovato' => true]);
        exit;
    }
    echo json_encode([
        'codice' => $row['codice'],
        'descrizione' => $row['descrizione'],
        'giacenza' => (int) $row['giacenza'],
        'lotto' => $row['lotto'],
        'scadenza' => $row['scadenza'],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['errore' => 'errore interno']);
}
