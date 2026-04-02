import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MartyrImportModal, { exportProfiles } from "@/components/MartyrBatchActions";

type DeputyPermission = "approve_profile" | "modify_profile" | "delete_profile";

type Contribution = {
  id: string;
  submitted_at: string;
  status: string;
  source_type: string;
  rejection_reason: string | null;
  person_data: Record<string, string>;
  profiles?: { display_name: string | null; country: string | null } | null;
};

type Tab = "queue" | "records" | "martyrs" | "orgs";

export default function Admin() {
  const { user, isAdmin, isFounder, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("queue");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [deputyPerms, setDeputyPerms] = useState<DeputyPermission[]>([]);

  const isDeputy = isAdmin && !isFounder;

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  // Load the current deputy admin's permissions from their profile
  useEffect(() => {
    if (!user || !isDeputy) return;
    supabase
      .from("profiles")
      .select("permissions")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.permissions) {
          setDeputyPerms(data.permissions as DeputyPermission[]);
        }
      });
  }, [user, isDeputy]);

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
    const { error } = await supabase.rpc("approve_contribution", { _contribution_id: id });
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

  if (loading)
    return (
      <div className="min-h-screen bg-background grain-overlay flex items-center justify-center">
        <div className="data-label animate-pulse">Loading…</div>
      </div>
    );
  if (!isAdmin) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "queue", label: "Review Queue" },
    { key: "records", label: "Records" },
    { key: "martyrs", label: "Martyr Profiles" },
    ...(isFounder ? [{ key: "orgs" as Tab, label: "Organizations" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background grain-overlay w-full max-w-full overflow-x-hidden">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="data-label text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              ← Archive
            </Link>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="data-label text-primary truncate">
              {isFounder ? "Founder Dashboard" : "Admin Dashboard"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isFounder && (
              <Link
                to="/admin/analytics"
                className="text-xs font-semibold tracking-wider uppercase border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              >
                📊 Analytics
              </Link>
            )}
            {isFounder && (
              <Link
                to="/admin/users"
                className="text-xs font-semibold tracking-wider uppercase border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              >
                👥 Users
              </Link>
            )}
            <div className="text-xs text-muted-foreground truncate max-w-[140px] hidden sm:block">
              {user?.email}
            </div>
          </div>
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
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
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
              <span className="data-label text-muted-foreground">
                {contributions.length} awaiting review
              </span>
            </div>

            {loadingData && (
              <div className="data-label animate-pulse text-muted-foreground">Loading queue…</div>
            )}

            {!loadingData && contributions.length === 0 && (
              <div className="border border-border bg-card p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-sm text-muted-foreground">
                  No pending contributions. Queue is clear.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {contributions.map((c) => {
                const pd = c.person_data;
                return (
                  <div key={c.id} className="bg-card border border-border">
                    <div className="border-b border-border px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span
                          className={`text-[10px] font-bold tracking-wider px-2 py-0.5 uppercase shrink-0 ${
                            c.source_type === "bulk_upload"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {c.source_type === "bulk_upload" ? "Bulk" : "Form"}
                        </span>
                        <span className="text-sm font-semibold text-foreground truncate">
                          {pd.first_name} {pd.last_name}
                        </span>
                        {pd.known_as && (
                          <span className="text-xs text-muted-foreground truncate">
                            "{pd.known_as}"
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {new Date(c.submitted_at).toLocaleDateString()}
                        {c.profiles?.display_name && ` · ${c.profiles.display_name}`}
                      </span>
                    </div>

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
                      ]
                        .filter(([, v]) => v)
                        .map(([label, value]) => (
                          <div key={label}>
                            <div className="data-label mb-0.5">{label}</div>
                            <div className="text-xs text-foreground">{value}</div>
                          </div>
                        ))}
                    </div>

                    {pd.bio && (
                      <div className="px-4 pb-4">
                        <div className="data-label mb-1">Bio</div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {pd.bio}
                        </p>
                      </div>
                    )}

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
                            onChange={(e) =>
                              setRejectReason((p) => ({ ...p, [c.id]: e.target.value }))
                            }
                            placeholder="Reason (optional)…"
                            className="flex-1 min-w-0 bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors"
                          />
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => reject(c.id)}
                              disabled={actionLoading === c.id}
                              className="bg-destructive text-destructive-foreground px-4 py-1.5 text-xs font-semibold tracking-wider uppercase hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => setRejectOpen(null)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectOpen(c.id)}
                          className="border border-destructive/50 text-destructive px-6 py-2 text-xs font-semibold tracking-wider uppercase hover:bg-destructive/10 transition-colors"
                        >
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

        {/* ── Records Panel ── */}
        {tab === "records" && isAdmin && <RecordsPanel isFounder={isFounder} />}

        {/* ── Martyr Profiles Panel ── */}
        {tab === "martyrs" && isAdmin && (
          <MartyrProfilesPanel isFounder={isFounder} deputyPerms={deputyPerms} />
        )}

        {/* ── Organizations (Founder only) ── */}
        {tab === "orgs" && isFounder && <OrgsPanel />}
      </div>
    </div>
  );
}

// ── Martyr Profiles Panel ─────────────────────────────────────────────────────
type MartyrProfile = {
  id: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  gender: string;
  birth_date: string | null;
  death_date: string | null;
  birth_city: string | null;
  birth_province: string | null;
  profile_picture_url: string | null;
  life_story: string | null;
  verification_document_url: string | null;
  status: string;
  submitted_by: string | null;
  created_at: string;
};

type EditFields = Pick<
  MartyrProfile,
  | "first_name"
  | "last_name"
  | "affiliation"
  | "gender"
  | "birth_date"
  | "death_date"
  | "birth_city"
  | "birth_province"
  | "status"
>;

function MartyrProfilesPanel({
  isFounder,
  deputyPerms,
}: {
  isFounder: boolean;
  deputyPerms: DeputyPermission[];
}) {
  const canEdit    = isFounder || deputyPerms.includes("modify_profile");
  const canDelete  = isFounder || deputyPerms.includes("delete_profile");
  const canApprove = isFounder || deputyPerms.includes("approve_profile");
  const [profiles, setProfiles] = useState<MartyrProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAffiliation, setFilterAffiliation] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({
    first_name: "",
    last_name: "",
    affiliation: "ELF",
    gender: "Unknown",
    birth_date: null,
    death_date: null,
    birth_city: null,
    birth_province: null,
    status: "Pending",
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<MartyrProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import modal
  const [showImport, setShowImport] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("martyr_profiles" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (filterAffiliation !== "All") {
      q = (q as any).eq("affiliation", filterAffiliation);
    }
    if (filterStatus !== "All") {
      q = (q as any).eq("status", filterStatus);
    }

    const { data } = await (q as any);
    let results = (data as MartyrProfile[]) ?? [];

    if (search.trim()) {
      const term = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.first_name.toLowerCase().includes(term) ||
          p.last_name.toLowerCase().includes(term)
      );
    }

    setProfiles(results);
    setLoading(false);
  }, [search, filterAffiliation, filterStatus]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const startEdit = (p: MartyrProfile) => {
    setEditingId(p.id);
    setEditFields({
      first_name: p.first_name,
      last_name: p.last_name,
      affiliation: p.affiliation,
      gender: p.gender || "Unknown",
      birth_date: p.birth_date,
      death_date: p.death_date,
      birth_city: p.birth_city,
      birth_province: p.birth_province,
      status: p.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await (supabase.from("martyr_profiles" as never) as any).update({
      first_name: editFields.first_name,
      last_name: editFields.last_name,
      affiliation: editFields.affiliation,
      gender: editFields.gender,
      birth_date: editFields.birth_date || null,
      death_date: editFields.death_date || null,
      birth_city: editFields.birth_city || null,
      birth_province: editFields.birth_province || null,
      status: editFields.status,
    }).eq("id", id);

    if (error) {
      alert("Save failed: " + error.message);
    } else {
      setEditingId(null);
      await fetchProfiles();
    }
    setSaving(false);
  };

  const approveProfile = async (p: MartyrProfile) => {
    const { error } = await (supabase.from("martyr_profiles" as never) as any)
      .update({ status: "Approved" })
      .eq("id", p.id);
    if (error) alert("Approve failed: " + error.message);
    else await fetchProfiles();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await (supabase.from("martyr_profiles" as never) as any)
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      setDeleteTarget(null);
      await fetchProfiles();
    }
    setDeleting(false);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      Rejected: "bg-red-50 text-red-700 border border-red-200",
      Pending: "bg-amber-50 text-amber-700 border border-amber-200",
    };
    return map[s] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div>
      {/* Header + stats */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
          Martyr Profiles
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {isFounder && (
            <>
              <button
                onClick={() => exportProfiles(profiles)}
                disabled={profiles.length === 0}
                className="flex items-center gap-1.5 border border-border bg-background px-4 py-2 text-xs font-semibold tracking-wider uppercase hover:bg-muted transition-colors disabled:opacity-40"
              >
                <span>↓</span> Export Data
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold tracking-wider uppercase hover:bg-primary/90 transition-colors"
              >
                <span>↑</span> Import Data
              </button>
            </>
          )}
          <div className="text-xs text-muted-foreground font-mono">
            {profiles.length} record{profiles.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-56"
        />
        <select
          value={filterAffiliation}
          onChange={(e) => setFilterAffiliation(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="All">All Affiliations</option>
          <option value="ELF">ELF</option>
          <option value="EPLF">EPLF</option>
          <option value="Civilian">Civilian</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading && (
        <div className="data-label animate-pulse text-muted-foreground py-8">Loading profiles…</div>
      )}

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left data-label">Full Name</th>
              <th className="px-4 py-3 text-left data-label">Affiliation</th>
              <th className="px-4 py-3 text-left data-label">Gender</th>
              <th className="px-4 py-3 text-left data-label">Birth Date</th>
              <th className="px-4 py-3 text-left data-label">Death Date</th>
              <th className="px-4 py-3 text-left data-label">Birth City</th>
              <th className="px-4 py-3 text-left data-label">Birth Province</th>
              <th className="px-4 py-3 text-left data-label">Status</th>
              <th className="px-4 py-3 text-left data-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) =>
              editingId === p.id ? (
                // ── Inline Edit Row ──────────────────────────────────────────
                <tr key={p.id} className="border-t border-border bg-muted/30">
                  <td className="px-2 py-2" colSpan={2}>
                    <div className="flex gap-1">
                      <input
                        value={editFields.first_name}
                        onChange={(e) =>
                          setEditFields((f) => ({ ...f, first_name: e.target.value }))
                        }
                        placeholder="First name"
                        className="w-24 bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground"
                      />
                      <input
                        value={editFields.last_name}
                        onChange={(e) =>
                          setEditFields((f) => ({ ...f, last_name: e.target.value }))
                        }
                        placeholder="Last name"
                        className="w-24 bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={editFields.affiliation}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, affiliation: e.target.value }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    >
                      <option>ELF</option>
                      <option>EPLF</option>
                      <option>Civilian</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={editFields.birth_date ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, birth_date: e.target.value || null }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={editFields.death_date ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, death_date: e.target.value || null }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={editFields.birth_city ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, birth_city: e.target.value || null }))
                      }
                      placeholder="City"
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={editFields.birth_province ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, birth_province: e.target.value || null }))
                      }
                      placeholder="Province"
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={editFields.status}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, status: e.target.value }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    >
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(p.id)}
                        disabled={saving}
                        className="bg-primary text-primary-foreground px-3 py-1 text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {saving ? "…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // ── Normal Row ────────────────────────────────────────────────
                <tr key={p.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.affiliation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    {p.birth_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    {p.death_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.birth_city ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.birth_province ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${statusBadge(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Approve: only for Pending profiles */}
                      {canApprove && p.status === "Pending" && (
                        <button
                          onClick={() => approveProfile(p)}
                          className="bg-emerald-700 text-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-800 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {/* Edit */}
                      {canEdit && (
                        <button
                          onClick={() => startEdit(p)}
                          className="text-primary hover:underline underline-offset-2 font-medium text-[11px]"
                        >
                          Edit
                        </button>
                      )}
                      {/* Delete */}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="bg-destructive text-destructive-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider hover:bg-destructive/90 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                      {!canEdit && !canDelete && !canApprove && (
                        <span className="text-[10px] text-muted-foreground italic">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            )}
            {!loading && profiles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No martyr profiles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          {/* Modal */}
          <div className="relative bg-card border border-border shadow-2xl w-full max-w-md mx-4 p-6">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-destructive"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>

            <h2
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Are you sure you want to permanently delete this profile?
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-semibold text-foreground">
                {deleteTarget.first_name} {deleteTarget.last_name}
              </span>{" "}
              · {deleteTarget.affiliation}
            </p>
            <p className="text-xs text-destructive/80 mb-6">
              This action cannot be undone. The profile will be permanently removed from the
              database.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {showImport && (
        <MartyrImportModal
          profiles={profiles}
          onClose={() => setShowImport(false)}
          onDone={fetchProfiles}
        />
      )}
    </div>
  );
}

// ── Organizations Panel ────────────────────────────────────────────────────────
function OrgsPanel() {
  const [orgs, setOrgs] = useState<{
    id: string;
    name: string;
    country: string | null;
    subscription_plan: string | null;
    subscription_status: string | null;
    created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", country: "" });
  const [saving, setSaving] = useState(false);

  const fetchOrgs = async () => {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    setOrgs(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("organizations")
      .insert({ name: newOrg.name, country: newOrg.country || null });
    setNewOrg({ name: "", country: "" });
    setCreating(false);
    await fetchOrgs();
    setSaving(false);
  };

  if (loading)
    return (
      <div className="data-label animate-pulse text-muted-foreground">
        Loading organizations…
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
          Organizations
        </h1>
        <button
          onClick={() => setCreating(!creating)}
          className="bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
        >
          + New Organization
        </button>
      </div>

      {creating && (
        <form
          onSubmit={createOrg}
          className="bg-card border border-border p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="data-label block mb-1.5">Organization Name *</label>
            <input
              required
              value={newOrg.name}
              onChange={(e) => setNewOrg((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Eritrean Community Toronto"
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="data-label block mb-1.5">Country</label>
            <input
              value={newOrg.country}
              onChange={(e) => setNewOrg((p) => ({ ...p, country: e.target.value }))}
              placeholder="e.g. Canada"
              className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
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
                <td className="px-4 py-3 text-muted-foreground capitalize">
                  {o.subscription_plan ?? "free"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                      o.subscription_status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {o.subscription_status ?? "trialing"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No organizations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Records Panel ──────────────────────────────────────────────────────────────
type PersonRow = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  category: string | null;
  status: string | null;
  date_of_death: string | null;
  deleted_at: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  created_at: string;
};

function RecordsPanel({ isFounder }: { isFounder: boolean }) {
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
      .select(
        "id,slug,first_name,last_name,category,status,date_of_death,deleted_at,submitted_by,approved_by,created_at"
      )
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

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const softDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.rpc("soft_delete_person" as never, {
      _person_id: id,
    } as never);
    if (error) alert(error.message);
    setConfirmDelete(null);
    await fetchRecords();
    setDeleting(null);
  };

  const restore = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.rpc("restore_person" as never, {
      _person_id: id,
    } as never);
    if (error) alert(error.message);
    await fetchRecords();
    setDeleting(null);
  };

  return (
    <div>
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
        <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
          All Records
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name…"
          className="bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-48"
        />
      </div>

      {loading && (
        <div className="data-label animate-pulse text-muted-foreground">Loading records…</div>
      )}

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
              <tr
                key={r.id}
                className={`border-t border-border ${r.deleted_at ? "opacity-40" : ""}`}
              >
                <td className="px-4 py-2.5">
                  <Link
                    to={`/martyr/${r.slug}`}
                    target="_blank"
                    className="font-medium hover:underline underline-offset-2"
                  >
                    {r.first_name} {r.last_name}
                  </Link>
                  {r.deleted_at && (
                    <span className="ml-2 text-[9px] text-destructive uppercase font-bold tracking-wider">
                      Deleted
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono uppercase text-[10px] text-muted-foreground">
                  {r.category ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {r.date_of_death ? r.date_of_death.slice(0, 4) : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground capitalize">
                  {r.status ?? "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {isFounder && (
                      <Link
                        to={`/admin/edit/${r.slug}`}
                        className="text-primary hover:underline underline-offset-2 font-medium"
                      >
                        Edit
                      </Link>
                    )}
                    {r.deleted_at ? (
                      isFounder && (
                        <button
                          onClick={() => restore(r.id)}
                          disabled={deleting === r.id}
                          className="text-emerald-700 hover:underline underline-offset-2 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )
                    ) : confirmDelete === r.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => softDelete(r.id)}
                          disabled={deleting === r.id}
                          className="text-destructive font-semibold hover:underline disabled:opacity-50"
                        >
                          {deleting === r.id ? "…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="text-destructive/70 hover:text-destructive hover:underline underline-offset-2"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!isFounder && (
        <p className="text-[10px] text-muted-foreground mt-3 text-right font-mono">
          Deputy limits: 5 deletions / week · 15 / month
        </p>
      )}
    </div>
  );
}
