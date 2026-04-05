import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getPersonBySlug, type PersonRow } from "@/hooks/usePersons";

const WARS = [
  { value: "", label: "— Select conflict —" },
  { value: "War of Liberation 1961–1991", label: "War of Liberation (1961–1991)" },
  { value: "War of 1998–2000", label: "Eritrea–Ethiopia War (1998–2000)" },
  { value: "Tigray War 2019–2022", label: "Tigray War (2019–2022)" },
  { value: "Other", label: "Other / Unknown" },
];

type FormData = {
  first_name: string;
  last_name: string;
  known_as: string;
  date_of_birth: string;
  date_of_death: string;
  city: string;
  region: string;
  category: string;
  status: string;
  rank: string;
  role: string;
  battle: string;
  place_of_martyrdom: string;
  bio: string;
  significance: string;
  quote: string;
  gender: string;
};

export default function EditRecord() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isFounder, isAdmin, loading: authLoading } = useAuth();

  const [person, setPerson] = useState<PersonRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    first_name: "", last_name: "", known_as: "",
    date_of_birth: "", date_of_death: "",
    city: "", region: "", category: "", status: "",
    rank: "", role: "", battle: "", place_of_martyrdom: "",
    bio: "", significance: "", quote: "", gender: "Unknown",
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!slug) return;
    getPersonBySlug(slug).then((data) => {
      if (!data) { navigate("/admin"); return; }
      setPerson(data);
      setForm({
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        known_as: data.known_as ?? "",
        date_of_birth: data.date_of_birth ?? "",
        date_of_death: data.date_of_death ?? "",
        city: data.city ?? "",
        region: data.region ?? "",
        category: data.category ?? "",
        status: data.status ?? "",
        rank: data.rank ?? "",
        role: data.role ?? "",
        battle: data.battle ?? "",
        place_of_martyrdom: data.place_of_martyrdom ?? "",
        bio: data.bio ?? "",
        significance: data.significance ?? "",
        quote: data.quote ?? "",
        gender: data.gender ?? "Unknown",
      });
      setLoading(false);
    });
  }, [slug, navigate]);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !person) return;
    setUploadingPhoto(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${person.id}/portrait.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("person-photos")
      .upload(path, file, { upsert: true });
    if (upErr) { setError("Photo upload failed: " + upErr.message); setUploadingPhoto(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("person-photos").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("persons")
      .update({ photo_url: publicUrl })
      .eq("id", person.id);
    if (dbErr) { setError("Failed to save photo URL: " + dbErr.message); }
    else {
      setPerson((p) => p ? { ...p, photo_url: publicUrl } : p);
      setPhotoPreview(publicUrl);
    }
    setUploadingPhoto(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    const { error: err } = await supabase.from("persons").update({
      first_name: form.first_name,
      last_name: form.last_name,
      known_as: form.known_as || null,
      date_of_birth: form.date_of_birth || null,
      date_of_death: form.date_of_death || null,
      city: form.city || null,
      region: form.region || null,
      category: form.category || null,
      status: form.status || null,
      rank: form.rank || null,
      role: form.role || null,
      battle: form.battle || null,
      place_of_martyrdom: form.place_of_martyrdom || null,
      bio: form.bio || null,
      significance: form.significance || null,
      quote: form.quote || null,
    }).eq("id", person.id);
    if (err) setError(err.message);
    else setSaveSuccess(true);
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background grain-overlay flex items-center justify-center">
        <div className="data-label animate-pulse">Loading…</div>
      </div>
    );
  }

  const currentPhoto = photoPreview || person?.photo_url;

  return (
    <div className="min-h-screen bg-background grain-overlay">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="data-label text-muted-foreground hover:text-foreground transition-colors">
              ← Admin
            </Link>
            <div className="h-4 w-px bg-border" />
            {person && (
              <Link
                to={`/martyr/${person.slug}`}
                className="data-label text-muted-foreground hover:text-foreground transition-colors"
              >
                View Profile →
              </Link>
            )}
          </div>
          <div className="data-label text-primary">Edit Record</div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <h1 className="text-2xl mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          {person?.first_name} {person?.last_name}
        </h1>
        <p className="text-xs text-muted-foreground mb-8 font-mono">{person?.slug}</p>

        {/* ── Photo Section ── */}
        <div className="bg-card border border-border p-6 mb-6">
          <div className="data-label mb-4">Portrait Photo</div>
          <div className="flex items-start gap-6">
            <div className="w-32 h-40 flex-shrink-0 bg-muted overflow-hidden border border-border">
              {currentPhoto ? (
                <img src={currentPhoto} alt="Portrait" className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-20">👤</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Upload a portrait photo. JPG or PNG, ideally head-and-shoulders. The photo will be publicly visible on the profile page.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? "Uploading…" : currentPhoto ? "Replace Photo" : "Upload Photo"}
              </button>
              {uploadingPhoto && (
                <p className="text-xs text-muted-foreground mt-2 animate-pulse">Uploading photo…</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit Form ── */}
        <form onSubmit={handleSave}>
          {/* Identity */}
          <div className="bg-card border border-border p-6 mb-4">
            <div className="data-label mb-4">Identity</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="First Name *" value={form.first_name} onChange={set("first_name")} required />
              <Field label="Last Name *" value={form.last_name} onChange={set("last_name")} required />
              <Field label="Known As / Tegname" value={form.known_as} onChange={set("known_as")} />
              <Field label="Date of Birth" value={form.date_of_birth} onChange={set("date_of_birth")} placeholder="e.g. 1955-03-12" />
              <Field label="Date of Death" value={form.date_of_death} onChange={set("date_of_death")} placeholder="e.g. 1988-07-02" />
              <Field label="Status" value={form.status} onChange={set("status")} placeholder="e.g. Martyred" />
            </div>
          </div>

          {/* Location */}
          <div className="bg-card border border-border p-6 mb-4">
            <div className="data-label mb-4">Location</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="City of Origin" value={form.city} onChange={set("city")} />
              <Field label="Region" value={form.region} onChange={set("region")} />
              <Field label="Place of Martyrdom" value={form.place_of_martyrdom} onChange={set("place_of_martyrdom")} />
            </div>
          </div>

          {/* Service */}
          <div className="bg-card border border-border p-6 mb-4">
            <div className="data-label mb-4">Service Record</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Category / Organisation" value={form.category} onChange={set("category")} placeholder="e.g. EPLF" />
              <Field label="Role" value={form.role} onChange={set("role")} />
              <Field label="Rank" value={form.rank} onChange={set("rank")} />
              <div className="col-span-2 md:col-span-3">
                <label className="data-label block mb-1.5">War / Conflict</label>
                <select
                  value={form.battle}
                  onChange={set("battle")}
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                >
                  {WARS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div className="bg-card border border-border p-6 mb-6">
            <div className="data-label mb-4">Narrative</div>
            <div className="space-y-4">
              <TextArea label="Significance" value={form.significance} onChange={set("significance")} rows={2} placeholder="One-sentence historical importance shown on profile banner…" />
              <TextArea label="Biography" value={form.bio} onChange={set("bio")} rows={8} placeholder="Full biography…" />
              <Field label="Notable Quote" value={form.quote} onChange={set("quote")} placeholder="A quote attributed to this person…" />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="bg-card border border-border text-foreground text-xs px-4 py-3 mb-4">
              ✅ Record saved successfully.
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-8 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {person && (
              <Link
                to={`/martyr/${person.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Cancel & view profile
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reusable field components ─────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, required,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="data-label block mb-1.5">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
      />
    </div>
  );
}

function TextArea({
  label, value, onChange, rows, placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="data-label block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows ?? 4}
        placeholder={placeholder}
        className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-y"
      />
    </div>
  );
}
