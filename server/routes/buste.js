const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { calcolaStipendio } = require('../utils/calculations');
const { generaPDF, MESI_NOMI } = require('../utils/generatePDF');

const BUSTE_BASE_DIR = path.join(__dirname, '..', '..', 'buste');

// GET /api/buste - lista tutte le buste paga
router.get('/', (req, res) => {
  try {
    const buste = db.prepare(`
      SELECT
        b.*,
        d.nome || ' ' || d.cognome AS nome_datore,
        l.nome || ' ' || l.cognome AS nome_lavoratrice
      FROM buste_paga b
      LEFT JOIN datori d ON b.datore_id = d.id
      LEFT JOIN lavoratrici l ON b.lavoratrice_id = l.id
      ORDER BY b.anno DESC, b.mese DESC, b.created_at DESC
    `).all();
    res.json(buste);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/buste/calcola - calcola stipendio (senza salvare)
router.post('/calcola', (req, res) => {
  const { tipoContratto, livello, oreSettimanali, pagaOraria } = req.body;

  if (!tipoContratto || !livello) {
    return res.status(400).json({ error: 'tipoContratto e livello sono obbligatori' });
  }
  if (tipoContratto === 'non_convivente' && (!oreSettimanali || !pagaOraria)) {
    return res.status(400).json({ error: 'oreSettimanali e pagaOraria sono obbligatori per contratto non convivente' });
  }

  try {
    const calcoli = calcolaStipendio({ tipoContratto, livello, oreSettimanali, pagaOraria });
    res.json(calcoli);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/buste/genera - genera busta paga e PDF
router.post('/genera', async (req, res) => {
  const { tipoContratto, livello, oreSettimanali, pagaOraria, mese, anno } = req.body;

  // Validazione input
  if (!tipoContratto || !livello || !mese || !anno) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti: tipoContratto, livello, mese, anno' });
  }
  if (tipoContratto === 'non_convivente' && (!oreSettimanali || !pagaOraria)) {
    return res.status(400).json({ error: 'Ore settimanali e paga oraria obbligatorie per non convivente' });
  }
  if (mese < 1 || mese > 12) {
    return res.status(400).json({ error: 'Mese non valido (1-12)' });
  }
  if (anno < 2000 || anno > 2099) {
    return res.status(400).json({ error: 'Anno non valido' });
  }

  try {
    const calcoli = calcolaStipendio({ tipoContratto, livello, oreSettimanali, pagaOraria });
    const datore = db.prepare('SELECT * FROM datori WHERE id = 1').get();
    const lavoratrice = db.prepare('SELECT * FROM lavoratrici WHERE id = 1').get();

    // Crea directory anno
    const annoDir = path.join(BUSTE_BASE_DIR, String(anno));
    if (!fs.existsSync(annoDir)) {
      fs.mkdirSync(annoDir, { recursive: true });
    }

    // Nome file: Busta_[Mese]_[Anno]_[NomeLavoratrice].pdf
    const nomeMese = MESI_NOMI[mese - 1];
    const nomeLav = [lavoratrice.nome, lavoratrice.cognome]
      .filter(Boolean)
      .join('_')
      .replace(/\s+/g, '_') || 'Lavoratrice';
    const nomeFile = `Busta_${nomeMese}_${anno}_${nomeLav}.pdf`;
    const outputPath = path.join(annoDir, nomeFile);

    await generaPDF({
      datore,
      lavoratrice,
      mese: parseInt(mese),
      anno: parseInt(anno),
      calcoli,
      tipoContratto,
      livello,
      oreSettimanali: parseFloat(oreSettimanali) || 0,
      pagaOraria: parseFloat(pagaOraria) || 0,
      outputPath,
    });

    // Salva in database
    const pdfRelativePath = path.join(String(anno), nomeFile);
    const result = db.prepare(`
      INSERT INTO buste_paga (
        datore_id, lavoratrice_id, mese, anno,
        tipo_contratto, livello, ore_settimanali, paga_oraria,
        lordo, contributi_lavoratore, contributi_datore, netto,
        tfr, tredicesima, costo_totale, pdf_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1, 1,
      parseInt(mese), parseInt(anno),
      tipoContratto, livello,
      parseFloat(oreSettimanali) || null,
      parseFloat(pagaOraria) || null,
      calcoli.lordo, calcoli.contributiLavoratore, calcoli.contributiDatore,
      calcoli.netto, calcoli.tfr, calcoli.tredicesima, calcoli.costoTotale,
      pdfRelativePath,
    );

    res.json({
      id: result.lastInsertRowid,
      nomeFile,
      calcoli,
      downloadUrl: `/api/buste/${result.lastInsertRowid}/download`,
    });
  } catch (err) {
    console.error('Errore generazione busta:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/buste/:id/download - scarica PDF
router.get('/:id/download', (req, res) => {
  try {
    const busta = db.prepare('SELECT * FROM buste_paga WHERE id = ?').get(req.params.id);
    if (!busta || !busta.pdf_path) {
      return res.status(404).json({ error: 'Busta paga non trovata' });
    }

    const filePath = path.join(BUSTE_BASE_DIR, busta.pdf_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File PDF non trovato sul disco' });
    }

    const nomeMese = MESI_NOMI[busta.mese - 1];
    const lavoratrice = db.prepare('SELECT * FROM lavoratrici WHERE id = 1').get();
    const nomeLav = [lavoratrice.nome, lavoratrice.cognome].filter(Boolean).join('_') || 'Lavoratrice';
    const downloadName = `Busta_${nomeMese}_${busta.anno}_${nomeLav}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/buste/:id - elimina busta
router.delete('/:id', (req, res) => {
  try {
    const busta = db.prepare('SELECT * FROM buste_paga WHERE id = ?').get(req.params.id);
    if (!busta) {
      return res.status(404).json({ error: 'Busta paga non trovata' });
    }

    // Elimina file PDF se esiste
    if (busta.pdf_path) {
      const filePath = path.join(BUSTE_BASE_DIR, busta.pdf_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.prepare('DELETE FROM buste_paga WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
