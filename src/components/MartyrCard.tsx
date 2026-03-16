import { Link } from "react-router-dom";
import { type Martyr, formatDate } from "@/data/martyrs";

interface MartyrCardProps {
  martyr: Martyr;
  index?: number;
}

const MartyrCard = ({ martyr, index = 0 }: MartyrCardProps) => {
  const staggerClass = index < 8 ? `stagger-${(index % 8) + 1}` : "";

  return (
    <Link to={`/martyr/${martyr.slug}`} className={`opacity-0 animate-fade-scale ${staggerClass} group block`}>
      <article className="netflix-card overflow-hidden relative cursor-pointer" style={{ aspectRatio: "3/4", background: "hsl(var(--card))" }}>
        {/* Portrait — full bleed */}
        <img
          src={martyr.photo_url}
          alt={`${martyr.first_name} ${martyr.last_name}`}
          className="historical-photo absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10" style={{ background: "hsl(220 15% 6% / 0.85)", padding: "2px 8px" }}>
          <span className="text-[8px] font-mono font-bold tracking-widest uppercase" style={{ color: "hsl(var(--oxblood-bright))" }}>
            {martyr.category}
          </span>
        </div>

        {/* Strong bottom gradient overlay — always visible */}
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
            {martyr.first_name} {martyr.last_name}
          </h3>
          {martyr.known_as && (
            <p className="text-[9px] italic mb-1.5" style={{ color: "hsl(35 20% 70%)" }}>"{martyr.known_as}"</p>
          )}

          {/* Dates row */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span style={{ color: "hsl(35 20% 65%)" }}>
              ✦ {martyr.date_of_birth ? formatDate(martyr.date_of_birth) : "—"}
            </span>
            <span style={{ color: "hsl(220 10% 35%)" }}>→</span>
            <span style={{ color: "hsl(var(--oxblood-bright))", fontWeight: 700 }}>
              {martyr.date_of_death ? formatDate(martyr.date_of_death) : "—"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MartyrCard;
