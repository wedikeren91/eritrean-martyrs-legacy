import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MartyrImportModal, { exportProfiles } from "@/components/MartyrBatchActions";
import { CATEGORIES } from "@/data/martyrs";
import { toast } from "@/components/ui/use-toast";
import { buildPersonDuplicateMap, type DuplicateInsight } from "@/lib/personDuplicates";

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

type Tab = "queue" | "records" | "martyrs" | "photos" | "orgs";

function NameMatchBadges({ info }: { info?: DuplicateInsight }) {
  if (!info || (info.exactMatches.length === 0 && info.similarMatches.length === 0)) {
    return null;
  }

  return (
    <>
      {info.exactMatches.length > 0 && (
        <span className="inline-flex items-center rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          Duplicate {info.exactMatches.length}
        </span>
      )}
      {info.similarMatches.length > 0 && (
        <span className="inline-flex items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Looks similar {info.similarMatches.length}
        </span>
      )}
    </>
  );
}

export default function Admin() {
  const { user, isAdmin, isFounder, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "queue";
  const [tab, setTab] = useState<Tab>(initialTab);

  const changeTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };
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
    { key: "photos", label: "Photo Review" },
    ...(isFounder ? [{ key: "orgs" as Tab, label: "Organizations" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background grain-overlay w-full max-w-full overflow-x-hidden">
      {/* Top bar */}
      <div className="border-b border-border bg-card" style={{ paddingTop: "var(--safe-area-top)" }}>
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
              onClick={() => changeTab(t.key)}
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

        {/* ── Photo Review ── */}
        {tab === "photos" && isAdmin && <PhotoReviewPanel />}

        {/* ── Organizations (Founder only) ── */}
        {tab === "orgs" && isFounder && <OrgsPanel />}
      </div>
    </div>
  );
}

// ── Martyr Profiles Panel (reads from persons – single source of truth) ───────
type MartyrProfile = {
  id: string;
  first_name: string;
  last_name: string;
  slug: string;
  category: string | null;   // was "affiliation" in legacy table
  gender: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  city: string | null;
  region: string | null;
  photo_url: string | null;
  bio: string | null;
  status: string | null;
  submitted_by: string | null;
  created_at: string;
  is_public: boolean;
  deleted_at: string | null;
};

// Alias helpers so the rest of the component can still use the old names
const affiliation = (p: MartyrProfile) => p.category ?? "—";

type EditFields = {
  first_name: string;
  last_name: string;
  category: string;
  gender: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  city: string | null;
  region: string | null;
  status: string;
};

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
  const [filterVisibility, setFilterVisibility] = useState("All");
  const [filterDuplicates, setFilterDuplicates] = useState<"All" | "exact" | "similar" | "any">("All");
  const [sortBy, setSortBy] = useState<"date" | "duplicates">("date");
  const [visibilityLoadingId, setVisibilityLoadingId] = useState<string | null>(null);

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({
    first_name: "",
    last_name: "",
    category: "ELF",
    gender: "Unknown",
    date_of_birth: null,
    date_of_death: null,
    city: null,
    region: null,
    status: "Pending",
  });
  const [saving, setSaving] = useState(false);
  const duplicateMap = useMemo(() => buildPersonDuplicateMap(profiles), [profiles]);

  // Filter by duplicate status, then sort
  const sortedProfiles = useMemo(() => {
    // Step 1: Filter by duplicate type
    let filtered = profiles;
    if (filterDuplicates !== "All") {
      filtered = profiles.filter((p) => {
        const info = duplicateMap[p.id];
        if (!info) return false;
        if (filterDuplicates === "exact") return info.exactMatches.length > 0;
        if (filterDuplicates === "similar") return info.similarMatches.length > 0;
        // "any"
        return info.exactMatches.length > 0 || info.similarMatches.length > 0;
      });
    }

    // Step 2: Sort
    if (sortBy !== "duplicates") return filtered;

    const visited = new Set<string>();
    const result: MartyrProfile[] = [];
    const idToProfile = new Map(filtered.map((p) => [p.id, p]));

    for (const p of filtered) {
      if (visited.has(p.id)) continue;
      const info = duplicateMap[p.id];
      const hasMatches = info && (info.exactMatches.length > 0 || info.similarMatches.length > 0);

      const group: MartyrProfile[] = [p];
      visited.add(p.id);

      if (hasMatches) {
        for (const matchId of [...info.exactMatches, ...info.similarMatches]) {
          if (!visited.has(matchId) && idToProfile.has(matchId)) {
            group.push(idToProfile.get(matchId)!);
            visited.add(matchId);
          }
        }
      }

      result.push(...group);
    }

    // Put records with duplicates first
    const withDupes: MartyrProfile[] = [];
    const withoutDupes: MartyrProfile[] = [];

    for (const p of result) {
      const info = duplicateMap[p.id];
      if (info && (info.exactMatches.length > 0 || info.similarMatches.length > 0)) {
        withDupes.push(p);
      } else {
        withoutDupes.push(p);
      }
    }

    return [...withDupes, ...withoutDupes];
  }, [profiles, duplicateMap, sortBy, filterDuplicates]);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<MartyrProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import modal
  const [showImport, setShowImport] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("persons")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (filterAffiliation !== "All") {
      q = q.eq("category", filterAffiliation);
    }
    if (filterStatus !== "All") {
      q = q.eq("status", filterStatus);
    }

    if (filterVisibility === "Public") {
      q = q.eq("is_public", true);
    } else if (filterVisibility === "Private") {
      q = q.eq("is_public", false);
    }

    const { data } = await q;
    let results = ((data as any[]) ?? []).map((row) => ({
      ...row,
      is_public: row.is_public ?? true,
    })) as MartyrProfile[];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      results = results.filter(
        (p) => {
          const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
          return (
            p.first_name.toLowerCase().includes(term) ||
            p.last_name.toLowerCase().includes(term) ||
            fullName.includes(term) ||
            p.slug.toLowerCase().includes(term)
          );
        }
      );
    }

    setProfiles(results);
    setLoading(false);
  }, [search, filterAffiliation, filterStatus, filterVisibility]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const toggleVisibility = async (profile: MartyrProfile) => {
    const newVal = !profile.is_public;
    setVisibilityLoadingId(profile.id);

    const { data, error } = await supabase
      .from("persons")
      .update({ is_public: newVal })
      .eq("id", profile.id)
      .select("id, is_public")
      .single();

    if (error || !data) {
      toast({
        title: "Could not update visibility",
        description: error?.message ?? "Please try again.",
      });
      setVisibilityLoadingId(null);
      return;
    }

    setProfiles((prev) => prev.map((x) => x.id === profile.id ? { ...x, is_public: data.is_public } : x));
    toast({
      title: data.is_public ? "Record is now public" : "Record is now private",
    });
    setVisibilityLoadingId(null);
  };

  const startEdit = (p: MartyrProfile) => {
    setEditingId(p.id);
    setEditFields({
      first_name: p.first_name,
      last_name: p.last_name,
      category: p.category ?? "Unknown",
      gender: p.gender || "Unknown",
      date_of_birth: p.date_of_birth,
      date_of_death: p.date_of_death,
      city: p.city,
      region: p.region,
      status: p.status ?? "Pending",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("persons").update({
      first_name: editFields.first_name,
      last_name: editFields.last_name,
      category: editFields.category,
      gender: editFields.gender,
      date_of_birth: editFields.date_of_birth || null,
      date_of_death: editFields.date_of_death || null,
      city: editFields.city || null,
      region: editFields.region || null,
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
    const { error } = await supabase.from("persons")
      .update({ status: "Approved" })
      .eq("id", p.id);
    if (error) alert("Approve failed: " + error.message);
    else await fetchProfiles();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // Soft-delete via RPC
    const { error } = await supabase.rpc("soft_delete_person", { _person_id: deleteTarget.id });
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
        <select
          value={filterVisibility}
          onChange={(e) => setFilterVisibility(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="All">All Visibility</option>
          <option value="Public">Public Only</option>
          <option value="Private">Private Only</option>
        </select>
        <select
          value={filterDuplicates}
          onChange={(e) => setFilterDuplicates(e.target.value as any)}
          className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="All">All Records</option>
          <option value="any">Duplicates & Similar</option>
          <option value="exact">Exact Duplicates Only</option>
          <option value="similar">Similar Names Only</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "duplicates")}
          className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
        >
          <option value="date">Sort: Date Created</option>
          <option value="duplicates">Sort: Duplicates First</option>
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
              <th className="px-4 py-3 text-left data-label">Category</th>
              <th className="px-4 py-3 text-left data-label">Gender</th>
              <th className="px-4 py-3 text-left data-label">Birth Date</th>
              <th className="px-4 py-3 text-left data-label">Death Date</th>
              <th className="px-4 py-3 text-left data-label">City</th>
              <th className="px-4 py-3 text-left data-label">Region</th>
              <th className="px-4 py-3 text-left data-label">Status</th>
              <th className="px-4 py-3 text-left data-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProfiles.map((p) =>
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
                      value={editFields.category}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, category: e.target.value }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    >
                      <option>ELF</option>
                      <option>EPLF</option>
                      <option>PLF</option>
                      <option>Civilian</option>
                      <option>Unknown</option>
                      <option>Other</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={editFields.gender}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, gender: e.target.value }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Unknown</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={editFields.date_of_birth ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, date_of_birth: e.target.value || null }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={editFields.date_of_death ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, date_of_death: e.target.value || null }))
                      }
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={editFields.city ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, city: e.target.value || null }))
                      }
                      placeholder="City"
                      className="bg-background border border-border px-2 py-1 text-xs focus:outline-none focus:border-foreground w-full"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={editFields.region ?? ""}
                      onChange={(e) =>
                        setEditFields((f) => ({ ...f, region: e.target.value || null }))
                      }
                      placeholder="Region"
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
                <tr key={p.id} className={`border-t border-border hover:bg-muted/20 transition-colors ${!p.is_public ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{p.first_name} {p.last_name}</span>
                      {!p.is_public && <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5">Private</span>}
                      <NameMatchBadges info={duplicateMap[p.id]} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {affiliation(p)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                      p.gender === "Male" ? "text-blue-600" : p.gender === "Female" ? "text-pink-500" : "text-muted-foreground"
                    }`}>
                      {p.gender || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    {p.date_of_birth ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    {p.date_of_death ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.city ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.region ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${statusBadge(p.status ?? "")}`}
                    >
                      {p.status ?? "—"}
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
                      {/* Toggle Public/Private */}
                      {canEdit && (
                        <button
                          onClick={() => toggleVisibility(p)}
                          disabled={visibilityLoadingId === p.id}
                          className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors border disabled:opacity-60 disabled:cursor-not-allowed ${
                            p.is_public
                              ? "border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
                              : "border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {visibilityLoadingId === p.id ? "Saving…" : p.is_public ? "✓ Public" : "Private"}
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
              · {affiliation(deleteTarget)}
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
  gender: string;
  status: string | null;
  date_of_death: string | null;
  deleted_at: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  created_at: string;
};

type RecordSort = "name_asc" | "name_desc" | "dod_asc" | "dod_desc" | "status_asc" | "status_desc" | "newest" | "oldest";

const RECORD_SORT_OPTIONS: { value: RecordSort; label: string }[] = [
  { value: "name_asc", label: "Name A → Z" },
  { value: "name_desc", label: "Name Z → A" },
  { value: "dod_asc", label: "Death Year ↑" },
  { value: "dod_desc", label: "Death Year ↓" },
  { value: "status_asc", label: "Status A → Z" },
  { value: "status_desc", label: "Status Z → A" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

function RecordsPanel({ isFounder }: { isFounder: boolean }) {
  const [records, setRecords] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [sortBy, setSortBy] = useState<RecordSort>("name_asc");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, deleted: 0 });
  const duplicateMap = useMemo(() => buildPersonDuplicateMap(records), [records]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);

    const sortCol = sortBy.startsWith("name") ? "last_name"
      : sortBy.startsWith("dod") ? "date_of_death"
      : sortBy.startsWith("status") ? "status"
      : "created_at";
    const ascending = sortBy === "name_asc" || sortBy === "dod_asc" || sortBy === "status_asc" || sortBy === "oldest";

    let q = supabase
      .from("persons")
      .select(
        "id,slug,first_name,last_name,category,gender,status,date_of_death,deleted_at,submitted_by,approved_by,created_at"
      )
      .order(sortCol, { ascending })
      .limit(200);
    if (filterCategory !== "All") {
      q = q.eq("category", filterCategory);
    }
    if (filterGender !== "All") {
      q = q.eq("gender", filterGender);
    }
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
  }, [search, filterCategory, filterGender, sortBy]);

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
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-auto"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-auto"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RecordSort)}
            className="bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-auto"
          >
            {RECORD_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name…"
            className="bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-48"
          />
        </div>
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
              <th className="px-4 py-3 text-left data-label">Gender</th>
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      to={`/martyr/${r.slug}`}
                      target="_blank"
                      className="font-medium hover:underline underline-offset-2"
                    >
                      {r.first_name} {r.last_name}
                    </Link>
                    {r.deleted_at && (
                      <span className="text-[9px] text-destructive uppercase font-bold tracking-wider">
                        Deleted
                      </span>
                    )}
                    <NameMatchBadges info={duplicateMap[r.id]} />
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono uppercase text-[10px] text-muted-foreground">
                  {r.category ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    r.gender === "Male" ? "text-blue-600" : r.gender === "Female" ? "text-pink-500" : "text-muted-foreground"
                  }`}>
                    {r.gender || "—"}
                  </span>
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
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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

// ── Photo Review Panel ──────────────────────────────────────────────────────
type PhotoSubmission = {
  id: string;
  person_id: string;
  photo_url: string;
  submitted_by: string | null;
  status: string;
  created_at: string;
  persons?: { first_name: string; last_name: string; slug: string; photo_url: string | null } | null;
};

function PhotoReviewPanel() {
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("photo_submissions")
      .select("*, persons(first_name, last_name, slug, photo_url)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Photo submissions error:", error.message);
    }
    setSubmissions((data as unknown as PhotoSubmission[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const approve = async (id: string) => {
    setActionLoading(id);
    const { error } = await (supabase.rpc as any)("approve_photo_submission", { _submission_id: id });
    if (error) {
      toast({ title: "Approve failed", description: error.message });
    } else {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Photo approved and applied" });
    }
    setActionLoading(null);
  };

  const reject = async (id: string) => {
    setActionLoading(id);
    const { error } = await (supabase.rpc as any)("reject_photo_submission", { _submission_id: id });
    if (error) {
      toast({ title: "Reject failed", description: error.message });
    } else {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Photo rejected" });
    }
    setActionLoading(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif" }}>
          Photo Review
        </h1>
        <span className="data-label text-muted-foreground">
          {submissions.length} pending
        </span>
      </div>

      {loading && (
        <div className="data-label animate-pulse text-muted-foreground py-8">Loading submissions…</div>
      )}

      {!loading && submissions.length === 0 && (
        <div className="border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-3">📸</div>
          <p className="text-sm text-muted-foreground">No pending photo submissions.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map((s) => {
          const personName = s.persons
            ? `${s.persons.first_name} ${s.persons.last_name}`
            : "Unknown";
          return (
            <div key={s.id} className="bg-card border border-border overflow-hidden">
              {/* Submitted photo */}
              <div className="relative" style={{ aspectRatio: "3/4" }}>
                <img
                  src={s.photo_url}
                  alt={`Submitted photo for ${personName}`}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{personName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {/* Current photo thumbnail */}
                  {s.persons?.photo_url && (
                    <div className="w-10 h-10 rounded overflow-hidden border border-border flex-shrink-0">
                      <img
                        src={s.persons.photo_url}
                        alt="Current"
                        className="w-full h-full object-cover"
                        title="Current photo"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => approve(s.id)}
                    disabled={actionLoading === s.id}
                    className="flex-1 bg-emerald-700 text-white py-1.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-800 transition-colors disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => reject(s.id)}
                    disabled={actionLoading === s.id}
                    className="flex-1 border border-destructive/50 text-destructive py-1.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
