import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { formatPrice, getInstrument } from "../data/instruments";
import type { Trade } from "../hooks/useTradingData";

interface HistoryProps {
  history: Trade[];
}

export function History({ history }: HistoryProps) {
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const sorted = [...history].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );
  const filtered = sorted.filter((t) => {
    const symMatch =
      !filterSymbol ||
      t.symbol.toLowerCase().includes(filterSymbol.toLowerCase());
    const actMatch =
      filterAction === "all" ||
      t.action.toLowerCase() === filterAction.toLowerCase();
    return symMatch && actMatch;
  });

  function formatTs(ts: bigint): string {
    const ms = Number(ts) / 1_000_000;
    if (!Number.isFinite(ms) || ms === 0) return "—";
    return new Date(ms).toLocaleString("en-IN");
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Trade History</h1>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Filter by symbol..."
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value)}
          className="w-44 bg-secondary border-border text-sm"
          data-ocid="history.search.input"
        />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger
            className="w-32 bg-secondary border-border"
            data-ocid="history.action.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="buy">Buy</SelectItem>
            <SelectItem value="sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div
          className="bg-card border border-border rounded-md p-12 text-center"
          data-ocid="history.empty_state"
        >
          <p className="text-muted-foreground">
            No trades yet. Place your first paper trade!
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {[
                  "Date/Time",
                  "Symbol",
                  "Action",
                  "Qty",
                  "Price",
                  "Total Value",
                ].map((h) => (
                  <TableHead key={h} className="text-muted-foreground text-xs">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, i) => {
                const inst = getInstrument(t.symbol);
                const currency = inst?.currency ?? "USD";
                return (
                  <TableRow
                    key={`${t.symbol}-${i}`}
                    className="border-border hover:bg-secondary/40"
                    data-ocid={`history.trade.item.${i + 1}`}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTs(t.timestamp)}
                    </TableCell>
                    <TableCell className="font-semibold text-teal text-sm">
                      {t.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border-0 ${
                          t.action.toLowerCase() === "buy"
                            ? "bg-positive/15 text-positive"
                            : "bg-negative/15 text-negative"
                        }`}
                      >
                        {t.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {t.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {formatPrice(t.price, currency)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-teal">
                      {formatPrice(t.price * t.quantity, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
