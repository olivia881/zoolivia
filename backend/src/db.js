import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "badante.sqlite");

export async function initDb() {
  await mkdir(DATA_DIR, { recursive: true });

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      employer_name TEXT NOT NULL DEFAULT '',
      employer_cf TEXT NOT NULL DEFAULT '',
      employer_address TEXT NOT NULL DEFAULT '',
      worker_name TEXT NOT NULL DEFAULT '',
      worker_cf TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.run(
    `
      INSERT INTO profile (id)
      SELECT 1
      WHERE NOT EXISTS (SELECT 1 FROM profile WHERE id = 1);
    `,
  );

  const cols = await db.all("PRAGMA table_info(profile)");
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("contract_type")) {
    await db.run(`ALTER TABLE profile ADD COLUMN contract_type TEXT DEFAULT 'convivente'`);
    await db.run(`ALTER TABLE profile ADD COLUMN level TEXT DEFAULT 'BS'`);
    await db.run(`ALTER TABLE profile ADD COLUMN weekly_hours REAL DEFAULT 54`);
    await db.run(`ALTER TABLE profile ADD COLUMN hourly_rate REAL DEFAULT 7.45`);
    await db.run(`ALTER TABLE profile ADD COLUMN month INTEGER DEFAULT 1`);
    await db.run(`ALTER TABLE profile ADD COLUMN year INTEGER DEFAULT 2026`);
  }
  if (!names.has("profile_json")) {
    await db.run(`ALTER TABLE profile ADD COLUMN profile_json TEXT DEFAULT '{}'`);
    await db.run(`ALTER TABLE profile ADD COLUMN input_json TEXT DEFAULT '{}'`);
  }

  return db;
}
