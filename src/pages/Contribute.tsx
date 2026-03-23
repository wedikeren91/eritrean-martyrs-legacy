import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import ContributeForm from "@/components/ContributeForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ── Suggest-an-Edit form ──────────────────────────────────────────────────────
function SuggestEditForm({ onSuccess, prefillName }: { onSuccess: () => void; prefillName?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slugOrName, setSlugOrName] = useState(prefillName || "");
  const [field, setField] = useState("");
  const [current, setCurrent] = useState("");
  const [suggested, setSuggested] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/auth", { state: { from: { pathname: "/contribute", search: "?mode=edit" } } });
      return;
    }
    if (!slugOrName.trim() || !field.trim() || !suggested.trim()) {
      setError("Please fill in the required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const personData = {
      _type: "edit_suggestion",
      record_identifier: slugOrName.trim(),
      field_to_edit: field.trim(),
      current_value: current.trim() || "(unknown)",
      suggested_value: suggested.trim(),
      reason: reason.trim(),
    };

    const { error: insertError } = await supabase.from("contributions").insert({
      user_id: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      person_data: personData as any,
      source_type: "edit_suggestion",
      status: "pending",
    });

    setSubmitting(false);
    if (insertError) { setError(insertError.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Found a mistake or want to add missing information to an existing profile? Let us know — our team will review your suggestion.
      </p>

      <div>
        <label className="data-label block mb-1.5">
          Profile name or ID <span className="text-primary normal-case font-normal">*</span>
        </label>
        <input value={slugOrName} onChange={(e) => setSlugOrName(e.target.value)}
          className={inputCls} placeholder="e.g. 'Hamid Idris' or the profile URL slug" />
      </div>

      <div>
        <label className="data-label block mb-1.5">
          Field to correct <span className="text-primary normal-case font-normal">*</span>
        </label>
        <select value={field} onChange={(e) => setField(e.target.value)} className={inputCls}>
          <option value="">Select field…</option>
          {[
            "First Name", "Last Name", "Known As", "Date of Birth", "Date of Death",
            "Category", "Rank", "Role", "City", "Region", "Place of Martyrdom",
            "War / Conflict", "Biography", "Historical Significance", "Quote", "Photo",
            "Other",
          ].map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div>
        <label className="data-label block mb-1.5">Current value (if known)</label>
        <input value={current} onChange={(e) => setCurrent(e.target.value)}
          className={inputCls} placeholder="What it currently shows (leave blank if unknown)" />
      </div>

      <div>
        <label className="data-label block mb-1.5">
          Your correction / suggestion <span className="text-primary normal-case font-normal">*</span>
        </label>
        <textarea value={suggested} onChange={(e) => setSuggested(e.target.value)}
          rows={3} className={`${inputCls} resize-none`}
          placeholder="The correct information…" />
      </div>

      <div>
        <label className="data-label block mb-1.5">Why are you confident this is correct?</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          rows={2} className={`${inputCls} resize-none`}
          placeholder="e.g. I am a family member, I have a document, I was present…" />
      </div>

      {error && (
        <p className="text-xs text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2">{error}</p>
      )}

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-primary-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit Edit Suggestion →"}
      </button>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type Mode = "new" | "edit";

const Contribute = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Support ?mode=edit&name=... from profile page "Suggest Correction" link
  const initialMode = (searchParams.get("mode") as Mode) === "edit" ? "edit" : "new";
  const prefillName = searchParams.get("name") || "";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState<Mode>("new");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground animate-pulse">Loading…</div>
        </div>
      </div>
    );
  }

  // ── Not logged in + trying to submit a NEW record ─────────────────────────
  if (!user && mode === "new") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-semibold mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
            Sign in to Submit a Record
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            You need an account to submit new records. It only takes a moment — your contributions
            will be credited to your profile and help build this living archive.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/auth" state={{ from: { pathname: "/contribute" } }}
              className="block w-full bg-primary text-primary-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors text-center">
              Sign In / Create Account →
            </Link>
            <button
              onClick={() => setMode("edit")}
              className="block w-full border border-border text-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-muted transition-colors text-center">
              ✏️ Suggest a Correction Instead
            </button>
            <Link to="/"
              className="block w-full border border-border text-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-muted transition-colors text-center">
              ← Browse the Archive
            </Link>
          </div>

          {/* Why contribute */}
          <div className="mt-12 border-t border-border pt-8 text-left space-y-4">
            <h2 className="text-sm font-semibold text-foreground mb-4">Why contribute?</h2>
            {[
              { icon: "🌹", title: "Preserve history", body: "Every name you add ensures a fighter or civilian is never forgotten." },
              { icon: "🏅", title: "Earn recognition", body: "Contributors earn badges and are listed in the Archive Builders hall of fame." },
              { icon: "✏️", title: "Fix mistakes", body: "Suggest corrections to names, dates, photos, and biographies." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="text-5xl mb-6">{submittedType === "new" ? "🌹" : "✏️"}</div>
          <h1 className="text-2xl font-semibold mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
            {submittedType === "new" ? "Thank you for your submission." : "Edit suggestion received."}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            {submittedType === "new"
              ? "Your record has been received and is now pending review. Our team will review it within 5–10 business days. Once approved it will appear in the archive."
              : "Your edit suggestion has been queued for review. A moderator will compare your suggestion against the existing record and apply it if verified."}
          </p>
          <div
            className="my-8 mx-auto max-w-xs border border-border bg-card p-4 text-left"
          >
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm font-semibold text-foreground">Pending Review</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setMode("new"); }}
              className="border border-border text-foreground px-6 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-muted transition-colors"
            >
              + Submit Another Record
            </button>
            <button
              onClick={() => { setSubmitted(false); setMode("edit"); }}
              className="border border-border text-foreground px-6 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-muted transition-colors"
            >
              ✏️ Suggest Another Edit
            </button>
            <Link to="/"
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors text-center"
            >
              ← Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main contribute UI ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Page header */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="data-label mb-2" style={{ color: "hsl(var(--oxblood-bright))", letterSpacing: "0.2em" }}>
            Community Archive
          </div>
          <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            Contribute to the Archive
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Help us build the most complete record of Eritrea's fallen. Submit a new profile, or suggest a correction to an existing one.
          </p>

          {/* Mode switcher */}
          <div className="flex gap-0 border border-border overflow-hidden w-fit">
            <button
              onClick={() => setMode("new")}
              className="px-5 py-2.5 text-xs font-semibold tracking-widest uppercase transition-colors"
              style={mode === "new"
                ? { background: "hsl(var(--oxblood))", color: "hsl(35 25% 97%)" }
                : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
              }
            >
              + New Record
            </button>
            <button
              onClick={() => setMode("edit")}
              className="px-5 py-2.5 text-xs font-semibold tracking-widest uppercase transition-colors"
              style={mode === "edit"
                ? { background: "hsl(var(--oxblood))", color: "hsl(35 25% 97%)" }
                : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
              }
            >
              ✏️ Suggest Edit
            </button>
          </div>
        </div>
      </section>

      {/* Form area */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {mode === "new" ? (
          <ContributeForm
            onCancel={() => navigate(-1)}
            onSuccess={() => { setSubmittedType("new"); setSubmitted(true); }}
          />
        ) : (
          <div className="py-2">
            <SuggestEditForm
              prefillName={prefillName}
              onSuccess={() => { setSubmittedType("edit"); setSubmitted(true); }}
            />
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="container mx-auto px-4 pb-12 max-w-2xl">
        <div className="border-t border-border pt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: "🔍", title: "Every record reviewed", body: "A moderator checks each submission for accuracy before it goes live." },
            { icon: "🔒", title: "Your identity is safe", body: "Your personal details are never shared publicly without your consent." },
            { icon: "🏅", title: "Earn recognition", body: "Build your contributor reputation and earn archive badges over time." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">{item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contribute;
