import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { TradeModal } from "../components/TradeModal";
import {
  FUTURES_INSTRUMENTS,
  OPTIONS_UNDERLYINGS,
  formatPrice,
} from "../data/instruments";
import type { Holding, Profile } from "../hooks/useTradingData";

interface FnOProps {
  prices: Record<string, number>;
  portfolio: Holding[];
  profile: Profile | null;
  onBuy: (symbol: string, qty: number, price: number) => Promise<boolean>;
  onSell: (symbol: string, qty: number, price: number) => Promise<boolean>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLastThursday(year: number, month: number): Date {
  const d = new Date(year, month + 1, 0);
  while (d.getDay() !== 4) d.setDate(d.getDate() - 1);
  return d;
}

function getLastFriday(year: number, month: number): Date {
  const d = new Date(year, month + 1, 0);
  while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
  return d;
}

function getNextFriday(): Date {
  const d = new Date();
  const day = d.getDay();
  const daysToFriday = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysToFriday);
  return d;
}

function getFuturesExpiries(isIndian: boolean): Date[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const expiries: Date[] = [];
  for (let i = 0; i < 3; i++) {
    const m = (month + i) % 12;
    const y = year + Math.floor((month + i) / 12);
    expiries.push(isIndian ? getLastThursday(y, m) : getLastFriday(y, m));
  }
  return expiries;
}

/** MCX Gold: expires 5th of Feb(1), Apr(3), Jun(5), Aug(7), Oct(9), Dec(11) */
function getMCXGoldExpiries(): Date[] {
  const evenMonths = [1, 3, 5, 7, 9, 11]; // 0-indexed
  const now = new Date();
  const results: Date[] = [];
  for (
    let y = now.getFullYear();
    y <= now.getFullYear() + 1 && results.length < 3;
    y++
  ) {
    for (const m of evenMonths) {
      if (results.length >= 3) break;
      const expiry = new Date(y, m, 5);
      if (expiry > now) {
        const day = expiry.getDay();
        if (day === 6) expiry.setDate(4); // Saturday → Friday
        if (day === 0) expiry.setDate(3); // Sunday → Friday
        results.push(expiry);
      }
    }
  }
  return results;
}

/** MCX Silver: expires 5th of Mar(2), May(4), Jul(6), Sep(8), Dec(11) */
function getMCXSilverExpiries(): Date[] {
  const silverMonths = [2, 4, 6, 8, 11]; // 0-indexed
  const now = new Date();
  const results: Date[] = [];
  for (
    let y = now.getFullYear();
    y <= now.getFullYear() + 1 && results.length < 3;
    y++
  ) {
    for (const m of silverMonths) {
      if (results.length >= 3) break;
      const expiry = new Date(y, m, 5);
      if (expiry > now) {
        const day = expiry.getDay();
        if (day === 6) expiry.setDate(4);
        if (day === 0) expiry.setDate(3);
        results.push(expiry);
      }
    }
  }
  return results;
}

function formatExpiry(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function expiryCode(d: Date): string {
  return d
    .toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    .replace(" ", "")
    .toUpperCase();
}

function calcFuturesPrice(underlying: number, daysToExpiry: number): number {
  return underlying * (1 + 0.08 * (daysToExpiry / 365));
}

function calcPremium(
  optionType: "CE" | "PE",
  strike: number,
  underlying: number,
  daysToExpiry: number,
): number {
  const intrinsic =
    optionType === "CE"
      ? Math.max(underlying - strike, 0)
      : Math.max(strike - underlying, 0);
  const timeValue = underlying * 0.01 * Math.sqrt(daysToExpiry / 365);
  return Math.max(intrinsic + timeValue, 0.01);
}

function calcDelta(
  optionType: "CE" | "PE",
  strike: number,
  underlying: number,
): number {
  const moneyness = (underlying - strike) / underlying;
  if (optionType === "CE")
    return Math.min(Math.max(0.5 + moneyness * 2, 0.01), 0.99);
  return Math.min(Math.max(-0.5 + moneyness * 2, -0.99), -0.01);
}

// ── Options Chain Tab ─────────────────────────────────────────────────────────

function OptionsChain({ prices, portfolio, profile, onBuy, onSell }: FnOProps) {
  const [underlying, setUnderlying] = useState("NIFTY");
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [tradePrice, setTradePrice] = useState(0);

  const balance = profile?.balance ?? 1000000;
  const und = OPTIONS_UNDERLYINGS.find((u) => u.symbol === underlying)!;
  const undPrice = prices[underlying] ?? und.basePrice;
  const expiry = getNextFriday();
  const daysToExpiry = Math.max(
    1,
    Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const expiryStr = expiry.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const strikeStep =
    und.symbol.startsWith("NIFTY") || und.symbol === "BANKNIFTY"
      ? 50
      : und.basePrice > 200
        ? 5
        : 1;
  const atmStrike = Math.round(undPrice / strikeStep) * strikeStep;
  const strikes: number[] = [];
  for (let i = -5; i <= 5; i++) {
    strikes.push(atmStrike + i * strikeStep);
  }

  function openTrade(symbol: string, premium: number) {
    setTradeSymbol(symbol);
    setTradePrice(premium);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={underlying} onValueChange={setUnderlying}>
          <SelectTrigger
            className="w-44 bg-secondary border-border"
            data-ocid="options.underlying.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {OPTIONS_UNDERLYINGS.map((u) => (
              <SelectItem key={u.symbol} value={u.symbol}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          Underlying:{" "}
          <span className="font-mono text-teal font-semibold">
            {formatPrice(undPrice, und.currency)}
          </span>
          <span className="ml-3">
            Expiry: <span className="text-foreground">{expiryStr}</span>
          </span>
          <span className="ml-3">
            Lot Size: <span className="text-foreground">{und.lotSize}</span>
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-positive text-center" colSpan={3}>
                CALLS
              </TableHead>
              <TableHead className="text-center text-muted-foreground">
                Strike
              </TableHead>
              <TableHead className="text-negative text-center" colSpan={3}>
                PUTS
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
            <TableRow className="border-border hover:bg-transparent text-xs">
              <TableHead className="text-muted-foreground">LTP</TableHead>
              <TableHead className="text-muted-foreground">Delta</TableHead>
              <TableHead className="text-muted-foreground">OI</TableHead>
              <TableHead className="text-center font-bold text-foreground">
                Strike
              </TableHead>
              <TableHead className="text-muted-foreground">LTP</TableHead>
              <TableHead className="text-muted-foreground">Delta</TableHead>
              <TableHead className="text-muted-foreground">OI</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {strikes.map((strike, i) => {
              const isATM = strike === atmStrike;
              const isITMCall = strike < undPrice;
              const isITMPut = strike > undPrice;
              const callPremium = calcPremium(
                "CE",
                strike,
                undPrice,
                daysToExpiry,
              );
              const putPremium = calcPremium(
                "PE",
                strike,
                undPrice,
                daysToExpiry,
              );
              const callDelta = calcDelta("CE", strike, undPrice);
              const putDelta = calcDelta("PE", strike, undPrice);
              const callOI = Math.floor(
                ((strike * 7 + i * 13) % 40000) + 10000,
              );
              const putOI = Math.floor(
                ((strike * 11 + i * 17) % 40000) + 10000,
              );
              const callSym = `${underlying}-CE-${strike}`;
              const putSym = `${underlying}-PE-${strike}`;

              return (
                <TableRow
                  key={strike}
                  className={`border-border text-xs ${
                    isATM
                      ? "bg-teal/5 border-l-2 border-l-teal"
                      : "hover:bg-secondary/30"
                  }`}
                  data-ocid={`options.strike.item.${i + 1}`}
                >
                  <TableCell
                    className={`font-mono ${
                      isITMCall
                        ? "text-positive font-semibold"
                        : "text-foreground/70"
                    }`}
                  >
                    {formatPrice(callPremium, und.currency)}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {callDelta.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {callOI.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`font-bold font-mono ${
                          isATM ? "text-teal" : "text-foreground"
                        }`}
                      >
                        {strike.toLocaleString()}
                      </span>
                      {isATM && (
                        <Badge className="text-[9px] px-1 py-0 bg-teal/20 text-teal border-0">
                          ATM
                        </Badge>
                      )}
                      {isITMCall && !isATM && (
                        <Badge className="text-[9px] px-1 py-0 bg-positive/10 text-positive border-0">
                          ITM
                        </Badge>
                      )}
                      {isITMPut && !isATM && (
                        <Badge className="text-[9px] px-1 py-0 bg-negative/10 text-negative border-0">
                          OTM
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`font-mono ${
                      isITMPut
                        ? "text-negative font-semibold"
                        : "text-foreground/70"
                    }`}
                  >
                    {formatPrice(putPremium, und.currency)}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {putDelta.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {putOI.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="text-[10px] px-2 h-6 bg-positive/15 text-positive hover:bg-positive hover:text-background"
                        onClick={() => openTrade(callSym, callPremium)}
                        data-ocid={`options.buy_ce.button.${i + 1}`}
                      >
                        CE
                      </Button>
                      <Button
                        size="sm"
                        className="text-[10px] px-2 h-6 bg-negative/15 text-negative hover:bg-negative hover:text-background"
                        onClick={() => openTrade(putSym, putPremium)}
                        data-ocid={`options.buy_pe.button.${i + 1}`}
                      >
                        PE
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {tradeSymbol && (
        <TradeModal
          symbol={tradeSymbol}
          currentPrice={tradePrice}
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

// ── Futures Tab ───────────────────────────────────────────────────────────────

function FuturesTable({ prices, portfolio, profile, onBuy, onSell }: FnOProps) {
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [tradePrice, setTradePrice] = useState(0);

  const balance = profile?.balance ?? 1000000;

  const EXPIRY_LABELS = ["Near", "Mid", "Far"] as const;
  const EXPIRY_COLORS = [
    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    "bg-secondary text-muted-foreground border-border",
    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ] as const;

  function openTrade(sym: string, price: number) {
    setTradeSymbol(sym);
    setTradePrice(price);
  }

  const rows: {
    inst: (typeof FUTURES_INSTRUMENTS)[number];
    expiry: Date;
    expiryLabel: string;
    expiryColor: string;
    futPrice: number;
    basis: number;
    changePct: number;
    sym: string;
    contractValue: number;
    isFirstInGroup: boolean;
    groupSize: number;
    rowIndex: number;
  }[] = [];

  let globalIdx = 0;
  for (const inst of FUTURES_INSTRUMENTS) {
    const undPrice = prices[inst.symbol] ?? inst.basePrice;

    let expiries: Date[];
    if (inst.symbol === "GOLD_MCX") {
      expiries = getMCXGoldExpiries();
    } else if (inst.symbol === "SILVER_MCX") {
      expiries = getMCXSilverExpiries();
    } else {
      const isIndian = inst.currency === "INR";
      expiries = getFuturesExpiries(isIndian);
    }

    expiries.forEach((expiry, ei) => {
      const daysToExpiry = Math.max(
        1,
        Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      );
      const futPrice = calcFuturesPrice(undPrice, daysToExpiry);
      const basis = futPrice - undPrice;
      const changePct = ((futPrice - inst.basePrice) / inst.basePrice) * 100;
      const code = expiryCode(expiry);
      const sym = `${inst.symbol}-FUT-${code}`;
      const contractValue = inst.lotSize * futPrice;

      rows.push({
        inst,
        expiry,
        expiryLabel: EXPIRY_LABELS[ei],
        expiryColor: EXPIRY_COLORS[ei],
        futPrice,
        basis,
        changePct,
        sym,
        contractValue,
        isFirstInGroup: ei === 0,
        groupSize: 3,
        rowIndex: ++globalIdx,
      });
    });
  }

  return (
    <div className="space-y-4">
      {/* MCX Info Banner */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-md px-3 py-2 text-xs">
          <span className="text-yellow-400 font-semibold">MCX Gold</span>
          <span className="text-muted-foreground ml-2">
            ₹/10g · Lot: 100 units (1 kg) · Expiry: 5th even months
          </span>
        </div>
        <div className="bg-slate-400/10 border border-slate-400/25 rounded-md px-3 py-2 text-xs">
          <span className="text-slate-300 font-semibold">MCX Silver</span>
          <span className="text-muted-foreground ml-2">
            ₹/kg · Lot: 30 kg · Expiry: 5th Mar/May/Jul/Sep/Dec
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent text-xs">
              <TableHead>Symbol</TableHead>
              <TableHead className="hidden md:table-cell">Name</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="hidden sm:table-cell">Lot Size</TableHead>
              <TableHead className="text-right">Futures Price</TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Contract Value
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Basis
              </TableHead>
              <TableHead className="text-right">Change%</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.sym}
                className={`border-border text-xs ${
                  row.isFirstInGroup
                    ? "border-t-2 border-t-border/60"
                    : "border-t border-t-border/20"
                } hover:bg-secondary/30 ${
                  row.inst.symbol === "GOLD_MCX"
                    ? "bg-yellow-500/5"
                    : row.inst.symbol === "SILVER_MCX"
                      ? "bg-slate-400/5"
                      : ""
                }`}
                data-ocid={`futures.item.${row.rowIndex}`}
              >
                <TableCell className="font-mono font-semibold">
                  <span
                    className={`${
                      row.inst.symbol === "GOLD_MCX"
                        ? "text-yellow-400"
                        : row.inst.symbol === "SILVER_MCX"
                          ? "text-slate-300"
                          : "text-foreground"
                    }`}
                  >
                    {row.inst.symbol}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {row.inst.name}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground/80">
                      {formatExpiry(row.expiry)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 border ${row.expiryColor}`}
                    >
                      {row.expiryLabel}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground hidden sm:table-cell">
                  {row.inst.lotSize.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold text-foreground">
                  {formatPrice(row.futPrice, row.inst.currency)}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="font-mono text-xs">
                    <div className="text-foreground font-semibold">
                      {formatPrice(row.contractValue, row.inst.currency)}
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      {row.inst.lotSize} ×{" "}
                      {formatPrice(row.futPrice, row.inst.currency)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground hidden sm:table-cell">
                  {row.basis >= 0 ? "+" : ""}
                  {formatPrice(row.basis, row.inst.currency)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    row.changePct >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {row.changePct >= 0 ? "+" : ""}
                  {row.changePct.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      className="text-[10px] px-2 h-6 bg-positive/15 text-positive hover:bg-positive hover:text-background"
                      onClick={() => openTrade(row.sym, row.futPrice)}
                      data-ocid={`futures.buy.button.${row.rowIndex}`}
                    >
                      Buy
                    </Button>
                    <Button
                      size="sm"
                      className="text-[10px] px-2 h-6 bg-negative/15 text-negative hover:bg-negative hover:text-background"
                      onClick={() => openTrade(row.sym, row.futPrice)}
                      data-ocid={`futures.sell.button.${row.rowIndex}`}
                    >
                      Sell
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {tradeSymbol && (
        <TradeModal
          symbol={tradeSymbol}
          currentPrice={tradePrice}
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

// ── Main FnO Page ─────────────────────────────────────────────────────────────

export function FnO(props: FnOProps) {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">
        F&amp;O{" "}
        <span className="text-sm font-normal text-muted-foreground">
          Futures &amp; Options
        </span>
      </h1>

      <Tabs defaultValue="options" className="w-full">
        <TabsList className="bg-secondary mb-4">
          <TabsTrigger
            value="options"
            data-ocid="fno.options.tab"
            className="data-[state=active]:bg-teal/20 data-[state=active]:text-teal"
          >
            Options Chain
          </TabsTrigger>
          <TabsTrigger
            value="futures"
            data-ocid="fno.futures.tab"
            className="data-[state=active]:bg-teal/20 data-[state=active]:text-teal"
          >
            Futures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="options">
          <OptionsChain {...props} />
        </TabsContent>

        <TabsContent value="futures">
          <FuturesTable {...props} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
