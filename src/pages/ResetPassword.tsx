import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setReady(true);
    else setMessage({ type: "error", text: "Invalid or expired reset link. Please request a new one." });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage({ type: "error", text: error.message });
    else {
      setMessage({ type: "success", text: "Password updated! Redirecting…" });
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background grain-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="data-label text-primary mb-1">Horeos Directory</div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
              Set New Password
            </h1>
          </Link>
        </div>
        <div className="bg-card border border-border">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {message && (
              <div className={`p-3 text-xs border ${
                message.type === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800"
              }`}>
                {message.text}
              </div>
            )}
            {ready && (
              <>
                <div>
                  <label className="data-label block mb-1.5">New Password *</label>
                  <input type="password" required minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <div>
                  <label className="data-label block mb-1.5">Confirm Password *</label>
                  <input type="password" required minLength={8} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {loading ? "Updating…" : "Update Password"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
