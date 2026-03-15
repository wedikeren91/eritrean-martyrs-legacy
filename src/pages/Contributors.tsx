import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import ContributorRegistrationPrompt from "@/components/ContributorRegistrationPrompt";

// ---------- Badge tiers ----------
const BADGE_TIERS = [
  {
    min: 500,
    label: "Legendary Guardian",
    emoji: "🏆",
    border: "border-yellow-400",
    text: "text-yellow-900",
    bg: "bg-gradient-to-br from-yellow-50 to-amber-100",
    description: "500+ records contributed",
    next: null,
  },
  {
    min: 300,
    label: "Elder Keeper",
    emoji: "🌟",
    border: "border-purple-400",
    text: "text-purple-900",
    bg: "bg-gradient-to-br from-purple-50 to-indigo-100",
    description: "300+ records contributed",
    next: 500,
  },
  {
    min: 100,
    label: "Senior Archivist",
    emoji: "💎",
    border: "border-cyan-400",
    text: "text-cyan-900",
    bg: "bg-gradient-to-br from-cyan-50 to-blue-100",
    description: "100+ records contributed",
    next: 300,
  },
  {
    min: 50,
    label: "Trusted Contributor",
    emoji: "🥈",
    border: "border-slate-400",
    text: "text-slate-800",
    bg: "bg-gradient-to-br from-slate-50 to-slate-100",
    description: "50+ records contributed",
    next: 100,
  },
  {
    min: 10,
    label: "Verified Contributor",
    emoji: "✅",
    border: "border-emerald-400",
    text: "text-emerald-900",
    bg: "bg-gradient-to-br from-emerald-50 to-green-100",
    description: "10+ records · Identity verified",
    next: 50,
  },
  {
    min: 1,
    label: "Contributor",
    emoji: "🌱",
    border: "border-stone-300",
    text: "text-stone-700",
    bg: "bg-gradient-to-br from-stone-50 to-stone-100",
    description: "1–9 records contributed",
    next: 10,
  },
];

function getBadge(count: number) {
  return BADGE_TIERS.find((t) => count >= t.min) || BADGE_TIERS[BADGE_TIERS.length - 1];
}

// ---------- Mock contributors ----------
const MOCK_CONTRIBUTORS = [
  { id: "1", name: "Miriam Tesfaye", city: "Asmara", country: "Eritrea", count: 523, relation: "Daughter of a fighter", public: true },
  { id: "2", name: "Yonas Haile", city: "Stockholm", country: "Sweden", count: 312, relation: "Historian & diaspora researcher", public: true },
  { id: "3", name: "Fatima Omar", city: "Toronto", country: "Canada", count: 147, relation: "Granddaughter of a martyr", public: true },
  { id: "4", name: "T. Woldemariam", city: "London", country: "UK", count: 89, relation: "Community historian", public: true },
  { id: "5", name: "Dawit Berhe", city: "Frankfurt", country: "Germany", count: 54, relation: "Son of a veteran", public: true },
  { id: "6", name: "A. Mohammed", city: "Jeddah", country: "Saudi Arabia", count: 23, relation: "Former ELF fighter's nephew", public: true },
  { id: "7", name: "Selam Kifle", city: "Washington DC", country: "USA", count: 11, relation: "Second-generation diaspora", public: true },
  { id: "8", name: "Anonymous", city: "—", country: "—", count: 6, relation: "Prefers anonymity", public: false },
];

// ---------- Submission form types ----------
type SubmissionForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  relation: string;
  martyrs_info: string;
  public_name: boolean;
  public_email: boolean;
  public_phone: boolean;
  public_location: boolean;
};

const defaultSubmission: SubmissionForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "",
  relation: "",
  martyrs_info: "",
  public_name: true,
  public_email: false,
  public_phone: false,
  public_location: true,
};

// ---------- Storage helpers ----------
const STORAGE_KEY = "ema_submission_count";
const REGISTERED_KEY = "ema_registered";
const PROMPT_DISMISSED_KEY = "ema_prompt_dismissed";
const REGISTRATION_THRESHOLD = 5;

function getCount(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
}
function incrementCount(): number {
  const next = getCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
function isRegistered(): boolean {
  return localStorage.getItem(REGISTERED_KEY) === "true";
}
function setRegistered() {
  localStorage.setItem(REGISTERED_KEY, "true");
}

// ---------- Main component ----------
const Contributors = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SubmissionForm>(defaultSubmission);
  const [submitted, setSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number>(getCount);
  const [showRegPrompt, setShowRegPrompt] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);

  // Check if prompt should show on mount (already hit threshold but not yet registered/dismissed)
  useEffect(() => {
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY) === "true";
    if (!dismissed && !isRegistered() && submissionCount >= REGISTRATION_THRESHOLD) {
      setShowRegPrompt(true);
    }
  }, []);

  const set = (k: keyof SubmissionForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.email || !form.country || !form.relation) return;
    const newCount = incrementCount();
    setSubmissionCount(newCount);
    setSubmitted(true);
    // Show registration prompt once threshold is reached and not yet registered
    if (newCount >= REGISTRATION_THRESHOLD && !isRegistered()) {
      setTimeout(() => setShowRegPrompt(true), 1200);
    }
  };

  const handleRegistered = (name: string) => {
    setRegistered();
    setRegisteredName(name);
    setShowRegPrompt(false);
  };

  const handleDismissPrompt = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    setShowRegPrompt(false);
  };

  const currentBadge = getBadge(Math.max(submissionCount, 0));
  const nextTier = BADGE_TIERS.find((t) => t.min > submissionCount && t.min <= 10);

  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* Registration prompt modal */}
      {showRegPrompt && (
        <ContributorRegistrationPrompt
          submissionCount={submissionCount}
          onRegistered={handleRegistered}
          onDismiss={handleDismissPrompt}
        />
      )}

      {/* ── Header ── */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="data-label mb-4">The Archive Community</div>
          <h1 className="display-title text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            Contributors
          </h1>
          <div className="rule-accent mb-6" />
          <p className="text-muted-foreground leading-relaxed max-w-2xl mb-8">
            This archive is built by the community. Every name, date, and story was contributed by someone who
            carries this history. Earn badges as you grow your contributions.
          </p>

          {/* Badge tiers reference */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {BADGE_TIERS.map((tier) => (
              <div
                key={tier.min}
                className={`${tier.bg} border ${tier.border} p-3 flex flex-col items-center text-center gap-1`}
              >
                <span className="text-2xl">{tier.emoji}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${tier.text}`}>{tier.label}</span>
                <span className="text-[9px] text-muted-foreground">{tier.description}</span>
              </div>
            ))}
          </div>

          {/* My progress strip — if they have submissions */}
          {submissionCount > 0 && (
            <div className={`${currentBadge.bg} border ${currentBadge.border} p-4 mb-6 flex items-center gap-5`}>
              <span className="text-3xl flex-shrink-0">{currentBadge.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold uppercase tracking-wider ${currentBadge.text}`}>
                  {registeredName ? `${registeredName} — ` : "Your status — "}{currentBadge.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {submissionCount} record{submissionCount !== 1 ? "s" : ""} submitted
                  {nextTier && ` · ${nextTier.min - submissionCount} more to unlock ${nextTier.emoji} ${nextTier.label}`}
                </div>
                {nextTier && (
                  <div className="mt-2 h-1.5 bg-black/10 overflow-hidden w-full max-w-xs">
                    <div
                      className="h-full bg-foreground/70 transition-all duration-700"
                      style={{ width: `${Math.min((submissionCount / nextTier.min) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              {!isRegistered() && submissionCount >= REGISTRATION_THRESHOLD && (
                <button
                  onClick={() => setShowRegPrompt(true)}
                  className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-2 text-[10px] font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
                >
                  Register Profile →
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-block bg-primary text-primary-foreground px-8 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors duration-200"
          >
            {showForm ? "← Close Form" : "+ Submit a Martyr Record"}
          </button>
        </div>
      </section>

      {/* ── Submission Form ── */}
      {showForm && !submitted && (
        <section className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-12 max-w-3xl">
            <div className="data-label mb-2">New Submission</div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
              Submit Martyr Information
            </h2>
            <div className="rule-accent mb-6" />

            {/* Progress nudge */}
            {submissionCount > 0 && submissionCount < REGISTRATION_THRESHOLD && (
              <div className="bg-muted/50 border border-border p-4 mb-6 flex items-center gap-3">
                <span className="text-xl">🌱</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {submissionCount} of {REGISTRATION_THRESHOLD} records — keep going!
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    At {REGISTRATION_THRESHOLD} submissions you'll be invited to create your Contributor Profile.
                  </p>
                </div>
                <div className="ml-auto w-24 h-1.5 bg-border overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(submissionCount / REGISTRATION_THRESHOLD) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-8">
              All submissions are reviewed before being added to the archive.
              <strong className="text-foreground"> At 10 contributions you'll be asked to verify your identity</strong> for a Verified Contributor badge.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contributor info */}
              <fieldset className="space-y-5">
                <legend className="data-label text-foreground mb-3">Your Information</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="data-label block mb-1.5">First Name *</label>
                    <input
                      required
                      value={form.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                      placeholder="Miriam"
                    />
                  </div>
                  <div>
                    <label className="data-label block mb-1.5">Last Name</label>
                    <input
                      value={form.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                      placeholder="Tesfaye"
                    />
                  </div>
                </div>
                <div>
                  <label className="data-label block mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    placeholder="you@example.com"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    For verification at 10+ contributions. Never shown publicly without consent.
                  </p>
                </div>
                <div>
                  <label className="data-label block mb-1.5">
                    Phone <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    placeholder="+1 202 555 0100"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="data-label block mb-1.5">City *</label>
                    <input
                      required
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div>
                    <label className="data-label block mb-1.5">State / Province</label>
                    <input
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div>
                    <label className="data-label block mb-1.5">Country *</label>
                    <input
                      required
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Relationship */}
              <fieldset className="space-y-4">
                <legend className="data-label text-foreground mb-3">Your Connection to the Martyrs</legend>
                <div>
                  <label className="data-label block mb-1.5">How are you related? *</label>
                  <select
                    required
                    value={form.relation}
                    onChange={(e) => set("relation", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                  >
                    <option value="">Select relationship…</option>
                    <option value="family_direct">Direct family member (parent, sibling, child)</option>
                    <option value="family_extended">Extended family (uncle, aunt, cousin, grandchild)</option>
                    <option value="fellow_fighter">Fellow liberation fighter / veteran</option>
                    <option value="community">Community member / neighbour</option>
                    <option value="historian">Historian / researcher / journalist</option>
                    <option value="diaspora">Diaspora community member</option>
                    <option value="other">Other — please describe below</option>
                  </select>
                </div>
                <div>
                  <label className="data-label block mb-1.5">
                    Additional context <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={form.martyrs_info}
                    onChange={(e) => set("martyrs_info", e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                    placeholder="e.g. My father served alongside this person in the Sahel region from 1975–1982…"
                  />
                </div>
              </fieldset>

              {/* Privacy */}
              <fieldset className="space-y-3">
                <legend className="data-label text-foreground mb-3">Privacy Settings</legend>
                <p className="text-xs text-muted-foreground mb-3">
                  You must provide the information above, but you choose what is publicly shown on your profile.
                </p>
                {[
                  { key: "public_name" as const, label: "Show my name publicly on the Contributors page" },
                  { key: "public_location" as const, label: "Show my city and country publicly" },
                  { key: "public_email" as const, label: "Show my email publicly (not recommended)" },
                  { key: "public_phone" as const, label: "Show my phone number publicly" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => set(key, !form[key])}
                      className={`w-4 h-4 border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer
                        ${form[key] ? "bg-foreground border-foreground" : "border-border group-hover:border-foreground"}`}
                    >
                      {form[key] && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="hsl(30 10% 96%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-foreground/80">{label}</span>
                  </label>
                ))}
              </fieldset>

              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-10 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
                >
                  Submit for Review
                </button>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Submissions reviewed within 5–10 business days. You'll receive an email confirmation.
                </p>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ── Success Message ── */}
      {submitted && (
        <section className="border-b border-border bg-card/50">
          <div className="container mx-auto px-6 py-10 max-w-2xl">
            <div className="flex items-start gap-6">
              <div className="text-4xl flex-shrink-0">🌹</div>
              <div>
                <h2 className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                  Thank you, {form.first_name}.
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                  Submission #{submissionCount} received. You'll get a confirmation at{" "}
                  <strong className="text-foreground">{form.email}</strong>.
                </p>

                {/* Post-submit progress */}
                {submissionCount < REGISTRATION_THRESHOLD && (
                  <div className="bg-muted/50 border border-border p-3 flex items-center gap-3 mb-4">
                    <span>🌱</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold">
                        {submissionCount} / {REGISTRATION_THRESHOLD} — {REGISTRATION_THRESHOLD - submissionCount} more until your Contributor Profile unlocks
                      </p>
                      <div className="mt-1.5 h-1.5 bg-border overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-700"
                          style={{ width: `${(submissionCount / REGISTRATION_THRESHOLD) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {submissionCount >= REGISTRATION_THRESHOLD && !isRegistered() && (
                  <div className="bg-emerald-50 border border-emerald-300 p-3 flex items-center gap-3 mb-4">
                    <span>🎉</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-800">
                        You've reached {REGISTRATION_THRESHOLD} records! Create your Contributor Profile.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRegPrompt(true)}
                      className="flex-shrink-0 bg-emerald-700 text-white px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase hover:bg-emerald-800 transition-colors"
                    >
                      Register →
                    </button>
                  </div>
                )}

                <button
                  onClick={() => { setSubmitted(false); setShowForm(true); setForm(defaultSubmission); }}
                  className="text-xs font-mono tracking-widest uppercase text-primary hover:underline"
                >
                  Submit Another Record →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Contributors List ── */}
      <section className="container mx-auto px-6 py-12">
        <div className="data-label mb-2">Recognised Contributors</div>
        <h2 className="text-3xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          The Archive Builders
        </h2>
        <div className="rule-accent mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_CONTRIBUTORS.map((c) => {
            const badge = getBadge(c.count);
            return (
              <div
                key={c.id}
                className={`${badge.bg} border ${badge.border} p-5 flex gap-4 items-start`}
              >
                <div className="flex-shrink-0 text-3xl leading-none mt-0.5">{badge.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${badge.text} truncate`} style={{ fontFamily: "'Fraunces', serif" }}>
                    {c.public ? c.name : "Anonymous Contributor"}
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-wider ${badge.text} opacity-70 mb-1`}>
                    {badge.label}
                  </div>
                  {c.public && c.city !== "—" && (
                    <div className="text-[10px] text-muted-foreground">{c.city}, {c.country}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground italic mt-1 line-clamp-1">{c.relation}</div>
                  <div className={`font-mono text-xs font-bold mt-2 ${badge.text}`}>
                    {c.count} record{c.count !== 1 ? "s" : ""} contributed
                  </div>
                  {/* Progress to next badge */}
                  {badge.next && (
                    <div className="mt-2">
                      <div className="h-1 bg-black/10 overflow-hidden">
                        <div
                          className="h-full bg-current opacity-40 transition-all"
                          style={{ width: `${Math.min((c.count / badge.next) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-[8px] text-muted-foreground mt-0.5">
                        {badge.next - c.count > 0 ? `${badge.next - c.count} to next badge` : "Max badge!"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Are you an Eritrean with knowledge of fighters, community leaders, or others who gave their lives?
          </p>
          <button
            onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="inline-block border border-foreground px-8 py-3 text-xs font-semibold tracking-widest uppercase text-foreground hover:bg-foreground hover:text-background transition-all duration-200"
          >
            + Add a Record You Know
          </button>
        </div>
      </section>

      <footer className="border-t border-border">
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

export default Contributors;
