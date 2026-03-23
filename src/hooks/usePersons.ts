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
};

export const WARS = [
  { value: "All", label: "All Conflicts" },
  { value: "War of Liberation 1961–1991", label: "Liberation War (1961–1991)" },
  { value: "War of 1998–2000", label: "War of 1998–2000" },
  { value: "Tigray War 2019–2022", label: "Tigray War (2019–2022)" },
];

export function usePersons(query: string, category: string, war = "All") {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPersons = useCallback(async (q: string, cat: string, w: string) => {
    setLoading(true);
    let req = supabase
      .from("persons")
      .select("id,slug,photo_url,first_name,last_name,known_as,date_of_birth,date_of_death,city,region,category,status,rank,role,significance,quote,place_of_martyrdom,battle", { count: "exact" })
      .is("deleted_at", null)
      .order("last_name", { ascending: true })
      .limit(200);

    if (cat && cat !== "All") {
      req = req.ilike("category", `%${cat}%`);
    }

    if (w && w !== "All") {
      req = req.ilike("battle", `%${w}%`);
    }

    if (q.trim()) {
      const term = `%${q.trim()}%`;
      req = req.or(
        `first_name.ilike.${term},last_name.ilike.${term},known_as.ilike.${term},role.ilike.${term},city.ilike.${term},region.ilike.${term},battle.ilike.${term}`
      );
    }

    const { data, count } = await req;
    setPersons((data as PersonRow[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Debounce only the query input; category/war changes fire immediately
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim()) {
      debounceRef.current = setTimeout(() => loadPersons(query, category, war), 300);
    } else {
      loadPersons(query, category, war);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, war, loadPersons]);

  return { persons, loading, total };
}

export async function getPersonBySlug(slug: string): Promise<PersonRow | null> {
  const { data } = await supabase
    .from("persons")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();
  return (data as PersonRow) ?? null;
}
