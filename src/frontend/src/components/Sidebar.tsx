import {
  BarChart2,
  Briefcase,
  History,
  LayoutDashboard,
  Star,
  TrendingUp,
  Trophy,
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

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-sidebar border-r border-border h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <span className="text-teal font-bold text-xl tracking-tight">
          TradeZone
        </span>
        <div className="text-xs text-muted-foreground mt-0.5">
          Paper Trading
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ page, icon, label }) => (
          <button
            type="button"
            key={page}
            data-ocid={`sidebar.${page.toLowerCase()}.link`}
            onClick={() => setActivePage(page)}
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
  );
}
