import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { PriceChart } from "../components/PriceChart";
import { TradeModal } from "../components/TradeModal";
import { ALL_INSTRUMENTS, formatPrice } from "../data/instruments";
import { useActor } from "../hooks/useActor";
import type { Holding, Profile } from "../hooks/useTradingData";
import { isMarketOpen } from "../utils/marketHours";

interface DashboardProps {
  prices: Record<string, number>;
  portfolio: Holding[];
  profile: Profile | null;
  onBuy: (symbol: string, qty: number, price: number) => Promise<boolean>;
  onSell: (symbol: string, qty: number, price: number) => Promise<boolean>;
  lastUpdated?: Date | null;
  userId?: string;
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${color}`}>
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div className={`p-2 rounded-md bg-secondary ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
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

export function Dashboard({
  prices,
  portfolio,
  profile,
  onBuy,
  onSell,
  lastUpdated,
  userId,
}: DashboardProps) {
  const { actor } = useActor();
  const [chartSymbol, setChartSymbol] = useState("AAPL");
  const [tradeSymbol, setTradeSymbol] = useState("AAPL");
  const [tradeQty, setTradeQty] = useState("1");
  const [moverTab, setMoverTab] = useState("gainers");
  const [tradeModal, setTradeModal] = useState<string | null>(null);

  const balance = profile?.balance ?? 1000000;

  const nameKey = userId ? `tradezone_name_${userId}` : null;
  const [displayName, setDisplayName] = useState<string>(() => {
    if (!nameKey) return "Trader";
    return localStorage.getItem(nameKey) || "";
  });
  const [nameInput, setNameInput] = useState("");
  const [nameSaved, setNameSaved] = useState(() => {
    if (!nameKey) return true;
    return !!localStorage.getItem(nameKey);
  });

  useEffect(() => {
    if (nameKey && !nameSaved) {
      setDisplayName("");
    }
  }, [nameKey, nameSaved]);

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || !nameKey) return;
    localStorage.setItem(nameKey, trimmed);
    setDisplayName(trimmed);
    setNameSaved(true);

    // Persist name to backend (fire and forget)
    if (actor) {
      (async () => {
        try {
          await (actor as any).initUser();
          await (actor as any).setDisplayName(trimmed);
        } catch {
          // Backend unavailable — name is saved locally, that's fine
        }
      })();
    }
  }

  // Portfolio value
  const portfolioValue = portfolio.reduce((sum, h) => {
    const price = prices[h.symbol] ?? h.avgBuyPrice;
    return sum + price * h.quantity;
  }, 0);
  const totalEquity = balance + portfolioValue;

  // Today P/L (compare current vs avg)
  const todayPL = portfolio.reduce((sum, h) => {
    const curr = prices[h.symbol] ?? h.avgBuyPrice;
    return sum + (curr - h.avgBuyPrice) * h.quantity;
  }, 0);

  // Market movers
  const movers = ALL_INSTRUMENTS.map((inst) => {
    const price = prices[inst.symbol] ?? inst.basePrice;
    const change = ((price - inst.basePrice) / inst.basePrice) * 100;
    return { ...inst, price, change };
  });
  const gainers = [...movers].sort((a, b) => b.change - a.change).slice(0, 5);
  const losers = [...movers].sort((a, b) => a.change - b.change).slice(0, 5);
  const active = [...movers]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);
  const moverList =
    moverTab === "gainers" ? gainers : moverTab === "losers" ? losers : active;

  const tradeInst = ALL_INSTRUMENTS.find((i) => i.symbol === tradeSymbol);
  const tradePrice = prices[tradeSymbol] ?? tradeInst?.basePrice ?? 0;

  const updatedLabel = lastUpdated
    ? `Live prices · Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
    : "Fetching live prices…";

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Welcome */}
      {!nameSaved && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              What's your name?
            </p>
            <p className="text-xs text-muted-foreground">
              We'll use this to personalise your dashboard and leaderboard.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              className="bg-secondary border-border text-sm h-8 w-full sm:w-36"
              placeholder="e.g. xyz"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              autoFocus
              data-ocid="dashboard.name.input"
            />
            <Button
              className="bg-teal hover:bg-teal/80 text-background h-8 px-3 text-sm font-semibold"
              onClick={saveName}
              disabled={!nameInput.trim()}
              data-ocid="dashboard.name.save_button"
            >
              Save
            </Button>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back, {displayName || "Trader"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's your trading overview
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 border border-border rounded-full px-3 py-1"
          data-ocid="dashboard.loading_state"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              lastUpdated
                ? "bg-green-400 animate-pulse"
                : "bg-yellow-400 animate-pulse"
            }`}
          />
          {updatedLabel}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Equity"
          value={`₹${totalEquity.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub="Balance + Portfolio"
          icon={<Wallet size={16} />}
          color="text-teal"
        />
        <KpiCard
          title="Today's P/L"
          value={`${todayPL >= 0 ? "+" : ""}₹${Math.abs(todayPL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub={`${todayPL >= 0 ? "+" : ""}${portfolioValue > 0 ? ((todayPL / portfolioValue) * 100).toFixed(2) : "0.00"}%`}
          icon={
            todayPL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />
          }
          color={todayPL >= 0 ? "text-positive" : "text-negative"}
        />
        <KpiCard
          title="Open Positions"
          value={String(portfolio.filter((h) => h.quantity > 0).length)}
          sub="Active holdings"
          icon={<Briefcase size={16} />}
          color="text-foreground"
        />
        <KpiCard
          title="Available Balance"
          value={`₹${balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub="Virtual cash"
          icon={<Wallet size={16} />}
          color="text-teal"
        />
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Live Chart</CardTitle>
              <Select value={chartSymbol} onValueChange={setChartSymbol}>
                <SelectTrigger className="w-32 h-7 text-xs bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ALL_INSTRUMENTS.map((i) => (
                    <SelectItem
                      key={i.symbol}
                      value={i.symbol}
                      className="text-xs"
                    >
                      {i.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <PriceChart
              symbol={chartSymbol}
              currentPrice={prices[chartSymbol] ?? 0}
              height={220}
            />
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick trade */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={tradeSymbol} onValueChange={setTradeSymbol}>
                <SelectTrigger className="bg-secondary border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ALL_INSTRUMENTS.map((i) => (
                    <SelectItem key={i.symbol} value={i.symbol}>
                      {i.symbol} — {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground flex-1">
                  Price:{" "}
                  <span className="font-mono text-teal font-semibold">
                    {formatPrice(tradePrice, tradeInst?.currency ?? "USD")}
                  </span>
                </div>
                <MarketStatusBadge symbol={tradeSymbol} />
              </div>
              <Input
                type="number"
                min={1}
                value={tradeQty}
                onChange={(e) => setTradeQty(e.target.value)}
                placeholder="Quantity"
                className="bg-secondary border-border"
                data-ocid="dashboard.quicktrade.input"
              />
              <Button
                className="w-full bg-teal hover:bg-teal/80 text-background font-semibold"
                onClick={() => setTradeModal(tradeSymbol)}
                data-ocid="dashboard.quicktrade.button"
              >
                PLACE PAPER TRADE
              </Button>
            </CardContent>
          </Card>

          {/* Market Movers */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Market Movers</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={moverTab} onValueChange={setMoverTab}>
                <TabsList className="w-full bg-secondary mb-3 h-7">
                  <TabsTrigger value="gainers" className="flex-1 text-xs">
                    Gainers
                  </TabsTrigger>
                  <TabsTrigger value="losers" className="flex-1 text-xs">
                    Losers
                  </TabsTrigger>
                  <TabsTrigger value="active" className="flex-1 text-xs">
                    Active
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-2">
                {moverList.map((m, i) => (
                  <div
                    key={m.symbol}
                    className="flex justify-between items-center text-xs py-1 border-b border-border/50 last:border-0"
                    data-ocid={`dashboard.mover.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {m.symbol}
                      </span>
                      <MarketStatusBadge symbol={m.symbol} />
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-foreground">
                        {formatPrice(m.price, m.currency)}
                      </div>
                      <div
                        className={
                          m.change >= 0 ? "text-positive" : "text-negative"
                        }
                      >
                        {m.change >= 0 ? "+" : ""}
                        {m.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {tradeModal && (
        <TradeModal
          symbol={tradeModal}
          currentPrice={prices[tradeModal] ?? 0}
          onBuy={onBuy}
          onSell={onSell}
          onClose={() => setTradeModal(null)}
          balance={balance}
          holdings={
            portfolio.find((h) => h.symbol === tradeModal)?.quantity ?? 0
          }
        />
      )}
    </div>
  );
}
