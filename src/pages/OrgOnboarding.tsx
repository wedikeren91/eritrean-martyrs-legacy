import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";

const PLANS = [
  {
    id: "community",
    name: "Community",
    price: "Free",
    desc: "For small diaspora groups and families preserving local memory.",
    features: ["Up to 500 records", "Contributor accounts", "Public archive page", "Admin review queue"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "$49/mo",
    desc: "For national organizations and established memorial projects.",
    features: ["Unlimited records", "Custom subdomain", "Bulk CSV upload", "Priority review", "Analytics"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    desc: "For governments, universities, and large-scale archival institutions.",
    features: ["White-label branding", "Custom domain", "API access", "Dedicated support", "Data export"],
  },
];

export default function OrgOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"plans" | "form" | "done">("plans");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    org_name: "",
    display_name: "",
    country: "",
    contact_email: "",
    description: "",
    archive_focus: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    setSaving(true);

    // Create the organization record
    const { data: org, error } = await supabase
      .from("organizations")
      .insert({
        name: form.org_name,
        display_name: form.display_name || form.org_name,
        country: form.country || null,
        subscription_plan: selectedPlan,
        subscription_status: "pending",
      })
      .select()
      .single();

    if (!error && org) {
      // Link the user to the org
      await supabase
        .from("profiles")
        .update({ organization_id: org.id })
        .eq("id", user.id);

      // Promote user to org_admin
      await supabase
        .from("user_roles")
        .update({ role: "org_admin" })
        .eq("user_id", user.id);

      setStep("done");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background grain-overlay">
      <SiteHeader />

      {/* Header */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-12">
          <div className="data-label mb-4" style={{ color: "hsl(var(--oxblood-bright))" }}>
            Martyrs Archive · SaaS Platform
          </div>
          <h1 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            Build Your Own<br />
            <em style={{ fontStyle: "italic", color: "hsl(var(--oxblood-bright))" }}>National Archive</em>
          </h1>
          <div className="rule-accent mb-5" />
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            The same platform that powers the Eritrean Martyrs Archive — now available for any nation, 
            organization, or diaspora community that wants to preserve the memory of their own heroes.
          </p>

          {/* Steps indicator */}
          <div className="mt-8 flex items-center gap-3 text-xs font-mono tracking-widest uppercase">
            {["plans", "form", "done"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold transition-colors ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : ["plans","form","done"].indexOf(step) > i
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={step === s ? "text-foreground" : "text-muted-foreground"}>
                  {s === "plans" ? "Choose Plan" : s === "form" ? "Register Org" : "Confirmed"}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">

        {/* ── Step 1: Plans ── */}
        {step === "plans" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative cursor-pointer border p-6 transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-foreground/30"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase px-3 py-1">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{plan.name}</div>
                      <div className="text-2xl font-bold mt-1" style={{ color: "hsl(var(--oxblood-bright))" }}>{plan.price}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                      selectedPlan === plan.id ? "border-primary bg-primary" : "border-border"
                    }`}>
                      {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{plan.desc}</p>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                        <span style={{ color: "hsl(var(--oxblood-bright))" }}>✦</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* What you get */}
            <div className="border border-border bg-card p-8 mb-8">
              <div className="data-label mb-4">What Every Organization Gets</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: "🌍", title: "Custom Archive", desc: "Your own branded archive for your nation or community's martyrs and heroes." },
                  { icon: "🔒", title: "Full Ownership", desc: "You own your data. We provide the platform infrastructure and you control the content." },
                  { icon: "👥", title: "Contributor System", desc: "Invite family members and researchers to contribute records with built-in review flow." },
                  { icon: "🏛️", title: "Admin Controls", desc: "Approve, reject, edit, and manage all records with a powerful admin dashboard." },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>{item.title}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (!user) { navigate("/auth"); return; }
                  setStep("form");
                }}
                className="bg-primary text-primary-foreground px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors"
              >
                Continue with {PLANS.find(p => p.id === selectedPlan)?.name} →
              </button>
              <Link to="/" className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
                ← Return Home
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 2: Form ── */}
        {step === "form" && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Register Your Organization</h2>
              <p className="text-sm text-muted-foreground">
                Selected plan: <span className="font-semibold text-foreground">{PLANS.find(p => p.id === selectedPlan)?.name}</span>
                <button onClick={() => setStep("plans")} className="ml-3 text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground">change</button>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="data-label block mb-1.5">Organization Name *</label>
                  <input
                    required
                    value={form.org_name}
                    onChange={e => setForm(p => ({ ...p, org_name: e.target.value }))}
                    placeholder="e.g. Ethiopian Veterans Archive"
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="data-label block mb-1.5">Display Name</label>
                  <input
                    value={form.display_name}
                    onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                    placeholder="Short public name (optional)"
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="data-label block mb-1.5">Country / Region *</label>
                  <input
                    required
                    value={form.country}
                    onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="e.g. Ethiopia, Tigray, Somalia…"
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="data-label block mb-1.5">Contact Email *</label>
                  <input
                    required
                    type="email"
                    value={form.contact_email}
                    onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                    placeholder="admin@yourorg.com"
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="data-label block mb-1.5">Archive Focus</label>
                <input
                  value={form.archive_focus}
                  onChange={e => setForm(p => ({ ...p, archive_focus: e.target.value }))}
                  placeholder="e.g. Ethiopian Liberation Front veterans, Tigray Defence Forces, 1998 border war…"
                  className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              <div>
                <label className="data-label block mb-1.5">Brief Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Tell us about your organization and the memory you want to preserve…"
                  className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Registering…" : "Register Organization →"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("plans")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                >
                  ← Back
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="max-w-xl text-center mx-auto py-16">
            <div className="text-5xl mb-6">✦</div>
            <h2 className="text-3xl mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Organization Registered
            </h2>
            <div className="rule-accent mx-auto mb-6" />
            <p className="text-muted-foreground leading-relaxed mb-8">
              Your organization has been registered and is under review. 
              We'll contact you within 48 hours to activate your archive and discuss setup.
              You have been granted admin access to start configuring your archive.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/admin"
                className="bg-primary text-primary-foreground px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors"
              >
                Go to Admin Dashboard →
              </Link>
              <Link
                to="/"
                className="border border-border px-8 py-3 text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Martyrs Archive Platform · Est. 2025</p>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-1">
            ← Return Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
