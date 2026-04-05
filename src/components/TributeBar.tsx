import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TributeBarProps {
  personId: string;
}

const SESSION_KEY = (id: string, type: string) => `tribute_${type}_${id}`;

const TributeBar = ({ personId }: TributeBarProps) => {
  const [flowerCount, setFlowerCount] = useState(0);
  const [candleCount, setCandleCount] = useState(0);
  const [givenFlower, setGivenFlower] = useState(false);
  const [givenCandles, setGivenCandles] = useState(0);
  const [loading, setLoading] = useState<"flower" | "candle" | null>(null);
  const [justGiven, setJustGiven] = useState<"flower" | "candle" | null>(null);

  useEffect(() => {
    const f = sessionStorage.getItem(SESSION_KEY(personId, "flower")) === "1";
    const c = parseInt(sessionStorage.getItem(SESSION_KEY(personId, "candle")) || "0", 10);
    setGivenFlower(f);
    setGivenCandles(c);
  }, [personId]);

  useEffect(() => {
    if (!personId) return;
    supabase
      .from("tributes")
      .select("tribute_type", { count: "exact" })
      .eq("person_id", personId)
      .eq("tribute_type", "flower")
      .then(({ count }) => setFlowerCount(count ?? 0));

    supabase
      .from("tributes")
      .select("tribute_type", { count: "exact" })
      .eq("person_id", personId)
      .eq("tribute_type", "candle")
      .then(({ count }) => setCandleCount(count ?? 0));
  }, [personId]);

  const giveFlower = async () => {
    if (givenFlower || loading) return;
    setLoading("flower");
    const { error } = await supabase.from("tributes").insert({
      person_id: personId,
      tribute_type: "flower",
      flower_count: 1,
    });
    if (!error) {
      setFlowerCount((c) => c + 1);
      setGivenFlower(true);
      sessionStorage.setItem(SESSION_KEY(personId, "flower"), "1");
      setJustGiven("flower");
      setTimeout(() => setJustGiven(null), 1800);
    }
    setLoading(null);
  };

  const giveCandle = async () => {
    if (givenCandles >= 2 || loading) return;
    setLoading("candle");
    const { error } = await supabase.from("tributes").insert({
      person_id: personId,
      tribute_type: "candle",
      flower_count: 1,
    });
    if (!error) {
      setCandleCount((c) => c + 1);
      const next = givenCandles + 1;
      setGivenCandles(next);
      sessionStorage.setItem(SESSION_KEY(personId, "candle"), String(next));
      setJustGiven("candle");
      setTimeout(() => setJustGiven(null), 1800);
    }
    setLoading(null);
  };

  const tributeBoxStyle = "flex items-center gap-3 min-w-[160px]";

  return (
    <div className="flex items-center gap-8 flex-wrap">
      {/* ── Flower ── */}
      <div className={tributeBoxStyle}>
        <button
          onClick={giveFlower}
          disabled={givenFlower || loading === "flower"}
          title={givenFlower ? "You already left a flower" : "Leave a flower"}
          className={`flex items-center gap-3 px-5 py-3 text-sm font-bold tracking-wider uppercase border-2 rounded transition-all duration-200 disabled:opacity-60 ${
            justGiven === "flower" ? "scale-110" : ""
          }`}
          style={
            givenFlower
              ? { background: "#ec4899", borderColor: "#ec4899", color: "#fff" }
              : { background: "transparent", borderColor: "#ec4899", color: "#ec4899" }
          }
        >
          <span className="text-3xl drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]">🌹</span>
          <span className="text-xl font-bold font-mono" style={{ color: "hsl(0 0% 100%)" }}>
            {flowerCount.toLocaleString()}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-12 w-px" style={{ background: "hsl(var(--border))" }} />

      {/* ── Candle ── */}
      <div className={tributeBoxStyle}>
        <button
          onClick={giveCandle}
          disabled={givenCandles >= 2 || loading === "candle"}
          title={
            givenCandles >= 2
              ? "You lit 2 candles (max)"
              : `Light a candle (${2 - givenCandles} remaining)`
          }
          className={`flex items-center gap-3 px-5 py-3 text-sm font-bold tracking-wider uppercase border-2 rounded transition-all duration-200 disabled:opacity-60 ${
            justGiven === "candle" ? "scale-110" : ""
          }`}
          style={
            givenCandles >= 2
              ? { background: "#f59e0b", borderColor: "#f59e0b", color: "#fff" }
              : { background: "transparent", borderColor: "#f59e0b", color: "#f59e0b" }
          }
        >
          <span className="text-3xl drop-shadow-[0_0_10px_rgba(251,191,36,1)]">🕯️</span>
          <span className="text-xl font-bold font-mono" style={{ color: "hsl(0 0% 100%)" }}>
            {candleCount.toLocaleString()}
          </span>
        </button>
      </div>
    </div>
  );
};

export default TributeBar;
