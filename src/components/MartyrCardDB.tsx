import { Link } from "react-router-dom";
import { type PersonRow } from "@/hooks/usePersons";
import FlowerRating from "@/components/FlowerRating";

interface MartyrCardDBProps {
  person: PersonRow;
  index?: number;
}

function getSummary(person: PersonRow): string {
  const source = person.significance || person.bio || "";
  const sentences = source.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 2).join(" ").trim();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.getFullYear().toString();
  } catch {
    return dateStr;
  }
}

const MartyrCardDB = ({ person, index = 0 }: MartyrCardDBProps) => {
  const staggerClass = index < 8 ? `stagger-${(index % 8) + 1}` : "";

  return (
    <Link to={`/martyr/${person.slug}`} className={`opacity-0 animate-fade-scale ${staggerClass} group block`}>
      <article className="netflix-card overflow-hidden relative cursor-pointer" style={{ aspectRatio: "3/4", background: "hsl(var(--card))" }}>

        {/* Portrait — full bleed */}
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={`${person.first_name} ${person.last_name}`}
            className="historical-photo absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
            <span className="text-5xl opacity-20">👤</span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10" style={{ background: "hsl(220 15% 6% / 0.85)", padding: "2px 8px" }}>
          <span className="text-[8px] font-mono font-bold tracking-widest uppercase" style={{ color: "hsl(var(--oxblood-bright))" }}>
            {person.category || "—"}
          </span>
        </div>

        {/* Strong bottom gradient overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10"
          style={{
            background: "linear-gradient(to top, hsl(220 15% 6%) 0%, hsl(220 15% 6% / 0.85) 45%, transparent 100%)",
            padding: "1.5rem 1rem 1rem",
          }}
        >
          {/* Name */}
          <h3
            className="text-sm font-semibold leading-tight mb-1.5 group-hover:text-primary transition-colors duration-300"
            style={{ fontFamily: "'Fraunces', serif", color: "hsl(35 20% 96%)" }}
          >
            {person.first_name} {person.last_name}
          </h3>
          {person.known_as && (
            <p className="text-[9px] italic mb-1.5" style={{ color: "hsl(35 20% 70%)" }}>"{person.known_as}"</p>
          )}

          {/* Dates row */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span style={{ color: "hsl(35 20% 65%)" }}>
              ✦ {formatDate(person.date_of_birth)}
            </span>
            <span style={{ color: "hsl(220 10% 35%)" }}>→</span>
            <span style={{ color: "hsl(var(--oxblood-bright))", fontWeight: 700 }}>
              {person.date_of_death ? formatDate(person.date_of_death) : "—"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MartyrCardDB;
