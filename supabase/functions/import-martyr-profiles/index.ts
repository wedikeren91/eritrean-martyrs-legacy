import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ImportRow = Record<string, unknown>;

const ALLOWED_CATEGORIES = new Set(["ELF", "EPLF", "PLF", "Civilian", "Unknown", "Other"]);

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

function normalizeCategoryValue(value: unknown) {
  const trimmed = normalizeString(value);
  if (!trimmed) return "Civilian";
  if (ALLOWED_CATEGORIES.has(trimmed)) return trimmed;

  const upper = trimmed.toUpperCase();
  if (upper.includes("EPLF")) return "EPLF";
  if (upper.includes("ELF")) return "ELF";
  if (upper.includes("PLF")) return "PLF";
  return "Civilian";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function generateSlug(firstName: string, lastName: string) {
  const base = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base}-${suffix}`;
}

interface NormalizedRow {
  id?: string;
  first_name: string;
  last_name: string;
  slug: string;
  category: string;
  gender: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  city: string | null;
  region: string | null;
  status: string | null;
  bio: string | null;
  rank: string | null;
  role: string | null;
  known_as: string | null;
  battle: string | null;
  place_of_martyrdom: string | null;
  quote: string | null;
  significance: string | null;
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

    const roles = (roleRows ?? []).map((row: any) => row.role);
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

      const lastName = normalizeString(rawRow.last_name) || "Unknown";

      // Support both old field names (affiliation, birth_date, etc.) and new ones (category, date_of_birth, etc.)
      normalized.push({
        id: normalizeString(rawRow.id) || undefined,
        first_name: firstName,
        last_name: lastName,
        slug: generateSlug(firstName, lastName),
        category: normalizeCategoryValue(rawRow.category ?? rawRow.affiliation),
        gender: normalizeString(rawRow.gender) || "Unknown",
        date_of_birth: normalizeDateValue(rawRow.date_of_birth ?? rawRow.birth_date),
        date_of_death: normalizeDateValue(rawRow.date_of_death ?? rawRow.death_date),
        city: normalizeNullableString(rawRow.city ?? rawRow.birth_city),
        region: normalizeNullableString(rawRow.region ?? rawRow.birth_province),
        status: normalizeNullableString(rawRow.status) || "Deceased",
        bio: normalizeNullableString(rawRow.bio ?? rawRow.life_story),
        rank: normalizeNullableString(rawRow.rank),
        role: normalizeNullableString(rawRow.role ?? rawRow.role_context),
        known_as: normalizeNullableString(rawRow.known_as),
        battle: normalizeNullableString(rawRow.battle),
        place_of_martyrdom: normalizeNullableString(rawRow.place_of_martyrdom),
        quote: normalizeNullableString(rawRow.quote),
        significance: normalizeNullableString(rawRow.significance),
        submitted_by: user.id,
      });
    }

    // ── Step 2: Separate rows with valid UUIDs from new rows ──
    const withId = normalized.filter((r) => r.id && isUuid(r.id));
    const withoutId = normalized.filter((r) => !r.id || !isUuid(r.id));

    let added = 0;
    let updated = 0;
    let skipped = 0;

    // ── Step 3: Handle rows WITH existing IDs (update in persons) ──
    if (withId.length > 0) {
      const existingIds = withId.map((r) => r.id!);
      const { data: existing } = await adminClient
        .from("persons")
        .select("id")
        .in("id", existingIds);

      const existingSet = new Set((existing ?? []).map((e: any) => e.id));

      const toUpdate = withId.filter((r) => existingSet.has(r.id!));
      const toInsertWithId = withId.filter((r) => !existingSet.has(r.id!));

      // Update existing
      for (const row of toUpdate) {
        const { id, slug: _slug, ...payload } = row;
        const { error: updateError } = await adminClient
          .from("persons").update(payload).eq("id", id!);
        if (updateError) {
          errors++;
          errorMessages.push(`Update ${row.first_name} ${row.last_name}: ${updateError.message}`);
        } else {
          updated++;
        }
      }

      // Insert rows with specified IDs
      if (toInsertWithId.length > 0) {
        const { error: insertError } = await adminClient
          .from("persons")
          .insert(toInsertWithId.map((r) => ({ id: r.id, ...r })));
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
      // Fetch existing persons to check for duplicates by first_name + last_name + category
      const { data: allExisting } = await adminClient
        .from("persons")
        .select("first_name, last_name, category")
        .is("deleted_at", null);

      const existingKeys = new Set(
        (allExisting ?? []).map((e: any) =>
          `${e.first_name.toLowerCase()}|${e.last_name.toLowerCase()}|${(e.category || "").toLowerCase()}`
        ),
      );

      const toInsert: Omit<NormalizedRow, "id">[] = [];
      for (const row of withoutId) {
        const key = `${row.first_name.toLowerCase()}|${row.last_name.toLowerCase()}|${row.category.toLowerCase()}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        existingKeys.add(key);
        const { id: _id, ...payload } = row;
        toInsert.push(payload);
      }

      // Bulk insert in chunks of 100
      const CHUNK = 100;
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        const chunk = toInsert.slice(i, i + CHUNK);
        const { error: insertError } = await adminClient
          .from("persons")
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
