import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, TrendingDown, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { TradeModal } from "../components/TradeModal";
import {
  ALL_INSTRUMENTS,
  formatPrice,
  getInstrument,
} from "../data/instruments";
import type { Holding, Profile } from "../hooks/useTradingData";

interface WatchlistPageProps {
  watchlist: string[];
  prices: Record<string, number>;
  portfolio: Holding[];
  profile: Profile | null;
  onAdd: (symbol: string) => Promise<void>;
  onRemove: (symbol: string) => Promise<void>;
  onBuy: (symbol: string, qty: number, price: number) => Promise<boolean>;
  onSell: (symbol: string, qty: number, price: number) => Promise<boolean>;
}

export function WatchlistPage({
  watchlist,
  prices,
  portfolio,
  profile,
  onAdd,
  onRemove,
  onBuy,
  onSell,
}: WatchlistPageProps) {
  const [input, setInput] = useState("");
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const balance = profile?.balance ?? 1000000;

  function handleAdd() {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    void onAdd(sym);
    setInput("");
  }

  const allSymbols = ALL_INSTRUMENTS.map((i) => i.symbol);
  const displayList = watchlist.length > 0 ? watchlist : allSymbols.slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Watchlist</h1>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add symbol (e.g. AAPL)"
          className="bg-secondary border-border"
          data-ocid="watchlist.symbol.input"
        />
        <Button
          onClick={handleAdd}
          className="bg-teal hover:bg-teal/80 text-background"
          data-ocid="watchlist.add.button"
        >
          Add
        </Button>
      </div>

      {displayList.length === 0 ? (
        <div
          className="bg-card border border-border rounded-md p-12 text-center"
          data-ocid="watchlist.empty_state"
        >
          <Star className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-muted-foreground">
            Your watchlist is empty. Add some symbols!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((symbol, i) => {
            const inst = getInstrument(symbol);
            const price = prices[symbol] ?? inst?.basePrice ?? 0;
            const base = inst?.basePrice ?? price;
            const change = price - base;
            const changePct = base > 0 ? (change / base) * 100 : 0;
            const isUp = changePct >= 0;

            return (
              <button
                type="button"
                key={symbol}
                className="w-full bg-card border border-border rounded-md px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-secondary/40 transition-colors text-left"
                onClick={() => setTradeSymbol(symbol)}
                data-ocid={`watchlist.item.${i + 1}`}
              >
                <div className="flex items-center gap-3">
                  <Star size={14} className="text-teal" />
                  <div>
                    <div className="font-semibold text-foreground text-sm">
                      {symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {inst?.name ?? symbol}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-semibold text-foreground text-sm">
                      {formatPrice(price, inst?.currency ?? "USD")}
                    </div>
                    <div
                      className={`text-xs flex items-center gap-1 ${isUp ? "text-positive" : "text-negative"}`}
                    >
                      {isUp ? (
                        <TrendingUp size={10} />
                      ) : (
                        <TrendingDown size={10} />
                      )}
                      {isUp ? "+" : ""}
                      {changePct.toFixed(2)}%
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onRemove(symbol);
                    }}
                    className="text-muted-foreground hover:text-negative h-7 w-7 p-0"
                    data-ocid={`watchlist.remove.button.${i + 1}`}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tradeSymbol && (
        <TradeModal
          symbol={tradeSymbol}
          currentPrice={prices[tradeSymbol] ?? 0}
          onBuy={onBuy}
          onSell={onSell}
          onClose={() => setTradeSymbol(null)}
          balance={balance}
          holdings={
            portfolio.find((h) => h.symbol === tradeSymbol)?.quantity ?? 0
          }
        />
      )}
    </div>
  );
}
