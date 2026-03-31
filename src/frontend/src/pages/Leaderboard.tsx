import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Medal, RefreshCw, Trophy, Users } from "lucide-react";
import type { LeaderboardEntry } from "../hooks/useTradingData";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  userPortfolioValue: number;
  profile: { balance: number } | null;
  onRefresh?: () => Promise<void>;
}

export function Leaderboard({
  leaderboard,
  currentUserId,
  userPortfolioValue,
  profile,
  onRefresh,
}: LeaderboardProps) {
  const balance = profile?.balance ?? 1000000;

  const STARTING_BALANCE = 1_000_000;

  const enriched = leaderboard
    .map((e) => {
      const total = e.balance + e.portfolioValue;
      const returnPct = ((total - STARTING_BALANCE) / STARTING_BALANCE) * 100;
      return { ...e, total, return: returnPct };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  function truncate(entry: LeaderboardEntry): string {
    if (entry.displayName) return entry.displayName;
    const id = entry.userId;
    if (id === "You") return "You";
    // Show readable fallback for unnamed users
    return `Trader #${id.slice(-4)}`;
  }

  function rankIcon(rank: number) {
    if (rank === 1) return <Trophy size={14} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={14} className="text-gray-300" />;
    if (rank === 3) return <Medal size={14} className="text-amber-600" />;
    return (
      <span className="text-muted-foreground text-xs font-mono">#{rank}</span>
    );
  }

  const userReturn =
    ((balance + userPortfolioValue - STARTING_BALANCE) / STARTING_BALANCE) *
    100;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">🏆 Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Top paper traders by total portfolio value
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onRefresh()}
            className="gap-1.5 text-xs"
            data-ocid="leaderboard.secondary_button"
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        )}
      </div>

      {enriched.length === 0 ? (
        <div
          className="bg-card border border-border rounded-md flex flex-col items-center justify-center py-16 gap-3"
          data-ocid="leaderboard.empty_state"
        >
          <Users size={36} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            No traders yet — be the first!
          </p>
          <p className="text-muted-foreground/60 text-xs">
            Log in and save your name to appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-12">
                  Rank
                </TableHead>
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
                <TableHead className="text-muted-foreground text-right">
                  % Return
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
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        entry.return >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {entry.return >= 0 ? "+" : ""}
                      {entry.return.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Current user stats */}
      <div className="bg-card border border-teal/30 rounded-md p-4">
        <p className="text-xs text-muted-foreground mb-2">Your Stats</p>
        <div className="flex flex-wrap gap-6 text-sm">
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
          <div>
            <span className="text-muted-foreground">Return: </span>
            <span
              className={`font-mono font-semibold ${
                userReturn >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {userReturn >= 0 ? "+" : ""}
              {userReturn.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
