import {
  BarChart2,
  Briefcase,
  History,
  LayoutDashboard,
  Star,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

export type Page =
  | "Dashboard"
  | "Markets"
  | "FnO"
  | "Portfolio"
  | "History"
  | "Watchlist"
  | "Leaderboard";

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { page: Page; icon: React.ReactNode; label: string }[] = [
  {
    page: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
  },
  { page: "Markets", icon: <TrendingUp size={18} />, label: "Markets" },
  { page: "FnO", icon: <BarChart2 size={18} />, label: "F&O" },
  { page: "Portfolio", icon: <Briefcase size={18} />, label: "Portfolio" },
  { page: "History", icon: <History size={18} />, label: "History" },
  { page: "Watchlist", icon: <Star size={18} />, label: "Watchlist" },
  { page: "Leaderboard", icon: <Trophy size={18} />, label: "Leaderboard" },
];

export function Sidebar({
  activePage,
  setActivePage,
  isMobile,
  isOpen,
  onClose,
}: SidebarProps) {
  if (isMobile && !isOpen) return null;

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          role="button"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={`${
          isMobile ? "fixed left-0 top-0 h-full z-50" : "relative"
        } w-56 flex-shrink-0 flex flex-col bg-sidebar border-r border-border h-screen`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-teal font-bold text-xl tracking-tight">
              TradeZone
            </span>
            <div className="text-xs text-muted-foreground mt-0.5">
              Paper Trading
            </div>
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ page, icon, label }) => (
            <button
              type="button"
              key={page}
              data-ocid={`sidebar.${page.toLowerCase()}.link`}
              onClick={() => {
                setActivePage(page);
                if (isMobile) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activePage === page
                  ? "bg-teal/15 text-teal"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-tight">
            TradeZone by
            <br />
            <span className="text-foreground/70 font-medium">
              Dhairya Devang Shah
            </span>
          </p>
        </div>
      </aside>
    </>
  );
}
