import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ImportRow = Record<string, unknown>;

const ALLOWED_AFFILIATIONS = new Set(["ELF", "EPLF", "Civilian"]);
const ALLOWED_REVIEW_STATUSES = ["Pending", "Approved", "Rejected"] as const;

function normalizeString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeNullableString(value: unknown) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function excelSerialToDate(value: number) {
  return new Date(Math.round((value - 25569) * 86400 * 1000));
}

function formatDateOnly(date: Date) {
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeDateValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (value > 20000 && value < 60000) return formatDateOnly(excelSerialToDate(value));
    return null;
  }

  const trimmed = normalizeString(value);
  if (!trimmed) return null;
  if (/^\d{4}$/.test(trimmed)) return null;
  if (/^\d{4}s$/i.test(trimmed)) return null;
  if (/^\d{4}\s*[–-]\s*\d{4}$/.test(trimmed)) return null;

  const parsed = new Date(trimmed.replace(/^Sept\b/i, "Sep"));
  return Number.isNaN(parsed.getTime()) ? null : formatDateOnly(parsed);
}

function normalizeAffiliationValue(value: unknown) {
  const trimmed = normalizeString(value);
  if (!trimmed) return "Civilian";
  if (ALLOWED_AFFILIATIONS.has(trimmed)) return trimmed;

  const upper = trimmed.toUpperCase();
  if (upper.includes("EPLF")) return "EPLF";
  if (upper.includes("ELF")) return "ELF";
  return "Civilian";
}

function normalizeReviewStatus(value: unknown) {
  const trimmed = normalizeString(value);
  if (!trimmed) return "Pending";

  const matched = ALLOWED_REVIEW_STATUSES.find(
    (allowed) => allowed.toLowerCase() === trimmed.toLowerCase(),
  );

  return matched ?? "Pending";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

interface NormalizedRow {
  id?: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  birth_date: string | null;
  death_date: string | null;
  birth_city: string | null;
  birth_province: string | null;
  status: string;
  life_story: string | null;
  submitted_by: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return Response.json({ error: "Server configuration is incomplete." }, {
        status: 500, headers: corsHeaders,
      });
    }

    if (!authHeader) {
      return Response.json({ error: "Authentication is required." }, {
        status: 401, headers: corsHeaders,
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return Response.json({ error: "Authentication could not be verified." }, {
        status: 401, headers: corsHeaders,
      });
    }

    const { data: roleRows, error: roleError } = await adminClient
      .from("user_roles").select("role").eq("user_id", user.id);

    if (roleError) {
      return Response.json({ error: roleError.message }, { status: 500, headers: corsHeaders });
    }

    const roles = (roleRows ?? []).map((row) => row.role);
    const canImport = roles.includes("founder") || roles.includes("org_admin");
    if (!canImport) {
      return Response.json({ error: "Only founders and admins can import profiles." }, {
        status: 403, headers: corsHeaders,
      });
    }

    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? (body.rows as ImportRow[]) : [];

    // ── Step 1: Normalize all rows ──
    const errorMessages: string[] = [];
    let errors = 0;

    const normalized: NormalizedRow[] = [];
    for (const [index, rawRow] of rows.entries()) {
      const firstName = normalizeString(rawRow.first_name);
      if (!firstName) {
        errors++;
        errorMessages.push(`Row ${index + 1}: missing first_name.`);
        continue;
      }

      normalized.push({
        id: normalizeString(rawRow.id) || undefined,
        first_name: firstName,
        last_name: normalizeString(rawRow.last_name) || "Unknown",
        affiliation: normalizeAffiliationValue(rawRow.affiliation),
        birth_date: normalizeDateValue(rawRow.birth_date),
        death_date: normalizeDateValue(rawRow.death_date),
        birth_city: normalizeNullableString(rawRow.birth_city),
        birth_province: normalizeNullableString(rawRow.birth_province),
        status: normalizeReviewStatus(rawRow.status),
        life_story: normalizeNullableString(rawRow.life_story),
        submitted_by: user.id,
      });
    }

    // ── Step 2: Separate rows with valid UUIDs from new rows ──
    const withId = normalized.filter((r) => r.id && isUuid(r.id));
    const withoutId = normalized.filter((r) => !r.id || !isUuid(r.id));

    let added = 0;
    let updated = 0;
    let skipped = 0;

    // ── Step 3: Handle rows WITH existing IDs (bulk upsert) ──
    if (withId.length > 0) {
      const existingIds = withId.map((r) => r.id!);
      const { data: existing } = await adminClient
        .from("martyr_profiles")
        .select("id")
        .in("id", existingIds);

      const existingSet = new Set((existing ?? []).map((e) => e.id));

      const toUpdate = withId.filter((r) => existingSet.has(r.id!));
      const toInsertWithId = withId.filter((r) => !existingSet.has(r.id!));

      // Bulk update existing
      for (const row of toUpdate) {
        const { id, ...payload } = row;
        const { error: updateError } = await adminClient
          .from("martyr_profiles").update(payload).eq("id", id!);
        if (updateError) {
          errors++;
          errorMessages.push(`Update ${row.first_name} ${row.last_name}: ${updateError.message}`);
        } else {
          updated++;
        }
      }

      // Bulk insert rows with specified IDs
      if (toInsertWithId.length > 0) {
        const { error: insertError, count } = await adminClient
          .from("martyr_profiles")
          .insert(toInsertWithId.map((r) => ({ id: r.id, ...r })))
          .select("id");
        if (insertError) {
          errors += toInsertWithId.length;
          errorMessages.push(`Bulk insert (with ID): ${insertError.message}`);
        } else {
          added += toInsertWithId.length;
        }
      }
    }

    // ── Step 4: Handle rows WITHOUT IDs — dedup check then bulk insert ──
    if (withoutId.length > 0) {
      // Fetch existing profiles to check for duplicates by first_name + last_name + affiliation
      const { data: allExisting } = await adminClient
        .from("martyr_profiles")
        .select("first_name, last_name, affiliation");

      const existingKeys = new Set(
        (allExisting ?? []).map((e) =>
          `${e.first_name.toLowerCase()}|${e.last_name.toLowerCase()}|${e.affiliation.toLowerCase()}`
        ),
      );

      const toInsert: Omit<NormalizedRow, "id">[] = [];
      for (const row of withoutId) {
        const key = `${row.first_name.toLowerCase()}|${row.last_name.toLowerCase()}|${row.affiliation.toLowerCase()}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        // Add to dedup set so we don't insert duplicates within the same batch
        existingKeys.add(key);
        const { id: _id, ...payload } = row;
        toInsert.push(payload);
      }

      // Bulk insert in chunks of 100
      const CHUNK = 100;
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        const chunk = toInsert.slice(i, i + CHUNK);
        const { error: insertError } = await adminClient
          .from("martyr_profiles")
          .insert(chunk);
        if (insertError) {
          errors += chunk.length;
          errorMessages.push(`Bulk insert chunk ${Math.floor(i / CHUNK) + 1}: ${insertError.message}`);
        } else {
          added += chunk.length;
        }
      }
    }

    return Response.json({
      added,
      updated,
      skipped,
      errors,
      errorMessages: errorMessages.slice(0, 20),
      total: rows.length,
    }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected import error.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
