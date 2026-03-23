import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import MartyrCardDB from "@/components/MartyrCardDB";
import { usePersons } from "@/hooks/usePersons";

const CATEGORIES = ["All", "ELF", "EPLF", "Civilian", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const filterBarRef = useRef<HTMLDivElement>(null);

  const { persons, loading, total } = usePersons(
    search,
    activeCategory === "All" ? "" : activeCategory
  );

  // Scroll to grid on mobile when filter changes
  const handleCategory = (cat: Category) => {
    setActiveCategory(cat);
  };

  return (
    <div className="min-h-screen bg-background" style={{ overflowX: "hidden" }}>
      <SiteHeader />

      {/* ── Compact Hero Banner ─────────────────────────────────── */}
      <section
        className="relative border-b border-border"
        style={{
          background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
          padding: "clamp(1.5rem, 5vw, 3rem) 0 clamp(1rem, 3vw, 2rem)",
        }}
      >
        {/* Ghost year watermark */}
        <div
          aria-hidden
          className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(6rem, 24vw, 18rem)",
            fontWeight: 700,
            lineHeight: 0.85,
            color: "hsl(4 78% 42% / 0.06)",
            letterSpacing: "-0.04em",
          }}
        >
          1991
        </div>

        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-6" style={{ background: "hsl(var(--oxblood))" }} />
            <span
              className="data-label"
              style={{ color: "hsl(var(--oxblood-bright))", letterSpacing: "0.2em" }}
            >
              Eritrean Martyrs Archive · 1961–Present
            </span>
          </div>

          <h1
            className="mb-3"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(1.6rem, 5.5vw, 3rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              color: "hsl(var(--foreground))",
            }}
          >
            They gave their <em style={{ fontStyle: "italic", color: "hsl(var(--oxblood-bright))" }}>tomorrows</em> for our today.
          </h1>

          <p
            className="text-sm mb-5 max-w-lg"
            style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}
          >
            A living archive of Eritrea's fallen — honouring every name, every sacrifice.
          </p>

          {/* Search */}
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, region…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border focus:outline-none focus:border-foreground/40 transition-colors"
              style={{ color: "hsl(var(--foreground))" }}
            />
          </div>
        </div>
      </section>

      {/* ── Sticky Category Filter Bar ──────────────────────────── */}
      <div
        ref={filterBarRef}
        className="sticky top-0 z-30 border-b border-border"
        style={{ background: "hsl(var(--background) / 0.97)", backdropFilter: "blur(8px)" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className="flex-shrink-0 px-3.5 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-200"
                style={
                  activeCategory === cat
                    ? {
                        background: "hsl(var(--oxblood))",
                        color: "hsl(35 25% 97%)",
                      }
                    : {
                        background: "hsl(var(--muted))",
                        color: "hsl(var(--muted-foreground))",
                      }
                }
              >
                {cat}
              </button>
            ))}

            {/* Record count pill */}
            <div className="ml-auto flex-shrink-0 flex items-center gap-1.5">
              <span
                className="text-[10px] font-mono"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {loading ? "…" : `${total.toLocaleString()} records`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── High-Density Grid ────────────────────────────────────── */}
      <main className="container mx-auto px-3 py-3">
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm animate-pulse"
                style={{ aspectRatio: "2/3", background: "hsl(var(--muted))" }}
              />
            ))}
          </div>
        )}

        {!loading && persons.length === 0 && (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">🕯️</div>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No records found{activeCategory !== "All" ? ` for "${activeCategory}"` : ""}.
            </p>
            {activeCategory !== "All" && (
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-4 text-xs underline underline-offset-4"
                style={{ color: "hsl(var(--oxblood-bright))" }}
              >
                Show all records
              </button>
            )}
          </div>
        )}

        {!loading && persons.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {persons.map((person, i) => (
              <MartyrCardDB key={person.id} person={person} index={i} />
            ))}
          </div>
        )}

        {/* Load more hint */}
        {!loading && total > persons.length && (
          <div className="text-center pt-8 pb-4">
            <Link
              to="/archive"
              className="text-xs font-mono tracking-widest uppercase underline underline-offset-4"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              View all {total.toLocaleString()} records in the Archive →
            </Link>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer
        className="border-t border-border mt-8"
        style={{ background: "hsl(var(--card))" }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Fraunces', serif", color: "hsl(var(--foreground))" }}
              >
                Eritrean Martyrs Archive
              </div>
              <p
                className="text-xs"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                © 2025 · Built with dignity.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                { to: "/archive", label: "Archive" },
                { to: "/browse", label: "Browse" },
                { to: "/contributors", label: "Contribute" },
                { to: "/auth", label: "Sign In" },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-xs transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--foreground))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                  }
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <p
            className="mt-6 text-[11px] font-mono"
            style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
          >
            ዝሓለፉ ሰማእታት ንዘልኣለም ይዘከሩ — The fallen shall be remembered forever.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
