import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDb } from "./db.js";
import { validateMonthlyInput, validateProfile } from "./utils/validation.js";
import { calculatePayroll } from "./services/payrollCalculator.js";
import { generatePayslipPdf } from "./services/pdfService.js";

const PORT = Number(process.env.PORT ?? 4000);
const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const archivePath = path.resolve(__dirname, "../buste");
app.use("/buste", express.static(archivePath));

const db = await initDb();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/profile", async (_req, res) => {
  const row = await db.get(
    `
      SELECT employer_name, employer_cf, employer_address, worker_name, worker_cf
      FROM profile
      WHERE id = 1
    `,
  );

  res.json({
    employerName: row?.employer_name ?? "",
    employerCf: row?.employer_cf ?? "",
    employerAddress: row?.employer_address ?? "",
    workerName: row?.worker_name ?? "",
    workerCf: row?.worker_cf ?? "",
  });
});

app.put("/api/profile", async (req, res) => {
  const { isValid, errors, sanitized } = validateProfile(req.body ?? {});
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  await db.run(
    `
      UPDATE profile
      SET employer_name = ?,
          employer_cf = ?,
          employer_address = ?,
          worker_name = ?,
          worker_cf = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `,
    sanitized.employerName,
    sanitized.employerCf,
    sanitized.employerAddress,
    sanitized.workerName,
    sanitized.workerCf,
  );

  return res.json({ profile: sanitized });
});

app.post("/api/payroll/calculate", (req, res) => {
  const { isValid, errors, sanitized } = validateMonthlyInput(req.body ?? {});
  if (!isValid) {
    return res.status(400).json({ errors });
  }

  const calculation = calculatePayroll(sanitized);
  return res.json({ input: sanitized, calculation });
});

app.post("/api/payroll/pdf", async (req, res) => {
  const profileValidation = validateProfile(req.body?.profile ?? {});
  const inputValidation = validateMonthlyInput(req.body?.input ?? {});

  if (!profileValidation.isValid || !inputValidation.isValid) {
    return res.status(400).json({
      profileErrors: profileValidation.errors,
      inputErrors: inputValidation.errors,
    });
  }

  const calculation = calculatePayroll(inputValidation.sanitized);
  const pdf = await generatePayslipPdf({
    profile: profileValidation.sanitized,
    input: inputValidation.sanitized,
    calculation,
  });

  return res.json({
    message: "PDF generato correttamente",
    fileName: pdf.fileName,
    filePath: pdf.relativePath,
    calculation,
  });
});

app.listen(PORT, () => {
  console.log(`Backend attivo su http://localhost:${PORT}`);
});
