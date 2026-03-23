import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "user" | "contributor" | "org_admin" | "founder";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isFounder: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, role: null, loading: true,
  isFounder: false, isAdmin: false, isContributor: false,
  signOut: async () => {},
});

async function fetchRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return (data?.role as AppRole) ?? "user";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on mount,
    // so we do NOT also call getSession() — that caused a double-lock freeze.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer the role fetch slightly so the auth lock is released first
          const r = await fetchRole(newSession.user.id);
          setRole(r);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, loading,
      isFounder: role === "founder",
      isAdmin: role === "founder" || role === "org_admin",
      isContributor: role === "founder" || role === "org_admin" || role === "contributor",
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
