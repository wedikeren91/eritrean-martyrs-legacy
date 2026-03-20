import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { getPersonBySlug, type PersonRow } from "@/hooks/usePersons";
import { getMartyrBySlug } from "@/data/martyrs";
import { useAuth } from "@/hooks/useAuth";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

const MartyrProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const [person, setPerson] = useState<PersonRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getPersonBySlug(slug).then((data) => {
      if (data) {
        setPerson(data);
      } else {
        // Fallback to static data
        const staticMartyr = getMartyrBySlug(slug);
        if (staticMartyr) {
          setPerson({
            id: staticMartyr.id,
            slug: staticMartyr.slug,
            photo_url: staticMartyr.photo_url,
            first_name: staticMartyr.first_name,
            last_name: staticMartyr.last_name,
            known_as: staticMartyr.known_as || null,
            date_of_birth: staticMartyr.date_of_birth,
            date_of_death: staticMartyr.date_of_death,
            city: staticMartyr.city,
            region: staticMartyr.region,
            category: staticMartyr.category,
            status: staticMartyr.status,
            rank: staticMartyr.rank || null,
            role: staticMartyr.role,
            bio: staticMartyr.bio,
            significance: staticMartyr.significance,
            quote: staticMartyr.quote || null,
            place_of_martyrdom: staticMartyr.place_of_martyrdom || null,
            battle: staticMartyr.battle || null,
          });
        }
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background grain-overlay">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="data-label animate-pulse">Loading record…</div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background grain-overlay">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl text-muted-foreground mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            Record Not Found
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This record does not exist in the archive.
          </p>
          <Link to="/archive" className="archive-link text-sm">
            ← Return to Archive
          </Link>
        </div>
      </div>
    );
  }

  const bioParas = (person.bio || "").split("\n\n").filter(Boolean);

  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/archive" className="hover:text-foreground transition-colors">Archive</Link>
            <span>/</span>
            <span className="text-foreground">{person.first_name} {person.last_name}</span>
          </div>
          {isAdmin && (
            <Link
              to={`/admin/edit/${person.slug}`}
              className="bg-primary text-primary-foreground px-3 py-1.5 font-semibold tracking-wider uppercase hover:bg-primary/90 transition-colors"
            >
              ✏️ Edit Record
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="relative border-b border-border overflow-hidden" style={{ minHeight: "70vh" }}>
        <div className="container mx-auto px-6 py-0 h-full">
          <div className="grid grid-cols-12 gap-0 min-h-[70vh]">
            
            {/* Portrait */}
            <div className="col-span-12 md:col-span-6 lg:col-span-5 relative overflow-hidden bg-stone-light">
              <div className="absolute inset-0">
                {person.photo_url ? (
                  <img
                    src={person.photo_url}
                    alt={`${person.first_name} ${person.last_name}`}
                    className="historical-photo w-full h-full object-cover object-top animate-fade-scale"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-8xl opacity-10">👤</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10 md:to-background/5" />
              </div>

              {/* Category tag */}
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-background/90 px-3 py-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-muted-foreground">
                    {person.category} · {person.rank || "Fighter"}
                  </span>
                </div>
              </div>
            </div>

            {/* Name & Data */}
            <div className="col-span-12 md:col-span-6 lg:col-span-7 flex flex-col justify-center px-8 py-12">
              <div className="animate-fade-scale" style={{ animationDelay: "150ms" }}>
                {person.known_as && (
                  <div className="data-label text-primary mb-3">{person.known_as}</div>
                )}
                
                <h1 className="display-name text-primary mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                  {person.first_name}
                </h1>
                <h1 className="display-name mb-8" style={{ fontFamily: "'Fraunces', serif" }}>
                  {person.last_name}
                </h1>

                <div className="rule-accent mb-8" />

                <div className="grid grid-cols-2 gap-y-6 gap-x-8 max-w-md">
                  <div>
                    <div className="data-label">Born</div>
                    <div className="data-value mt-1">{formatDate(person.date_of_birth)}</div>
                  </div>
                  <div>
                    <div className="data-label">Martyred</div>
                    <div className="data-value mt-1 text-primary font-bold">
                      {formatDate(person.date_of_death)}
                    </div>
                  </div>
                  <div>
                    <div className="data-label">City of Origin</div>
                    <div className="data-value mt-1">{person.city || "—"}</div>
                  </div>
                  <div>
                    <div className="data-label">Region</div>
                    <div className="data-value mt-1">{person.region || "—"}</div>
                  </div>
                  <div>
                    <div className="data-label">Organisation</div>
                    <div className="data-value mt-1">{person.category || "—"}</div>
                  </div>
                  {person.place_of_martyrdom && (
                    <div className="col-span-2">
                      <div className="data-label">Place of Martyrdom</div>
                      <div className="data-value mt-1">{person.place_of_martyrdom}</div>
                    </div>
                  )}
                  {person.battle && (
                    <div className="col-span-2">
                      <div className="data-label">Battle / Campaign</div>
                      <div className="data-value mt-1">{person.battle}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Significance Banner */}
      {person.significance && (
        <section className="bg-foreground text-background">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-3xl">
              <div className="text-xs font-mono tracking-widest uppercase mb-3 opacity-50">
                Historical Significance
              </div>
              <p
                className="text-lg leading-relaxed"
                style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic" }}
              >
                {person.significance}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Biography */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-12 gap-8">
          {/* Side Column */}
          <div className="col-span-12 md:col-span-3">
            <div className="sticky top-24">
              <div className="data-label mb-2">Record</div>
              <div className="rule-accent mb-6" />

              <div className="space-y-4 text-xs">
                {person.role && (
                  <div>
                    <div className="data-label">Role</div>
                    <div className="mt-1 text-sm">{person.role}</div>
                  </div>
                )}
                {person.rank && (
                  <div>
                    <div className="data-label">Rank</div>
                    <div className="mt-1 text-sm">{person.rank}</div>
                  </div>
                )}
                {person.status && (
                  <div>
                    <div className="data-label">Status</div>
                    <div className="mt-1 text-sm font-mono text-primary font-bold">{person.status}</div>
                  </div>
                )}
              </div>

              {person.quote && (
                <blockquote className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm italic text-muted-foreground leading-relaxed mb-2">
                    "{person.quote}"
                  </p>
                  <cite className="text-xs data-label not-italic">
                    — {person.first_name} {person.last_name}
                  </cite>
                </blockquote>
              )}
            </div>
          </div>

          {/* Biography Column */}
          <div className="col-span-12 md:col-span-9">
            <div className="data-label mb-2">Biography</div>
            <div className="rule-accent mb-8" />
            
            <div className="space-y-5 max-w-2xl">
              {bioParas.map((para, i) => (
                <p
                  key={i}
                  className="text-base leading-relaxed text-foreground/85 animate-fade-scale"
                  style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-16 pt-8 border-t border-border flex justify-between items-center">
              <Link to="/archive" className="archive-link text-sm">
                ← Return to Archive
              </Link>
              <div className="text-xs text-muted-foreground font-mono">
                Archive Record · {person.slug}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8">
          <p className="text-xs text-muted-foreground text-center">
            Eritrean Martyrs Archive · This record is part of a living archive. 
            If you have additional information,{" "}
            <Link to="/contributors" className="archive-link">
              please contribute →
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MartyrProfile;
