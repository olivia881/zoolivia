-- Inserisce alert di prova per testare alert.php sul PC.
-- Modifica ProdottoId con codici che esistono in tabella Prodotti.

INSERT INTO AlertMagazzino (ProdottoId, Tipo, Attivo)
VALUES (160, 'esaurimento', 1)
ON CONFLICT(ProdottoId, Tipo) DO UPDATE SET
    Attivo = 1,
    AggiornatoIl = datetime('now', 'localtime');

-- Per simulare "nuovo alert" al poll successivo, riesegui solo l'UPDATE:
-- UPDATE AlertMagazzino
-- SET AggiornatoIl = datetime('now', 'localtime')
-- WHERE ProdottoId = 160 AND Tipo = 'esaurimento';

-- Per chiudere un alert (come farà Prisma PC quando il prodotto torna ok):
-- UPDATE AlertMagazzino
-- SET Attivo = 0, AggiornatoIl = datetime('now', 'localtime')
-- WHERE ProdottoId = 160 AND Tipo = 'esaurimento';
