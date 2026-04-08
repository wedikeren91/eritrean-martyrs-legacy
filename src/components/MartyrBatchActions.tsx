import { useRef, useState } from "react";
import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type MartyrProfile = {
  id: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  birth_date: string | null;
  death_date: string | null;
  birth_city: string | null;
  birth_province: string | null;
  status: string;
  life_story: string | null;
};

const COLUMNS = [
  { key: "id", header: "id" },
  { key: "first_name", header: "first_name" },
  { key: "last_name", header: "last_name" },
  { key: "affiliation", header: "affiliation" },
  { key: "birth_date", header: "birth_date" },
  { key: "death_date", header: "death_date" },
  { key: "birth_city", header: "birth_city" },
  { key: "birth_province", header: "birth_province" },
  { key: "status", header: "status" },
  { key: "life_story", header: "life_story" },
] as const;

// ── Export ────────────────────────────────────────────────────────────────────
export async function exportProfiles(profiles: MartyrProfile[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Martyr Profiles");

  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 20 }));

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E0D5" } };
    cell.border = { bottom: { style: "thin" } };
  });

  profiles.forEach((p) => {
    ws.addRow({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      affiliation: p.affiliation,
      birth_date: p.birth_date ?? "",
      death_date: p.death_date ?? "",
      birth_city: p.birth_city ?? "",
      birth_province: p.birth_province ?? "",
      status: p.status,
      life_story: p.life_story ?? "",
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `martyr_profiles_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Download blank template ───────────────────────────────────────────────────
export async function downloadTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Martyr Profiles");
  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 20 }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E0D5" } };
    cell.border = { bottom: { style: "thin" } };
  });

  // Example row
  ws.addRow({
    id: "(leave blank for new profiles)",
    first_name: "Haile",
    last_name: "Woldense",
    affiliation: "ELF",
    birth_date: "1950-03-15",
    death_date: "1977-09-01",
    birth_city: "Asmara",
    birth_province: "Maekel",
    status: "Pending",
    life_story: "Optional biography text…",
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "martyr_profiles_template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Parse uploaded file ───────────────────────────────────────────────────────
type ParsedImportValue = string | number | boolean | Date | null | undefined;
type ParsedImportRow = Record<string, string>;

const ALLOWED_AFFILIATIONS = ["ELF", "EPLF", "Civilian"] as const;
const ALLOWED_REVIEW_STATUSES = ["Pending", "Approved", "Rejected"] as const;
const IMPORT_CHUNK_SIZE = 50;

const IMPORT_ALIASES: Record<string, string> = {
  "known_as__nickname": "known_as",
  "known_as_nickname": "known_as",
  "nickname": "known_as",
  "organization": "affiliation",
  "category": "affiliation",
  "organisation": "affiliation",
  "role__context": "role_context",
  "date_of_sacrifice": "death_date",
  "date_of_death": "death_date",
  "date_of_birth": "birth_date",
  "military_rank": "rank",
  "life_story": "life_story",
  "bio": "life_story",
  "notable_quote": "quote",
  "city": "birth_city",
  "region": "birth_province",
  "place": "place_of_martyrdom",
  "place_of_martyrdom": "place_of_martyrdom",
  "conflict__war": "battle",
  "conflict_war": "battle",
  "battle": "battle",
  "status": "status",
};

function normalizeKey(raw: string) {
  const key = raw.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
  return IMPORT_ALIASES[key] ?? key;
}

function excelSerialToDate(value: number) {
  return new Date(Math.round((value - 25569) * 86400 * 1000));
}

function formatDateOnly(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateValue(value: ParsedImportValue): string {
  if (value instanceof Date) {
    return formatDateOnly(value);
  }

  if (typeof value === "number") {
    if (value > 20000 && value < 60000) {
      return formatDateOnly(excelSerialToDate(value));
    }
    if (value >= 1000 && value <= 9999) {
      return "";
    }
    return "";
  }

  if (typeof value !== "string") {
    return String(value ?? "").trim();
  }

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}$/.test(trimmed)) return "";
  if (/^\d{4}s$/i.test(trimmed)) return "";
  if (/^\d{4}\s*[–-]\s*\d{4}$/.test(trimmed)) return "";

  const normalizedMonth = trimmed.replace(/^Sept\b/i, "Sep");
  const parsed = new Date(normalizedMonth);
  return Number.isNaN(parsed.getTime()) ? "" : formatDateOnly(parsed);
}

function normalizeCellValue(value: ParsedImportValue, header: string): string {
  if (header === "birth_date" || header === "death_date") {
    return normalizeDateValue(value);
  }

  if (value instanceof Date) {
    return formatDateOnly(value);
  }

  return String(value ?? "").trim();
}

function mergeRowValues(headers: string[], values: ParsedImportValue[]) {
  const row: ParsedImportRow = {};

  headers.forEach((header, index) => {
    const nextValue = normalizeCellValue(values[index], header);
    if (!header) return;

    if (!(header in row) || !row[header]) {
      row[header] = nextValue;
      return;
    }

    if (nextValue) {
      row[header] = nextValue;
    }
  });

  return row;
}

function normalizeAffiliationValue(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "Civilian";

  if (ALLOWED_AFFILIATIONS.includes(trimmed as (typeof ALLOWED_AFFILIATIONS)[number])) {
    return trimmed;
  }

  const upper = trimmed.toUpperCase();
  const elfIndex = upper.indexOf("ELF");
  const eplfIndex = upper.indexOf("EPLF");

  if (elfIndex === -1 && eplfIndex === -1) return "Civilian";
  if (elfIndex === -1) return "EPLF";
  if (eplfIndex === -1) return "ELF";

  return elfIndex < eplfIndex ? "ELF" : "EPLF";
}

function normalizeReviewStatus(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "Pending";

  const matched = ALLOWED_REVIEW_STATUSES.find(
    (allowed) => allowed.toLowerCase() === trimmed.toLowerCase()
  );

  return matched ?? "Pending";
}

async function parseUploadedFile(file: File): Promise<ParsedImportRow[]> {
  const buffer = await file.arrayBuffer();

  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => normalizeKey(h.replace(/"/g, "")));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
      return mergeRowValues(headers, values);
    });
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: ParsedImportRow[] = [];
  let headers: string[] = [];

  ws.eachRow((excelRow, rowNumber) => {
    const cells = (excelRow.values as ParsedImportValue[]).slice(1);
    if (rowNumber === 1) {
      headers = cells.map((v) => normalizeKey(String(v ?? "").trim()));
      return;
    }

    rows.push(mergeRowValues(headers, cells));
  });

  return rows;
}

// ── Import Modal ──────────────────────────────────────────────────────────────
type ImportResult = {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages?: string[];
  total: number;
};

type Props = { profiles: MartyrProfile[]; onClose: () => void; onDone: () => void };

export default function MartyrImportModal({ profiles, onClose, onDone }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const rows = await parseUploadedFile(file);
    const cleaned = rows.filter(
      (r) =>
        r.first_name &&
        !(r.first_name === "Haile" && r.last_name === "Woldense")
    );
    setParsedRows(cleaned);
  };

  const runImport = async () => {
    if (!parsedRows || !user) return;
    setImporting(true);

    const CHUNK = 200;
    const aggregate: ImportResult = { added: 0, updated: 0, skipped: 0, errors: 0, errorMessages: [], total: parsedRows.length };
    setProgress({ sent: 0, total: parsedRows.length });

    for (let i = 0; i < parsedRows.length; i += CHUNK) {
      const chunk = parsedRows.slice(i, i + CHUNK);
      setProgress({ sent: i, total: parsedRows.length });

      const { data, error } = await supabase.functions.invoke("import-martyr-profiles", {
        body: { rows: chunk },
      });

      if (error) {
        aggregate.errors += chunk.length;
        aggregate.errorMessages?.push(`Batch ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
        continue;
      }

      aggregate.added += data?.added ?? 0;
      aggregate.updated += data?.updated ?? 0;
      aggregate.skipped += data?.skipped ?? 0;
      aggregate.errors += data?.errors ?? 0;
      if (data?.errorMessages?.length) {
        aggregate.errorMessages?.push(...data.errorMessages);
      }
    }

    setProgress({ sent: parsedRows.length, total: parsedRows.length });
    setResult(aggregate);
    setImporting(false);
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-card border border-border max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            Import Complete
          </h2>
          <div className="space-y-2 mb-6 text-sm">
            <p>
              <span className="font-semibold text-emerald-700">{result.added}</span> new profiles added
            </p>
            <p>
              <span className="font-semibold text-primary">{result.updated}</span> profiles updated
            </p>
            {result.skipped > 0 && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{result.skipped}</span> duplicates skipped
              </p>
            )}
            {result.errors > 0 && (
              <p className="text-destructive">
                <span className="font-semibold">{result.errors}</span> rows failed
              </p>
            )}
          </div>
          {result.errorMessages && result.errorMessages.length > 0 && (
            <div className="mb-6 border border-border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
              <p className="mb-2 font-semibold text-foreground">Top import issues</p>
              <ul className="space-y-1">
                {result.errorMessages.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => { onDone(); onClose(); }}
            className="bg-primary text-primary-foreground px-8 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border max-w-2xl w-full my-8">
        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />

        <div className="border-b border-border px-8 py-6 flex items-center justify-between">
          <div>
            <div className="data-label mb-1">Batch Management</div>
            <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Import Martyr Profiles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Instructions */}
          <div className="bg-muted/40 border border-border p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Import rules:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Rows with a valid <code className="font-mono">id</code> will <strong className="text-foreground">update</strong> the matching profile.</li>
              <li>Rows without an <code className="font-mono">id</code> (or blank) will be <strong className="text-foreground">inserted</strong> as new profiles.</li>
                <li><code className="font-mono">first_name</code> is required. Blank <code className="font-mono">last_name</code> values are saved as <strong className="text-foreground">Unknown</strong>.</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-2 text-primary underline underline-offset-4 font-semibold"
            >
              ↓ Download Template (.xlsx)
            </button>
          </div>

          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary transition-colors p-10 text-center cursor-pointer"
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {fileName || "Click to select file"}
            </p>
            <p className="text-xs text-muted-foreground">Accepts Google Sheets exports (.xlsx/.csv) and Excel (.xlsx)</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {parsedRows && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} ready to import
              </p>
              <div className="max-h-48 overflow-y-auto border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left data-label">First Name</th>
                      <th className="px-3 py-2 text-left data-label">Last Name</th>
                      <th className="px-3 py-2 text-left data-label">Affiliation</th>
                      <th className="px-3 py-2 text-left data-label">Status</th>
                      <th className="px-3 py-2 text-left data-label">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, i) => {
                      const isUuid = /^[0-9a-f-]{36}$/i.test(r.id?.trim() ?? "");
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2">{r.first_name || "—"}</td>
                          <td className="px-3 py-2">{r.last_name || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.affiliation || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{r.status || "Pending"}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                                isUuid
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {isUuid ? "Update" : "New"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Importing…</span>
                <span>{progress.sent} / {progress.total} rows sent</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.sent / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <button
              onClick={runImport}
              disabled={!parsedRows || parsedRows.length === 0 || importing}
              className="bg-primary text-primary-foreground px-10 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {importing ? "Importing…" : `Import ${parsedRows?.length ?? 0} Rows`}
            </button>
            <button
              onClick={onClose}
              disabled={importing}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
