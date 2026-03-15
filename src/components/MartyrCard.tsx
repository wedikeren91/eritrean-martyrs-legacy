import { Link } from "react-router-dom";
import { type Martyr, formatDate } from "@/data/martyrs";
import FlowerRating from "@/components/FlowerRating";

interface MartyrCardProps {
  martyr: Martyr;
  index?: number;
}

// Get 1-2 sentence summary from significance or beginning of bio
function getSummary(martyr: Martyr): string {
  const source = martyr.significance || martyr.bio;
  const sentences = source.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 2).join(" ").trim();
}

const MartyrCard = ({ martyr, index = 0 }: MartyrCardProps) => {
  const staggerClass = index < 8 ? `stagger-${(index % 8) + 1}` : "";
  const summary = getSummary(martyr);

  return (
    <div className={`opacity-0 animate-fade-scale ${staggerClass} group`}>
      <article className="netflix-card bg-card overflow-hidden flex flex-col h-full cursor-pointer">
        {/* Portrait */}
        <div className="relative overflow-hidden bg-stone-light" style={{ aspectRatio: "3/4" }}>
          <img
            src={martyr.photo_url}
            alt={`${martyr.first_name} ${martyr.last_name}`}
            className="historical-photo w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Category badge */}
          <div className="absolute top-2 left-2 bg-background/90 px-2 py-0.5">
            <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-muted-foreground">
              {martyr.category}
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
              {martyr.first_name} {martyr.last_name}
            </h3>
            {martyr.known_as && (
              <p className="text-[10px] text-muted-foreground italic mt-0.5">"{martyr.known_as}"</p>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
            <div>
              <span className="text-[8px] uppercase tracking-widest block text-muted-foreground/60">Born</span>
              {martyr.date_of_birth ? formatDate(martyr.date_of_birth) : <span className="opacity-30">—</span>}
            </div>
            <div className="w-px bg-border self-stretch" />
            <div>
              <span className="text-[8px] uppercase tracking-widest block text-muted-foreground/60">Martyred</span>
              {martyr.date_of_death ? (
                <span className="text-primary font-bold">{formatDate(martyr.date_of_death)}</span>
              ) : (
                <span className="opacity-30">—</span>
              )}
            </div>
          </div>

          {/* Summary */}
          <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-3 flex-1">
            {summary}
          </p>

          {/* Flower tribute */}
          <div className="pt-2 border-t border-border">
            <FlowerRating martyrId={martyr.id} size="sm" />
          </div>

          {/* Learn more */}
          <Link
            to={`/martyr/${martyr.slug}`}
            className="inline-block mt-1 text-[10px] font-mono font-semibold tracking-widest uppercase text-primary hover:underline underline-offset-2 decoration-1"
          >
            Learn More →
          </Link>
        </div>
      </article>
    </div>
  );
};

export default MartyrCard;
