import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Minimum required access level */
  require: "contributor" | "admin" | "founder";
}

/**
 * Role hierarchy:
 *  public      → unauthenticated visitor
 *  contributor → can submit records (role: contributor)
 *  admin       → can approve / moderate (role: org_admin or founder)
 *  founder     → full control (role: founder)
 */
export default function ProtectedRoute({ children, require }: ProtectedRouteProps) {
  const { user, loading, isAdmin, isFounder, isContributor } = useAuth();
  const location = useLocation();

  // Wait for session to resolve before making a redirect decision
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <svg
            className="animate-spin h-6 w-6 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-xs tracking-widest uppercase">Checking access…</span>
        </div>
      </div>
    );
  }

  // Not logged in at all → send to /auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  const hasAccess =
    require === "contributor" ? isContributor :
    require === "admin"       ? isAdmin :
    require === "founder"     ? isFounder :
    false;

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
