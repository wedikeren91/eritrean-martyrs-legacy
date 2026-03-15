import { useState, useEffect } from "react";

interface FlowerRatingProps {
  martyrId: string;
  size?: "sm" | "md";
}

const FLOWERS = ["🌹", "🌸", "🌺", "🌼", "🌻"];
const MAX_FLOWERS = 5;

const FlowerRating = ({ martyrId, size = "md" }: FlowerRatingProps) => {
  const storageKey = `flowers_${martyrId}`;
  const totalKey = `flowers_total_${martyrId}`;

  const [hovered, setHovered] = useState<number | null>(null);
  const [given, setGiven] = useState(0);
  const [total, setTotal] = useState(0);
  const [justGiven, setJustGiven] = useState(false);

  useEffect(() => {
    const savedGiven = parseInt(localStorage.getItem(storageKey) || "0", 10);
    const savedTotal = parseInt(localStorage.getItem(totalKey) || String(Math.floor(Math.random() * 24) + 1), 10);
    setGiven(savedGiven);
    setTotal(savedTotal);
    if (!localStorage.getItem(totalKey)) {
      localStorage.setItem(totalKey, String(savedTotal));
    }
  }, [martyrId]);

  const handleGive = (count: number) => {
    if (given > 0) return; // already given
    const newTotal = total + count;
    setGiven(count);
    setTotal(newTotal);
    localStorage.setItem(storageKey, String(count));
    localStorage.setItem(totalKey, String(newTotal));
    setJustGiven(true);
    setTimeout(() => setJustGiven(false), 1500);
  };

  const displayCount = hovered !== null && given === 0 ? hovered : given > 0 ? given : 0;
  const btnSize = size === "sm" ? "text-sm" : "text-xl";
  const gapSize = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div className="flex flex-col items-start">
      <div className={`flex ${gapSize} items-center`}>
        {Array.from({ length: MAX_FLOWERS }).map((_, i) => {
          const pos = i + 1;
          const isFilled = pos <= displayCount;
          const isGiven = given > 0 && pos <= given;
          return (
            <button
              key={i}
              disabled={given > 0}
              onClick={() => handleGive(pos)}
              onMouseEnter={() => given === 0 && setHovered(pos)}
              onMouseLeave={() => setHovered(null)}
              title={given > 0 ? "You've already given flowers" : `Give ${pos} flower${pos > 1 ? "s" : ""}`}
              className={`transition-all duration-150 leading-none select-none
                ${given > 0 ? "cursor-default" : "cursor-pointer hover:scale-125 active:scale-110"}
                ${isFilled ? "opacity-100" : "opacity-20"}
                ${isGiven && justGiven ? "animate-bounce" : ""}
                ${btnSize}
              `}
              style={{ filter: isFilled ? "none" : "grayscale(1)" }}
            >
              🌹
            </button>
          );
        })}
      </div>
      <div className="text-[9px] font-mono text-muted-foreground mt-0.5 tracking-wide">
        {total} {total === 1 ? "tribute" : "tributes"}
        {given > 0 && <span className="text-primary ml-1">· yours included</span>}
      </div>
    </div>
  );
};

export default FlowerRating;
