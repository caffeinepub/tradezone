import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { formatPrice, getInstrument } from "../data/instruments";
import { getMarketLabel, isMarketOpen } from "../utils/marketHours";

interface TradeModalProps {
  symbol: string;
  currentPrice: number;
  onBuy: (symbol: string, qty: number, price: number) => Promise<boolean>;
  onSell: (symbol: string, qty: number, price: number) => Promise<boolean>;
  onClose: () => void;
  balance: number;
  holdings: number;
}

type OrderType = "Market" | "Limit" | "Stop";

export function TradeModal({
  symbol,
  currentPrice,
  onBuy,
  onSell,
  onClose,
  balance,
  holdings,
}: TradeModalProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("Market");
  const [qty, setQty] = useState("1");
  const [limitPrice, setLimitPrice] = useState(currentPrice.toFixed(2));
  const [loading, setLoading] = useState(false);

  const inst = getInstrument(symbol);
  const currency = inst?.currency ?? "USD";
  const execPrice =
    orderType === "Market"
      ? currentPrice
      : Number.parseFloat(limitPrice) || currentPrice;
  const quantity = Number.parseInt(qty) || 0;
  const total = execPrice * quantity;

  const marketOpen = isMarketOpen(symbol);
  const marketLabel = getMarketLabel(symbol);

  async function handleSubmit() {
    if (quantity <= 0) return;
    setLoading(true);
    let ok = false;
    if (side === "buy") {
      ok = await onBuy(symbol, quantity, execPrice);
    } else {
      ok = await onSell(symbol, quantity, execPrice);
    }
    setLoading(false);
    if (ok) onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="trade.modal"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Trade <span className="text-teal">{symbol}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Market status row */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {marketOpen ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/30 rounded px-2 py-0.5">
                <span className="text-green-400">●</span> MARKET OPEN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-400/10 border border-red-400/30 rounded px-2 py-0.5">
                <span className="text-red-400">●</span> MARKET CLOSED
              </span>
            )}
            <span className="text-xs text-muted-foreground">{marketLabel}</span>
          </div>
          {!marketOpen && (
            <p className="text-xs text-amber-400/80">
              Note: This is a paper trade simulation — order will still be
              executed
            </p>
          )}
        </div>

        {/* Buy / Sell tabs */}
        <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")}>
          <TabsList className="w-full bg-secondary">
            <TabsTrigger
              value="buy"
              data-ocid="trade.buy.tab"
              className="flex-1 data-[state=active]:bg-positive/20 data-[state=active]:text-positive"
            >
              BUY
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              data-ocid="trade.sell.tab"
              className="flex-1 data-[state=active]:bg-negative/20 data-[state=active]:text-negative"
            >
              SELL
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3 mt-2">
          {/* Order Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Order Type
            </Label>
            <Select
              value={orderType}
              onValueChange={(v) => setOrderType(v as OrderType)}
            >
              <SelectTrigger
                className="bg-secondary border-border"
                data-ocid="trade.ordertype.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="Market">Market</SelectItem>
                <SelectItem value="Limit">Limit</SelectItem>
                <SelectItem value="Stop">Stop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit / Stop price */}
          {orderType !== "Market" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {orderType} Price
              </Label>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="bg-secondary border-border font-mono"
                data-ocid="trade.limitprice.input"
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Quantity
            </Label>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="bg-secondary border-border font-mono"
              data-ocid="trade.quantity.input"
            />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 bg-secondary rounded-md p-3 text-xs">
            <div className="text-muted-foreground">Market Price</div>
            <div className="text-right font-mono text-foreground">
              {formatPrice(currentPrice, currency)}
            </div>
            <div className="text-muted-foreground">
              {side === "buy" ? "Est. Cost" : "Est. Proceeds"}
            </div>
            <div className="text-right font-mono font-semibold text-foreground">
              {formatPrice(total, currency)}
            </div>
            <div className="text-muted-foreground">Available Balance</div>
            <div className="text-right font-mono text-teal">
              ₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-muted-foreground">Holdings</div>
            <div className="text-right font-mono text-foreground">
              {holdings} units
            </div>
          </div>

          {/* Submit */}
          <Button
            className={`w-full font-semibold ${
              side === "buy"
                ? "bg-positive hover:bg-positive/80 text-background"
                : "bg-negative hover:bg-negative/80 text-background"
            }`}
            onClick={handleSubmit}
            disabled={loading || quantity <= 0}
            data-ocid="trade.submit.button"
          >
            {loading
              ? "Processing..."
              : `PLACE PAPER TRADE — ${side.toUpperCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
