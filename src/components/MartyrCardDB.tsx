import { Link } from "react-router-dom";
import { type PersonRow } from "@/hooks/usePersons";
import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface MartyrCardDBProps {
  person: PersonRow;
  index?: number;
}

function formatYear(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch {
    return dateStr;
  }
}

const SESSION_KEY = (id: string, type: string) => `tribute_${type}_${id}`;

const MartyrCardDB = ({ person, index = 0 }: MartyrCardDBProps) => {
  const staggerClass = index < 8 ? `stagger-${(index % 8) + 1}` : "";
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  // Tribute state
  const [flowerCount, setFlowerCount] = useState(0);
  const [candleCount, setCandleCount] = useState(0);
  const [givenFlower, setGivenFlower] = useState(false);
  const [givenCandle, setGivenCandle] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  // Load tribute counts
  useEffect(() => {
    if (!person.id) return;
    supabase
      .from("tributes")
      .select("tribute_type", { count: "exact" })
      .eq("person_id", person.id)
      .eq("tribute_type", "flower")
      .then(({ count }) => setFlowerCount(count ?? 0));
    supabase
      .from("tributes")
      .select("tribute_type", { count: "exact" })
      .eq("person_id", person.id)
      .eq("tribute_type", "candle")
      .then(({ count }) => setCandleCount(count ?? 0));

    setGivenFlower(sessionStorage.getItem(SESSION_KEY(person.id, "flower")) === "1");
    setGivenCandle(sessionStorage.getItem(SESSION_KEY(person.id, "candle")) === "1");
  }, [person.id]);

  const giveFlower = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (givenFlower || loading) return;
    setLoading("flower");
    const { error } = await supabase.from("tributes").insert({
      person_id: person.id,
      tribute_type: "flower",
      flower_count: 1,
    });
    if (!error) {
      setFlowerCount((c) => c + 1);
      setGivenFlower(true);
      sessionStorage.setItem(SESSION_KEY(person.id, "flower"), "1");
    }
    setLoading(null);
  };

  const giveCandle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (givenCandle || loading) return;
    setLoading("candle");
    const { error } = await supabase.from("tributes").insert({
      person_id: person.id,
      tribute_type: "candle",
      flower_count: 1,
    });
    if (!error) {
      setCandleCount((c) => c + 1);
      setGivenCandle(true);
      sessionStorage.setItem(SESSION_KEY(person.id, "candle"), "1");
    }
    setLoading(null);
  };

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, WebP, or GIF image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5 MB." });
      return;
    }
    setUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1200;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
      );
      const path = `${person.id}-${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("person-photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("person-photos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { data: result, error: rpcErr } = await (supabase.rpc as any)("set_person_photo", {
        _person_id: person.id,
        _photo_url: publicUrl,
      });
      if (rpcErr) throw rpcErr;

      if (result === "approved") {
        setLocalPhotoUrl(publicUrl);
        toast({ title: "Photo updated!", description: "The profile photo has been updated." });
      } else {
        // Show preview locally but don't persist — it's pending
        setLocalPhotoUrl(publicUrl);
        toast({
          title: "Photo submitted for review",
          description: "An admin will review your photo before it goes live. Thank you!",
        });
        // Revert preview after a moment so the card shows the original state
        setTimeout(() => setLocalPhotoUrl(null), 4000);
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Please try again." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [person.id]);

  const displayPhotoUrl = localPhotoUrl || person.photo_url;

  const genderColor =
    person.gender === "Female" ? "#EC4899" :
    person.gender === "Male" ? "#3B82F6" :
    "transparent";

  return (
    <Link
      to={`/martyr/${person.slug}`}
      className={`opacity-0 animate-fade-scale ${staggerClass} group block`}
    >
      <article
        className="relative overflow-hidden cursor-pointer rounded-sm"
        style={{ aspectRatio: "2/3" }}
      >
        {/* Gender-colored frame */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            border: `3px solid ${genderColor}`,
            borderRadius: "inherit",
          }}
        />

        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          capture="environment"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Portrait */}
        {displayPhotoUrl ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              ref={imgRef}
              src={displayPhotoUrl}
              alt={`${person.first_name} ${person.last_name}`}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              decoding="async"
              fetchPriority={index < 6 ? "high" : "low"}
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 z-10 cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              background: "linear-gradient(145deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)",
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!uploading) fileInputRef.current?.click();
            }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span
                  className="text-[9px] font-mono uppercase tracking-wider"
                  style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
                >
                  Uploading…
                </span>
              </div>
            ) : (
              <>
                {/* Silhouette frame */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    border: "2px dashed hsl(var(--muted-foreground) / 0.3)",
                    background: "hsl(var(--muted-foreground) / 0.05)",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="opacity-25"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span
                  className="text-[9px] font-mono uppercase tracking-wider text-center px-2 leading-tight"
                  style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
                >
                  Add Profile<br />Picture
                </span>
              </>
            )}
          </div>
        )}

        {/* Category badge — top left */}
        <div
          className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5"
          style={{ background: "hsl(var(--oxblood))" }}
        >
          <span
            className="text-[8px] font-mono font-bold tracking-widest uppercase"
            style={{ color: "hsl(35 25% 97%)" }}
          >
            {person.category || "—"}
          </span>
        </div>

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 z-10"
          style={{
            background:
              "linear-gradient(to top, rgba(15,10,8,0.97) 0%, rgba(15,10,8,0.85) 45%, rgba(15,10,8,0.0) 100%)",
            padding: "1.5rem 0.5rem 0.4rem",
          }}
        >
          <p
            className="text-[15px] font-semibold leading-tight mb-0.5 truncate"
            style={{ fontFamily: "'Fraunces', serif", color: "#fff" }}
          >
            {person.first_name} {person.last_name}
          </p>
          <div className="flex items-center gap-1 text-[12px] font-mono font-bold mb-1.5">
            <span style={{ color: "hsl(45 90% 65%)" }}>
              {formatYear(person.date_of_birth)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>–</span>
            <span style={{ color: "hsl(45 90% 65%)" }}>
              {formatYear(person.date_of_death)}
            </span>
          </div>

          {/* Mini tribute buttons — flower left, candle right, equal size */}
          <div className="flex items-center justify-between w-full relative z-30">
            <button
              onClick={giveFlower}
              disabled={givenFlower || loading === "flower"}
              className="flex items-center gap-2 transition-all duration-200 disabled:opacity-60"
              title={givenFlower ? "Flower given" : "Give a flower"}
            >
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]">🌹</span>
              <span className="text-lg font-bold font-mono drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" style={{ color: "hsl(0 0% 100%)" }}>
                {flowerCount.toLocaleString()}
              </span>
            </button>
            <button
              onClick={giveCandle}
              disabled={givenCandle || loading === "candle"}
              className="flex items-center gap-2 transition-all duration-200 disabled:opacity-60"
              title={givenCandle ? "Candle lit" : "Light a candle"}
            >
              <span className="text-2xl drop-shadow-[0_0_10px_rgba(251,191,36,1)]">🕯️</span>
              <span className="text-lg font-bold font-mono drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" style={{ color: "hsl(0 0% 100%)" }}>
                {candleCount.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MartyrCardDB;
