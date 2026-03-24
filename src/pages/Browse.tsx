import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SearchBar from "@/components/SearchBar";
import { CATEGORIES } from "@/data/martyrs";
import { usePersons, WARS } from "@/hooks/usePersons";
import MartyrCardDB from "@/components/MartyrCardDB";

const Browse = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeWar, setActiveWar] = useState("All");
  const { persons, loading } = usePersons(query, activeCategory, activeWar);

  const timelineEras = [
    { period: "1961–1970", label: "The Ignition", desc: "First shots fired at Mount Adal. Early organisation of liberation forces." },
    { period: "1971–1980", label: "The Consolidation", desc: "EPLF formation. Strategic Withdrawal. The Siege of Nakfa begins." },
    { period: "1981–1988", label: "The Endurance", desc: "Nakfa holds. Six Ethiopian strategic offensives repelled. Red Star campaign defeated." },
    { period: "1989–1991", label: "The Liberation", desc: "Battle of Afabet. Fall of Keren, Massawa, Asmara. Independence: May 24, 1991." },
    { period: "1998–2000", label: "War of 1998", desc: "Eritrea–Ethiopia border war. Over 70,000 lives lost across two years of intense fighting." },
    { period: "2019–2022", label: "Tigray War", desc: "Eritrean forces engaged in the Tigray conflict. Significant casualties on all sides." },
  ];

  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* Timeline Section */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="data-label mb-3">Browse The Struggle · 1961—1991</div>
          <h1 className="display-title text-4xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            The Journey to Freedom
          </h1>
          <div className="rule-accent mb-8" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
            {timelineEras.map((era) => (
              <div key={era.period} className="bg-background p-5 hover:bg-card transition-colors duration-200 cursor-pointer group">
                <div className="font-mono text-xs text-primary font-bold mb-1">{era.period}</div>
                <div
                  className="text-base font-semibold mb-2 group-hover:text-primary transition-colors duration-200"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {era.label}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{era.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Organisation */}
      <section className="container mx-auto px-6 py-10">
        <div className="max-w-3xl mb-8">
          <div className="data-label mb-3">Browse by Organisation</div>
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name, role, or origin…" />

          <div className="mt-4 flex flex-wrap gap-2">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* War / Conflict filter */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="data-label self-center mr-1 opacity-60">Conflict:</span>
            {WARS.map((w) => (
              <button
                key={w.value}
                onClick={() => setActiveWar(w.value)}
                className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all duration-200 border ${
                  activeWar === w.value
                    ? "border-primary text-primary bg-primary/10"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse" style={{ aspectRatio: "2/3" }} />
            ))}
          </div>
        ) : persons.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">
              No record found. Help us complete the archive.{" "}
              <Link to="/contributors" className="archive-link">
                Submit a record →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {persons.map((person, i) => (
              <MartyrCardDB key={person.id} person={person} index={i} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Eritrean Martyrs Archive · Est. 2025</p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-1">
            ← Return Home
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Browse;
