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
  profiles?: { display_name: string | null; country: string | null } | null;
};

type Tab = "new_records" | "edit_suggestions";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 uppercase border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function SourcePill({ source }: { source: string }) {
  const isEdit = source === "edit_suggestion";
  return (
    <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 uppercase border ${
      isEdit ? "bg-purple-100 text-purple-800 border-purple-200"
              : source === "bulk_upload" ? "bg-blue-100 text-blue-800 border-blue-200"
              : "bg-amber-100 text-amber-800 border-amber-200"
    }`}>
      {isEdit ? "Edit" : source === "bulk_upload" ? "Bulk" : "Form"}
    </span>
  );
}

export default function ModeratorDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("new_records");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [editSuggestions, setEditSuggestions] = useState<Contribution[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin, navigate]);

  const fetchAll = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from("contributions")
      .select("*, profiles!contributions_user_id_fkey(display_name, country)")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });

    const all = (data as unknown as Contribution[]) ?? [];
    setContributions(all.filter((c) => c.source_type !== "edit_suggestion"));
    setEditSuggestions(all.filter((c) => c.source_type === "edit_suggestion"));
    setLoadingData(false);
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const approve = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.rpc("approve_contribution", {
      _contribution_id: id,
    });
    if (!error) {
      setContributions((p) => p.filter((c) => c.id !== id));
      setEditSuggestions((p) => p.filter((c) => c.id !== id));
      setExpanded(null);
    }
    setActionLoading(null);
  };

  const reject = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.rpc("reject_contribution", {
      _contribution_id: id, _reason: rejectReason[id] || null,
    });
    if (!error) {
      setContributions((p) => p.filter((c) => c.id !== id));
      setEditSuggestions((p) => p.filter((c) => c.id !== id));
      setRejectOpen(null);
      setExpanded(null);
    }
    setActionLoading(null);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="data-label animate-pulse">Loading…</div>
    </div>
  );
  if (!isAdmin) return null;

  const activeList = tab === "new_records" ? contributions : editSuggestions;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground p-1 -ml-1 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </Link>
            <div>
              <div className="data-label" style={{ color: "hsl(var(--oxblood-bright))" }}>Moderator Dashboard</div>
              <div className="text-[10px] text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} disabled={loadingData}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <svg className={loadingData ? "animate-spin" : ""} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
            <Link to="/admin"
              className="text-xs font-semibold tracking-widest uppercase border border-border px-3 py-1.5 hover:bg-muted transition-colors">
              Admin →
            </Link>
          </div>
        </div>

        {/* Stat bar */}
        <div className="container mx-auto px-4 pb-3 grid grid-cols-2 gap-3">
          <button onClick={() => setTab("new_records")}
            className={`border p-3 text-left transition-colors ${tab === "new_records" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
            <div className="text-2xl font-mono font-bold">{contributions.length}</div>
            <div className="text-[10px] data-label text-muted-foreground">New Records Pending</div>
          </button>
          <button onClick={() => setTab("edit_suggestions")}
            className={`border p-3 text-left transition-colors ${tab === "edit_suggestions" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
            <div className="text-2xl font-mono font-bold">{editSuggestions.length}</div>
            <div className="text-[10px] data-label text-muted-foreground">Edit Suggestions Pending</div>
          </button>
        </div>

        {/* Tab pills */}
        <div className="container mx-auto px-4 pb-0 flex gap-1 border-t border-border">
          {(["new_records", "edit_suggestions"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase border-b-2 -mb-px transition-colors ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "new_records" ? "New Records" : "Edit Suggestions"}
            </button>
          ))}
        </div>
      </div>

      {/* Queue */}
      <div className="container mx-auto px-4 py-4 max-w-3xl pb-24 space-y-3">
        {loadingData && [1,2,3].map((i) => (
          <div key={i} className="border border-border bg-card h-20 animate-pulse" />
        ))}

        {!loadingData && activeList.length === 0 && (
          <div className="border border-border bg-card p-12 text-center mt-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm text-muted-foreground">
              {tab === "new_records" ? "No new record submissions pending." : "No edit suggestions pending."}
            </p>
          </div>
        )}

        {activeList.map((c) => {
          const pd = c.person_data;
          const isExp = expanded === c.id;
          const isLoading = actionLoading === c.id;
          const isEditSugg = c.source_type === "edit_suggestion";

          return (
            <div key={c.id} className="border border-border bg-card overflow-hidden">
              {/* Header row */}
              <button
                className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 active:bg-muted/50 transition-colors"
                onClick={() => setExpanded(isExp ? null : c.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SourcePill source={c.source_type} />
                    <span className="text-sm font-semibold truncate" style={{ fontFamily: "'Fraunces', serif" }}>
                      {isEditSugg
                        ? (pd.record_identifier || "Unknown Profile")
                        : `${pd.first_name ?? ""} ${pd.last_name ?? ""}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    {isEditSugg && pd.field_to_edit && (
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{pd.field_to_edit}</span>
                    )}
                    {!isEditSugg && pd.category && <span className="font-mono uppercase">{pd.category}</span>}
                    <span>{new Date(c.submitted_at).toLocaleDateString()}</span>
                    {c.profiles?.display_name && <span>· {c.profiles.display_name}</span>}
                    {c.profiles?.country && <span>· {c.profiles.country}</span>}
                  </div>
                </div>
                <svg className={`flex-shrink-0 mt-1 transition-transform text-muted-foreground ${isExp ? "rotate-180" : ""}`}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Expanded */}
              {isExp && (
                <div className="border-t border-border">
                  {isEditSugg ? (
                    /* Edit suggestion details */
                    <div className="px-4 py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="data-label mb-0.5">Profile</div>
                          <div className="text-xs text-foreground">{pd.record_identifier || "—"}</div>
                        </div>
                        <div>
                          <div className="data-label mb-0.5">Field</div>
                          <div className="text-xs text-foreground font-semibold">{pd.field_to_edit || "—"}</div>
                        </div>
                        <div>
                          <div className="data-label mb-0.5">Current Value</div>
                          <div className="text-xs text-muted-foreground">{pd.current_value || "—"}</div>
                        </div>
                        <div>
                          <div className="data-label mb-0.5">Suggested Value</div>
                          <div className="text-xs text-emerald-700 font-medium">{pd.suggested_value || "—"}</div>
                        </div>
                      </div>
                      {pd.reason && (
                        <div>
                          <div className="data-label mb-0.5">Reason / Evidence</div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pd.reason}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* New record details */
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {[
                          ["Category", pd.category],
                          ["Role / Rank", [pd.role, pd.rank].filter(Boolean).join(" · ")],
                          ["Date of Birth", pd.date_of_birth],
                          ["Date of Death", pd.date_of_death],
                          ["City", pd.city],
                          ["Region", pd.region],
                          ["Battle", pd.battle],
                          ["Known As", pd.known_as],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <div key={label}>
                            <div className="data-label mb-0.5">{label}</div>
                            <div className="text-xs text-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                      {pd.bio && (
                        <div className="mb-2">
                          <div className="data-label mb-1">Biography</div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{pd.bio}</p>
                        </div>
                      )}
                      {pd.significance && (
                        <div>
                          <div className="data-label mb-1">Significance</div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{pd.significance}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reject reason */}
                  {rejectOpen === c.id && (
                    <div className="px-4 pb-3 border-t border-border pt-3">
                      <div className="data-label mb-1.5">Rejection Reason (optional)</div>
                      <textarea
                        value={rejectReason[c.id] ?? ""}
                        onChange={(e) => setRejectReason((p) => ({ ...p, [c.id]: e.target.value }))}
                        placeholder="Explain why this is being rejected…"
                        rows={2}
                        className="w-full bg-background border border-border px-3 py-2 text-xs resize-none focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
                    {rejectOpen === c.id ? (
                      <>
                        <button onClick={() => setRejectOpen(null)} disabled={isLoading}
                          className="col-span-1 py-4 text-xs font-semibold tracking-wider uppercase text-muted-foreground hover:bg-muted transition-colors">
                          Cancel
                        </button>
                        <button onClick={() => reject(c.id)} disabled={isLoading}
                          className="col-span-2 py-4 text-xs font-semibold tracking-wider uppercase bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50">
                          {isLoading ? "…" : "Confirm Reject"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setRejectOpen(c.id)} disabled={isLoading}
                          className="py-4 text-xs font-semibold tracking-wider uppercase text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                          ✕ Reject
                        </button>
                        {!isEditSugg && (
                          <Link to={`/admin/edit/${pd.slug || ""}`}
                            className="py-4 text-xs font-semibold tracking-wider uppercase text-foreground hover:bg-muted transition-colors text-center">
                            ✎ Edit
                          </Link>
                        )}
                        <button onClick={() => approve(c.id)} disabled={isLoading}
                          className={`py-4 text-xs font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50 ${isEditSugg ? "col-span-2" : ""}`}>
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
  );
}
