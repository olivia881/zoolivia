<?php
/**
 * alert.php — API lettura alert magazzino (esaurimento / scadenza).
 *
 * PC test:   copia in D:\web\api\alert.php
 *            php -S 0.0.0.0:8081 -t D:\web\api
 *            http://192.168.0.188:8081/alert.php
 *
 * Synology:  copia in web/api sul NAS (stessa cartella di giacenza.php)
 *            $dbPath = '/volume1/Prisma/Prisma.db';
 *
 * Scrive gli alert solo Prisma PC (tabella AlertMagazzino). Questo script legge.
 *
 * GET opzionali:
 *   attivi=1     — solo alert attivi (default)
 *   attivi=0     — anche quelli chiusi
 *   da=2026-05-29T10:00:00 — solo alert aggiornati dopo quella data/ora (polling app)
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_response(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/** @return string|false */
function normalize_datetime_param(string $raw) {
    $raw = trim($raw);
    if ($raw === '') {
        return false;
    }
    // Accetta "2026-05-29T10:00:00" o "2026-05-29 10:00:00"
    $normalized = str_replace('T', ' ', $raw);
    $dt = DateTime::createFromFormat('Y-m-d H:i:s', $normalized)
        ?: DateTime::createFromFormat('Y-m-d H:i', $normalized);
    if (!$dt) {
        return false;
    }
    return $dt->format('Y-m-d H:i:s');
}

$soloAttivi = !isset($_GET['attivi']) || (string) $_GET['attivi'] !== '0';
$da = isset($_GET['da']) ? normalize_datetime_param((string) $_GET['da']) : false;
if (isset($_GET['da']) && $_GET['da'] !== '' && $da === false) {
    json_response(['errore' => 'Parametro da non valido (usa Y-m-dTH:i:s)'], 400);
}

try {
    // PC test
    $dbPath = 'D:/Prisma/Prisma.db';
    // Synology: $dbPath = '/volume1/Prisma/Prisma.db';

    if (!file_exists($dbPath)) {
        json_response(['errore' => 'Database non trovato', 'percorso' => $dbPath], 500);
    }

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $tableCheck = $pdo->query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='AlertMagazzino'"
    )->fetchColumn();

    if (!$tableCheck) {
        json_response([
            'errore'  => 'Tabella AlertMagazzino assente. Esegui docs/crea-tabella-alert.sql sul DB.',
            'alert'   => [],
            'totale'  => 0,
        ], 200);
    }

    $sql = 'SELECT
                a.Id AS id,
                a.ProdottoId AS codice,
                p.TipoDiProdotto AS descrizione,
                a.Tipo AS tipo,
                p.ResiduoMagazzino AS giacenza,
                p.LottoNr AS lotto,
                p.DataScadenza AS scadenza,
                p.Marca AS marca,
                a.Attivo AS attivo,
                a.CreatoIl AS creato,
                a.AggiornatoIl AS aggiornato
            FROM AlertMagazzino a
            INNER JOIN Prodotti p ON p.Id = a.ProdottoId
            WHERE 1=1';

    $params = [];

    if ($soloAttivi) {
        $sql .= ' AND a.Attivo = 1';
    }

    if ($da !== false) {
        $sql .= ' AND a.AggiornatoIl >= :da';
        $params[':da'] = $da;
    }

    $sql .= ' ORDER BY a.AggiornatoIl DESC, a.Id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $alert = [];
    foreach ($rows as $row) {
        $alert[] = [
            'id'          => (int) $row['id'],
            'codice'      => (int) $row['codice'],
            'descrizione' => $row['descrizione'],
            'tipo'        => $row['tipo'],
            'giacenza'    => (int) $row['giacenza'],
            'lotto'       => $row['lotto'],
            'scadenza'    => $row['scadenza'],
            'marca'       => $row['marca'] ?: null,
            'attivo'      => (int) $row['attivo'] === 1,
            'creato'      => $row['creato'],
            'aggiornato'  => $row['aggiornato'],
        ];
    }

    json_response([
        'alert'     => $alert,
        'totale'    => count($alert),
        'timestamp' => (new DateTime('now'))->format('Y-m-d H:i:s'),
    ], 200);

} catch (Throwable $e) {
    json_response(['errore' => $e->getMessage()], 500);
}
