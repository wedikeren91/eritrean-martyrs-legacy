import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Grid2X2, PlusCircle } from "lucide-react";

const tabs = [
  {
    to: "/",
    label: "Home",
    icon: Home,
    exact: true,
  },
  {
    to: "/archive",
    label: "Archive",
    icon: BookOpen,
    exact: false,
  },
  {
    to: "/browse",
    label: "Browse",
    icon: Grid2X2,
    exact: false,
  },
  {
    to: "/contribute",
    label: "Contribute",
    icon: PlusCircle,
    exact: false,
  },
];

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {tabs.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 transition-colors duration-150
                ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.6}
                className="transition-all duration-150"
              />
              <span
                className="text-[10px] font-medium tracking-widest uppercase"
                style={{ letterSpacing: "0.06em" }}
              >
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
