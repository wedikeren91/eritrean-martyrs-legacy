import { useState } from "react";

type RegForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  relation: string;
  story: string;
  public_name: boolean;
  public_location: boolean;
  public_email: boolean;
  public_phone: boolean;
};

const defaultReg: RegForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "",
  relation: "",
  story: "",
  public_name: true,
  public_location: true,
  public_email: false,
  public_phone: false,
};

type Props = {
  submissionCount: number;
  onRegistered: (name: string, email: string) => void;
  onDismiss: () => void;
};

const NEXT_BADGE_AT = 10;

export default function ContributorRegistrationPrompt({ submissionCount, onRegistered, onDismiss }: Props) {
  const [step, setStep] = useState<"prompt" | "form" | "done">("prompt");
  const [form, setForm] = useState<RegForm>(defaultReg);
  const set = (k: keyof RegForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const progress = Math.min((submissionCount / NEXT_BADGE_AT) * 100, 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.email || !form.country || !form.relation) return;
    setStep("done");
    onRegistered(form.first_name, form.email);
  };

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-card border border-border max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">🌹</div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            Welcome, {form.first_name}.
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Your contributor profile has been created. Keep adding records — at{" "}
            <strong className="text-foreground">10 records</strong> you'll receive your{" "}
            <span className="text-emerald-700 font-semibold">✅ Verified Contributor</span> badge.
          </p>
          <button
            onClick={onDismiss}
            className="bg-primary text-primary-foreground px-8 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
          >
            Continue Contributing
          </button>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-card border border-border max-w-2xl w-full my-8">
          {/* Header */}
          <div className="border-b border-border px-8 py-6">
            <div className="data-label mb-1">Step 2 of 2</div>
            <h2 className="text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
              Create Your Contributor Profile
            </h2>
            <p className="text-xs text-muted-foreground mt-2">
              Your profile will appear on the Contributors page. You control what is shown publicly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-7">
            {/* Identity */}
            <fieldset className="space-y-4">
              <legend className="data-label text-foreground mb-2">Your Identity</legend>
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
                  Used for verification at 10 records. Never shown without your consent.
                </p>
              </div>
              <div>
                <label className="data-label block mb-1.5">
                  Phone <span className="text-muted-foreground font-normal normal-case">(optional — for verified badge)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                  placeholder="+1 202 555 0100"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
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

            {/* Connection */}
            <fieldset className="space-y-4">
              <legend className="data-label text-foreground mb-2">Your Connection to the Martyrs</legend>
              <div>
                <label className="data-label block mb-1.5">Relationship *</label>
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
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="data-label block mb-1.5">
                  Your story <span className="text-muted-foreground font-normal normal-case">(optional — shown on your profile)</span>
                </label>
                <textarea
                  value={form.story}
                  onChange={(e) => set("story", e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                  placeholder="e.g. My uncle fought in the liberation war. I grew up hearing his stories and want to preserve the memory of his comrades…"
                />
              </div>
            </fieldset>

            {/* Privacy */}
            <fieldset className="space-y-3">
              <legend className="data-label text-foreground mb-2">Privacy Settings</legend>
              <p className="text-xs text-muted-foreground">
                Your information is required but you choose what appears publicly on the Contributors page.
              </p>
              {[
                { key: "public_name" as const, label: "Show my name publicly" },
                { key: "public_location" as const, label: "Show my city and country" },
                { key: "public_email" as const, label: "Show my email publicly" },
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
                        <path d="M1 3L3 5L7 1" stroke="hsl(30 10% 96%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-foreground/80">{label}</span>
                </label>
              ))}
            </fieldset>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-10 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
              >
                Create Profile
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // step === "prompt"
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card border border-border max-w-lg w-full overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400" />

        <div className="p-8">
          {/* Badge preview */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-300 flex items-center justify-center text-3xl flex-shrink-0">
              🌱
            </div>
            <div>
              <div className="data-label text-emerald-700 mb-0.5">You've submitted {submissionCount} records!</div>
              <h2 className="text-xl leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Create your Contributor Profile
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Only {NEXT_BADGE_AT - submissionCount} more records to your first badge
              </p>
            </div>
          </div>

          {/* Progress bar toward 10 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Progress to ✅ Verified Contributor
              </span>
              <span className="text-[10px] font-mono font-bold text-foreground">
                {submissionCount} / {NEXT_BADGE_AT}
              </span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">🌱 Contributor</span>
              <span className="text-[9px] text-muted-foreground">✅ Verified at 10</span>
            </div>
          </div>

          {/* Badge journey */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { emoji: "✅", label: "Verified", at: 10, color: "text-emerald-700" },
              { emoji: "🥈", label: "Trusted", at: 50, color: "text-slate-600" },
              { emoji: "💎", label: "Senior", at: 100, color: "text-cyan-700" },
            ].map((b) => (
              <div key={b.at} className="border border-border p-2 text-center bg-muted/30">
                <div className="text-xl mb-0.5">{b.emoji}</div>
                <div className={`text-[9px] font-bold uppercase tracking-wide ${b.color}`}>{b.label}</div>
                <div className="text-[9px] text-muted-foreground">{b.at}+ records</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            Creating a profile lets you track your contributions, earn badges as you grow, and appear on the
            community leaderboard. <strong className="text-foreground">Your privacy is yours</strong> — choose exactly what to show publicly.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setStep("form")}
              className="w-full bg-primary text-primary-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
            >
              Create My Profile →
            </button>
            <button
              onClick={onDismiss}
              className="w-full border border-border py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors tracking-wider uppercase"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
