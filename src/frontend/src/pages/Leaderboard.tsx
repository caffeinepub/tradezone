import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Medal, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "../hooks/useTradingData";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  userPortfolioValue: number;
  profile: { balance: number } | null;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    userId: "Dhairya-Devang-Shah",
    displayName: "DHAIRYA DEVANG SHAH",
    balance: 112000,
    portfolioValue: 23400,
  },
  {
    userId: "2vxky-m3abc",
    displayName: "",
    balance: 98000,
    portfolioValue: 31500,
  },
  {
    userId: "trader-xyz",
    displayName: "",
    balance: 87000,
    portfolioValue: 28000,
  },
  {
    userId: "aapl-bull-99",
    displayName: "",
    balance: 76000,
    portfolioValue: 19200,
  },
  {
    userId: "nifty-king-47",
    displayName: "",
    balance: 65000,
    portfolioValue: 15800,
  },
];

export function Leaderboard({
  leaderboard,
  currentUserId,
  userPortfolioValue,
  profile,
}: LeaderboardProps) {
  const data = leaderboard.length > 0 ? leaderboard : MOCK_LEADERBOARD;
  const balance = profile?.balance ?? 1000000;

  const enriched = data
    .map((e) => ({ ...e, total: e.balance + e.portfolioValue }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  function truncate(entry: LeaderboardEntry): string {
    // Prefer backend-provided display name
    if (entry.displayName) return entry.displayName;
    // Fallback: format the userId
    const id = entry.userId;
    if (id === "You") return "You";
    if (id === "Dhairya-Devang-Shah") return "DHAIRYA DEVANG SHAH";
    if (id.length > 12) return `${id.slice(0, 6)}...${id.slice(-4)}`;
    return id;
  }

  function rankIcon(rank: number) {
    if (rank === 1) return <Trophy size={14} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={14} className="text-gray-300" />;
    if (rank === 3) return <Medal size={14} className="text-amber-600" />;
    return (
      <span className="text-muted-foreground text-xs font-mono">#{rank}</span>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">🏆 Leaderboard</h1>
      <p className="text-sm text-muted-foreground">
        Top paper traders by total portfolio value
      </p>

      <div className="bg-card border border-border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground w-12">Rank</TableHead>
              <TableHead className="text-muted-foreground">Trader</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Balance
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                Portfolio Value
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                Total Value
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enriched.map((entry, i) => {
              const isCurrent =
                entry.userId === currentUserId || entry.userId === "You";
              return (
                <TableRow
                  key={entry.userId}
                  className={`border-border ${
                    isCurrent
                      ? "bg-teal/8 border-l-2 border-l-teal"
                      : "hover:bg-secondary/40"
                  }`}
                  data-ocid={`leaderboard.trader.item.${i + 1}`}
                >
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {rankIcon(i + 1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium text-sm ${
                          isCurrent ? "text-teal" : "text-foreground"
                        }`}
                      >
                        {truncate(entry)}
                      </span>
                      {isCurrent && (
                        <Badge className="text-[10px] px-1 py-0 bg-teal/20 text-teal border-0">
                          You
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    ₹{entry.balance.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-positive">
                    ₹{entry.portfolioValue.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-teal">
                    ₹{entry.total.toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Current user stats */}
      <div className="bg-card border border-teal/30 rounded-md p-4">
        <p className="text-xs text-muted-foreground mb-2">Your Stats</p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Balance: </span>
            <span className="font-mono font-semibold text-teal">
              ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Portfolio: </span>
            <span className="font-mono font-semibold text-positive">
              ₹
              {userPortfolioValue.toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Total: </span>
            <span className="font-mono font-semibold text-foreground">
              ₹
              {(balance + userPortfolioValue).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
