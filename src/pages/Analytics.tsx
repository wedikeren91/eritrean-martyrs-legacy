import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface LiveStats {
  totalApproved: number;
  pendingQueue: number;
  totalRejected: number;
  totalContributions: number;
}

interface CategoryStat {
  name: string;
  count: number;
}

interface RecentApproval {
  id: string;
  first_name: string;
  last_name: string;
  category: string | null;
  created_at: string;
  slug: string;
}

const COLORS = [
  "hsl(4 78% 42%)",
  "hsl(38 85% 52%)",
  "hsl(200 60% 45%)",
  "hsl(150 50% 40%)",
  "hsl(270 45% 55%)",
];

export default function Analytics() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<LiveStats>({
    totalApproved: 0,
    pendingQueue: 0,
    totalRejected: 0,
    totalContributions: 0,
  });
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [loading, isAdmin, navigate]);

  const fetchAll = async () => {
    setLoadingData(true);
    const [approvedRes, pendingRes, rejectedRes, catRes, recentRes] =
      await Promise.all([
        supabase
          .from("persons")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("contributions")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("contributions")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),
        supabase
          .from("persons")
          .select("category")
          .is("deleted_at", null),
        supabase
          .from("persons")
          .select("id,first_name,last_name,category,created_at,slug")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const totalApproved = approvedRes.count ?? 0;
    const pendingQueue = pendingRes.count ?? 0;
    const totalRejected = rejectedRes.count ?? 0;

    setStats({
      totalApproved,
      pendingQueue,
      totalRejected,
      totalContributions: totalApproved + pendingQueue + totalRejected,
    });

    // Build category breakdown
    const catMap: Record<string, number> = {};
    (catRes.data ?? []).forEach((p) => {
      const c = p.category ?? "Unknown";
      catMap[c] = (catMap[c] ?? 0) + 1;
    });
    setCategories(
      Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    );

    setRecentApprovals((recentRes.data as RecentApproval[]) ?? []);
    setLoadingData(false);
  };

  // Initial fetch
  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  // Realtime subscriptions on persons + contributions
  useEffect(() => {
    if (!isAdmin) return;

    const ch = supabase
      .channel("analytics-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "persons" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        () => fetchAll()
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
    };
  }, [isAdmin]);

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="data-label animate-pulse">Loading…</div>
      </div>
    );

  if (!isAdmin) return null;

  const approvalRate =
    stats.totalContributions > 0
      ? Math.round((stats.totalApproved / stats.totalContributions) * 100)
      : 0;

  const summaryCards = [
    {
      label: "Approved Records",
      value: stats.totalApproved,
      color: "hsl(var(--oxblood))",
      pulse: true,
    },
    {
      label: "Pending Review",
      value: stats.pendingQueue,
      color: "hsl(38 85% 52%)",
      pulse: stats.pendingQueue > 0,
    },
    {
      label: "Rejected",
      value: stats.totalRejected,
      color: "hsl(var(--muted-foreground))",
      pulse: false,
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      color: "hsl(150 50% 40%)",
      pulse: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background grain-overlay">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/admin"
            className="data-label text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Admin
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="data-label text-primary flex items-center gap-2">
            Live Analytics
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ background: "hsl(150 50% 40%)" }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* ── Summary counters ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border p-5 text-center relative overflow-hidden"
            >
              {s.pulse && (
                <div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: s.color }}
                />
              )}
              <div
                className="text-3xl font-bold font-mono mb-1"
                style={{ color: s.color, fontFamily: "'Fraunces', serif" }}
              >
                {loadingData ? "…" : s.value.toLocaleString()}
              </div>
              <div className="data-label text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Category breakdown ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-6">
            <div className="data-label mb-4 text-foreground">Category Breakdown</div>
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v} records`, "Count"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 0,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                {loadingData ? "Loading…" : "No data yet"}
              </div>
            )}
          </div>

          <div className="bg-card border border-border p-6">
            <div className="data-label mb-4 text-foreground">Records by Category</div>
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={categories}
                  margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} records`, "Count"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 0,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                {loadingData ? "Loading…" : "No data yet"}
              </div>
            )}
          </div>
        </div>

        {/* ── Recent approvals feed ── */}
        <div className="bg-card border border-border">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <div className="data-label text-foreground">Recent Approvals</div>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse ml-1"
              style={{ background: "hsl(150 50% 40%)" }}
            />
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">
              live
            </span>
          </div>
          <div className="divide-y divide-border">
            {loadingData ? (
              <div className="px-6 py-8 text-center data-label animate-pulse text-muted-foreground">
                Loading…
              </div>
            ) : recentApprovals.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No approved records yet.
              </div>
            ) : (
              recentApprovals.map((r, i) => (
                <div
                  key={r.id}
                  className="px-6 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[10px] font-mono w-5 shrink-0"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {i + 1}
                    </span>
                    <Link
                      to={`/martyr/${r.slug}`}
                      className="text-sm font-semibold hover:underline underline-offset-2 truncate"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {r.first_name} {r.last_name}
                    </Link>
                    {r.category && (
                      <span
                        className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 shrink-0"
                        style={{
                          background: "hsl(var(--oxblood))",
                          color: "hsl(35 25% 97%)",
                        }}
                      >
                        {r.category}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
