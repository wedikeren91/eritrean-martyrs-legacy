import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──────────────────────────────────────────────────────────────────
interface FormState {
  // Martyr identity
  first_name: string;
  last_name: string;
  known_as: string;
  gender: string;
  date_of_birth: string;
  date_of_death: string;
  // Location
  city: string;
  region: string;
  place_of_martyrdom: string;
  // Classification
  category: string;
  rank: string;
  role: string;
  battle: string;
  // Narrative
  bio: string;
  significance: string;
  quote: string;
  // Contributor
  relation: string;
}

const EMPTY: FormState = {
  first_name: "", last_name: "", known_as: "", gender: "",
  date_of_birth: "", date_of_death: "",
  city: "", region: "", place_of_martyrdom: "",
  category: "Martyr", rank: "", role: "", battle: "",
  bio: "", significance: "", quote: "",
  relation: "",
};

const ERITREAN_REGIONS = [
  "Anseba", "Debub", "Gash-Barka", "Maekel", "Northern Red Sea", "Southern Red Sea",
];

const CATEGORIES = ["Martyr", "ELF", "EPLF", "PLF", "Civilian", "Unknown", "Other"];

const WARS = [
  { value: "War of Liberation 1961–1991", label: "War of Liberation (1961–1991)" },
  { value: "War of 1998–2000", label: "Eritrea–Ethiopia War (1998–2000)" },
  { value: "Tigray War 2019–2022", label: "Tigray War (2019–2022)" },
  { value: "Other", label: "Other / Unknown" },
];

const RELATION_OPTIONS = [
  { value: "family_direct", label: "Direct family (parent / sibling / child)" },
  { value: "family_extended", label: "Extended family (uncle, aunt, cousin…)" },
  { value: "fellow_fighter", label: "Fellow liberation fighter / veteran" },
  { value: "community", label: "Community member / neighbour" },
  { value: "historian", label: "Historian / researcher / journalist" },
  { value: "diaspora", label: "Diaspora community member" },
  { value: "other", label: "Other" },
];

// ── Helper ─────────────────────────────────────────────────────────────────
function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="data-label block mb-1.5">
        {label} {required && <span className="text-primary normal-case font-normal">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/60";

// ── Main component ─────────────────────────────────────────────────────────
interface ContributeFormProps {
  onSuccess?: (submissionCount: number) => void;
  onCancel?: () => void;
}

type Step = "identity" | "details" | "photo" | "relation" | "review";
const STEPS: Step[] = ["identity", "details", "photo", "relation", "review"];
const STEP_LABELS: Record<Step, string> = {
  identity: "Name & Dates",
  details: "Location & Role",
  photo: "Photo",
  relation: "Your Connection",
  review: "Review & Submit",
};

export default function ContributeForm({ onSuccess, onCancel }: ContributeFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("identity");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v })), []);

  // ── Photo handling with compression ─────────────────────────────────────
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelected = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("Photo must be under 10 MB.");
      return;
    }
    setError(null);
    // Compress before preview
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    setUploading(true);
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("person-photos")
      .upload(path, photoFile, { upsert: false });
    setUploading(false);
    if (error) { setError("Photo upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("person-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Navigation ──────────────────────────────────────────────────────────
  const stepIdx = STEPS.indexOf(step);
  const isFirst = stepIdx === 0;
  const isLast = step === "review";

  const canAdvance = () => {
    if (step === "identity") return form.first_name.trim().length > 0 && form.last_name.trim().length > 0;
    if (step === "relation") return form.relation.length > 0;
    return true;
  };

  const next = () => {
    if (!canAdvance()) { setError("Please fill in the required fields."); return; }
    setError(null);
    setStep(STEPS[stepIdx + 1]);
  };
  const back = () => { setError(null); setStep(STEPS[stepIdx - 1]); };

  // ── Submission ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    setSubmitting(true);
    setError(null);

    const photoUrl = await uploadPhoto();
    if (uploading) return; // still uploading — wait

    const personData = {
      ...form,
      photo_url: photoUrl ?? undefined,
      status: "Deceased",
    };

    const { error: insertError } = await supabase.from("contributions").insert({
      user_id: user.id,
      person_data: personData as unknown as import("@/integrations/supabase/types").Json,
      source_type: "form",
      status: "pending",
    });

    setSubmitting(false);
    if (insertError) { setError(insertError.message); return; }
    onSuccess?.(1);
  };

  // ── Render helpers ──────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: Identity ─────────────────────────────────────────────
      case "identity":
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Start with the person's full name. Even partial information helps — fill in what you know.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required>
                <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)}
                  className={inputCls} placeholder="e.g. Hamid" autoComplete="off" />
              </Field>
              <Field label="Last Name" required>
                <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)}
                  className={inputCls} placeholder="e.g. Idris" autoComplete="off" />
              </Field>
            </div>
            <Field label="Known As" hint="Nickname or nom de guerre, if any">
              <input value={form.known_as} onChange={(e) => set("known_as", e.target.value)}
                className={inputCls} placeholder="Optional alias" />
            </Field>
            <Field label="Gender" required>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                className={inputCls}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth" hint="Approximate year is fine">
                <input type="text" value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                  className={inputCls} placeholder="e.g. 1945 or 1945-03" />
              </Field>
              <Field label="Date of Death" hint="Approximate year is fine">
                <input type="text" value={form.date_of_death}
                  onChange={(e) => set("date_of_death", e.target.value)}
                  className={inputCls} placeholder="e.g. 1975 or 1975-06" />
              </Field>
            </div>
            <Field label="Quote" hint="A memorable phrase attributed to this person, if known">
              <textarea value={form.quote} onChange={(e) => set("quote", e.target.value)}
                rows={2} className={`${inputCls} resize-none`}
                placeholder='"We fight not for ourselves but for those who come after…"' />
            </Field>
          </div>
        );

      // ── Step 2: Location & Role ──────────────────────────────────────
      case "details":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="City / Town">
                <input value={form.city} onChange={(e) => set("city", e.target.value)}
                  className={inputCls} placeholder="e.g. Keren" />
              </Field>
              <Field label="Region">
                <select value={form.region} onChange={(e) => set("region", e.target.value)}
                  className={inputCls}>
                  <option value="">Select…</option>
                  {ERITREAN_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="Other">Other / Unknown</option>
                </select>
              </Field>
            </div>
            <Field label="Place of Martyrdom">
              <input value={form.place_of_martyrdom}
                onChange={(e) => set("place_of_martyrdom", e.target.value)}
                className={inputCls} placeholder="Where did they fall?" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Rank">
                <input value={form.rank} onChange={(e) => set("rank", e.target.value)}
                  className={inputCls} placeholder="e.g. Commander" />
              </Field>
            </div>
            <Field label="Role / Profession">
              <input value={form.role} onChange={(e) => set("role", e.target.value)}
                className={inputCls} placeholder="e.g. Field medic, Teacher, Fighter" />
            </Field>
            <Field label="War / Conflict" hint="Select the conflict, then add specific battle name below if known">
              <select value={form.battle} onChange={(e) => set("battle", e.target.value)}
                className={inputCls}>
                <option value="">Select war / conflict…</option>
                {WARS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </Field>
            <Field label="Biography" hint="Share everything you know — dates, places, stories">
              <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)}
                rows={5} className={`${inputCls} resize-none`}
                placeholder="Tell their story…" />
            </Field>
            <Field label="Historical Significance">
              <textarea value={form.significance} onChange={(e) => set("significance", e.target.value)}
                rows={3} className={`${inputCls} resize-none`}
                placeholder="Why is this person important to remember?" />
            </Field>
          </div>
        );

      // ── Step 3: Photo ────────────────────────────────────────────────
      case "photo":
        return (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              A photo makes this record come alive. Upload from your gallery or take one now.
              <br />Photos are reviewed before publication. Max 10 MB (JPG, PNG, WEBP).
            </p>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePhotoSelected(e.target.files[0])} />

            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview"
                  className="w-full max-h-72 object-contain bg-muted border border-border" />
                <button onClick={removePhoto}
                  className="absolute top-2 right-2 bg-background border border-border px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors">
                  Remove
                </button>
                <p className="text-[10px] text-muted-foreground mt-2">{photoFile?.name}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border p-8 flex flex-col items-center gap-2 text-center">
                <div className="text-4xl mb-1">📷</div>
                <p className="text-sm text-muted-foreground">No photo selected</p>
                <p className="text-[10px] text-muted-foreground">
                  Optional — you can submit without a photo
                </p>
              </div>
            )}

            {/* Mobile-friendly two-button layout */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 border border-border py-5 text-xs font-semibold tracking-wider uppercase text-foreground hover:bg-muted transition-colors">
                <span className="text-2xl">📸</span>
                Take Photo
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 border border-border py-5 text-xs font-semibold tracking-wider uppercase text-foreground hover:bg-muted transition-colors">
                <span className="text-2xl">🖼️</span>
                Choose File
              </button>
            </div>
          </div>
        );

      // ── Step 4: Relation ─────────────────────────────────────────────
      case "relation":
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your connection to this person helps our reviewers assess the credibility of the record.
            </p>
            <Field label="How do you know this person?" required>
              <select value={form.relation} onChange={(e) => set("relation", e.target.value)}
                className={inputCls}>
                <option value="">Select…</option>
                {RELATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            {!user && (
              <div className="bg-muted border border-border p-4 flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">🔒</span>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Sign in to save your contribution</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    You can still submit as a guest, but signing in lets you track your submissions,
                    earn badges, and be listed as a contributor.
                  </p>
                  <a href="/auth"
                    className="inline-block mt-3 text-[10px] font-semibold tracking-widest uppercase bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors">
                    Sign In / Register →
                  </a>
                </div>
              </div>
            )}
          </div>
        );

      // ── Step 5: Review ───────────────────────────────────────────────
      case "review":
        return (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review your submission before sending. All records are reviewed by our team before
              being published to the archive.
            </p>

            {/* Summary card */}
            <div className="border border-border bg-card p-4 space-y-3">
              {/* Photo thumbnail */}
              {photoPreview && (
                <img src={photoPreview} alt=""
                  className="w-16 h-16 object-cover border border-border historical-photo" />
              )}

              <div>
                <p className="data-label mb-0.5">Full Name</p>
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {[form.first_name, form.last_name].filter(Boolean).join(" ")}
                  {form.known_as && <span className="text-muted-foreground font-normal text-xs"> "{form.known_as}"</span>}
                </p>
              </div>

              {(form.date_of_birth || form.date_of_death) && (
                <div className="grid grid-cols-2 gap-3">
                  {form.date_of_birth && (
                    <div><p className="data-label mb-0.5">Born</p><p className="text-xs text-foreground">{form.date_of_birth}</p></div>
                  )}
                  {form.date_of_death && (
                    <div><p className="data-label mb-0.5">Died</p><p className="text-xs text-foreground">{form.date_of_death}</p></div>
                  )}
                </div>
              )}

              {(form.city || form.region) && (
                <div>
                  <p className="data-label mb-0.5">Location</p>
                  <p className="text-xs text-foreground">{[form.city, form.region].filter(Boolean).join(", ")}</p>
                </div>
              )}

              {form.category && (
                <div className="flex gap-4 flex-wrap">
                  <div><p className="data-label mb-0.5">Category</p><p className="text-xs text-foreground">{form.category}</p></div>
                  {form.rank && <div><p className="data-label mb-0.5">Rank</p><p className="text-xs text-foreground">{form.rank}</p></div>}
                  {form.role && <div><p className="data-label mb-0.5">Role</p><p className="text-xs text-foreground">{form.role}</p></div>}
                </div>
              )}

              {form.bio && (
                <div>
                  <p className="data-label mb-0.5">Biography (excerpt)</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{form.bio}</p>
                </div>
              )}

              <div>
                <p className="data-label mb-0.5">Your Connection</p>
                <p className="text-xs text-foreground">
                  {RELATION_OPTIONS.find(o => o.value === form.relation)?.label ?? form.relation}
                </p>
              </div>

              {!photoPreview && (
                <p className="text-[10px] text-muted-foreground italic">No photo attached</p>
              )}
            </div>

            {/* Edit links */}
            <div className="flex flex-wrap gap-2">
              {STEPS.filter(s => s !== "review").map((s, i) => (
                <button key={s} onClick={() => setStep(s)}
                  className="text-[10px] tracking-widest uppercase text-primary hover:underline border border-primary/30 px-3 py-1">
                  Edit {STEP_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-background min-h-0">
      {/* ── Progress bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        {/* Step labels — scrollable on mobile */}
        <div className="flex overflow-x-auto scrollbar-none">
          {STEPS.map((s, i) => (
            <button key={s}
              disabled={i > stepIdx}
              onClick={() => i <= stepIdx && setStep(s)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 border-b-2 transition-colors text-[9px] tracking-widest uppercase font-semibold
                ${s === step
                  ? "border-primary text-primary"
                  : i < stepIdx
                  ? "border-transparent text-muted-foreground hover:text-foreground cursor-pointer"
                  : "border-transparent text-muted-foreground/40 cursor-not-allowed"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold
                ${s === step ? "bg-primary text-primary-foreground"
                  : i < stepIdx ? "bg-foreground/20 text-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < stepIdx ? "✓" : i + 1}
              </span>
              <span className="hidden sm:block">{STEP_LABELS[s]}</span>
            </button>
          ))}
        </div>
        {/* Continuous progress line */}
        <div className="h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────── */}
      <div className="p-5 pb-4">
        <div className="mb-5">
          <p className="data-label text-[9px] mb-0.5">Step {stepIdx + 1} of {STEPS.length}</p>
          <h2 className="text-xl text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
            {STEP_LABELS[step]}
          </h2>
        </div>

        {error && (
          <div className="mb-4 bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {renderStep()}
      </div>

      {/* ── Bottom navigation — fixed on mobile ───────────────────── */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 flex gap-3 items-center">
        {!isFirst ? (
          <button onClick={back}
            className="flex-shrink-0 border border-border px-5 py-3.5 text-xs font-semibold tracking-widest uppercase text-foreground hover:bg-muted transition-colors">
            ← Back
          </button>
        ) : (
          onCancel && (
            <button onClick={onCancel}
              className="flex-shrink-0 border border-border px-5 py-3.5 text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          )
        )}

        {isLast ? (
          <button onClick={handleSubmit}
            disabled={submitting || uploading}
            className="flex-1 bg-primary text-primary-foreground py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting || uploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-primary-foreground/60 border-t-primary-foreground rounded-full animate-spin" />
                {uploading ? "Uploading photo…" : "Submitting…"}
              </span>
            ) : "Submit for Review →"}
          </button>
        ) : (
          <button onClick={next}
            disabled={!canAdvance()}
            className="flex-1 bg-primary text-primary-foreground py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
