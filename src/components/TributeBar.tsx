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
  const [givenCandles, setGivenCandles] = useState(0); // 0, 1, or 2
  const [loading, setLoading] = useState<"flower" | "candle" | null>(null);
  const [justGiven, setJustGiven] = useState<"flower" | "candle" | null>(null);

  // Restore session-local tribute state
  useEffect(() => {
    const f = sessionStorage.getItem(SESSION_KEY(personId, "flower")) === "1";
    const c = parseInt(sessionStorage.getItem(SESSION_KEY(personId, "candle")) || "0", 10);
    setGivenFlower(f);
    setGivenCandles(c);
  }, [personId]);

  // Fetch live counts from DB (both tribute types)
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

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* ── Flower tribute ── */}
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[2.5rem]">
          <div
            className="text-xl font-bold font-mono"
            style={{ color: "hsl(var(--oxblood-bright))" }}
          >
            {flowerCount.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground leading-tight">
            Flowers
          </div>
        </div>
        <button
          onClick={giveFlower}
          disabled={givenFlower || loading === "flower"}
          title={givenFlower ? "You already left a flower" : "Leave a flower"}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wider uppercase border-2 transition-all duration-200 disabled:opacity-60 ${
            justGiven === "flower" ? "scale-110" : ""
          }`}
          style={
            givenFlower
              ? {
                  background: "hsl(340 70% 42%)",
                  borderColor: "hsl(340 70% 42%)",
                  color: "#fff",
                }
              : {
                  background: "transparent",
                  borderColor: "hsl(340 70% 42%)",
                  color: "hsl(340 70% 42%)",
                }
          }
        >
          <span className="text-2xl drop-shadow-[0_0_6px_rgba(244,114,182,0.8)]">🌹</span>
          {givenFlower ? "Given" : "Give Flower"}
        </button>
      </div>

      {/* Divider */}
      <div className="h-10 w-px" style={{ background: "hsl(var(--border))" }} />

      {/* ── Candle tribute (up to 2) ── */}
      <div className="flex items-center gap-3">
        <div className="text-center min-w-[2.5rem]">
          <div
            className="text-xl font-bold font-mono"
            style={{ color: "hsl(38 85% 56%)" }}
          >
            {candleCount.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground leading-tight">
            Candles
          </div>
        </div>
        <div className="flex flex-col items-start gap-1">
          <button
            onClick={giveCandle}
            disabled={givenCandles >= 2 || loading === "candle"}
            title={
              givenCandles >= 2
                ? "You lit 2 candles (max)"
                : `Light a candle (${2 - givenCandles} remaining)`
            }
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wider uppercase border-2 transition-all duration-200 disabled:opacity-60 ${
              justGiven === "candle" ? "scale-110" : ""
            }`}
            style={
              givenCandles >= 2
                ? {
                    background: "hsl(38 85% 48%)",
                    borderColor: "hsl(38 85% 48%)",
                    color: "#fff",
                  }
                : {
                    background: "transparent",
                    borderColor: "hsl(38 85% 48%)",
                    color: "hsl(38 85% 48%)",
                  }
            }
          >
            <span className="text-base">{givenCandles >= 2 ? "🕯️" : "🕯"}</span>
            {givenCandles === 0
              ? "Light Candle"
              : givenCandles === 1
              ? "1 Lit · Light Another"
              : "Both Candles Lit"}
          </button>
          {/* Pip indicators */}
          <div className="flex gap-1 pl-1">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{
                  background:
                    givenCandles >= n
                      ? "hsl(38 85% 48%)"
                      : "hsl(var(--muted-foreground) / 0.3)",
                }}
              />
            ))}
            <span className="text-[9px] font-mono text-muted-foreground ml-1">
              {givenCandles}/2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TributeBar;
