import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-6 py-16 max-w-lg">
        {/* Icon */}
        <div className="flex justify-center mb-10">
          <div
            className="w-24 h-24 flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}
          >
            <svg width="52" height="52" viewBox="0 0 28 28" fill="none">
              <rect x="1" y="1" width="26" height="26" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" />
              <rect x="5" y="5" width="18" height="18" stroke="hsl(var(--primary-foreground))" strokeWidth="0.75" />
              <line x1="14" y1="5" x2="14" y2="23" stroke="hsl(var(--primary-foreground))" strokeWidth="0.75" />
              <line x1="5" y1="14" x2="23" y2="14" stroke="hsl(var(--primary-foreground))" strokeWidth="0.75" />
              <circle cx="14" cy="14" r="2.5" fill="hsl(var(--primary-foreground))" />
            </svg>
          </div>
        </div>

        <h1
          className="display-title text-3xl text-center mb-2 text-foreground"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Eritrean Martyrs Archive
        </h1>
        <p className="text-center text-xs tracking-widest uppercase text-muted-foreground mb-10">
          1961 — 1991 · The Struggle
        </p>

        <hr className="rule-primary mb-10" />

        {isInstalled ? (
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-foreground font-medium">App is already installed.</p>
            <p className="text-sm text-muted-foreground">
              You can find it on your home screen or app drawer.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 text-xs font-semibold tracking-widest uppercase bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors"
            >
              Open Archive
            </Link>
          </div>
        ) : isIOS ? (
          /* iOS instructions — no programmatic prompt available */
          <div className="space-y-6">
            <p className="text-sm text-foreground leading-relaxed">
              Install this app on your iPhone or iPad for fast, offline access to the archive.
            </p>
            <ol className="space-y-4">
              {[
                {
                  step: "1",
                  text: 'Tap the Share button at the bottom of your browser (the square with an arrow pointing up).',
                },
                {
                  step: "2",
                  text: 'Scroll down and tap "Add to Home Screen".',
                },
                {
                  step: "3",
                  text: 'Tap "Add" in the top-right corner.',
                },
              ].map(({ step, text }) => (
                <li key={step} className="flex gap-4 items-start">
                  <span
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    {step}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : deferredPrompt ? (
          /* Android / Chrome — native install prompt */
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Install the app for fast, offline access to the archive — no app store required.
            </p>
            <ul className="text-sm text-muted-foreground text-left space-y-2 mb-8">
              {[
                "Works offline — browse the archive without internet",
                "Installs directly on your home screen",
                "Loads instantly like a native app",
                "No app store required",
              ].map((item) => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="text-primary mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleInstall}
              className="w-full text-sm font-semibold tracking-widest uppercase bg-primary text-primary-foreground px-6 py-4 hover:bg-primary/90 transition-colors"
            >
              Install App
            </button>
          </div>
        ) : (
          /* Already dismissed or not supported */
          <div className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To install this app, open it in your browser and look for the install option in your
              browser's menu (usually three dots "⋮" → "Install app" or "Add to Home Screen").
            </p>
            <Link
              to="/"
              className="inline-block mt-4 text-xs font-semibold tracking-widest uppercase bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors"
            >
              Continue to Archive
            </Link>
          </div>
        )}

        <hr className="rule-primary mt-12 mb-8" />

        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/browse", label: "Browse Archive" },
            { to: "/archive", label: "Full Archive" },
            { to: "/contributors", label: "Contributors" },
            { to: "/auth", label: "Sign In" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-center text-xs tracking-widest uppercase border border-border text-muted-foreground px-4 py-3 hover:border-foreground hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Install;
