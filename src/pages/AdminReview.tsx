import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Contribution = {
  id: string;
  submitted_at: string;
  status: string;
  source_type: string;
  rejection_reason: string | null;
  person_data: Record<string, string>;
  profiles?: { display_name: string | null } | null;
};

export default function AdminReview() {
  const { user, isAdmin, isFounder, loading } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  const fetchContributions = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from("contributions")
      .select("*, profiles!contributions_user_id_fkey(display_name)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });
    setContributions((data as unknown as Contribution[]) ?? []);
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) fetchContributions();
  }, [isAdmin]);

  const approve = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.rpc("approve_contribution", {
      _contribution_id: id,
    });
    if (!error) {
      setContributions((prev) => prev.filter((c) => c.id !== id));
      setExpanded(null);
    }
    setActionLoading(null);
  };

  const reject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.rpc("reject_contribution", {
      _contribution_id: id,
      _reason: rejectReason[id] || null,
    });
    if (!error) {
      setContributions((prev) => prev.filter((c) => c.id !== id));
      setRejectOpen(null);
      setExpanded(null);
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="data-label animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Link>
            <div>
              <div className="data-label text-primary">Review Queue</div>
              <div className="text-[10px] text-muted-foreground">{contributions.length} pending</div>
            </div>
          </div>
          <button
            onClick={fetchContributions}
            disabled={loadingData}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            {loadingData ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto pb-24">
        {/* Empty state */}
        {!loadingData && contributions.length === 0 && (
          <div className="border border-border bg-card p-12 text-center mt-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm text-muted-foreground">Queue is clear. No pending contributions.</p>
          </div>
        )}

        {loadingData && (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border bg-card h-24 animate-pulse" />
            ))}
          </div>
        )}

        {/* Contribution cards */}
        <div className="space-y-3 mt-2">
          {contributions.map((c) => {
            const pd = c.person_data;
            const isExp = expanded === c.id;
            const isLoading = actionLoading === c.id;

            return (
              <div key={c.id} className="border border-border bg-card overflow-hidden">
                {/* Tap to expand header */}
                <button
                  className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 active:bg-muted/50 transition-colors"
                  onClick={() => setExpanded(isExp ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 uppercase flex-shrink-0 ${
                        c.source_type === "bulk_upload"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : c.source_type === "correction"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {c.source_type === "bulk_upload" ? "Bulk" : c.source_type === "correction" ? "✏️ Correction" : "New Record"}
                      </span>
                      <span className="text-sm font-semibold truncate" style={{ fontFamily: "'Fraunces', serif" }}>
                        {pd.first_name} {pd.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      {pd.category && <span className="font-mono uppercase">{pd.category}</span>}
                      {pd.category && <span>·</span>}
                      <span>{new Date(c.submitted_at).toLocaleDateString()}</span>
                      {c.profiles?.display_name && (
                        <>
                          <span>·</span>
                          <span className="truncate">{c.profiles.display_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`flex-shrink-0 mt-1 transition-transform duration-200 text-muted-foreground ${isExp ? "rotate-180" : ""}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExp && (
                  <div className="border-t border-border">
                    {/* Data grid */}
                    <div className="px-4 py-3 grid grid-cols-2 gap-3">
                      {[
                        ["Status", pd.status],
                        ["City", pd.city],
                        ["Region", pd.region],
                        ["Date of Birth", pd.date_of_birth],
                        ["Date of Death", pd.date_of_death],
                        ["Role / Rank", [pd.role, pd.rank].filter(Boolean).join(" · ")],
                        ["Battle", pd.battle],
                        ["Known As", pd.known_as],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label}>
                          <div className="data-label mb-0.5">{label}</div>
                          <div className="text-xs text-foreground">{value}</div>
                        </div>
                      ))}
                    </div>

                    {pd._correction_note && (
                      <div className="px-4 pb-3 bg-primary/5 border-b border-primary/20">
                        <div className="data-label mb-1 text-primary">Reviewer Note</div>
                        <p className="text-xs leading-relaxed">{pd._correction_note}</p>
                        {pd._original_slug && (
                          <a
                            href={`/martyr/${pd._original_slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary underline mt-1 inline-block"
                          >
                            View original record →
                          </a>
                        )}
                      </div>
                    )}

                    {pd.bio && (
                      <div className="px-4 pb-3">
                        <div className="data-label mb-1">Bio</div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{pd.bio}</p>
                      </div>
                    )}

                    {pd.significance && (
                      <div className="px-4 pb-3">
                        <div className="data-label mb-1">Significance</div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{pd.significance}</p>
                      </div>
                    )}

                    {/* Reject reason input */}
                    {rejectOpen === c.id && (
                      <div className="px-4 pb-3">
                        <div className="data-label mb-1.5">Rejection Reason (optional)</div>
                        <textarea
                          value={rejectReason[c.id] ?? ""}
                          onChange={(e) => setRejectReason((p) => ({ ...p, [c.id]: e.target.value }))}
                          placeholder="Enter reason for rejection…"
                          rows={3}
                          className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors resize-none"
                        />
                      </div>
                    )}

                    {/* Action buttons — large touch targets */}
                    <div className="border-t border-border grid grid-cols-2 divide-x divide-border">
                      {rejectOpen === c.id ? (
                        <>
                          <button
                            onClick={() => setRejectOpen(null)}
                            disabled={isLoading}
                            className="py-4 text-xs font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => reject(c.id)}
                            disabled={isLoading}
                            className="py-4 text-xs font-semibold tracking-wider uppercase bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors active:bg-destructive/30 disabled:opacity-50"
                          >
                            {isLoading ? "…" : "Confirm Reject"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setRejectOpen(c.id)}
                            disabled={isLoading}
                            className="py-4 text-xs font-semibold tracking-wider uppercase text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/20 disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => approve(c.id)}
                            disabled={isLoading}
                            className="py-4 text-xs font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors active:bg-emerald-200 disabled:opacity-50"
                          >
                            {isLoading ? "…" : "✓ Approve"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop link back */}
      {isFounder && (
        <div className="fixed bottom-6 right-6">
          <Link
            to="/admin"
            className="bg-card border border-border px-4 py-2 text-xs data-label shadow-lg hover:border-foreground transition-colors"
          >
            Full Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}
