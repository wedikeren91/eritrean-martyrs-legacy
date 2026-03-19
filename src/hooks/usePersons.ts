import { useState, useEffect, useCallback } from "react";
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

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("persons")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("last_name", { ascending: true })
      .limit(200);

    if (category && category !== "All") {
      q = q.ilike("category", `%${category}%`);
    }

    if (war && war !== "All") {
      q = q.ilike("battle", `%${war}%`);
    }

    if (query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(
        `first_name.ilike.${term},last_name.ilike.${term},known_as.ilike.${term},role.ilike.${term},city.ilike.${term},region.ilike.${term},battle.ilike.${term}`
      );
    }

    const { data, count } = await q;
    setPersons((data as PersonRow[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [query, category, war]);

  useEffect(() => {
    fetch();
  }, [fetch]);

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
