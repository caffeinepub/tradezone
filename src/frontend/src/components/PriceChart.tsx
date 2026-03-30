import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  height?: number;
}

type Timeframe = "1D" | "1W" | "1M";

interface DataPoint {
  time: string;
  price: number;
}

function formatPriceLabel(val: number): string {
  if (val >= 1000)
    return val.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return val.toFixed(2);
}

export function PriceChart({
  symbol,
  currentPrice,
  height = 240,
}: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [history, setHistory] = useState<DataPoint[]>(() => {
    const pts: DataPoint[] = [];
    let p = currentPrice;
    for (let i = 59; i >= 0; i--) {
      p = p * (1 + (Math.random() - 0.5) * 0.004);
      pts.push({ time: `${i}m`, price: Number.parseFloat(p.toFixed(4)) });
    }
    return pts;
  });

  useEffect(() => {
    setHistory((prev) => {
      return [
        ...prev.slice(1),
        { time: "now", price: Number.parseFloat(currentPrice.toFixed(4)) },
      ];
    });
  }, [currentPrice]);

  const startPrice = history[0]?.price ?? currentPrice;
  const isUp = currentPrice >= startPrice;
  const strokeColor = isUp ? "#32D07F" : "#E25555";
  const fillId = `fill-${symbol}`;

  const timeframes: Timeframe[] = ["1D", "1W", "1M"];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">{symbol}</span>
          <span
            className={`text-lg font-bold font-mono ${isUp ? "text-positive" : "text-negative"}`}
          >
            {formatPriceLabel(currentPrice)}
          </span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              isUp
                ? "bg-positive/15 text-positive"
                : "bg-negative/15 text-negative"
            }`}
          >
            {isUp ? "+" : ""}
            {(((currentPrice - startPrice) / startPrice) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex gap-1">
          {timeframes.map((tf) => (
            <button
              type="button"
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                timeframe === tf
                  ? "bg-teal text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={history}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#233047"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#8FA2BC" }}
            axisLine={false}
            tickLine={false}
            interval={11}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#8FA2BC" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatPriceLabel}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "#141E2E",
              border: "1px solid #233047",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#8FA2BC" }}
            itemStyle={{ color: strokeColor }}
            formatter={(val: number) => [formatPriceLabel(val), "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={{ r: 4, fill: strokeColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
