import { ALL_INSTRUMENTS } from "../data/instruments";

interface TickerBannerProps {
  prices: Record<string, number>;
}

export function TickerBanner({ prices }: TickerBannerProps) {
  const items = ALL_INSTRUMENTS.map((inst) => {
    const current = prices[inst.symbol] ?? inst.basePrice;
    const change = ((current - inst.basePrice) / inst.basePrice) * 100;
    const isUp = change >= 0;
    const symbol = inst.currency === "INR" ? "₹" : "$";
    const priceStr =
      inst.currency === "INR"
        ? `₹${current.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
        : `$${current.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    return { inst, current, change, isUp, priceStr, symbol };
  });

  return (
    <div
      className="h-8 bg-[oklch(0.12_0.015_200)] border-b border-border overflow-hidden flex items-center"
      data-ocid="ticker.banner"
    >
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 120s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="ticker-track">
        {[...items, ...items].map((item, idx) => (
          <span
            key={`${item.inst.symbol}-${idx}`}
            className="inline-flex items-center gap-1.5 px-4 text-xs font-mono whitespace-nowrap border-r border-border/30"
          >
            <span className="text-foreground/80 font-semibold">
              {item.inst.symbol}
            </span>
            <span className="text-foreground/70">{item.priceStr}</span>
            <span
              className={`font-medium ${
                item.isUp ? "text-green-400" : "text-red-400"
              }`}
            >
              {item.isUp ? "+" : ""}
              {item.change.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
