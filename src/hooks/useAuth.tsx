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

    // Step 1: Get the current session synchronously-ish so the UI doesn't flicker
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mountedRef.current) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentSession.user.id)
          .single()
          .then(({ data }) => {
            if (!mountedRef.current) return;
            setRole((data?.role as AppRole) ?? "user");
            setLoading(false);
          })
          .catch(() => {
            if (!mountedRef.current) return;
            setRole("user");
            setLoading(false);
          });
      } else {
        setRole(null);
        setLoading(false);
      }
    }).catch(() => {
      if (!mountedRef.current) return;
      setLoading(false);
    });

    // Step 2: Listen for future auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mountedRef.current) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid lock contention — releases the current lock first
          setTimeout(() => {
            if (!mountedRef.current) return;
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", newSession.user.id)
              .single()
              .then(({ data }) => {
                if (!mountedRef.current) return;
                setRole((data?.role as AppRole) ?? "user");
                setLoading(false);
              })
              .catch(() => {
                if (!mountedRef.current) return;
                setRole("user");
                setLoading(false);
              });
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
