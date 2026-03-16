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
  const summary = getSummary(person);

  return (
    <div className={`opacity-0 animate-fade-scale ${staggerClass} group`}>
      <article className="netflix-card bg-card overflow-hidden flex flex-col h-full cursor-pointer">
        {/* Portrait */}
        <div className="relative overflow-hidden bg-stone-light" style={{ aspectRatio: "3/4" }}>
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={`${person.first_name} ${person.last_name}`}
              className="historical-photo w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-4xl opacity-20">👤</span>
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-2 left-2 bg-background/90 px-2 py-0.5">
            <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-muted-foreground">
              {person.category || "—"}
            </span>
          </div>
          {/* Gradient overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Card body */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          {/* Name */}
          <div>
            <h3
              className="text-base leading-tight font-semibold group-hover:text-primary transition-colors duration-300"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {person.first_name} {person.last_name}
            </h3>
            {person.known_as && (
              <p className="text-[10px] text-muted-foreground italic mt-0.5">"{person.known_as}"</p>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
            <div>
              <span className="text-[8px] uppercase tracking-widest block text-muted-foreground/60">Born</span>
              {formatDate(person.date_of_birth)}
            </div>
            <div className="w-px bg-border self-stretch" />
            <div>
              <span className="text-[8px] uppercase tracking-widest block text-muted-foreground/60">Martyred</span>
              {person.date_of_death ? (
                <span className="text-primary font-bold">{formatDate(person.date_of_death)}</span>
              ) : (
                <span className="opacity-30">—</span>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-3 flex-1">
              {summary}
            </p>
          )}

          {/* Flower tribute */}
          <div className="pt-2 border-t border-border">
            <FlowerRating martyrId={person.id} size="sm" />
          </div>

          {/* Learn more */}
          <Link
            to={`/martyr/${person.slug}`}
            className="inline-block mt-1 text-[10px] font-mono font-semibold tracking-widest uppercase text-primary hover:underline underline-offset-2 decoration-1"
          >
            Learn More →
          </Link>
        </div>
      </article>
    </div>
  );
};

export default MartyrCardDB;
