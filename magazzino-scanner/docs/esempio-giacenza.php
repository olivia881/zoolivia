<?php
/**
 * giacenza.php — modello allineato a PrismaScanner (GET ?id=..., JSON piatto in radice).
 *
 * Synology:  $dbPath = '/volume1/Prisma/Prisma.db';
 * PC test:   $dbPath = 'D:/Prisma/Prisma.db';
 * QNAP:      adatta percorso sotto /share/...
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_response(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

if (!isset($_GET['id']) || trim((string) $_GET['id']) === '') {
    json_response(['errore' => 'Parametro id mancante'], 400);
}

$id = (int) $_GET['id'];
if ($id <= 0) {
    json_response(['errore' => 'Parametro id non valido'], 400);
}

try {
    $dbPath = '/volume1/Prisma/Prisma.db'; // PC test: 'D:/Prisma/Prisma.db'

    if (!file_exists($dbPath)) {
        json_response(['errore' => 'Database non trovato'], 500);
    }

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $sql = 'SELECT Id, TipoDiProdotto, ResiduoMagazzino, LottoNr, DataScadenza,
                   Marca, NumeroSerie, UnitaMisura
            FROM Prodotti
            WHERE Id = :id
            LIMIT 1';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    if (!$row) {
        json_response([
            'trovato' => false,
            'codice'  => $id,
        ], 200);
    }

    // JSON piatto — PrismaScanner legge i campi in radice (non usare "prodotto": { ... })
    json_response([
        'codice'       => $row['Id'],
        'descrizione'  => $row['TipoDiProdotto'],
        'giacenza'     => (int) $row['ResiduoMagazzino'],
        'lotto'        => $row['LottoNr'],
        'scadenza'     => $row['DataScadenza'],
        'marca'        => $row['Marca'] ?: null,
        'numero_serie' => $row['NumeroSerie'] ?: null,
        'unita_misura' => $row['UnitaMisura'] ?: null,
    ], 200);

} catch (Throwable $e) {
    json_response(['errore' => $e->getMessage()], 500);
}
