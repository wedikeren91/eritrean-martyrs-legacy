import type { Martyr } from "./types";
import { MARTYRS } from "./martyrs";

export function getMartyrBySlug(slug: string): Martyr | undefined {
  return MARTYRS.find((m) => m.slug === slug);
}

export function searchMartyrs(query: string, category?: string): Martyr[] {
  const q = query.toLowerCase().trim();
  return MARTYRS.filter((m) => {
    const matchesQuery =
      !q ||
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.region.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.known_as || "").toLowerCase().includes(q) ||
      (m.battle || "").toLowerCase().includes(q);
    const matchesCategory = !category || category === "All" || m.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function formatYear(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).getFullYear().toString();
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  if (d.getMonth() === 0 && day === 1) return d.getFullYear().toString();
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const CATEGORIES = ["ELF", "EPLF", "PLF", "Civilian", "Unknown", "Other"] as const;
