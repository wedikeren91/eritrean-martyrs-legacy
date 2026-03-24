import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Permission definitions
const PERMISSION_OPTIONS = [
  { key: "approve_profile", label: "Approve Profiles", description: "Can approve pending martyr profiles" },
  { key: "modify_profile",  label: "Modify Profiles",  description: "Can inline-edit martyr profile records" },
  { key: "delete_profile",  label: "Delete Profiles",  description: "Can permanently delete martyr profiles" },
] as const;

type Permission = "approve_profile" | "modify_profile" | "delete_profile";

type UserRow = {
  id: string;
  display_name: string | null;
  city: string | null;
  country: string | null;
  permissions: Permission[];
  email?: string;
  role: string;
};

type FormMode = "create" | "edit";

const ROLE_DISPLAY: Record<string, string> = {
  user:       "Visitor",
  contributor:"Contributor",
  org_admin:  "Deputy Admin",
  founder:    "Full Admin",
};

const ROLE_BADGE: Record<string, string> = {
  founder:    "bg-amber-50 text-amber-700 border border-amber-200",
  org_admin:  "bg-blue-50 text-blue-700 border border-blue-200",
  contributor:"bg-emerald-50 text-emerald-700 border border-emerald-200",
  user:       "bg-muted text-muted-foreground border border-border",
};

export default function UserManagement() {
  const { user, isFounder, loading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Form state
  const [formOpen, setFormOpen]   = useState(false);
  const [formMode, setFormMode]   = useState<FormMode>("create");
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [formName, setFormName]   = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPerms, setFormPerms] = useState<Set<Permission>>(new Set());
  const [formRole, setFormRole]   = useState<"org_admin" | "user" | "contributor">("org_admin");
  const [saving, setSaving]       = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isFounder) navigate("/");
  }, [loading, isFounder, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoadingData(true);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, display_name, city, country, permissions")
      .order("created_at", { ascending: false })
      .limit(200);

    const ids = (profileData ?? []).map((p) => p.id);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);

    const roleMap = Object.fromEntries((roleData ?? []).map((r) => [r.user_id, r.role]));

    const merged: UserRow[] = (profileData ?? []).map((p) => ({
      id:           p.id,
      display_name: p.display_name,
      city:         p.city,
      country:      p.country,
      permissions:  (p.permissions as Permission[]) ?? [],
      role:         roleMap[p.id] ?? "user",
    }));

    setUsers(merged);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (isFounder) fetchUsers();
  }, [isFounder, fetchUsers]);

  // Filtered list
  const filtered = users.filter((u) => {
    const matchSearch = !search.trim() ||
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Open create form ──────────────────────────────────────────────────────
  const openCreate = () => {
    setFormMode("create");
    setEditTarget(null);
    setFormName("");
    setFormEmail("");
    setFormPerms(new Set());
    setFormRole("org_admin");
    setFormOpen(true);
  };

  // ── Open edit form ────────────────────────────────────────────────────────
  const openEdit = (u: UserRow) => {
    setFormMode("edit");
    setEditTarget(u);
    setFormName(u.display_name ?? "");
    setFormEmail("");
    setFormPerms(new Set(u.permissions));
    setFormRole(u.role === "founder" ? "org_admin" : (u.role as "org_admin" | "user" | "contributor"));
    setFormOpen(true);
  };

  const togglePerm = (p: Permission) => {
    setFormPerms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  // ── Save (create is invite-only — we update the role + permissions) ───────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const permsArray = Array.from(formPerms);

    if (formMode === "edit" && editTarget) {
      // Update display name
      await supabase.from("profiles").update({
        display_name: formName || null,
        permissions: permsArray,
      }).eq("id", editTarget.id);

      // Update role
      await supabase.from("user_roles")
        .update({ role: formRole })
        .eq("user_id", editTarget.id);

    } else {
      // Create mode: we can only set permissions for existing users via role change.
      // Since auth user creation requires the admin API, we show a note.
      // For the purposes of this form we find user by display_name and update their role.
      // In practice a newly registered user signs up themselves; admin upgrades them here.
      alert("To add a new Deputy Admin, first have the user sign up, then find them in the list and use Edit to assign the Deputy Admin role and permissions.");
      setSaving(false);
      setFormOpen(false);
      return;
    }

    await fetchUsers();
    setFormOpen(false);
    setSaving(false);
  };

  // ── Revoke / downgrade ────────────────────────────────────────────────────
  const handleRevoke = async (u: UserRow) => {
    setDeleting(true);
    await supabase.from("user_roles")
      .update({ role: "user" })
      .eq("user_id", u.id);
    await supabase.from("profiles")
      .update({ permissions: [] })
      .eq("id", u.id);
    setDeleteTarget(null);
    await fetchUsers();
    setDeleting(false);
  };

  if (loading || loadingData)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="data-label animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );

  if (!isFounder) return null;

  return (
    <div className="min-h-screen bg-background grain-overlay w-full overflow-x-hidden">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="data-label text-muted-foreground hover:text-foreground transition-colors">
              ← Dashboard
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="data-label text-primary">User Management</div>
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[180px] hidden sm:block">
            {user?.email}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
              User Management
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage roles and granular permissions for all users. Only Full Admins can access this page.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors"
          >
            + Add Deputy Admin
          </button>
        </div>

        {/* Role stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Full Admins",    role: "founder",     icon: "👑" },
            { label: "Deputy Admins",  role: "org_admin",   icon: "🛡️" },
            { label: "Contributors",   role: "contributor", icon: "✍️" },
            { label: "Visitors",       role: "user",        icon: "👤" },
          ].map((s) => (
            <div key={s.role} className="bg-card border border-border p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-lg font-mono font-bold text-foreground">
                {users.filter((u) => u.role === s.role).length}
              </div>
              <div className="data-label text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search & filter */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors w-full sm:w-56"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="founder">Full Admin</option>
            <option value="org_admin">Deputy Admin</option>
            <option value="contributor">Contributor</option>
            <option value="user">Visitor</option>
          </select>
          <span className="self-center text-xs text-muted-foreground font-mono">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left data-label">Name</th>
                <th className="px-4 py-3 text-left data-label">Location</th>
                <th className="px-4 py-3 text-left data-label">Role</th>
                <th className="px-4 py-3 text-left data-label">Permissions</th>
                <th className="px-4 py-3 text-left data-label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {u.display_name ?? <span className="text-muted-foreground italic">Unnamed</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[u.city, u.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${ROLE_BADGE[u.role] ?? ROLE_BADGE.user}`}>
                      {ROLE_DISPLAY[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "org_admin" ? (
                      u.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.permissions.map((p) => (
                            <span key={p} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 uppercase font-semibold tracking-wide">
                              {p.replace("_profile", "")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[10px]">No permissions set</span>
                      )
                    ) : (
                      <span className="text-muted-foreground text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.role !== "founder" && (
                        <button
                          onClick={() => openEdit(u)}
                          className="text-primary hover:underline underline-offset-2 font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {u.role === "org_admin" && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-destructive/70 hover:text-destructive hover:underline underline-offset-2"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-card border border-border">
          <div className="data-label mb-2">Permission Reference</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PERMISSION_OPTIONS.map((p) => (
              <div key={p.key} className="flex items-start gap-2">
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 uppercase font-semibold tracking-wide shrink-0 mt-0.5">
                  {p.key.replace("_profile", "")}
                </span>
                <span className="text-[11px] text-muted-foreground">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit / Create Form Modal ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !saving && setFormOpen(false)} />
          <div className="relative bg-card border border-border shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
              {formMode === "create" ? "Add Deputy Admin" : `Edit User: ${editTarget?.display_name ?? "—"}`}
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              {formMode === "create"
                ? "New users must register themselves. Use this form to upgrade an existing user to Deputy Admin by finding them in the table and clicking Edit."
                : "Update this user's display name, role, and granular permissions."}
            </p>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Name */}
              <div>
                <label className="data-label block mb-1.5">Display Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dawit Tesfaye"
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Role */}
              <div>
                <label className="data-label block mb-1.5">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as typeof formRole)}
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                >
                  <option value="user">Visitor</option>
                  <option value="contributor">Contributor</option>
                  <option value="org_admin">Deputy Admin</option>
                </select>
              </div>

              {/* Permissions — only for Deputy Admin */}
              {formRole === "org_admin" && (
                <div>
                  <label className="data-label block mb-3">
                    Deputy Admin Permissions
                  </label>
                  <div className="space-y-3">
                    {PERMISSION_OPTIONS.map((p) => (
                      <label
                        key={p.key}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input
                            type="checkbox"
                            checked={formPerms.has(p.key)}
                            onChange={() => togglePerm(p.key)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 border-2 flex items-center justify-center transition-colors shrink-0 ${
                              formPerms.has(p.key)
                                ? "bg-primary border-primary"
                                : "bg-background border-border group-hover:border-primary/60"
                            }`}
                          >
                            {formPerms.has(p.key) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-primary-foreground">
                                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground leading-none mb-0.5">{p.label}</div>
                          <div className="text-xs text-muted-foreground">{p.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* JSON preview */}
                  {formPerms.size > 0 && (
                    <div className="mt-4 bg-muted/60 border border-border px-3 py-2">
                      <div className="data-label mb-1">Saved as JSON</div>
                      <code className="text-[11px] text-muted-foreground font-mono">
                        {JSON.stringify(Array.from(formPerms))}
                      </code>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider border border-border hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : formMode === "create" ? "Add" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Revoke Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-card border border-border shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-xl">
              🛡️
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Revoke Deputy Admin access?
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-semibold text-foreground">{deleteTarget.display_name ?? "This user"}</span>'s
              role will be downgraded to <strong>Visitor</strong> and all permissions will be cleared.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 mb-6 mt-3">
              The user will immediately lose access to all admin features.
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
                onClick={() => handleRevoke(deleteTarget)}
                disabled={deleting}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Revoking…" : "Confirm Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
