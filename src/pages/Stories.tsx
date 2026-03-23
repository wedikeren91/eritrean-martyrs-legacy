import SiteHeader from "@/components/SiteHeader";
import { Link } from "react-router-dom";

const FEATURED = [
  {
    id: "1",
    title: "The Battle of Afabet — A Turning Point",
    subtitle: "How a small force defeated a heavily-equipped army and changed the course of Eritrean liberation",
    date: "March 1988",
    category: "Battle History",
    readTime: "8 min read",
    excerpt:
      "In March 1988, EPLF forces executed one of the most decisive military manoeuvres in African liberation history. The fall of the Nadew Command at Afabet sent shockwaves through Addis Ababa and galvanised international attention on the Eritrean cause.",
  },
  {
    id: "2",
    title: "Women of the Struggle",
    subtitle: "30% of EPLF fighters were women — their stories deserve to be told",
    date: "1970s–1991",
    category: "Human Stories",
    readTime: "12 min read",
    excerpt:
      "Tegadalit — female freedom fighters — were a defining feature of the EPLF. They fought on the front lines, served as doctors, engineers, and commanders. Many gave their lives. Their stories are only beginning to be recorded.",
  },
  {
    id: "3",
    title: "The Border War of 1998 — Why it Still Matters",
    subtitle: "Two years of brutal conflict that cost over 100,000 lives on both sides",
    date: "1998–2000",
    category: "Conflict History",
    readTime: "10 min read",
    excerpt:
      "What began as a border dispute over the town of Badme escalated into a full-scale conventional war fought with tanks, artillery, and air power. The human cost was staggering — and the wounds have not fully healed.",
  },
  {
    id: "4",
    title: "Eritreans in the Tigray War",
    subtitle: "The contested role of Eritrean forces in the 2019–2022 conflict",
    date: "2019–2022",
    category: "Recent History",
    readTime: "15 min read",
    excerpt:
      "The Tigray War drew Eritrea back into armed conflict on Ethiopian soil. The exact extent of Eritrean military involvement remains disputed, but the human cost to Eritrean families — including those with sons and daughters serving — was real.",
  },
];

export default function Stories() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border" style={{
        background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
        padding: "clamp(2rem, 6vw, 4rem) 0 clamp(1.5rem, 4vw, 2.5rem)",
      }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-6" style={{ background: "hsl(var(--oxblood))" }} />
            <span className="data-label" style={{ color: "hsl(var(--oxblood-bright))", letterSpacing: "0.2em" }}>
              Living History · Long Reads
            </span>
          </div>
          <h1 className="mb-3" style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            fontWeight: 700,
            lineHeight: 1.1,
          }}>
            Stories from <em style={{ fontStyle: "italic", color: "hsl(var(--oxblood-bright))" }}>The Struggle</em>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Long-form stories, battle histories, and personal accounts from Eritrea's liberation — and the conflicts that followed.
          </p>
        </div>
      </section>

      {/* Coming soon banner */}
      <div className="border-b border-border bg-amber-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-base">📖</span>
          <p className="text-xs text-amber-800 font-medium">
            Full stories are being written by the community. Contribute your story or nominate a battle/person below.
          </p>
          <Link to="/contribute"
            className="ml-auto flex-shrink-0 text-[10px] font-bold tracking-widest uppercase bg-amber-700 text-white px-3 py-1.5 hover:bg-amber-800 transition-colors">
            Contribute →
          </Link>
        </div>
      </div>

      {/* Story cards */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {FEATURED.map((story, i) => (
            <article key={story.id}
              className="border border-border bg-card hover:border-foreground/30 transition-colors cursor-pointer group"
              onClick={() => {/* future: navigate to full story */}}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 border"
                    style={{ background: "hsl(var(--oxblood))", color: "hsl(35 25% 97%)", borderColor: "hsl(var(--oxblood))" }}>
                    {story.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{story.date}</span>
                  <span className="text-[10px] text-muted-foreground">· {story.readTime}</span>
                </div>

                <h2 className="text-lg font-semibold mb-1 group-hover:underline underline-offset-2 decoration-1"
                  style={{ fontFamily: "'Fraunces', serif" }}>
                  {story.title}
                </h2>
                <p className="text-xs text-muted-foreground mb-3 font-medium">{story.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{story.excerpt}</p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-widest uppercase"
                    style={{ color: "hsl(var(--oxblood-bright))" }}>
                    Read full story →
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Coming soon
                  </span>
                </div>
              </div>

              {/* Issue number watermark */}
              <div className="px-5 sm:px-6 pb-4 border-t border-border pt-3">
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  #{String(i + 1).padStart(3, "0")} · Eritrean Martyrs Archive · Long Reads
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 border border-border bg-card p-6 text-center">
          <div className="text-3xl mb-3">✍️</div>
          <h3 className="text-base font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            Know a story that should be told?
          </h3>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-md mx-auto">
            Submit a battle account, personal testimony, or historical narrative. Stories are reviewed before publication.
          </p>
          <Link to="/contribute"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors">
            Submit a Story →
          </Link>
        </div>
      </main>

      <footer className="border-t border-border mt-8 bg-card">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Eritrean Martyrs Archive · Stories</p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
            ← Directory
          </Link>
        </div>
      </footer>
    </div>
  );
}
