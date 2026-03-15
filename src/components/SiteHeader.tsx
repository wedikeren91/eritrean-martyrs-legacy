import { Link } from "react-router-dom";

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Archive Emblem SVG */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="transition-opacity duration-300 group-hover:opacity-80"
          >
            <rect x="1" y="1" width="26" height="26" stroke="hsl(0 75% 35%)" strokeWidth="1.5" />
            <rect x="5" y="5" width="18" height="18" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
            <line x1="14" y1="5" x2="14" y2="23" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
            <line x1="5" y1="14" x2="23" y2="14" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
            <circle cx="14" cy="14" r="2.5" fill="hsl(0 75% 35%)" />
          </svg>

          <div>
            <div className="display-sm text-sm font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
              Eritrean Martyrs Archive
            </div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase" style={{ fontSize: "0.6rem" }}>
              1961 — 1991 · The Struggle
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/archive"
            className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline decoration-1"
          >
            Archive
          </Link>
          <Link
            to="/browse"
            className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline decoration-1"
          >
            Browse
          </Link>
          <a
            href="https://shabait.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 underline-offset-4 hover:underline decoration-1"
          >
            Contribute
          </a>
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
