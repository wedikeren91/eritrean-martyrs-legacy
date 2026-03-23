import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import { getPersonBySlug, type PersonRow } from "@/hooks/usePersons";
import { getMartyrBySlug } from "@/data/martyrs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const WARS = [
  { value: "", label: "— Select conflict —" },
  { value: "War of Liberation 1961–1991", label: "War of Liberation (1961–1991)" },
  { value: "War of 1998–2000", label: "Eritrea–Ethiopia War (1998–2000)" },
  { value: "Tigray War 2019–2022", label: "Tigray War (2019–2022)" },
  { value: "Other", label: "Other / Unknown" },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch {
    return dateStr;
  }
}

// ─── Tribute (candle) hook ─────────────────────────────────────────────────
function useTributes(personId: string | undefined) {
  const [count, setCount] = useState(0);
  const [hasLit, setHasLit] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personId) return;
    supabase
      .from("tributes")
      .select("id", { count: "exact", head: true })
      .eq("person_id", personId)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [personId]);

  const light = async () => {
    if (!personId || hasLit || loading) return;
    setLoading(true);
    const { error } = await supabase
      .from("tributes")
      .insert({ person_id: personId, flower_count: 1 });
    if (!error) {
      setCount((c) => c + 1);
      setHasLit(true);
    }
    setLoading(false);
  };

  return { count, hasLit, light, loading };
}

// ─── Main Component ────────────────────────────────────────────────────────
const MartyrProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const [person, setPerson] = useState<PersonRow | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const { count: tributeCount, hasLit, light, loading: tributeLoading } = useTributes(person?.id);

  useEffect(() => {
    if (!slug) { setPageLoading(false); return; }
    getPersonBySlug(slug).then((data) => {
      if (data) {
        setPerson(data);
      } else {
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
      setPageLoading(false);
    });
  }, [slug]);

  if (pageLoading) {
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
          <Link to="/archive" className="archive-link text-sm">← Return to Archive</Link>
        </div>
      </div>
    );
  }

  const bioParas = (person.bio || "").split("\n\n").filter(Boolean);
  const previewParas = bioParas.slice(0, 2);
  const remainingParas = bioParas.slice(2);

  return (
    <div className="min-h-screen bg-background grain-overlay w-full max-w-full overflow-x-hidden">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2 text-xs text-muted-foreground overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/archive" className="hover:text-foreground transition-colors">Archive</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[140px]">{person.first_name} {person.last_name}</span>
          </div>
          {isAdmin && (
            <Link
              to={`/admin/edit/${person.slug}`}
              className="bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase hover:bg-primary/90 transition-colors shrink-0"
            >
              ✏️ Edit
            </Link>
          )}
        </div>
      </div>

      {/* ── HERO: Portrait + Name ── */}
      <section className="border-b border-border overflow-hidden bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Portrait — full bleed, tall on mobile */}
            <div className="relative overflow-hidden" style={{ minHeight: "360px", maxHeight: "520px" }}>
              {person.photo_url ? (
                <img
                  src={person.photo_url}
                  alt={`${person.first_name} ${person.last_name}`}
                  className="w-full h-full object-cover object-top animate-fade-scale"
                  style={{ minHeight: "360px", maxHeight: "520px" }}
                />
              ) : (
                <div className="w-full h-full min-h-[360px] flex items-center justify-center bg-muted">
                  <span className="text-8xl opacity-10">👤</span>
                </div>
              )}

              {/* Category + rank badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="px-3 py-1.5" style={{ background: "hsl(var(--oxblood))" }}>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: "hsl(35 25% 97%)" }}>
                    {person.category} · {person.rank || "Fighter"}
                  </span>
                </div>
              </div>

              {/* Birth–Death overlay on image (mobile only) */}
              <div className="absolute bottom-0 left-0 right-0 md:hidden z-10"
                style={{ background: "linear-gradient(to top, rgba(15,10,8,0.95) 0%, transparent 100%)", padding: "2rem 1rem 0.75rem" }}>
              <h1 className="text-xl font-bold leading-tight text-white mb-0.5 break-words" style={{ fontFamily: "'Fraunces', serif", wordBreak: "break-word" }}>
                  {person.first_name} {person.last_name}
                </h1>
                {person.known_as && (
                  <p className="text-xs italic mb-1.5" style={{ color: "hsl(35 20% 72%)" }}>"{person.known_as}"</p>
                )}
                <div className="flex items-center gap-2 font-mono text-sm font-bold">
                  <span style={{ color: "hsl(38 85% 68%)" }}>{formatYear(person.date_of_birth)}</span>
                  <span className="text-white/30">–</span>
                  <span style={{ color: "hsl(4 90% 68%)" }}>{formatYear(person.date_of_death)}</span>
                </div>
              </div>
            </div>

            {/* Name & Data panel */}
            <div className="hidden md:flex flex-col justify-center px-8 py-12 animate-fade-scale" style={{ animationDelay: "150ms" }}>
              {person.known_as && (
                <div className="data-label text-primary mb-3">{person.known_as}</div>
              )}
              <h1 className="display-name text-primary mb-1 break-words" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 6vw, 5rem)", wordBreak: "break-word" }}>
                {person.first_name}
              </h1>
              <h1 className="display-name mb-6 break-words" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 6vw, 5rem)", wordBreak: "break-word" }}>
                {person.last_name}
              </h1>
              <div className="rule-accent mb-6" />

              <div className="grid grid-cols-2 gap-y-5 gap-x-6 max-w-sm">
                <div>
                  <div className="data-label">Born</div>
                  <div className="data-value mt-1">{formatDate(person.date_of_birth)}</div>
                </div>
                <div>
                  <div className="data-label">Martyred</div>
                  <div className="data-value mt-1 text-primary font-bold">{formatDate(person.date_of_death)}</div>
                </div>
                <div>
                  <div className="data-label">Origin</div>
                  <div className="data-value mt-1">{person.city || "—"}{person.region ? `, ${person.region}` : ""}</div>
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
                    <div className="data-label">Battle / Conflict</div>
                    <div className="data-value mt-1">{person.battle}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRIBUTE / CANDLE BAR ── */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Significance summary */}
          {person.significance && (
            <p className="text-sm italic text-muted-foreground max-w-xl leading-relaxed" style={{ fontFamily: "'Fraunces', serif" }}>
              "{person.significance}"
            </p>
          )}

          {/* Candle button + counter */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "hsl(var(--oxblood))", fontFamily: "'Fraunces', serif" }}>
                {tributeCount.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                Candles Lit
              </div>
            </div>

            <button
              onClick={light}
              disabled={hasLit || tributeLoading}
              className="flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all duration-200 border-2 disabled:opacity-50"
              style={hasLit
                ? { background: "hsl(38 80% 48%)", borderColor: "hsl(38 80% 48%)", color: "#fff" }
                : { background: "transparent", borderColor: "hsl(var(--oxblood))", color: "hsl(var(--oxblood))" }
              }
            >
              <span className="text-lg">{hasLit ? "🕯️" : "🕯"}</span>
              {hasLit ? "Candle Lit" : "Light a Candle"}
            </button>
          </div>
        </div>
      </section>

      {/* ── MOBILE DATA FIELDS (below portrait) ── */}
      <section className="md:hidden container mx-auto px-4 py-6 border-b border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="data-label">Born</div>
            <div className="data-value mt-1">{formatDate(person.date_of_birth)}</div>
          </div>
          <div>
            <div className="data-label">Martyred</div>
            <div className="data-value mt-1 text-primary font-bold">{formatDate(person.date_of_death)}</div>
          </div>
          <div>
            <div className="data-label">Origin</div>
            <div className="data-value mt-1">{person.city || "—"}{person.region ? `, ${person.region}` : ""}</div>
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
              <div className="data-label">Battle / Conflict</div>
              <div className="data-value mt-1">{person.battle}</div>
            </div>
          )}
        </div>
      </section>

      {/* ── BIOGRAPHY ── */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-5xl mx-auto">

          {/* Sidebar */}
          <div className="md:col-span-3">
            <div className="md:sticky top-24">
              <div className="data-label mb-2">Record</div>
              <div className="rule-accent mb-5" />
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

          {/* Bio column */}
          <div className="md:col-span-9">
            <div className="data-label mb-2">Biography</div>
            <div className="rule-accent mb-6" />

            {bioParas.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">No biography recorded yet.</p>
            ) : (
              <div className="space-y-5 max-w-2xl">
                {/* Always show first 2 paragraphs */}
                {previewParas.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-foreground/85 animate-fade-scale"
                    style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}>
                    {para}
                  </p>
                ))}

                {/* Collapsible remainder */}
                {remainingParas.length > 0 && (
                  <>
                    {bioExpanded && remainingParas.map((para, i) => (
                      <p key={`r-${i}`} className="text-base leading-relaxed text-foreground/85 animate-fade-scale"
                        style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}>
                        {para}
                      </p>
                    ))}

                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="mt-2 flex items-center gap-2 text-sm font-semibold border-b-2 pb-0.5 transition-colors duration-200"
                      style={{ color: "hsl(var(--oxblood))", borderColor: "hsl(var(--oxblood))" }}
                    >
                      {bioExpanded ? "↑ Show Less" : `↓ Read Full Story (${remainingParas.length} more section${remainingParas.length > 1 ? "s" : ""})`}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
              <Link to="/archive" className="archive-link text-sm">← Return to Archive</Link>
              <div className="text-xs text-muted-foreground font-mono">{person.slug}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUGGEST CORRECTION ── */}
      <SuggestCorrectionSection person={person} />

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <p className="text-xs text-muted-foreground text-center">
            Eritrean Martyrs Archive · This record is part of a living archive. If you have additional information,{" "}
            <Link to="/contributors" className="archive-link">please contribute →</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

// ─── Suggest Correction Section ────────────────────────────────────────────
function SuggestCorrectionSection({ person }: { person: PersonRow }) {
  const { user, isContributor } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    first_name: person.first_name ?? "",
    last_name: person.last_name ?? "",
    known_as: person.known_as ?? "",
    date_of_birth: person.date_of_birth ?? "",
    date_of_death: person.date_of_death ?? "",
    city: person.city ?? "",
    region: person.region ?? "",
    category: person.category ?? "",
    status: person.status ?? "",
    rank: person.rank ?? "",
    role: person.role ?? "",
    battle: person.battle ?? "",
    place_of_martyrdom: person.place_of_martyrdom ?? "",
    bio: person.bio ?? "",
    significance: person.significance ?? "",
    quote: person.quote ?? "",
    correction_note: "",
  });

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    const { correction_note, ...correctedData } = form;
    const { error: err } = await supabase.from("contributions").insert({
      user_id: user.id,
      source_type: "correction",
      status: "pending",
      person_data: {
        ...correctedData,
        slug: person.slug,
        photo_url: person.photo_url,
        _correction_note: correction_note,
        _original_person_id: person.id,
        _original_slug: person.slug,
      },
    });
    if (err) { setError(err.message); }
    else { setSuccess(true); setOpen(false); }
    setSaving(false);
  };

  if (!isContributor) return null;

  return (
    <section className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {!open && !success && (
          <div className="flex items-center justify-between">
            <div>
              <div className="data-label text-muted-foreground">Know something different?</div>
              <p className="text-xs text-muted-foreground mt-1">
                Corrections are reviewed before appearing publicly.
              </p>
            </div>
            <button
              onClick={handleOpen}
              className="px-5 py-2 text-xs font-semibold tracking-widest uppercase border border-border hover:border-foreground transition-colors bg-background"
            >
              ✏️ Suggest Correction
            </button>
          </div>
        )}

        {success && (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm text-muted-foreground">
              Thank you — your correction has been submitted and is pending admin review.
            </p>
          </div>
        )}

        {open && (
          <div ref={formRef}>
            <div className="flex items-center justify-between mb-6">
              <div className="data-label text-primary">Suggest Correction</div>
              <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ✕ Cancel
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed border-l-2 border-primary pl-3">
              Edit only the fields that need correcting. Your suggestion will be reviewed by an admin before any changes go live on the public record.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identity */}
              <div className="border border-border p-4 bg-background">
                <div className="data-label mb-3">Identity</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <CField label="First Name" value={form.first_name} onChange={set("first_name")} />
                  <CField label="Last Name" value={form.last_name} onChange={set("last_name")} />
                  <CField label="Known As" value={form.known_as} onChange={set("known_as")} />
                  <CField label="Date of Birth" value={form.date_of_birth} onChange={set("date_of_birth")} placeholder="e.g. 1955-03-12" />
                  <CField label="Date of Death" value={form.date_of_death} onChange={set("date_of_death")} placeholder="e.g. 1988-07-02" />
                  <CField label="Status" value={form.status} onChange={set("status")} />
                </div>
              </div>
              {/* Location */}
              <div className="border border-border p-4 bg-background">
                <div className="data-label mb-3">Location</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <CField label="City" value={form.city} onChange={set("city")} />
                  <CField label="Region" value={form.region} onChange={set("region")} />
                  <CField label="Place of Martyrdom" value={form.place_of_martyrdom} onChange={set("place_of_martyrdom")} />
                </div>
              </div>
              {/* Service */}
              <div className="border border-border p-4 bg-background">
                <div className="data-label mb-3">Service Record</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <CField label="Category / Organisation" value={form.category} onChange={set("category")} />
                  <CField label="Role" value={form.role} onChange={set("role")} />
                  <CField label="Rank" value={form.rank} onChange={set("rank")} />
                  <div className="col-span-2 md:col-span-3">
                    <label className="data-label block mb-1.5">War / Conflict</label>
                    <select value={form.battle} onChange={set("battle")} className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors">
                      {WARS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {/* Narrative */}
              <div className="border border-border p-4 bg-background">
                <div className="data-label mb-3">Narrative</div>
                <div className="space-y-3">
                  <CTextArea label="Significance" value={form.significance} onChange={set("significance")} rows={2} />
                  <CTextArea label="Biography" value={form.bio} onChange={set("bio")} rows={6} />
                  <CField label="Notable Quote" value={form.quote} onChange={set("quote")} />
                </div>
              </div>
              {/* Correction note */}
              <div className="border border-primary/30 p-4 bg-primary/5">
                <CTextArea
                  label="Note to Reviewer (required)"
                  value={form.correction_note}
                  onChange={set("correction_note")}
                  rows={2}
                  placeholder="Briefly describe what you changed and why (e.g. 'Corrected date of death — source: family records')"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving || !form.correction_note.trim()}
                  className="bg-primary text-primary-foreground px-8 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Submitting…" : "Submit for Review"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function CField({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="data-label block mb-1">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors" />
    </div>
  );
}

function CTextArea({ label, value, onChange, rows, placeholder }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="data-label block mb-1">{label}</label>
      <textarea value={value} onChange={onChange} rows={rows ?? 4} placeholder={placeholder}
        className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors resize-y" />
    </div>
  );
}

export default MartyrProfile;
