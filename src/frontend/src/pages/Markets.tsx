import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { TradeModal } from "../components/TradeModal";
import {
  COMMODITIES,
  IN_STOCKS,
  type Instrument,
  US_STOCKS,
  formatPrice,
} from "../data/instruments";
import { fetchWithProxies } from "../hooks/usePrices";
import type { Holding, Profile } from "../hooks/useTradingData";
import { isMarketOpen } from "../utils/marketHours";

interface MarketsProps {
  prices: Record<string, number>;
  lastUpdated: Date | null;
  isLive: boolean;
  portfolio: Holding[];
  profile: Profile | null;
  onBuy: (symbol: string, qty: number, price: number) => Promise<boolean>;
  onSell: (symbol: string, qty: number, price: number) => Promise<boolean>;
}

interface DynamicResult {
  symbol: string;
  name: string;
  price: number;
  currency: "USD" | "INR";
}

function MarketStatusBadge({ symbol }: { symbol: string }) {
  const open = isMarketOpen(symbol);
  return open ? (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded px-1 py-0 leading-4">
      <span>●</span> OPEN
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded px-1 py-0 leading-4">
      <span>●</span> CLOSED
    </span>
  );
}

function LiveStatusBar({
  isLive,
  lastUpdated,
}: {
  isLive: boolean;
  lastUpdated: Date | null;
}) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border text-xs"
      data-ocid="markets.live_status.panel"
    >
      {isLive ? (
        <span className="flex items-center gap-1.5 font-bold text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          LIVE
        </span>
      ) : (
        <span className="flex items-center gap-1.5 font-bold text-yellow-400">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          Connecting...
        </span>
      )}
      <span className="text-muted-foreground">
        {isLive ? "Prices updating every 15s" : "Fetching live prices"}
      </span>
      {isLive && secondsAgo !== null && (
        <span className="text-muted-foreground ml-auto">
          Last updated:{" "}
          <span className="text-foreground font-semibold">
            {secondsAgo < 5
              ? "just now"
              : secondsAgo < 60
                ? `${secondsAgo}s ago`
                : `${Math.floor(secondsAgo / 60)}m ago`}
          </span>
        </span>
      )}
    </div>
  );
}

function InstrumentTable({
  instruments,
  prices,
  basePrices,
  onTrade,
}: {
  instruments: Instrument[];
  prices: Record<string, number>;
  basePrices: Record<string, number>;
  onTrade: (symbol: string) => void;
}) {
  if (instruments.length === 0) {
    return (
      <div
        className="py-16 text-center text-muted-foreground text-sm"
        data-ocid="markets.empty_state"
      >
        No instruments match your search.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">#</TableHead>
            <TableHead className="text-muted-foreground">Symbol</TableHead>
            <TableHead className="text-muted-foreground">Name</TableHead>
            <TableHead className="text-muted-foreground text-right">
              Price
            </TableHead>
            <TableHead className="text-muted-foreground text-right">
              Change
            </TableHead>
            <TableHead className="text-muted-foreground text-right">
              Change %
            </TableHead>
            <TableHead className="text-muted-foreground text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instruments.map((inst, i) => {
            const price = prices[inst.symbol] ?? inst.basePrice;
            const base = basePrices[inst.symbol] ?? inst.basePrice;
            const change = price - base;
            const changePct = (change / base) * 100;
            return (
              <TableRow
                key={inst.symbol}
                className="border-border hover:bg-secondary/50"
                data-ocid={`markets.instrument.item.${i + 1}`}
              >
                <TableCell className="text-muted-foreground text-xs w-8">
                  {i + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-teal">
                      {inst.symbol}
                    </span>
                    <MarketStatusBadge symbol={inst.symbol} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate">
                  {inst.name}
                </TableCell>
                <TableCell className="text-right font-mono text-foreground">
                  {formatPrice(price, inst.currency)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    change >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {formatPrice(Math.abs(change), inst.currency)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    changePct >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {changePct >= 0 ? "+" : ""}
                  {changePct.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-teal text-teal hover:bg-teal hover:text-background text-xs"
                    onClick={() => onTrade(inst.symbol)}
                    data-ocid={`markets.trade.button.${i + 1}`}
                  >
                    Trade
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function Markets({
  prices,
  lastUpdated,
  isLive,
  portfolio,
  profile,
  onBuy,
  onSell,
}: MarketsProps) {
  const [search, setSearch] = useState("");
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [tradePrice, setTradePrice] = useState<number>(0);
  const [dynamicResult, setDynamicResult] = useState<DynamicResult | null>(
    null,
  );
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [dynamicError, setDynamicError] = useState<string | null>(null);

  const balance = profile?.balance ?? 1000000;

  const basePrices: Record<string, number> = {};
  for (const inst of [...US_STOCKS, ...IN_STOCKS, ...COMMODITIES]) {
    basePrices[inst.symbol] = inst.basePrice;
  }

  function filter(list: Instrument[]) {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (i) =>
        i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q),
    );
  }

  const filteredIN = filter(IN_STOCKS);
  const filteredUS = filter(US_STOCKS);
  const filteredCOM = filter(COMMODITIES);

  const noLocalMatch =
    search.trim().length > 0 &&
    filteredIN.length === 0 &&
    filteredUS.length === 0 &&
    filteredCOM.length === 0;

  async function searchDynamicStock(query: string) {
    setDynamicLoading(true);
    setDynamicError(null);
    setDynamicResult(null);
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(query.toUpperCase())}&fields=regularMarketPrice,shortName,symbol`;
      const res = await fetchWithProxies(url, 10000);
      if (!res) throw new Error("Could not reach data source");
      const data = await res.json();
      const result = data?.quoteResponse?.result?.[0];
      if (!result || !result.regularMarketPrice) {
        throw new Error(`Symbol "${query.toUpperCase()}" not found`);
      }
      const sym: string = result.symbol ?? query.toUpperCase();
      const currency: "USD" | "INR" =
        sym.endsWith(".NS") || sym.endsWith(".BO") ? "INR" : "USD";
      setDynamicResult({
        symbol: sym,
        name: result.shortName ?? sym,
        price: result.regularMarketPrice,
        currency,
      });
    } catch (err: any) {
      setDynamicError(err?.message ?? "Search failed");
    } finally {
      setDynamicLoading(false);
    }
  }

  function openTrade(symbol: string, price: number) {
    setTradeSymbol(symbol);
    setTradePrice(price);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Markets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {IN_STOCKS.length} Indian · {US_STOCKS.length} US ·{" "}
            {COMMODITIES.length} Commodities
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDynamicResult(null);
              setDynamicError(null);
            }}
            placeholder="Search symbol or name..."
            className="pl-8 bg-secondary border-border text-sm"
            data-ocid="markets.search_input"
          />
        </div>
      </div>

      {/* Live status indicator */}
      <LiveStatusBar isLive={isLive} lastUpdated={lastUpdated} />

      {/* Dynamic live search section */}
      {noLocalMatch && (
        <div className="bg-card border border-border rounded-md p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            No local match for{" "}
            <span className="text-foreground font-semibold">
              &quot;{search}&quot;
            </span>
            . Search live on Yahoo Finance?
          </p>
          <Button
            size="sm"
            onClick={() => searchDynamicStock(search)}
            disabled={dynamicLoading}
            className="gap-2"
            data-ocid="markets.search.button"
          >
            {dynamicLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            {dynamicLoading ? "Searching..." : "Search Live"}
          </Button>

          {dynamicError && (
            <p
              className="text-sm text-negative"
              data-ocid="markets.search.error_state"
            >
              {dynamicError}
            </p>
          )}

          {dynamicResult && (
            <div
              className="bg-secondary border border-border rounded-md p-3"
              data-ocid="markets.search.panel"
            >
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
                Live Search Result
              </p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-teal text-sm">
                      {dynamicResult.symbol}
                    </span>
                    <MarketStatusBadge symbol={dynamicResult.symbol} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dynamicResult.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-foreground">
                    {formatPrice(dynamicResult.price, dynamicResult.currency)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-teal text-teal hover:bg-teal hover:text-background text-xs"
                  onClick={() =>
                    openTrade(dynamicResult.symbol, dynamicResult.price)
                  }
                  data-ocid="markets.search.primary_button"
                >
                  Trade
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="in">
        <TabsList className="bg-secondary">
          <TabsTrigger value="in" data-ocid="markets.in.tab">
            NSE/BSE
            <span className="ml-1 text-[10px] opacity-60">
              ({filteredIN.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="us" data-ocid="markets.us.tab">
            US Stocks
            <span className="ml-1 text-[10px] opacity-60">
              ({filteredUS.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="com" data-ocid="markets.commodities.tab">
            Commodities
            <span className="ml-1 text-[10px] opacity-60">
              ({filteredCOM.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="in"
          className="bg-card border border-border rounded-md overflow-hidden mt-3"
        >
          <InstrumentTable
            instruments={filteredIN}
            prices={prices}
            basePrices={basePrices}
            onTrade={(sym) => {
              const inst = IN_STOCKS.find((i) => i.symbol === sym);
              openTrade(sym, prices[sym] ?? inst?.basePrice ?? 0);
            }}
          />
        </TabsContent>
        <TabsContent
          value="us"
          className="bg-card border border-border rounded-md overflow-hidden mt-3"
        >
          <InstrumentTable
            instruments={filteredUS}
            prices={prices}
            basePrices={basePrices}
            onTrade={(sym) => {
              const inst = US_STOCKS.find((i) => i.symbol === sym);
              openTrade(sym, prices[sym] ?? inst?.basePrice ?? 0);
            }}
          />
        </TabsContent>
        <TabsContent
          value="com"
          className="bg-card border border-border rounded-md overflow-hidden mt-3"
        >
          <InstrumentTable
            instruments={filteredCOM}
            prices={prices}
            basePrices={basePrices}
            onTrade={(sym) => {
              const inst = COMMODITIES.find((i) => i.symbol === sym);
              openTrade(sym, prices[sym] ?? inst?.basePrice ?? 0);
            }}
          />
        </TabsContent>
      </Tabs>

      {tradeSymbol && (
        <TradeModal
          symbol={tradeSymbol}
          currentPrice={tradePrice || prices[tradeSymbol] || 0}
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
