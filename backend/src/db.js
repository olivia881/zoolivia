import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const dataDirectory = path.join(projectRoot, 'data')

fs.mkdirSync(dataDirectory, { recursive: true })

const database = new Database(path.join(dataDirectory, 'badante.sqlite'))
database.pragma('journal_mode = WAL')

database.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    employer_name TEXT NOT NULL,
    employer_tax_code TEXT NOT NULL,
    employer_address TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    worker_tax_code TEXT NOT NULL,
    contract_type TEXT NOT NULL,
    level TEXT NOT NULL,
    weekly_hours REAL NOT NULL,
    hourly_rate REAL NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payslip_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    worker_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    gross_salary REAL NOT NULL,
    net_salary REAL NOT NULL,
    employer_contributions REAL NOT NULL,
    worker_contributions REAL NOT NULL,
    total_cost REAL NOT NULL,
    created_at TEXT NOT NULL
  );
`)

export function getSettings() {
  return database
    .prepare(
      `
        SELECT
          employer_name AS employerName,
          employer_tax_code AS employerTaxCode,
          employer_address AS employerAddress,
          worker_name AS workerName,
          worker_tax_code AS workerTaxCode,
          contract_type AS contractType,
          level,
          weekly_hours AS weeklyHours,
          hourly_rate AS hourlyRate,
          month,
          year
        FROM settings
        WHERE id = 1
      `,
    )
    .get()
}

export function saveSettings(input) {
  database
    .prepare(
      `
        INSERT INTO settings (
          id,
          employer_name,
          employer_tax_code,
          employer_address,
          worker_name,
          worker_tax_code,
          contract_type,
          level,
          weekly_hours,
          hourly_rate,
          month,
          year,
          updated_at
        )
        VALUES (
          1,
          @employerName,
          @employerTaxCode,
          @employerAddress,
          @workerName,
          @workerTaxCode,
          @contractType,
          @level,
          @weeklyHours,
          @hourlyRate,
          @month,
          @year,
          @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          employer_name = excluded.employer_name,
          employer_tax_code = excluded.employer_tax_code,
          employer_address = excluded.employer_address,
          worker_name = excluded.worker_name,
          worker_tax_code = excluded.worker_tax_code,
          contract_type = excluded.contract_type,
          level = excluded.level,
          weekly_hours = excluded.weekly_hours,
          hourly_rate = excluded.hourly_rate,
          month = excluded.month,
          year = excluded.year,
          updated_at = excluded.updated_at
      `,
    )
    .run({
      ...input,
      updatedAt: new Date().toISOString(),
    })
}

export function saveArchiveEntry(payload) {
  database
    .prepare(
      `
        INSERT INTO payslip_archive (
          year,
          month,
          worker_name,
          file_name,
          file_path,
          gross_salary,
          net_salary,
          employer_contributions,
          worker_contributions,
          total_cost,
          created_at
        )
        VALUES (
          @year,
          @month,
          @workerName,
          @fileName,
          @filePath,
          @grossSalary,
          @netSalary,
          @employerContributions,
          @workerContributions,
          @totalCost,
          @createdAt
        )
      `,
    )
    .run({
      ...payload,
      createdAt: new Date().toISOString(),
    })
}

export function listArchive(limit = 12) {
  return database
    .prepare(
      `
        SELECT
          id,
          year,
          month,
          worker_name AS workerName,
          file_name AS fileName,
          file_path AS filePath,
          gross_salary AS grossSalary,
          net_salary AS netSalary,
          employer_contributions AS employerContributions,
          worker_contributions AS workerContributions,
          total_cost AS totalCost,
          created_at AS createdAt
        FROM payslip_archive
        ORDER BY created_at DESC
        LIMIT ?
      `,
    )
    .all(limit)
}
