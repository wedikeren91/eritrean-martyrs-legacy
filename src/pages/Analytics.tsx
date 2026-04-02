import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";

// ── Eritrean flag palette ──────────────────────────────────────────────────────
const FLAG_RED   = "#E4002B";
const FLAG_GREEN = "#43B02A";
const FLAG_BLUE  = "#418FDE";
const FLAG_GOLD  = "#FFC72C";
const FLAG_DARK  = "#1A1A2E";

const AFFIL_COLORS: Record<string, string> = {
  ELF:      FLAG_BLUE,
  EPLF:     FLAG_RED,
  Civilian: FLAG_GREEN,
};

const TOOLTIP_STYLE = {
  background: "hsl(35 20% 99%)",
  border: "1px solid hsl(35 15% 82%)",
  borderRadius: 0,
  fontSize: 11,
  color: "hsl(220 25% 12%)",
};

// ── Types ──────────────────────────────────────────────────────────────────────
type MartyrRow = {
  affiliation: string;
  birth_province: string | null;
  birth_date: string | null;
  death_date: string | null;
  gender: string | null;
  status: string;
};

type ChartDatum = { name: string; count: number };

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildAffiliationData(rows: MartyrRow[]): (ChartDatum & { pct: string })[] {
  const map: Record<string, number> = { ELF: 0, EPLF: 0, Civilian: 0 };
  rows.forEach((r) => { if (r.affiliation in map) map[r.affiliation]++; });
  const total = rows.length || 1;
  return Object.entries(map).map(([name, count]) => ({
    name,
    count,
    pct: ((count / total) * 100).toFixed(1),
  }));
}

function buildRegionData(rows: MartyrRow[]): ChartDatum[] {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const p = r.birth_province?.trim() || "Unknown";
    map[p] = (map[p] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function buildDeathYearData(rows: MartyrRow[]): ChartDatum[] {
  const map: Record<number, number> = {};
  rows.forEach((r) => {
    if (!r.death_date) return;
    const yr = parseInt(r.death_date.slice(0, 4), 10);
    if (yr >= 1961 && yr <= 1991) map[yr] = (map[yr] ?? 0) + 1;
  });
  const result: ChartDatum[] = [];
  for (let y = 1961; y <= 1991; y++) {
    result.push({ name: String(y), count: map[y] ?? 0 });
  }
  return result;
}

const AGE_RANGES = [
  { label: "Under 18", min: 0,  max: 17  },
  { label: "18–25",    min: 18, max: 25  },
  { label: "26–35",    min: 26, max: 35  },
  { label: "36–45",    min: 36, max: 45  },
  { label: "46+",      min: 46, max: 999 },
];

function buildAgeData(rows: MartyrRow[]): ChartDatum[] {
  const buckets: Record<string, number> = {};
  AGE_RANGES.forEach((r) => { buckets[r.label] = 0; });

  rows.forEach((row) => {
    if (!row.birth_date || !row.death_date) return;
    const born  = new Date(row.birth_date).getFullYear();
    const died  = new Date(row.death_date).getFullYear();
    const age   = died - born;
    const range = AGE_RANGES.find((r) => age >= r.min && age <= r.max);
    if (range) buckets[range.label]++;
  });

  return AGE_RANGES.map((r) => ({ name: r.label, count: buckets[r.label] }));
}

function buildGenderData(rows: MartyrRow[]): (ChartDatum & { pct: string })[] {
  const map: Record<string, number> = { Male: 0, Female: 0, Unknown: 0 };
  rows.forEach((r) => {
    const g = r.gender || "Unknown";
    if (g in map) map[g]++;
    else map["Unknown"]++;
  });
  const total = rows.length || 1;
  return Object.entries(map).map(([name, count]) => ({
    name,
    count,
    pct: ((count / total) * 100).toFixed(1),
  }));
}

// ── Custom Pie label ──────────────────────────────────────────────────────────
const renderPieLabel = ({
  cx, cy, midAngle, outerRadius, name, count, pct,
}: {
  cx: number; cy: number; midAngle: number; outerRadius: number;
  name: string; count: number; pct: string;
}) => {
  if (count === 0) return null;
  const RAD = Math.PI / 180;
  const r   = outerRadius + 24;
  const x   = cx + r * Math.cos(-midAngle * RAD);
  const y   = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x} y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontSize: 11, fill: "hsl(220 25% 12%)", fontFamily: "monospace" }}
    >
      {name} {count} ({pct}%)
    </text>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, accent, pulse = false,
}: {
  label: string; value: string | number; accent: string; pulse?: boolean;
}) {
  return (
    <div
      className="bg-card border border-border p-5 relative overflow-hidden"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      {pulse && (
        <span
          className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
          style={{ background: accent }}
        />
      )}
      <div
        className="text-3xl font-bold mb-1 tabular-nums"
        style={{ color: accent, fontFamily: "'Fraunces', serif" }}
      >
        {value}
      </div>
      <div className="data-label text-muted-foreground">{label}</div>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="mb-1 text-sm font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
        {title}
      </div>
      {subtitle && <div className="data-label text-muted-foreground mb-4">{subtitle}</div>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

const LOADING_CHART = (
  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-xs animate-pulse">
    Loading data…
  </div>
);
const EMPTY_CHART = (
  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-xs">
    No data available yet.
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { isFounder, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rows,        setRows]        = useState<MartyrRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    if (!authLoading && !isFounder) navigate("/");
  }, [authLoading, isFounder, navigate]);

  useEffect(() => {
    if (!isFounder) return;
    (async () => {
      setLoadingData(true);
      const [rowsRes, pendingRes] = await Promise.all([
        (supabase.from("martyr_profiles" as never) as any)
          .select("affiliation,birth_province,birth_date,death_date,gender,status")
          .limit(5000),
        (supabase.from("martyr_profiles" as never) as any)
          .select("id", { count: "exact", head: true })
          .eq("status", "Pending"),
      ]);
      setRows((rowsRes.data as MartyrRow[]) ?? []);
      setTotalPending(pendingRes.count ?? 0);
      setLoadingData(false);
    })();
  }, [isFounder]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="data-label animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!isFounder) return null;

  // ── Derived data ──────────────────────────────────────────────────────────
  const affiliationData = buildAffiliationData(rows);
  const regionData      = buildRegionData(rows);
  const deathYearData   = buildDeathYearData(rows);
  const ageData         = buildAgeData(rows);
  const genderData      = buildGenderData(rows);

  const totalELF      = affiliationData.find((d) => d.name === "ELF")?.count      ?? 0;
  const totalEPLF     = affiliationData.find((d) => d.name === "EPLF")?.count     ?? 0;
  const totalCivilian = affiliationData.find((d) => d.name === "Civilian")?.count ?? 0;

  const summaryCards = [
    { label: "Total Profiles",       value: loadingData ? "…" : rows.length,        accent: FLAG_DARK  },
    { label: "ELF",                  value: loadingData ? "…" : totalELF,            accent: FLAG_BLUE  },
    { label: "EPLF",                 value: loadingData ? "…" : totalEPLF,           accent: FLAG_RED   },
    { label: "Civilian",             value: loadingData ? "…" : totalCivilian,       accent: FLAG_GREEN },
    { label: "Pending Approval",     value: loadingData ? "…" : totalPending,        accent: FLAG_GOLD, pulse: true },
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
          <div className="data-label text-primary">Martyr Profiles Analytics</div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: FLAG_GREEN }}
            />
            Full Admin Only
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* ── Summary stat cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              accent={s.accent}
              pulse={s.pulse}
            />
          ))}
        </div>

        {/* ── Row 1: Pie + Region Bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. Affiliation Pie */}
          <ChartCard
            title="Affiliation Breakdown"
            subtitle="ELF · EPLF · Civilian — with count and percentage"
          >
            {loadingData ? LOADING_CHART : affiliationData.every((d) => d.count === 0) ? EMPTY_CHART : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={affiliationData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine
                      label={renderPieLabel as any}
                    >
                      {affiliationData.map((d) => (
                        <Cell key={d.name} fill={AFFIL_COLORS[d.name] ?? FLAG_DARK} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v} martyrs`, name]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* 2. Region Bar */}
          <ChartCard
            title="Martyrs by Birth Province"
            subtitle="Sorted highest to lowest · top 15 regions shown"
          >
            {loadingData ? LOADING_CHART : regionData.length === 0 ? EMPTY_CHART : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 15% 82%)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "hsl(220 12% 42%)" }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(220 12% 42%)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v} martyrs`, "Count"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="count" fill={FLAG_BLUE} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Row 2: Death Year Line + Age Distribution ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 3. Death Year Line Chart */}
          <ChartCard
            title="Casualties by Year of Death"
            subtitle="1961–1991 · Eritrean War of Independence timeline"
          >
            {loadingData ? LOADING_CHART : deathYearData.every((d) => d.count === 0) ? EMPTY_CHART : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={deathYearData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 15% 82%)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: "hsl(220 12% 42%)" }}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(220 12% 42%)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v} martyrs`, "Deaths"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={FLAG_RED}
                      strokeWidth={2}
                      dot={{ r: 2, fill: FLAG_RED }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* 4. Age Distribution Bar */}
          <ChartCard
            title="Age at Time of Death"
            subtitle="Calculated from birth_date and death_date · grouped by range"
          >
            {loadingData ? LOADING_CHART : ageData.every((d) => d.count === 0) ? EMPTY_CHART : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ageData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 15% 82%)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(220 12% 42%)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(220 12% 42%)" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v} martyrs`, "Count"]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {ageData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={[FLAG_RED, FLAG_GOLD, FLAG_GREEN, FLAG_BLUE, FLAG_DARK][i % 5]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Row 3: Gender Breakdown ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Gender Breakdown"
            subtitle="Male · Female · Unknown — with count and percentage"
          >
            {loadingData ? LOADING_CHART : genderData.every((d) => d.count === 0) ? EMPTY_CHART : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine
                      label={renderPieLabel as any}
                    >
                      {genderData.map((d) => (
                        <Cell
                          key={d.name}
                          fill={d.name === "Male" ? "#3B82F6" : d.name === "Female" ? "#EC4899" : "#9CA3AF"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v} profiles`, name]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Footer note ──────────────────────────────────────────────────────── */}
        <p className="text-[10px] font-mono text-muted-foreground text-center pb-4">
          Data sourced from <em>martyr_profiles</em> table · {rows.length} total records ·{" "}
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
