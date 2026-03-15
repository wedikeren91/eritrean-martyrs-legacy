export type Category = "ELF" | "EPLF" | "PLF" | "Civilian" | "Unknown" | "Other";
export type Status = "Deceased" | "Disappeared" | "Imprisoned" | "Alive";

export interface Martyr {
  id: string;
  slug: string;
  photo_url: string;
  first_name: string;
  last_name: string;
  known_as?: string;
  date_of_birth: string;
  date_of_death: string | null;
  city: string;
  region: string;
  category: Category;
  status: Status;
  rank?: string;
  role: string;
  place_of_martyrdom?: string;
  battle?: string;
  bio: string;
  significance: string;
  quote?: string;
}
