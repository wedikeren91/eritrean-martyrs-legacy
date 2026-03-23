import { useState } from "react";
import { useNavigate, Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup" | "forgot";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  // Already signed in → go back to where they came from (or home)
  if (!loading && user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: "error", text: error.message });
      else navigate("/");
    } else if (mode === "signup") {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
          emailRedirectTo: redirectTo,
        },
      });
      if (error) setMessage({ type: "error", text: error.message });
      else setMessage({ type: "success", text: `Check your email for a verification link. Once you click it you'll be taken back here to sign in. (Make sure to open the link on the same device.)` });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setMessage({ type: "error", text: error.message });
      else setMessage({ type: "success", text: "Password reset link sent — check your email." });
    }
    setLoading(false);
  };

  const titles = { login: "Sign In", signup: "Create Account", forgot: "Reset Password" };

  return (
    <div className="min-h-screen bg-background grain-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="data-label text-primary mb-1">Horeos Directory</div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
              {titles[mode]}
            </h1>
          </Link>
        </div>

        <div className="bg-card border border-border">
          {/* Top accent */}
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

            {mode === "signup" && (
              <div>
                <label className="data-label block mb-1.5">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Miriam Tesfaye"
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            )}

            <div>
              <label className="data-label block mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="data-label block mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 text-xs font-semibold tracking-widest uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait…" : titles[mode]}
            </button>

            <div className="flex flex-col gap-2 pt-2 text-center text-xs text-muted-foreground">
              {mode === "login" && (
                <>
                  <button type="button" onClick={() => { setMode("forgot"); setMessage(null); }}
                    className="hover:text-foreground transition-colors underline underline-offset-4">
                    Forgot password?
                  </button>
                  <span>
                    No account?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setMessage(null); }}
                      className="text-foreground font-semibold hover:text-primary transition-colors">
                      Create one
                    </button>
                  </span>
                </>
              )}
              {mode === "signup" && (
                <span>
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setMode("login"); setMessage(null); }}
                    className="text-foreground font-semibold hover:text-primary transition-colors">
                    Sign in
                  </button>
                </span>
              )}
              {mode === "forgot" && (
                <button type="button" onClick={() => { setMode("login"); setMessage(null); }}
                  className="hover:text-foreground transition-colors underline underline-offset-4">
                  ← Back to sign in
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
