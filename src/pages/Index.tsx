import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import MartyrCard from "@/components/MartyrCard";
import { MARTYRS } from "@/data/martyrs";

const featuredMartyrs = MARTYRS.slice(0, 3);

const Index = () => {
  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* HERO */}
      <section className="relative border-b border-border overflow-hidden" style={{ minHeight: "90vh" }}>
        <div className="container mx-auto px-6 h-full">
          <div className="grid grid-cols-12 min-h-[90vh]">

            {/* Left — Text */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-center py-20 lg:py-0 lg:pr-16">
              <div className="animate-fade-scale">
                {/* Emblem */}
                <div className="mb-8 flex items-center gap-3">
                  <div className="rule-accent" />
                  <span className="data-label text-primary">Eritrean Martyrs Archive · 1961–1991</span>
                </div>

                <h1 className="display-name mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
                  They gave their<br />
                  <span className="text-primary">tomorrows</span><br />
                  for our today.
                </h1>

                <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-lg">
                  A living archive of those who sacrificed their lives during The Struggle for Eritrean independence. 
                  Every name is a monument. Every record is an act of remembrance.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px bg-border mt-12 mb-10">
                  <div className="bg-background p-5">
                    <div className="font-mono text-3xl font-bold text-foreground">65K+</div>
                    <div className="data-label mt-1">Martyrs Estimated</div>
                  </div>
                  <div className="bg-background p-5">
                    <div className="font-mono text-3xl font-bold text-foreground">30</div>
                    <div className="data-label mt-1">Years of Struggle</div>
                  </div>
                  <div className="bg-background p-5">
                    <div className="font-mono text-3xl font-bold text-foreground">{MARTYRS.length}</div>
                    <div className="data-label mt-1">Records in Archive</div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex gap-4 flex-wrap">
                  <Link
                    to="/archive"
                    className="inline-block bg-foreground text-background px-8 py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-primary transition-colors duration-300"
                  >
                    Enter the Archive
                  </Link>
                  <Link
                    to="/browse"
                    className="inline-block border border-border px-8 py-3.5 text-sm font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-300"
                  >
                    Browse the Struggle
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — Featured Portrait Stack */}
            <div className="col-span-12 lg:col-span-5 relative flex items-center justify-center py-12 lg:py-0">
              <div className="relative w-full max-w-sm">
                {/* Stacked portrait cards */}
                {featuredMartyrs.slice(0, 3).map((martyr, i) => (
                  <Link
                    to={`/martyr/${martyr.slug}`}
                    key={martyr.id}
                    className={`absolute block animate-fade-scale stagger-${i + 2}`}
                    style={{
                      top: `${i * 24}px`,
                      left: `${i * 16}px`,
                      right: `${-i * 0}px`,
                      zIndex: 3 - i,
                      transform: `rotate(${(i - 1) * 1.5}deg)`,
                    }}
                  >
                    <div className="bg-card shadow-xl overflow-hidden" style={{ width: "100%", aspectRatio: "3/4" }}>
                      <div className="relative w-full h-full">
                        <img
                          src={martyr.photo_url}
                          alt={`${martyr.first_name} ${martyr.last_name}`}
                          className="historical-photo w-full h-full object-cover object-top"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 to-transparent">
                          <div
                            className="text-lg font-semibold leading-tight text-primary"
                            style={{ fontFamily: "'Fraunces', serif" }}
                          >
                            {martyr.first_name} {martyr.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            ✦ {new Date(martyr.date_of_death || "").getFullYear()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Spacer to give the stacked cards height */}
                <div style={{ paddingBottom: "160%", position: "relative" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative vertical rule */}
        <div
          className="absolute left-1/2 top-0 bottom-0 hidden lg:block"
          style={{ width: "1px", background: "hsla(0, 0%, 0%, 0.06)" }}
        />
      </section>

      {/* FEATURED MARTYRS */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="data-label mb-2">Featured Records</div>
            <h2 className="display-sm text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Cornerstone Figures of The Struggle
            </h2>
          </div>
          <Link
            to="/archive"
            className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-1"
          >
            View All {MARTYRS.length} Records →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {MARTYRS.slice(0, 4).map((martyr, i) => (
            <MartyrCard key={martyr.id} martyr={martyr} index={i} />
          ))}
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="bg-card border-t border-b border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 md:col-span-5">
              {/* Large decorative year */}
              <div
                className="text-[8rem] font-bold leading-none text-border select-none"
                style={{ fontFamily: "'Fraunces', serif", color: "hsla(0, 0%, 0%, 0.06)" }}
              >
                1961
              </div>
              <div
                className="text-[8rem] font-bold leading-none text-border select-none -mt-4"
                style={{ fontFamily: "'Fraunces', serif", color: "hsla(0, 0%, 0%, 0.06)" }}
              >
                1991
              </div>
            </div>
            <div className="col-span-12 md:col-span-7">
              <div className="data-label mb-4 text-primary">Our Mission</div>
              <div className="rule-accent mb-6" />
              <p
                className="text-xl leading-relaxed mb-6"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                This archive exists because forgetting is its own form of occupation. 
                Every name recorded is a small act of liberation.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                The Eritrean liberation struggle (1961–1991) is one of the longest continuous independence 
                movements in modern African history. An estimated 65,000 fighters gave their lives — men and women 
                from every ethnic group, every religion, every corner of Eritrea — to secure the freedom of 
                a nation that the world had forgotten.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This archive is dedicated to making sure they are not forgotten again. 
                It is built for families, historians, and the global Eritrean diaspora who carry 
                the weight of this history.
              </p>

              <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-4">
                <Link to="/archive" className="group flex items-center gap-3">
                  <div className="w-8 h-8 border border-border flex items-center justify-center group-hover:bg-foreground group-hover:border-foreground transition-all duration-200">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 6H11M7 2L11 6L7 10" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium tracking-widest uppercase group-hover:text-primary transition-colors">Search Archive</span>
                </Link>
                <Link to="/browse" className="group flex items-center gap-3">
                  <div className="w-8 h-8 border border-border flex items-center justify-center group-hover:bg-foreground group-hover:border-foreground transition-all duration-200">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium tracking-widest uppercase group-hover:text-primary transition-colors">Browse History</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARTYRS' DAY BANNER */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono tracking-widest uppercase opacity-70 mb-1">
              Commemorated Annually
            </div>
            <p className="font-semibold text-lg" style={{ fontFamily: "'Fraunces', serif" }}>
              Martyrs' Day — June 20th
            </p>
          </div>
          <p className="text-sm opacity-80 max-w-md text-center md:text-right leading-relaxed">
            On June 20 each year, Eritreans around the world pause to remember those 
            who gave their lives for the nation's independence.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <div className="display-sm text-lg mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                Eritrean Martyrs Archive
              </div>
              <div className="data-label text-muted-foreground mb-4">1961 — 1991 · The Struggle</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A living, searchable site of remembrance for the fallen of Eritrea's liberation struggle.
              </p>
            </div>
            <div className="col-span-6 md:col-span-2 md:col-start-7">
              <div className="data-label mb-4">Navigate</div>
              <nav className="space-y-2">
                {[
                  { to: "/", label: "Home" },
                  { to: "/archive", label: "Archive" },
                  { to: "/browse", label: "Browse" },
                  { to: "/contributors", label: "Contributors" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="col-span-6 md:col-span-2">
              <div className="data-label mb-4">Contribute</div>
              <nav className="space-y-2">
                {[
                  { href: "mailto:contribute@eritrean-martyrs.org", label: "Submit a Record" },
                  { href: "mailto:info@eritrean-martyrs.org", label: "Contact" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
            <p>© 2025 Eritrean Martyrs Archive. Built with dignity.</p>
            <p className="font-mono">ዝሓለፉ ሰማእታት ንዘልኣለም ይዘከሩ — The fallen shall be remembered forever.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
