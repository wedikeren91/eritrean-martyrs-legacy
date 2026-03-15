import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const SiteHeader = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const navLinks = [
    { to: "/archive", label: "Archive" },
    { to: "/browse", label: "Browse" },
    { to: "/contributors", label: "Contributors" },
    { to: "/install", label: "Install App", mobileOnly: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
            className="transition-opacity duration-300 group-hover:opacity-80">
            <rect x="1" y="1" width="26" height="26" stroke="hsl(0 75% 35%)" strokeWidth="1.5" />
            <rect x="5" y="5" width="18" height="18" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
            <line x1="14" y1="5" x2="14" y2="23" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
            <line x1="5" y1="14" x2="23" y2="14" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
            <circle cx="14" cy="14" r="2.5" fill="hsl(0 75% 35%)" />
          </svg>
          <div>
            <div className="display-sm text-sm font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
              Eritrean Martyrs Archive
            </div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase" style={{ fontSize: "0.6rem" }}>
              1961 — 1991 · The Struggle
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}
              className={`text-xs font-medium tracking-widest uppercase transition-colors duration-200 underline-offset-4 decoration-1
                ${pathname === link.to
                  ? "text-primary underline"
                  : "text-muted-foreground hover:text-foreground hover:underline"
                }`}>
              {link.label}
            </Link>
          ))}

          {/* Admin link */}
          {isAdmin && (
            <Link to="/admin"
              className={`text-xs font-medium tracking-widest uppercase transition-colors duration-200 underline-offset-4 decoration-1
                ${pathname.startsWith("/admin")
                  ? "text-primary underline"
                  : "text-muted-foreground hover:text-foreground hover:underline"
                }`}>
              Admin
            </Link>
          )}

          {/* Auth */}
          <div className="ml-2 flex items-center gap-3">
            {user ? (
              <button onClick={handleSignOut}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider uppercase border border-border px-3 py-1.5 hover:border-foreground">
                Sign Out
              </button>
            ) : (
              <Link to="/auth"
                className="text-xs font-semibold tracking-widest uppercase bg-primary text-primary-foreground px-4 py-1.5 hover:bg-primary/90 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
