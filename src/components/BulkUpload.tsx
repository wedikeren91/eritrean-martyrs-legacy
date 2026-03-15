import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ParsedRow = {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  date_of_death?: string;
  city?: string;
  region?: string;
  category?: string;
  status?: string;
  rank?: string;
  role?: string;
  bio?: string;
  significance?: string;
  quote?: string;
  place_of_martyrdom?: string;
  battle?: string;
  known_as?: string;
  _errors?: string[];
  _valid: boolean;
};

const REQUIRED_COLS = ["first_name", "last_name"];
const ALL_COLS = [
  "first_name","last_name","known_as","date_of_birth","date_of_death",
  "city","region","category","status","rank","role",
  "bio","significance","quote","place_of_martyrdom","battle",
];

function normalizeKey(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
}

function parseRows(sheet: XLSX.WorkSheet): ParsedRow[] {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return json.map((raw) => {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      row[normalizeKey(k)] = String(v ?? "").trim();
    }
    const errors: string[] = [];
    for (const req of REQUIRED_COLS) {
      if (!row[req]) errors.push(`Missing required field: ${req}`);
    }
    return {
      first_name: row.first_name ?? "",
      last_name: row.last_name ?? "",
      known_as: row.known_as,
      date_of_birth: row.date_of_birth,
      date_of_death: row.date_of_death,
      city: row.city,
      region: row.region,
      category: row.category,
      status: row.status,
      rank: row.rank,
      role: row.role,
      bio: row.bio,
      significance: row.significance,
      quote: row.quote,
      place_of_martyrdom: row.place_of_martyrdom,
      battle: row.battle,
      _errors: errors,
      _valid: errors.length === 0,
    };
  });
}

type Props = { onClose: () => void };

export default function BulkUpload({ onClose }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ submitted: number; errors: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      setRows(parseRows(ws));
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!rows || !user) return;
    setSubmitting(true);
    const validRows = rows.filter((r) => r._valid);
    const errorRows = rows.filter((r) => !r._valid).length;

    // Create bulk upload record
    const { data: upload } = await supabase
      .from("bulk_uploads")
      .insert({
        user_id: user.id,
        file_name: fileName,
        total_rows: rows.length,
        parsed_rows: validRows.length,
        error_rows: errorRows,
        status: "done",
      })
      .select()
      .single();

    // Insert contributions
    const contributions = validRows.map((row) => {
      const { _errors, _valid, ...personData } = row;
      return {
        user_id: user.id,
        person_data: personData as unknown as import("@/integrations/supabase/types").Json,
        source_type: "bulk_upload",
        bulk_upload_id: upload?.id ?? null,
        status: "pending" as const,
      };
    });

    let submitted = 0;
    // Batch insert in chunks of 50
    for (let i = 0; i < contributions.length; i += 50) {
      const { error } = await supabase.from("contributions").insert(contributions.slice(i, i + 50));
      if (!error) submitted += Math.min(50, contributions.length - i);
    }

    setDone({ submitted, errors: errorRows });
    setSubmitting(false);
  };

  const validCount = rows?.filter((r) => r._valid).length ?? 0;
  const errorCount = rows?.filter((r) => !r._valid).length ?? 0;

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-card border border-border max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            Upload Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            <strong className="text-foreground">{done.submitted}</strong> records submitted for review.
          </p>
          {done.errors > 0 && (
            <p className="text-xs text-destructive mb-4">
              {done.errors} rows skipped due to missing required fields.
            </p>
          )}
          <p className="text-xs text-muted-foreground mb-6">
            All records are <strong className="text-foreground">Pending</strong> — an admin will review and approve them.
          </p>
          <button onClick={onClose}
            className="bg-primary text-primary-foreground px-8 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border max-w-3xl w-full my-8">
        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />

        <div className="border-b border-border px-8 py-6 flex items-center justify-between">
          <div>
            <div className="data-label mb-1">Bulk Data Entry</div>
            <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>Upload Excel / CSV</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl">✕</button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Template download hint */}
          <div className="bg-muted/40 border border-border p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Required column headers (case-insensitive):</p>
            <p className="font-mono text-[10px] leading-relaxed">
              {ALL_COLS.join(" · ")}
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Required:</strong> first_name, last_name · All other fields are optional.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary transition-colors p-10 text-center cursor-pointer"
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {fileName || "Click to select file"}
            </p>
            <p className="text-xs text-muted-foreground">Accepts .xlsx, .xls, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {rows && (
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-xs font-semibold text-foreground">{rows.length} rows parsed</span>
                <span className="text-xs text-emerald-700">✅ {validCount} valid</span>
                {errorCount > 0 && <span className="text-xs text-destructive">⚠️ {errorCount} with errors</span>}
              </div>

              <div className="max-h-64 overflow-y-auto border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left data-label">Status</th>
                      <th className="px-3 py-2 text-left data-label">First Name</th>
                      <th className="px-3 py-2 text-left data-label">Last Name</th>
                      <th className="px-3 py-2 text-left data-label">Category</th>
                      <th className="px-3 py-2 text-left data-label">City</th>
                      <th className="px-3 py-2 text-left data-label">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${!row._valid ? "bg-destructive/5" : ""}`}>
                        <td className="px-3 py-2">
                          {row._valid ? <span className="text-emerald-700">✅</span> : <span className="text-destructive">⚠️</span>}
                        </td>
                        <td className="px-3 py-2">{row.first_name || "—"}</td>
                        <td className="px-3 py-2">{row.last_name || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.category || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.city || "—"}</td>
                        <td className="px-3 py-2 text-destructive text-[10px]">{row._errors?.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <button
              onClick={handleSubmit}
              disabled={!rows || validCount === 0 || submitting}
              className="bg-primary text-primary-foreground px-10 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {submitting ? "Submitting…" : `Submit ${validCount} Records for Review`}
            </button>
            <button onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
