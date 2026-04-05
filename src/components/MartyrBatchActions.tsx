import { useRef, useState } from "react";
import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";

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
type ParsedImportRow = Record<string, string>;

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

async function parseUploadedFile(file: File): Promise<ParsedImportRow[]> {
  const buffer = await file.arrayBuffer();

  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => normalizeKey(h.replace(/"/g, "")));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
      const row: ParsedImportRow = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
      return row;
    });
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: ParsedImportRow[] = [];
  let headers: string[] = [];

  ws.eachRow((excelRow, rowNumber) => {
    const cells = (excelRow.values as (string | number | boolean | null | undefined)[]).slice(1);
    const vals = cells.map((v) => String(v ?? "").trim());
    if (rowNumber === 1) {
      headers = vals.map(normalizeKey);
      return;
    }
    const row: ParsedImportRow = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    rows.push(row);
  });

  return rows;
}

// ── Import Modal ──────────────────────────────────────────────────────────────
type ImportResult = { added: number; updated: number; errors: number };

type Props = { profiles: MartyrProfile[]; onClose: () => void; onDone: () => void };

export default function MartyrImportModal({ profiles, onClose, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const rows = await parseUploadedFile(file);
    // Filter out template example rows and empty rows
    const cleaned = rows.filter(
      (r) =>
        r.first_name &&
        r.first_name !== "Haile" &&
        r.last_name &&
        r.last_name !== "Woldense"
    );
    setParsedRows(cleaned);
  };

  const runImport = async () => {
    if (!parsedRows) return;
    setImporting(true);

    let added = 0;
    let updated = 0;
    let errors = 0;

    for (const row of parsedRows) {
      const existingId = row.id?.trim();
      const isUuid = /^[0-9a-f-]{36}$/i.test(existingId ?? "");

      const payload = {
        first_name: row.first_name?.trim() || "",
        last_name: row.last_name?.trim() || "",
        affiliation: row.affiliation?.trim() || "Civilian",
        birth_date: row.birth_date?.trim() || null,
        death_date: row.death_date?.trim() || null,
        birth_city: row.birth_city?.trim() || null,
        birth_province: row.birth_province?.trim() || null,
        status: row.status?.trim() || "Pending",
        life_story: row.life_story?.trim() || null,
      };

      if (!payload.first_name || !payload.last_name) {
        errors++;
        continue;
      }

      if (isUuid) {
        // Check if this ID exists
        const { data: existing } = await (supabase.from("martyr_profiles" as never) as any)
          .select("id")
          .eq("id", existingId)
          .maybeSingle();

        if (existing) {
          const { error } = await (supabase.from("martyr_profiles" as never) as any)
            .update(payload)
            .eq("id", existingId);
          if (error) errors++;
          else updated++;
          continue;
        }
      }

      // Insert new
      const { error } = await (supabase.from("martyr_profiles" as never) as any).insert(payload);
      if (error) errors++;
      else added++;
    }

    setResult({ added, updated, errors });
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
            {result.errors > 0 && (
              <p className="text-destructive">
                <span className="font-semibold">{result.errors}</span> rows skipped due to errors
              </p>
            )}
          </div>
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
              <li><code className="font-mono">first_name</code> and <code className="font-mono">last_name</code> are required.</li>
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
            <p className="text-xs text-muted-foreground">Accepts .xlsx, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
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
