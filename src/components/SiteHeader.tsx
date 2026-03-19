import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { X, Menu } from "lucide-react";

const SiteHeader = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/archive", label: "Archive" },
    { to: "/browse", label: "Browse" },
    { to: "/contributors", label: "Contributors" },
    { to: "/org/start", label: "Start Your Archive" },
    { to: "/install", label: "Install App" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none"
              className="transition-opacity duration-300 group-hover:opacity-80 shrink-0">
              <rect x="1" y="1" width="26" height="26" stroke="hsl(0 75% 35%)" strokeWidth="1.5" />
              <rect x="5" y="5" width="18" height="18" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
              <line x1="14" y1="5" x2="14" y2="23" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
              <line x1="5" y1="14" x2="23" y2="14" stroke="hsl(0 75% 35%)" strokeWidth="0.75" />
              <circle cx="14" cy="14" r="2.5" fill="hsl(0 75% 35%)" />
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate" style={{ fontFamily: "'Fraunces', serif" }}>
                Eritrean Martyrs Archive
              </div>
              <div className="text-muted-foreground tracking-widest uppercase hidden sm:block" style={{ fontSize: "0.55rem" }}>
                1961 — 1991 · The Struggle
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.slice(1, 5).map((link) => (
              <Link key={link.to} to={link.to}
                className={`text-xs font-medium tracking-widest uppercase transition-colors duration-200 underline-offset-4 decoration-1
                  ${pathname === link.to
                    ? "text-primary underline"
                    : "text-muted-foreground hover:text-foreground hover:underline"
                  }`}>
                {link.label}
              </Link>
            ))}
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
            <div className="ml-1">
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

          {/* Mobile — hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] shrink-0"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={22} className="text-foreground" />
            ) : (
              <>
                <span className="block w-6 h-[1.5px] bg-foreground" />
                <span className="block w-6 h-[1.5px] bg-foreground" />
                <span className="block w-6 h-[1.5px] bg-foreground" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 bg-background border-b border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="container mx-auto px-4 py-2 divide-y divide-border">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center py-4 text-sm font-medium tracking-widest uppercase transition-colors
                    ${pathname === link.to ? "text-primary" : "text-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center py-4 text-sm font-medium tracking-widest uppercase transition-colors
                    ${pathname.startsWith("/admin") ? "text-primary" : "text-foreground"}`}
                >
                  Admin
                </Link>
              )}
              <div className="py-4">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left text-sm font-medium tracking-widest uppercase text-muted-foreground"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center bg-primary text-primary-foreground py-3 text-sm font-semibold tracking-widest uppercase"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default SiteHeader;
