import { Button } from "@/components/ui/button";
import { IndianRupee, LogOut, User } from "lucide-react";

interface TopBarProps {
  onLogout: () => void;
  balance: number;
}

export function TopBar({ onLogout, balance }: TopBarProps) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="text-teal font-bold text-lg tracking-tight">
          TradeZone
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-md">
          <IndianRupee size={14} className="text-teal" />
          <span className="text-sm font-mono font-semibold text-teal">
            {balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User size={16} className="text-muted-foreground" />
          <span className="hidden sm:block text-foreground font-medium text-xs">
            DHAIRYA DEVANG SHAH
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          data-ocid="topbar.logout.button"
          className="hidden md:flex text-muted-foreground hover:text-negative"
        >
          <LogOut size={16} />
          <span className="ml-1.5">Logout</span>
        </Button>
      </div>
    </header>
  );
}
