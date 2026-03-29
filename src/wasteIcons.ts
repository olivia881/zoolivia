/** Icone stile calendario comunale (lettera + forma + colore). */

export type WasteGlyph = {
  letter: string;
  shape: "circle" | "diamond";
  color: string;
};

function pushUnique(out: WasteGlyph[], g: WasteGlyph) {
  if (!out.some((x) => x.letter === g.letter && x.shape === g.shape)) out.push(g);
}

/**
 * Estrae icone da una riga di calendario (testo libero + parole chiave italiane).
 */
export function glyphsFromScheduleLine(line: string): WasteGlyph[] {
  const t = line.trim();
  if (!t || /nessun|no ritiro|verifica|controllo/i.test(t)) return [];
  const lower = t.toLowerCase();
  const out: WasteGlyph[] = [];

  if (/umido|organico/.test(lower)) {
    pushUnique(out, { letter: "U", shape: "circle", color: "#6B4423" });
  }
  if (/carta/.test(lower)) {
    pushUnique(out, { letter: "C", shape: "diamond", color: "#1E5A96" });
  }
  if (/plastica|metall|multimateriale/.test(lower)) {
    pushUnique(out, { letter: "M", shape: "diamond", color: "#C9A008" });
  }
  if (/\bvetro\b/.test(lower)) {
    pushUnique(out, { letter: "V", shape: "diamond", color: "#2D7A3E" });
  }
  if (/indifferenziata/.test(lower)) {
    pushUnique(out, { letter: "I", shape: "diamond", color: "#6B7280" });
  }

  return out;
}
