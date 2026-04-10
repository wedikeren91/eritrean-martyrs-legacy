import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PersonRow = {
  id: string;
  slug: string;
  photo_url: string | null;
  first_name: string;
  last_name: string;
  known_as: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  city: string | null;
  region: string | null;
  category: string | null;
  status: string | null;
  rank: string | null;
  role: string | null;
  bio: string | null;
  significance: string | null;
  quote: string | null;
  place_of_martyrdom: string | null;
  battle: string | null;
  gender: string | null;
  is_public?: boolean;
};

export const WARS = [
  { value: "All", label: "All Conflicts" },
  { value: "War of Liberation 1961–1991", label: "Liberation War (1961–1991)" },
  { value: "War of 1998–2000", label: "War of 1998–2000" },
  { value: "Tigray War 2019–2022", label: "Tigray War (2019–2022)" },
];

export type SortOption = "name_asc" | "name_desc" | "dod_asc" | "dod_desc" | "status";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "dod_asc", label: "Death Year ↑" },
  { value: "dod_desc", label: "Death Year ↓" },
  { value: "status", label: "Status" },
];

export const STATUS_FILTERS = ["All", "Deceased", "Disappeared", "Imprisoned", "Alive", "Unknown"];

const SEARCHABLE_FIELDS: Array<keyof Pick<PersonRow, "first_name" | "last_name" | "known_as" | "role" | "city" | "region" | "battle">> = [
  "first_name",
  "last_name",
  "known_as",
  "role",
  "city",
  "region",
  "battle",
];

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchableText(person: PersonRow) {
  return normalizeSearchValue(
    SEARCHABLE_FIELDS.map((field) => person[field] ?? "").join(" ")
  );
}

export function usePersons(query: string, category: string, war = "All", sort: SortOption = "name_asc", statusFilter = "All") {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadPersons = useCallback(async (q: string, cat: string, w: string, s: SortOption, sf: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);

    const searchWords = Array.from(
      new Set(
        q
          .trim()
          .split(/\s+/)
          .map((word) => word.replace(/[,%()]/g, "").trim())
          .filter(Boolean)
      )
    );
    const normalizedWords = searchWords.map(normalizeSearchValue);

    const sortCol = s === "dod_asc" || s === "dod_desc" ? "date_of_death"
      : s === "status" ? "status"
      : "last_name";
    const ascending = s === "name_asc" || s === "dod_asc" || s === "status";

    let req = supabase
      .from("persons")
      .select(
        "id,slug,photo_url,first_name,last_name,known_as,date_of_birth,date_of_death,city,region,category,status,rank,role,significance,quote,place_of_martyrdom,battle,gender",
        { count: "exact" }
      )
      .is("deleted_at", null)
      .eq("is_public", true)
      .order(sortCol, { ascending })
      .limit(searchWords.length > 0 ? 1000 : 300);

    if (cat && cat !== "All" && cat !== "") {
      req = req.eq("category", cat);
    }

    if (w && w !== "All") {
      req = req.ilike("battle", `%${w}%`);
    }

    if (sf && sf !== "All") {
      req = req.ilike("status", `%${sf}%`);
    }

    if (searchWords.length > 0) {
      const searchClauses = searchWords.flatMap((word) => {
        const term = `%${word}%`;
        return SEARCHABLE_FIELDS.map((field) => `${field}.ilike.${term}`);
      });
      req = req.or(searchClauses.join(","));
    }

    const { data, count, error } = await req;

    if (error) {
      console.error("usePersons error:", error.message);
      setLoading(false);
      return;
    }

    const nextPersons = ((data as PersonRow[]) ?? []).filter((person) => {
      if (normalizedWords.length === 0) return true;
      const searchableText = buildSearchableText(person);
      return normalizedWords.every((word) => searchableText.includes(word));
    });

    setPersons(nextPersons);
    setTotal(normalizedWords.length > 0 ? nextPersons.length : count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim()) {
      debounceRef.current = setTimeout(() => loadPersons(query, category, war, sort, statusFilter), 350);
    } else {
      loadPersons(query, category, war, sort, statusFilter);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, war, sort, statusFilter, loadPersons]);

  return { persons, loading, total };
}

export async function getPersonBySlug(slug: string): Promise<PersonRow | null> {
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("is_public", true)
    .maybeSingle();
  if (error) {
    console.error("getPersonBySlug error:", error.message);
    return null;
  }
  return (data as PersonRow) ?? null;
}

export async function getPersonBySlugAdmin(slug: string): Promise<PersonRow | null> {
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    console.error("getPersonBySlugAdmin error:", error.message);
    return null;
  }
  return (data as PersonRow) ?? null;
}
