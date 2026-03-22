/**
 * API per buste paga (archivio PDF)
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Lista buste per anno
router.get('/archivio/:anno', (req, res) => {
  const dir = path.join(__dirname, '..', 'buste', req.params.anno);
  if (!fs.existsSync(dir)) {
    return res.json([]);
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  res.json(files);
});

export default router;
