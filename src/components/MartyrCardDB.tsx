import { Link } from "react-router-dom";
import { type PersonRow } from "@/hooks/usePersons";
import { useState, useRef, useEffect } from "react";

interface MartyrCardDBProps {
  person: PersonRow;
  index?: number;
}

function formatYear(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch {
    return dateStr;
  }
}

const MartyrCardDB = ({ person, index = 0 }: MartyrCardDBProps) => {
  const staggerClass = index < 8 ? `stagger-${(index % 8) + 1}` : "";
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle already-cached images (complete before onLoad fires)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const genderColor =
    (person as any).gender === "Female" ? "#EC4899" :
    (person as any).gender === "Male" ? "#3B82F6" :
    "transparent";

  return (
    <Link
      to={`/martyr/${person.slug}`}
      className={`opacity-0 animate-fade-scale ${staggerClass} group block`}
    >
      <article
        className="relative overflow-hidden cursor-pointer rounded-sm"
        style={{ aspectRatio: "2/3" }}
      >
        {/* Gender-colored frame */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            border: `3px solid ${genderColor}`,
            borderRadius: "inherit",
          }}
        />

        {/* Portrait */}
        {person.photo_url ? (
          <>
            {/* Low-quality placeholder shimmer */}
            {!loaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              ref={imgRef}
              src={person.photo_url}
              alt={`${person.first_name} ${person.last_name}`}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              decoding="async"
              fetchPriority={index < 6 ? "high" : "low"}
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))" }}
          >
            <span className="text-3xl opacity-20">👤</span>
          </div>
        )}

        {/* Category badge — top left */}
        <div
          className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5"
          style={{ background: "hsl(var(--oxblood))" }}
        >
          <span
            className="text-[7px] font-mono font-bold tracking-widest uppercase"
            style={{ color: "hsl(35 25% 97%)" }}
          >
            {person.category || "—"}
          </span>
        </div>

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(15,10,8,0.97) 0%, rgba(15,10,8,0.85) 45%, rgba(15,10,8,0.0) 100%)",
            padding: "1.5rem 0.5rem 0.45rem",
          }}
        >
          <p
            className="text-[11px] font-semibold leading-tight mb-0.5 truncate"
            style={{ fontFamily: "'Fraunces', serif", color: "#fff" }}
          >
            {person.first_name} {person.last_name}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
            <span style={{ color: "hsl(38 85% 72%)" }}>
              {formatYear(person.date_of_birth)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>–</span>
            <span style={{ color: "hsl(4 90% 70%)" }}>
              {formatYear(person.date_of_death)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MartyrCardDB;
