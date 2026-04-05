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

export function usePersons(query: string, category: string, war = "All", sort: SortOption = "name_asc", statusFilter = "All") {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadPersons = useCallback(async (q: string, cat: string, w: string, s: SortOption, sf: string) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);

    // Determine sort column and direction
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
      .order(sortCol, { ascending })
      .limit(300);

    // Use exact match for category to avoid ELF matching EPLF
    if (cat && cat !== "All" && cat !== "") {
      req = req.eq("category", cat);
    }

    if (w && w !== "All") {
      req = req.ilike("battle", `%${w}%`);
    }

    // Status filter
    if (sf && sf !== "All") {
      req = req.ilike("status", `%${sf}%`);
    }

    if (q.trim()) {
      const term = `%${q.trim()}%`;
      req = req.or(
        `first_name.ilike.${term},last_name.ilike.${term},known_as.ilike.${term},role.ilike.${term},city.ilike.${term},region.ilike.${term},battle.ilike.${term}`
      );
    }

    const { data, count, error } = await req;

    if (error) {
      console.error("usePersons error:", error.message);
      setLoading(false);
      return;
    }

    setPersons((data as PersonRow[]) ?? []);
    setTotal(count ?? 0);
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
    .single();
  if (error) {
    console.error("getPersonBySlug error:", error.message);
    return null;
  }
  return (data as PersonRow) ?? null;
}
