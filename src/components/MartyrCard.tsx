import { Link } from "react-router-dom";
import { type Martyr, formatDate, formatYear } from "@/data/martyrs";

interface MartyrCardProps {
  martyr: Martyr;
  index?: number;
}

const MartyrCard = ({ martyr, index = 0 }: MartyrCardProps) => {
  const staggerClass = index < 8 ? `stagger-${(index % 8) + 1}` : "";

  return (
    <Link
      to={`/martyr/${martyr.slug}`}
      className={`block opacity-0 animate-fade-scale ${staggerClass}`}
    >
      <article className="martyr-card bg-card flex gap-0 overflow-hidden cursor-pointer group">
        {/* Portrait */}
        <div className="relative w-[120px] min-w-[120px] h-[160px] overflow-hidden bg-stone-light flex-shrink-0">
          <img
            src={martyr.photo_url}
            alt={`${martyr.first_name} ${martyr.last_name}`}
            className="historical-photo w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Category badge */}
          <div className="absolute top-2 left-2 bg-background/90 px-1.5 py-0.5">
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-muted-foreground">
              {martyr.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-5 flex-1 min-w-0">
          <div>
            {/* Name */}
            <h3
              className="display-sm text-xl leading-tight mb-1 group-hover:text-primary transition-colors duration-300"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {martyr.first_name} {martyr.last_name}
            </h3>
            {martyr.known_as && (
              <p className="text-xs text-muted-foreground mb-3 italic">
                "{martyr.known_as}"
              </p>
            )}
            <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
              {martyr.role}
            </p>
          </div>

          {/* Footer data */}
          <div className="flex items-end justify-between mt-4 pt-3 border-t border-border">
            <div>
              <div className="data-label mb-0.5">Place of Origin</div>
              <div className="text-xs font-medium">{martyr.city}, {martyr.region}</div>
            </div>
            <div className="text-right">
              <div className="data-label mb-0.5">Year of Martyrdom</div>
              <div className="font-mono text-sm font-bold text-primary">
                {formatYear(martyr.date_of_death)}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MartyrCard;
