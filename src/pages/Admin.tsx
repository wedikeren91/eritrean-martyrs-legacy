import { useState, useEffect, useCallback } from "react";
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

type Tab = "queue" | "records" | "users" | "orgs";

export default function Admin() {
  const { user, isAdmin, isFounder, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("queue");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  const fetchContributions = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from("contributions")
      .select("*, profiles!contributions_user_id_fkey(display_name, country)")
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
    if (!error) setContributions((prev) => prev.filter((c) => c.id !== id));
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
    }
    setActionLoading(null);
  };

  if (loading) return <div className="min-h-screen bg-background grain-overlay flex items-center justify-center"><div className="data-label animate-pulse">Loading…</div></div>;
  if (!isAdmin) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "queue", label: "Review Queue" },
    ...(isFounder ? [
      { key: "records" as Tab, label: "All Records" },
      { key: "users" as Tab, label: "Users" },
      { key: "orgs" as Tab, label: "Organizations" },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background grain-overlay w-full max-w-full overflow-x-hidden">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-4">
          <Link to="/" className="data-label text-muted-foreground hover:text-foreground transition-colors shrink-0">← Archive</Link>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="data-label text-primary truncate">{isFounder ? "Founder Dashboard" : "Admin Dashboard"}</div>
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[140px] hidden sm:block">{user?.email}</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Mobile review queue shortcut */}
        <div className="mb-6 p-4 border border-border bg-card flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="data-label mb-0.5">Mobile Review</div>
            <p className="text-xs text-muted-foreground">Optimised for phone-based approvals</p>
          </div>
          <a
            href="/admin/review"
            className="flex-shrink-0 bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
          >
            Open →
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Review Queue ── */}
        {tab === "queue" && (
          <div>
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
                Pending Contributions
              </h1>
              <span className="data-label text-muted-foreground">{contributions.length} awaiting review</span>
            </div>

            {loadingData && <div className="data-label animate-pulse text-muted-foreground">Loading queue…</div>}

            {!loadingData && contributions.length === 0 && (
              <div className="border border-border bg-card p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-sm text-muted-foreground">No pending contributions. Queue is clear.</p>
              </div>
            )}

            <div className="space-y-4">
              {contributions.map((c) => {
                const pd = c.person_data;
                return (
                  <div key={c.id} className="bg-card border border-border">
                    {/* Card header */}
                    <div className="border-b border-border px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 uppercase shrink-0 ${
                          c.source_type === "bulk_upload"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {c.source_type === "bulk_upload" ? "Bulk" : "Form"}
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate">
                          {pd.first_name} {pd.last_name}
                        </span>
                        {pd.known_as && <span className="text-xs text-muted-foreground truncate">"{pd.known_as}"</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {new Date(c.submitted_at).toLocaleDateString()}
                        {c.profiles?.display_name && ` · ${c.profiles.display_name}`}
                      </span>
                    </div>

                    {/* Data grid */}
                    <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ["Category", pd.category],
                        ["Status", pd.status],
                        ["City", pd.city],
                        ["Region", pd.region],
                        ["Date of Birth", pd.date_of_birth],
                        ["Date of Death", pd.date_of_death],
                        ["Role / Rank", [pd.role, pd.rank].filter(Boolean).join(" · ")],
                        ["Battle", pd.battle],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label}>
                          <div className="data-label mb-0.5">{label}</div>
                          <div className="text-xs text-foreground">{value}</div>
                        </div>
                      ))}
                    </div>

                    {pd.bio && (
                      <div className="px-4 pb-4">
                        <div className="data-label mb-1">Bio</div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{pd.bio}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t border-border px-4 py-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => approve(c.id)}
                        disabled={actionLoading === c.id}
                        className="bg-emerald-700 text-white px-6 py-2 text-xs font-semibold tracking-wider uppercase hover:bg-emerald-800 transition-colors disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>

                      {rejectOpen === c.id ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
                          <input
                            value={rejectReason[c.id] ?? ""}
                            onChange={(e) => setRejectReason((p) => ({ ...p, [c.id]: e.target.value }))}
                            placeholder="Reason (optional)…"
                            className="flex-1 min-w-0 bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors"
                          />
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => reject(c.id)} disabled={actionLoading === c.id}
                              className="bg-destructive text-destructive-foreground px-4 py-1.5 text-xs font-semibold tracking-wider uppercase hover:bg-destructive/90 transition-colors disabled:opacity-50">
                              Confirm Reject
                            </button>
                            <button onClick={() => setRejectOpen(null)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setRejectOpen(c.id)}
                          className="border border-destructive/50 text-destructive px-6 py-2 text-xs font-semibold tracking-wider uppercase hover:bg-destructive/10 transition-colors">
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Records Panel (Founder) ── */}
        {tab === "records" && isFounder && <RecordsPanel />}

        {/* ── Users (Founder only) ── */}
        {tab === "users" && isFounder && <UsersPanel />}

        {/* ── Organizations (Founder only) ── */}
        {tab === "orgs" && isFounder && <OrgsPanel />}
      </div>
    </div>
  );
}

// ── Users Panel ───────────────────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState<{
    id: string; display_name: string | null; country: string | null;
    user_roles: { role: string }[];
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, country")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch roles separately to avoid join issues
    const profileIds = (data ?? []).map((p) => p.id);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", profileIds);

    const roleMap = Object.fromEntries((roleData ?? []).map((r) => [r.user_id, r.role]));
    setUsers(
      (data ?? []).map((p) => ({
        ...p,
        user_roles: [{ role: roleMap[p.id] ?? "user" }],
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId: string, newRole: string) => {
    setRoleUpdating(userId);
    await supabase.from("user_roles").update({ role: newRole as "user" | "contributor" | "org_admin" | "founder" }).eq("user_id", userId);
    await fetchUsers();
    setRoleUpdating(null);
  };

  if (loading) return <div className="data-label animate-pulse text-muted-foreground">Loading users…</div>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl mb-6" style={{ fontFamily: "'Fraunces', serif" }}>User Management</h1>
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left data-label">Name</th>
              <th className="px-4 py-3 text-left data-label">Country</th>
              <th className="px-4 py-3 text-left data-label">Role</th>
              <th className="px-4 py-3 text-left data-label">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = u.user_roles?.[0]?.role ?? "user";
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{u.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono uppercase text-[10px] tracking-wider">{role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={role}
                      disabled={roleUpdating === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground"
                    >
                      <option value="user">User</option>
                      <option value="contributor">Contributor</option>
                      <option value="org_admin">Org Admin</option>
                      <option value="founder">Founder</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Organizations Panel ───────────────────────────────────────────────────────
function OrgsPanel() {
  const [orgs, setOrgs] = useState<{
    id: string; name: string; country: string | null;
    subscription_plan: string | null; subscription_status: string | null; created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", country: "" });
  const [saving, setSaving] = useState(false);

  const fetchOrgs = async () => {
    const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    setOrgs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOrgs(); }, []);

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("organizations").insert({ name: newOrg.name, country: newOrg.country || null });
    setNewOrg({ name: "", country: "" });
    setCreating(false);
    await fetchOrgs();
    setSaving(false);
  };

  if (loading) return <div className="data-label animate-pulse text-muted-foreground">Loading organizations…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>Organizations</h1>
        <button onClick={() => setCreating(!creating)}
          className="bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors">
          + New Organization
        </button>
      </div>

      {creating && (
        <form onSubmit={createOrg} className="bg-card border border-border p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="data-label block mb-1.5">Organization Name *</label>
            <input required value={newOrg.name} onChange={(e) => setNewOrg((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Eritrean Community Toronto"
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="data-label block mb-1.5">Country</label>
            <input value={newOrg.country} onChange={(e) => setNewOrg((p) => ({ ...p, country: e.target.value }))}
              placeholder="e.g. Canada"
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Create"}
            </button>
            <button type="button" onClick={() => setCreating(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left data-label">Name</th>
              <th className="px-4 py-3 text-left data-label">Country</th>
              <th className="px-4 py-3 text-left data-label">Plan</th>
              <th className="px-4 py-3 text-left data-label">Status</th>
              <th className="px-4 py-3 text-left data-label">Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.country ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{o.subscription_plan ?? "free"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                    o.subscription_status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {o.subscription_status ?? "trialing"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No organizations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Records Panel (Founder only) ──────────────────────────────────────────────
type PersonRow = {
  id: string; slug: string; first_name: string; last_name: string;
  category: string | null; status: string | null; date_of_death: string | null;
  deleted_at: string | null; submitted_by: string | null; approved_by: string | null;
  created_at: string;
};

function RecordsPanel() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, deleted: 0 });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("persons")
      .select("id,slug,first_name,last_name,category,status,date_of_death,deleted_at,submitted_by,approved_by,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (search.trim()) {
      const t = `%${search.trim()}%`;
      q = q.or(`first_name.ilike.${t},last_name.ilike.${t},slug.ilike.${t}`);
    }
    const { data } = await q;
    const all = (data as PersonRow[]) ?? [];
    setRecords(all);
    setStats({
      total: all.length,
      active: all.filter((r) => !r.deleted_at).length,
      deleted: all.filter((r) => r.deleted_at).length,
    });
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const softDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("persons").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setConfirmDelete(null);
    await fetchRecords();
    setDeleting(null);
  };

  const restore = async (id: string) => {
    setDeleting(id);
    await supabase.from("persons").update({ deleted_at: null }).eq("id", id);
    await fetchRecords();
    setDeleting(null);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Records", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Soft-deleted", value: stats.deleted },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">{s.value}</div>
            <div className="data-label text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>All Records</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name…"
          className="bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-48"
        />
      </div>

      {loading && <div className="data-label animate-pulse text-muted-foreground">Loading records…</div>}

      <div className="bg-card border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left data-label">Name</th>
              <th className="px-4 py-3 text-left data-label">Category</th>
              <th className="px-4 py-3 text-left data-label">Death Year</th>
              <th className="px-4 py-3 text-left data-label">Status</th>
              <th className="px-4 py-3 text-left data-label">Added</th>
              <th className="px-4 py-3 text-left data-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className={`border-t border-border ${r.deleted_at ? "opacity-40" : ""}`}>
                <td className="px-4 py-2.5">
                  <Link to={`/martyr/${r.slug}`} target="_blank"
                    className="font-medium hover:underline underline-offset-2">
                    {r.first_name} {r.last_name}
                  </Link>
                  {r.deleted_at && <span className="ml-2 text-[9px] text-destructive uppercase font-bold tracking-wider">Deleted</span>}
                </td>
                <td className="px-4 py-2.5 font-mono uppercase text-[10px] text-muted-foreground">{r.category ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.date_of_death ? r.date_of_death.slice(0, 4) : "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground capitalize">{r.status ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/edit/${r.slug}`}
                      className="text-primary hover:underline underline-offset-2 font-medium">
                      Edit
                    </Link>
                    {r.deleted_at ? (
                      <button onClick={() => restore(r.id)} disabled={deleting === r.id}
                        className="text-emerald-700 hover:underline underline-offset-2 disabled:opacity-50">
                        Restore
                      </button>
                    ) : confirmDelete === r.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => softDelete(r.id)} disabled={deleting === r.id}
                          className="text-destructive font-semibold hover:underline disabled:opacity-50">
                          {deleting === r.id ? "…" : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="text-muted-foreground hover:text-foreground">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.id)}
                        className="text-destructive/70 hover:text-destructive hover:underline underline-offset-2">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
