import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SearchBar from "@/components/SearchBar";
import { CATEGORIES } from "@/data/martyrs";
import { usePersons, WARS } from "@/hooks/usePersons";
import MartyrCardDB from "@/components/MartyrCardDB";

const Archive = () => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeWar, setActiveWar] = useState("All");
  const { persons, loading, total } = usePersons(query, activeCategory, activeWar);

  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* Archive Header */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-3xl">
            <div className="data-label mb-4">
              The Archive · {loading ? "…" : `${total} Records`}
            </div>
            <h1 className="display-title text-4xl md:text-5xl mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
              Eritrean Martyrs<br />Directory
            </h1>
            <div className="rule-accent mb-6" />
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              A searchable record of those who gave their lives for Eritrea's freedom during 
              The Struggle (1961–1991). Each entry is a monument. Each name is a life.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-2xl">
            <SearchBar value={query} onChange={setQuery} />
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold tracking-wider uppercase transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse" style={{ aspectRatio: "3/4" }} />
            ))}
          </div>
        ) : persons.length === 0 ? (
          <div className="text-center py-24 animate-fade-scale">
            <div className="text-5xl mb-6 opacity-20">∅</div>
            <h3
              className="text-2xl mb-4 text-muted-foreground"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              No record found.
            </h3>
            <p className="text-muted-foreground text-sm">
              Help us complete the archive.{" "}
              <Link to="/contributors" className="archive-link">
                Submit a record →
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="data-label">
                {persons.length} {persons.length === 1 ? "Record" : "Records"} Found
                {query && ` · "${query}"`}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Page 1 of {Math.ceil(persons.length / 10)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {persons.map((person, i) => (
                <MartyrCardDB key={person.id} person={person} index={i} />
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Eritrean Martyrs Archive · Est. 2025
          </p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-1">
            ← Return Home
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Archive;
