import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import MartyrCard from "@/components/MartyrCard";
import { MARTYRS } from "@/data/martyrs";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const featuredMartyrs = MARTYRS.slice(0, 3);

const Index = () => {
  const { ref: martyrsRef, visible: martyrsVisible } = useScrollReveal(0.1);
  const { ref: missionRef, visible: missionVisible } = useScrollReveal(0.1);

  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* HERO */}
      <section className="relative border-b border-border overflow-hidden" style={{ minHeight: "92vh", background: "hsl(var(--background))" }}>
        {/* Subtle warm tint top-left */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 65% 55% at 5% 15%, hsl(4 78% 42% / 0.06) 0%, transparent 70%)"
        }} />
        {/* Large ghost year watermark */}
        <div className="absolute right-0 bottom-0 pointer-events-none select-none overflow-hidden"
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(10rem, 28vw, 22rem)",
            fontWeight: 700,
            lineHeight: 0.85,
            color: "hsl(4 78% 42% / 0.07)",
            letterSpacing: "-0.04em"
          }}>
          1991
        </div>

        <div className="container mx-auto px-6 h-full relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:min-h-[92vh]">

            {/* Left — Text */}
            <div className="lg:col-span-7 flex flex-col justify-center pt-20 pb-10 lg:py-0 lg:pr-16">
              <div className="animate-fade-scale">
                {/* Label */}
                <div className="mb-7 flex items-center gap-3">
                  <div className="h-px w-8" style={{ background: "hsl(var(--oxblood))" }} />
                  <span className="data-label" style={{ color: "hsl(var(--oxblood-bright))", letterSpacing: "0.2em" }}>
                    Eritrean Martyrs Archive · 1961–1991
                  </span>
                </div>

                <h1 className="display-name mb-5" style={{ color: "hsl(var(--foreground))" }}>
                  They gave their<br />
                  <em style={{
                    fontStyle: "italic",
                    color: "hsl(var(--oxblood-bright))",
                    textShadow: "0 0 40px hsl(4 82% 48% / 0.35)"
                  }}>tomorrows</em><br />
                  for our today.
                </h1>

                <p className="mt-5 text-base lg:text-lg leading-relaxed max-w-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
                  A living archive of those who sacrificed their lives during The Struggle for Eritrean independence.
                  Every name is a monument. Every record is an act of remembrance.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-8 mb-9">
                  {[
                    { value: "65K+", label: "Martyrs Estimated" },
                    { value: "30", label: "Years of Struggle" },
                    { value: MARTYRS.length.toString(), label: "Records in Archive" },
                  ].map((stat) => (
                    <div key={stat.label} className="stat-card p-4 lg:p-5">
                      <div
                        className="font-mono text-2xl lg:text-3xl font-bold"
                        style={{ color: "hsl(var(--oxblood-bright))" }}
                      >
                        {stat.value}
                      </div>
                      <div className="data-label mt-1.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/archive"
                    className="inline-block px-7 py-3.5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300"
                    style={{
                      background: "hsl(var(--oxblood))",
                      color: "hsl(var(--primary-foreground))",
                      boxShadow: "0 4px 20px -4px hsl(4 82% 48% / 0.5)"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "hsl(var(--oxblood-bright))";
                      e.currentTarget.style.boxShadow = "0 6px 28px -4px hsl(4 82% 48% / 0.65)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "hsl(var(--oxblood))";
                      e.currentTarget.style.boxShadow = "0 4px 20px -4px hsl(4 82% 48% / 0.5)";
                    }}
                  >
                    Enter the Archive
                  </Link>
                  <Link
                    to="/browse"
                    className="inline-block px-7 py-3.5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300"
                    style={{
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--muted-foreground))"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "hsl(var(--foreground) / 0.4)";
                      e.currentTarget.style.color = "hsl(var(--foreground))";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "hsl(var(--border))";
                      e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                    }}
                  >
                    Browse the Struggle
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — Featured Portrait Stack */}
            <div className="lg:col-span-5 relative flex items-center justify-center py-12 lg:py-0">
              <div className="relative w-full max-w-[260px] sm:max-w-xs mx-auto">
                {featuredMartyrs.slice(0, 3).map((martyr, i) => (
                  <Link
                    to={`/martyr/${martyr.slug}`}
                    key={martyr.id}
                    className={`absolute block animate-fade-scale stagger-${i + 2}`}
                    style={{
                      top: `${i * 22}px`,
                      left: `${i * 14}px`,
                      zIndex: 3 - i,
                      transform: `rotate(${(i - 1) * 1.8}deg)`,
                    }}
                  >
                    <div
                      className="overflow-hidden portrait-glow"
                      style={{
                        width: "100%",
                        aspectRatio: "3/4",
                        background: "hsl(var(--card))",
                        border: `1px solid hsl(4 82% 48% / ${i === 0 ? "0.5" : "0.2"})`,
                        opacity: i === 0 ? 1 : i === 1 ? 0.85 : 0.65,
                      }}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={martyr.photo_url}
                          alt={`${martyr.first_name} ${martyr.last_name}`}
                          className="historical-photo w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                        />
                        {/* Strong gradient for text legibility */}
                        <div
                          className="absolute bottom-0 left-0 right-0 p-4"
                          style={{
                            background: "linear-gradient(to top, rgba(10,10,14,0.97) 0%, rgba(10,10,14,0.7) 50%, transparent 100%)",
                            paddingTop: "3rem"
                          }}
                        >
                          <div
                            className="text-sm font-semibold leading-tight"
                            style={{ fontFamily: "'Fraunces', serif", color: "hsl(35 20% 93%)" }}
                          >
                            {martyr.first_name} {martyr.last_name}
                          </div>
                          <div className="font-mono mt-1 text-xs flex items-center gap-1.5" style={{ color: "hsl(var(--oxblood-bright))" }}>
                            <span style={{ color: "hsl(var(--gold))" }}>✦</span>
                            <span>{new Date(martyr.date_of_death || "").getFullYear()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Spacer */}
                <div style={{ paddingBottom: "145%", position: "relative" }} />
              </div>
            </div>

          </div>
        </div>

        {/* Decorative vertical rule */}
        <div
          className="absolute left-1/2 top-0 bottom-0 hidden lg:block"
          style={{ width: "1px", background: "hsl(4 82% 48% / 0.1)" }}
        />
      </section>

      {/* FEATURED MARTYRS */}
      <section className="container mx-auto px-6 py-16 lg:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="data-label mb-2" style={{ color: "hsl(var(--oxblood-bright))" }}>Featured Records</div>
            <h2 className="display-sm text-2xl" style={{ fontFamily: "'Fraunces', serif", color: "hsl(var(--foreground))" }}>
              Cornerstone Figures of The Struggle
            </h2>
          </div>
          <Link
            to="/archive"
            className="text-xs font-mono tracking-widest uppercase transition-colors underline underline-offset-4 decoration-1"
            style={{ color: "hsl(var(--muted-foreground))" }}
            onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
            onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
          >
            View All {MARTYRS.length} →
          </Link>
        </div>

        <div ref={martyrsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {MARTYRS.slice(0, 4).map((martyr, i) => (
            <div
              key={martyr.id}
              style={{
                opacity: martyrsVisible ? 1 : 0,
                transform: martyrsVisible ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)`,
                transitionDelay: martyrsVisible ? `${i * 130}ms` : "0ms",
              }}
            >
              <MartyrCard martyr={martyr} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section
        className="border-t border-b border-border"
        style={{ background: "hsl(220 15% 5%)" }}
        ref={missionRef}
      >
        <div className="container mx-auto px-6 py-16 lg:py-20">
          <div className="grid grid-cols-12 gap-8 items-center">

            {/* Years decoration */}
            <div
              className="col-span-12 md:col-span-5 relative"
              style={{
                opacity: missionVisible ? 1 : 0,
                transform: missionVisible ? "translateX(0)" : "translateX(-32px)",
                transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div
                className="select-none leading-none"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(5rem, 16vw, 9rem)",
                  fontWeight: 700,
                  color: "hsl(4 82% 48% / 0.25)",
                  letterSpacing: "-0.03em"
                }}
              >
                1961
              </div>
              <div
                className="select-none leading-none -mt-2"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: "clamp(5rem, 16vw, 9rem)",
                  fontWeight: 700,
                  color: "hsl(4 82% 48% / 0.5)",
                  letterSpacing: "-0.03em"
                }}
              >
                1991
              </div>
              <div className="mt-5 w-12 h-0.5" style={{ background: "hsl(var(--oxblood))" }} />
            </div>

            {/* Text */}
            <div
              className="col-span-12 md:col-span-7"
              style={{
                opacity: missionVisible ? 1 : 0,
                transform: missionVisible ? "translateX(0)" : "translateX(32px)",
                transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s",
              }}
            >
              <div className="data-label mb-4" style={{ color: "hsl(var(--oxblood-bright))" }}>Our Mission</div>
              <div className="rule-accent mb-6" />
              <p
                className="text-xl leading-relaxed mb-6"
                style={{ fontFamily: "'Fraunces', serif", color: "hsl(var(--foreground))" }}
              >
                This archive exists because forgetting is its own form of occupation.
                Every name recorded is a small act of liberation.
              </p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                The Eritrean liberation struggle (1961–1991) is one of the longest continuous independence
                movements in modern African history. An estimated 65,000 fighters gave their lives — men and women
                from every ethnic group, every religion, every corner of Eritrea — to secure the freedom of
                a nation that the world had forgotten.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                This archive is dedicated to making sure they are not forgotten again.
                It is built for families, historians, and the global Eritrean diaspora who carry
                the weight of this history.
              </p>

              <div
                className="mt-8 pt-8 grid grid-cols-2 gap-4"
                style={{ borderTop: "1px solid hsl(var(--border))" }}
              >
                {[
                  { to: "/archive", label: "Search Archive", icon: <path d="M1 6H11M7 2L11 6L7 10" stroke="currentColor" strokeWidth="1.5"/> },
                  { to: "/browse", label: "Browse History", icon: <><rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/><rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.5"/></> },
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="group flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex items-center justify-center transition-all duration-200"
                      style={{ border: "1px solid hsl(var(--border))" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--oxblood))";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--oxblood))";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = "";
                        (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--border))";
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">{item.icon}</svg>
                    </div>
                    <span
                      className="text-xs font-medium tracking-widest uppercase transition-colors"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                      onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
                      onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MARTYRS' DAY BANNER */}
      <section style={{ background: "hsl(4 82% 40%)" }}>
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "hsl(4 82% 75%)" }}>
              Commemorated Annually
            </div>
            <p className="font-semibold text-lg" style={{ fontFamily: "'Fraunces', serif", color: "hsl(35 20% 96%)" }}>
              Martyrs' Day — June 20th
            </p>
          </div>
          <p className="text-sm max-w-md text-center md:text-right leading-relaxed" style={{ color: "hsl(4 82% 88%)" }}>
            On June 20 each year, Eritreans around the world pause to remember those
            who gave their lives for the nation's independence.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border" style={{ background: "hsl(220 15% 5%)" }}>
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <div className="display-sm text-lg mb-1" style={{ fontFamily: "'Fraunces', serif", color: "hsl(var(--foreground))" }}>
                Eritrean Martyrs Archive
              </div>
              <div className="data-label mb-4" style={{ color: "hsl(var(--oxblood-bright))" }}>1961 — 1991 · The Struggle</div>
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                A living, searchable site of remembrance for the fallen of Eritrea's liberation struggle.
              </p>
            </div>
            <div className="col-span-6 md:col-span-2 md:col-start-7">
              <div className="data-label mb-4">Navigate</div>
              <nav className="space-y-2.5">
                {[
                  { to: "/", label: "Home" },
                  { to: "/archive", label: "Archive" },
                  { to: "/browse", label: "Browse" },
                  { to: "/contributors", label: "Contributors" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block text-xs transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                    onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
                    onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="col-span-6 md:col-span-2">
              <div className="data-label mb-4">Contribute</div>
              <nav className="space-y-2.5">
                <Link
                  to="/contributors"
                  className="block text-xs transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
                  onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
                >
                  Submit a Record
                </Link>
                <a
                  href="mailto:info@eritrean-martyrs.org"
                  className="block text-xs transition-colors"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
                  onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}
                >
                  Contact
                </a>
              </nav>
            </div>
          </div>
          <div
            className="mt-12 pt-8 text-xs flex flex-col md:flex-row justify-between gap-2"
            style={{ borderTop: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          >
            <p>© 2025 Eritrean Martyrs Archive. Built with dignity.</p>
            <p className="font-mono">ዝሓለፉ ሰማእታት ንዘልኣለም ይዘከሩ — The fallen shall be remembered forever.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
