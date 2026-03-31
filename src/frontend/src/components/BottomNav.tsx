import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BarChart2,
  Briefcase,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Share2,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "./Sidebar";

interface BottomNavProps {
  activePage: Page;
  setActivePage: (p: Page) => void;
  onLogout: () => void;
}

const primaryTabs: { page: Page; icon: React.ReactNode; label: string }[] = [
  {
    page: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
  },
  { page: "Markets", icon: <TrendingUp size={20} />, label: "Markets" },
  { page: "FnO", icon: <BarChart2 size={20} />, label: "F&O" },
  { page: "Portfolio", icon: <Briefcase size={20} />, label: "Portfolio" },
];

const moreItems: { page: Page; icon: React.ReactNode; label: string }[] = [
  { page: "History", icon: <History size={18} />, label: "History" },
  { page: "Watchlist", icon: <Star size={18} />, label: "Watchlist" },
  { page: "Leaderboard", icon: <Trophy size={18} />, label: "Leaderboard" },
];

export function BottomNav({
  activePage,
  setActivePage,
  onLogout,
}: BottomNavProps) {
  const [open, setOpen] = useState(false);
  const isMoreActive = ["History", "Watchlist", "Leaderboard"].includes(
    activePage,
  );

  function handleInvite() {
    const link = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: "TradeZone by Dhairya Devang Shah",
          text: "Practice paper trading with real market prices! Join me on TradeZone.",
          url: link,
        })
        .catch(() => {
          /* user cancelled */
        });
    } else {
      navigator.clipboard.writeText(link).then(() => {
        toast.success("Link copied!", {
          description: "Share it with your friends to invite them.",
        });
      });
    }
    setOpen(false);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-ocid="bottom.nav"
    >
      {primaryTabs.map(({ page, icon, label }) => (
        <button
          key={page}
          type="button"
          data-ocid={`bottom.${page.toLowerCase()}.tab`}
          onClick={() => setActivePage(page)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
            activePage === page
              ? "text-teal"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className={`${
              activePage === page ? "text-teal" : "text-muted-foreground"
            }`}
          >
            {icon}
          </span>
          {label}
        </button>
      ))}

      {/* More — Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            data-ocid="bottom.more.open_modal_button"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isMoreActive
                ? "text-teal"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Menu
              size={20}
              className={isMoreActive ? "text-teal" : "text-muted-foreground"}
            />
            More
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-card border-t border-border rounded-t-2xl"
          data-ocid="bottom.more.sheet"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-teal text-lg font-bold">
              More
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pb-6">
            {moreItems.map(({ page, icon, label }) => (
              <button
                key={page}
                type="button"
                data-ocid={`bottom.more.${page.toLowerCase()}.link`}
                onClick={() => {
                  setActivePage(page);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${
                  activePage === page
                    ? "bg-teal/15 text-teal"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}

            {/* Invite a Friend */}
            <button
              type="button"
              data-ocid="bottom.more.invite.button"
              onClick={handleInvite}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Share2 size={18} />
              Invite a Friend
            </button>

            <div className="pt-2 border-t border-border mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-4 px-4 py-3.5 h-auto text-sm font-medium rounded-xl"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                data-ocid="bottom.more.logout.button"
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
