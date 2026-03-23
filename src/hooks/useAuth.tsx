import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Step 1: Get the current session so UI doesn't flicker
    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          try {
            const { data } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", currentSession.user.id)
              .single();
            if (!mountedRef.current) return;
            setRole((data?.role as AppRole) ?? "user");
          } catch {
            if (!mountedRef.current) return;
            setRole("user");
          }
        } else {
          setRole(null);
        }
      } catch {
        // ignore
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    init();

    // Step 2: Listen for future auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mountedRef.current) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid lock contention — releases the current lock first
          const uid = newSession.user.id;
          setTimeout(async () => {
            if (!mountedRef.current) return;
            try {
              const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", uid)
                .single();
              if (!mountedRef.current) return;
              setRole((data?.role as AppRole) ?? "user");
            } catch {
              if (!mountedRef.current) return;
              setRole("user");
            } finally {
              if (mountedRef.current) setLoading(false);
            }
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
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
