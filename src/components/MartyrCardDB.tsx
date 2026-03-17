import { Link } from "react-router-dom";
import { type PersonRow } from "@/hooks/usePersons";

interface MartyrCardDBProps {
  person: PersonRow;
  index?: number;
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
      <article className="netflix-card overflow-hidden relative cursor-pointer" style={{ aspectRatio: "3/4", background: "hsl(var(--muted))" }}>

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
            <span className="text-5xl opacity-30">👤</span>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10" style={{ background: "hsl(var(--oxblood))", padding: "2px 8px" }}>
          <span className="text-[8px] font-mono font-bold tracking-widest uppercase" style={{ color: "hsl(35 25% 97%)" }}>
            {person.category || "—"}
          </span>
        </div>

        {/* Strong bottom gradient — guarantees legibility */}
        <div
          className="card-text-overlay absolute bottom-0 left-0 right-0 z-10"
          style={{ padding: "2rem 0.75rem 0.85rem" }}
        >
          {/* Name */}
          <h3
            className="text-sm font-semibold leading-tight mb-1 group-hover:text-oxblood-bright transition-colors duration-300"
            style={{ fontFamily: "'Fraunces', serif", color: "#fff" }}
          >
            {person.first_name} {person.last_name}
          </h3>
          {person.known_as && (
            <p className="text-[9px] italic mb-1.5" style={{ color: "hsl(35 20% 78%)" }}>"{person.known_as}"</p>
          )}

          {/* Dates row — high contrast */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold">
            <span style={{ color: "hsl(38 70% 72%)" }}>
              {formatDate(person.date_of_birth)}
            </span>
            <span style={{ color: "hsl(220 10% 55%)" }}>–</span>
            <span style={{ color: "hsl(4 85% 72%)", fontWeight: 700 }}>
              {person.date_of_death ? formatDate(person.date_of_death) : "—"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MartyrCardDB;
