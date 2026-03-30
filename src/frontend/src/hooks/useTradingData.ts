import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface Profile {
  balance: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface Trade {
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  timestamp: bigint;
}

export interface LeaderboardEntry {
  userId: string;
  balance: number;
  portfolioValue: number;
}

export interface TradingData {
  profile: Profile | null;
  portfolio: Holding[];
  history: Trade[];
  watchlist: string[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addWatch: (symbol: string) => Promise<void>;
  removeWatch: (symbol: string) => Promise<void>;
  executeBuy: (
    symbol: string,
    quantity: number,
    price: number,
  ) => Promise<boolean>;
  executeSell: (
    symbol: string,
    quantity: number,
    price: number,
  ) => Promise<boolean>;
}

const STORAGE_KEY = "tradezone_data";

interface StoredData {
  balance: number;
  portfolio: Holding[];
  history: Trade[];
  watchlist: string[];
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    balance: 1000000,
    portfolio: [],
    history: [],
    watchlist: [],
  };
}

function saveData(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useTradingData(): TradingData {
  const [stored, setStored] = useState<StoredData>(loadData);
  // Keep a ref always in sync with latest stored — safe to read in callbacks
  const storedRef = useRef(stored);
  storedRef.current = stored;

  // Persist whenever stored changes
  useEffect(() => {
    saveData(stored);
  }, [stored]);

  const profile: Profile = { balance: stored.balance };

  const refresh = useCallback(async () => {
    setStored(loadData());
  }, []);

  const addWatch = useCallback(async (symbol: string) => {
    setStored((prev) => {
      if (prev.watchlist.includes(symbol)) return prev;
      const next = { ...prev, watchlist: [...prev.watchlist, symbol] };
      toast.success(`${symbol} added to watchlist`);
      return next;
    });
  }, []);

  const removeWatch = useCallback(async (symbol: string) => {
    setStored((prev) => {
      const next = {
        ...prev,
        watchlist: prev.watchlist.filter((s) => s !== symbol),
      };
      toast.success(`${symbol} removed from watchlist`);
      return next;
    });
  }, []);

  const executeBuy = useCallback(
    async (
      symbol: string,
      quantity: number,
      price: number,
    ): Promise<boolean> => {
      const cost = price * quantity;
      // Use ref for latest balance — avoids stale closure and localStorage timing issues
      const currentBalance = storedRef.current.balance;

      if (currentBalance < cost) {
        toast.error(
          `Insufficient balance. Need ₹${cost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}, have ₹${currentBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        );
        return false;
      }

      setStored((prev) => {
        if (prev.balance < cost) return prev;

        const existingIdx = prev.portfolio.findIndex(
          (h) => h.symbol === symbol,
        );
        let newPortfolio: Holding[];
        if (existingIdx >= 0) {
          newPortfolio = prev.portfolio.map((h, i) => {
            if (i !== existingIdx) return h;
            const totalQty = h.quantity + quantity;
            const avgPrice =
              (h.avgBuyPrice * h.quantity + price * quantity) / totalQty;
            return { ...h, quantity: totalQty, avgBuyPrice: avgPrice };
          });
        } else {
          newPortfolio = [
            ...prev.portfolio,
            { symbol, quantity, avgBuyPrice: price },
          ];
        }

        const newTrade: Trade = {
          symbol,
          action: "BUY",
          quantity,
          price,
          timestamp: BigInt(Date.now()),
        };

        return {
          ...prev,
          balance: prev.balance - cost,
          portfolio: newPortfolio,
          history: [newTrade, ...prev.history],
        };
      });

      toast.success(
        `Bought ${quantity} × ${symbol} @ ${price % 1 === 0 ? price.toLocaleString("en-IN") : price.toFixed(2)}`,
      );
      return true;
    },
    [],
  );

  const executeSell = useCallback(
    async (
      symbol: string,
      quantity: number,
      price: number,
    ): Promise<boolean> => {
      // Use ref for latest portfolio — avoids stale closure and localStorage timing issues
      const currentPortfolio = storedRef.current.portfolio;
      const holding = currentPortfolio.find((h) => h.symbol === symbol);

      if (!holding || holding.quantity < quantity) {
        toast.error(
          holding
            ? `Insufficient holdings. Have ${holding.quantity}, trying to sell ${quantity}`
            : `No holdings found for ${symbol}`,
        );
        return false;
      }

      setStored((prev) => {
        const h = prev.portfolio.find((ph) => ph.symbol === symbol);
        if (!h || h.quantity < quantity) return prev;

        const newPortfolio = prev.portfolio
          .map((ph) => {
            if (ph.symbol !== symbol) return ph;
            return { ...ph, quantity: ph.quantity - quantity };
          })
          .filter((ph) => ph.quantity > 0);

        const proceeds = price * quantity;
        const newTrade: Trade = {
          symbol,
          action: "SELL",
          quantity,
          price,
          timestamp: BigInt(Date.now()),
        };

        return {
          ...prev,
          balance: prev.balance + proceeds,
          portfolio: newPortfolio,
          history: [newTrade, ...prev.history],
        };
      });

      toast.success(
        `Sold ${quantity} × ${symbol} @ ${price % 1 === 0 ? price.toLocaleString("en-IN") : price.toFixed(2)}`,
      );
      return true;
    },
    [],
  );

  // Static leaderboard — in a real app this would be multi-user
  const leaderboard: LeaderboardEntry[] = [
    { userId: "You", balance: stored.balance, portfolioValue: 0 },
  ];

  return {
    profile,
    portfolio: stored.portfolio,
    history: stored.history,
    watchlist: stored.watchlist,
    leaderboard,
    isLoading: false,
    refresh,
    addWatch,
    removeWatch,
    executeBuy,
    executeSell,
  };
}
