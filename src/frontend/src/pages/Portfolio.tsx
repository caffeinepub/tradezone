import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, getInstrument } from "../data/instruments";
import type { Holding, Profile } from "../hooks/useTradingData";

interface PortfolioProps {
  prices: Record<string, number>;
  portfolio: Holding[];
  profile: Profile | null;
}

export function Portfolio({ prices, portfolio, profile }: PortfolioProps) {
  const balance = profile?.balance ?? 1000000;

  const enriched = portfolio
    .filter((h) => h.quantity > 0)
    .map((h) => {
      const inst = getInstrument(h.symbol);
      const currency = inst?.currency ?? "USD";
      const currentPrice = prices[h.symbol] ?? h.avgBuyPrice;
      const invested = h.avgBuyPrice * h.quantity;
      const currentValue = currentPrice * h.quantity;
      const pl = currentValue - invested;
      const plPct = (pl / invested) * 100;
      return {
        ...h,
        currentPrice,
        invested,
        currentValue,
        pl,
        plPct,
        currency,
      };
    });

  const totalInvested = enriched.reduce((s, h) => s + h.invested, 0);
  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0);
  const totalPL = totalValue - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  // Use balance for display purposes
  void balance;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Portfolio</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Invested",
            value: `₹${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            color: "text-foreground",
          },
          {
            label: "Current Value",
            value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            color: "text-teal",
          },
          {
            label: "Total P/L",
            value: `${totalPL >= 0 ? "+" : ""}₹${Math.abs(totalPL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            color: totalPL >= 0 ? "text-positive" : "text-negative",
          },
          {
            label: "P/L %",
            value: `${totalPLPct >= 0 ? "+" : ""}${totalPLPct.toFixed(2)}%`,
            color: totalPLPct >= 0 ? "text-positive" : "text-negative",
          },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${s.color}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {enriched.length === 0 ? (
        <div
          className="bg-card border border-border rounded-md p-12 text-center"
          data-ocid="portfolio.empty_state"
        >
          <p className="text-muted-foreground">
            No holdings yet. Start trading in Markets!
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {[
                  "Symbol",
                  "Qty",
                  "Avg Price",
                  "Current Price",
                  "Current Value",
                  "Invested",
                  "P/L",
                  "P/L %",
                ].map((h) => (
                  <TableHead key={h} className="text-muted-foreground text-xs">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {enriched.map((h, i) => (
                <TableRow
                  key={h.symbol}
                  className="border-border hover:bg-secondary/40"
                  data-ocid={`portfolio.holding.item.${i + 1}`}
                >
                  <TableCell className="font-semibold text-teal">
                    {h.symbol}
                  </TableCell>
                  <TableCell className="font-mono text-foreground">
                    {h.quantity}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {formatPrice(h.avgBuyPrice, h.currency)}
                  </TableCell>
                  <TableCell className="font-mono text-foreground">
                    {formatPrice(h.currentPrice, h.currency)}
                  </TableCell>
                  <TableCell className="font-mono text-teal">
                    {formatPrice(h.currentValue, h.currency)}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {formatPrice(h.invested, h.currency)}
                  </TableCell>
                  <TableCell
                    className={`font-mono font-semibold ${h.pl >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {h.pl >= 0 ? "+" : ""}
                    {formatPrice(Math.abs(h.pl), h.currency)}
                  </TableCell>
                  <TableCell
                    className={`font-mono ${h.plPct >= 0 ? "text-positive" : "text-negative"}`}
                  >
                    {h.plPct >= 0 ? "+" : ""}
                    {h.plPct.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
