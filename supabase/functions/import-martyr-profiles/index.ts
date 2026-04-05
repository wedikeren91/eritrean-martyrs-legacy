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
    if (value >= 1000 && value <= 9999) return null;
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
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!authHeader) {
      return Response.json({ error: "Authentication is required." }, {
        status: 401,
        headers: corsHeaders,
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Authentication could not be verified." }, {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: roleRows, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleError) {
      return Response.json({ error: roleError.message }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    const roles = (roleRows ?? []).map((row) => row.role);
    const canImport = roles.includes("founder") || roles.includes("org_admin");

    if (!canImport) {
      return Response.json({ error: "Only founders and admins can import profiles." }, {
        status: 403,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? (body.rows as ImportRow[]) : [];

    let added = 0;
    let updated = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const [index, rawRow] of rows.entries()) {
      const firstName = normalizeString(rawRow.first_name);
      const lastName = normalizeString(rawRow.last_name) || "Unknown";

      if (!firstName) {
        errors += 1;
        errorMessages.push(`Row ${index + 1}: missing first_name.`);
        continue;
      }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        affiliation: normalizeAffiliationValue(rawRow.affiliation),
        birth_date: normalizeDateValue(rawRow.birth_date),
        death_date: normalizeDateValue(rawRow.death_date),
        birth_city: normalizeNullableString(rawRow.birth_city),
        birth_province: normalizeNullableString(rawRow.birth_province),
        status: normalizeReviewStatus(rawRow.status),
        life_story: normalizeNullableString(rawRow.life_story),
        submitted_by: user.id,
      };

      const existingId = normalizeString(rawRow.id);

      if (existingId && isUuid(existingId)) {
        const { data: existingProfile, error: existingError } = await adminClient
          .from("martyr_profiles")
          .select("id")
          .eq("id", existingId)
          .maybeSingle();

        if (existingError) {
          errors += 1;
          errorMessages.push(`Row ${index + 1}: ${existingError.message}`);
          continue;
        }

        if (existingProfile) {
          const { error: updateError } = await adminClient
            .from("martyr_profiles")
            .update(payload)
            .eq("id", existingId);

          if (updateError) {
            errors += 1;
            errorMessages.push(`Row ${index + 1}: ${updateError.message}`);
          } else {
            updated += 1;
          }
          continue;
        }

        const { error: insertWithIdError } = await adminClient
          .from("martyr_profiles")
          .insert({ id: existingId, ...payload });

        if (insertWithIdError) {
          errors += 1;
          errorMessages.push(`Row ${index + 1}: ${insertWithIdError.message}`);
        } else {
          added += 1;
        }
        continue;
      }

      const { error: insertError } = await adminClient
        .from("martyr_profiles")
        .insert(payload);

      if (insertError) {
        errors += 1;
        errorMessages.push(`Row ${index + 1}: ${insertError.message}`);
      } else {
        added += 1;
      }
    }

    return Response.json({
      added,
      updated,
      errors,
      errorMessages: errorMessages.slice(0, 8),
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected import error.";
    return Response.json({ error: message }, {
      status: 500,
      headers: corsHeaders,
    });
  }
});