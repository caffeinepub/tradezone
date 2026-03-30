import { useEffect, useRef, useState } from "react";
import { ALL_INSTRUMENTS } from "../data/instruments";
import { fetchPricesViaBackend } from "../utils/backendPrices";
import { isMarketOpen } from "../utils/marketHours";

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  AAPL: "AAPL",
  TSLA: "TSLA",
  GOOGL: "GOOGL",
  MSFT: "MSFT",
  AMZN: "AMZN",
  NVDA: "NVDA",
  META: "META",
  NFLX: "NFLX",
  JPM: "JPM",
  V: "V",
  JNJ: "JNJ",
  WMT: "WMT",
  PYPL: "PYPL",
  DIS: "DIS",
  BABA: "BABA",
  CRM: "CRM",
  AMD: "AMD",
  INTC: "INTC",
  UBER: "UBER",
  SPOT: "SPOT",
  COIN: "COIN",
  PLTR: "PLTR",
  ADANIENT: "ADANIENT.NS",
  ADANIPORTS: "ADANIPORTS.NS",
  APOLLOHOSP: "APOLLOHOSP.NS",
  ASIANPAINT: "ASIANPAINT.NS",
  AXISBANK: "AXISBANK.NS",
  BAJAJ_AUTO: "BAJAJ-AUTO.NS",
  BAJFINANCE: "BAJFINANCE.NS",
  BAJAJFINSV: "BAJAJFINSV.NS",
  BEL: "BEL.NS",
  BPCL: "BPCL.NS",
  BHARTIARTL: "BHARTIARTL.NS",
  BRITANNIA: "BRITANNIA.NS",
  CIPLA: "CIPLA.NS",
  COALINDIA: "COALINDIA.NS",
  DRREDDY: "DRREDDY.NS",
  EICHERMOT: "EICHERMOT.NS",
  GRASIM: "GRASIM.NS",
  HCLTECH: "HCLTECH.NS",
  HDFCBANK: "HDFCBANK.NS",
  HDFCLIFE: "HDFCLIFE.NS",
  HEROMOTOCO: "HEROMOTOCO.NS",
  HINDALCO: "HINDALCO.NS",
  HINDUNILVR: "HINDUNILVR.NS",
  ICICIBANK: "ICICIBANK.NS",
  INDUSINDBK: "INDUSINDBK.NS",
  INFY: "INFY.NS",
  ITC: "ITC.NS",
  JSWSTEEL: "JSWSTEEL.NS",
  KOTAKBANK: "KOTAKBANK.NS",
  LT: "LT.NS",
  MNM: "M%26M.NS",
  MARUTI: "MARUTI.NS",
  NESTLEIND: "NESTLEIND.NS",
  NTPC: "NTPC.NS",
  ONGC: "ONGC.NS",
  POWERGRID: "POWERGRID.NS",
  RELIANCE: "RELIANCE.NS",
  SBILIFE: "SBILIFE.NS",
  SBIN: "SBIN.NS",
  SHRIRAMFIN: "SHRIRAMFIN.NS",
  SUNPHARMA: "SUNPHARMA.NS",
  TATACONSUM: "TATACONSUM.NS",
  TATAMOTORS: "TATAMOTORS.NS",
  TATASTEEL: "TATASTEEL.NS",
  TCS: "TCS.NS",
  TECHM: "TECHM.NS",
  TITAN: "TITAN.NS",
  TRENT: "TRENT.NS",
  ULTRACEMCO: "ULTRACEMCO.NS",
  WIPRO: "WIPRO.NS",
  ZOMATO: "ZOMATO.NS",
  PAYTM: "PAYTM.NS",
  NYKAA: "NYKAA.NS",
  POLICYBZR: "POLICYBZR.NS",
  DMART: "DMART.NS",
  PIDILITIND: "PIDILITIND.NS",
  HAVELLS: "HAVELLS.NS",
  SIEMENS: "SIEMENS.NS",
  ABB: "ABB.NS",
  DLF: "DLF.NS",
  GODREJCP: "GODREJCP.NS",
  MARICO: "MARICO.NS",
  COLPAL: "COLPAL.NS",
  MUTHOOTFIN: "MUTHOOTFIN.NS",
  IRFC: "IRFC.NS",
  HAL: "HAL.NS",
  IRCTC: "IRCTC.NS",
  VEDL: "VEDL.NS",
  BANKBARODA: "BANKBARODA.NS",
  PNB: "PNB.NS",
  GOLD: "GC=F",
  SILVER: "SI=F",
  CRUDEOIL_WTI: "CL=F",
  CRUDEOIL_BRENT: "BZ=F",
  NATGAS: "NG=F",
  COPPER: "HG=F",
  WHEAT: "ZW=F",
  CORN: "ZC=F",
  NIFTY: "%5ENSEI",
  BANKNIFTY: "%5ENSEBANK",
  GOLD_MCX: "GC=F",
  SILVER_MCX: "SI=F",
  USDINR: "INR=X",
};

const BASE_PRICE_MAP: Record<string, number> = {};
for (const inst of ALL_INSTRUMENTS) {
  BASE_PRICE_MAP[inst.symbol] = inst.basePrice;
}
BASE_PRICE_MAP.NIFTY = 23500;
BASE_PRICE_MAP.BANKNIFTY = 52000;
BASE_PRICE_MAP.GOLD = 4561;
BASE_PRICE_MAP.SILVER = 71.28;
BASE_PRICE_MAP.GOLD_MCX = Math.round(((4561 * 84) / 31.1035) * 10);
BASE_PRICE_MAP.SILVER_MCX = Math.round(((71.28 * 84) / 31.1035) * 1000);

const TICK_VOLATILITY: Record<string, number> = {
  TSLA: 0.0012,
  NVDA: 0.00105,
  COIN: 0.0018,
  PLTR: 0.0015,
  AMD: 0.00105,
  META: 0.00075,
  NFLX: 0.00075,
  SPOT: 0.0009,
  UBER: 0.00075,
  AAPL: 0.0006,
  GOOGL: 0.0006,
  MSFT: 0.0006,
  AMZN: 0.0006,
  INTC: 0.00075,
  JPM: 0.0006,
  V: 0.00045,
  WMT: 0.00045,
  JNJ: 0.00045,
  DIS: 0.00075,
  BABA: 0.0009,
  NIFTY: 0.0003,
  BANKNIFTY: 0.00045,
  ADANIENT: 0.0012,
  ADANIPORTS: 0.0009,
  ZOMATO: 0.00135,
  PAYTM: 0.0015,
  NYKAA: 0.0012,
  TATAMOTORS: 0.0009,
  TATASTEEL: 0.0009,
  JSWSTEEL: 0.0009,
  HINDALCO: 0.00075,
  INDUSINDBK: 0.0009,
  TRENT: 0.00105,
  HAL: 0.0009,
  RELIANCE: 0.0006,
  TCS: 0.00045,
  INFY: 0.0006,
  HDFCBANK: 0.00045,
  ICICIBANK: 0.0006,
  AXISBANK: 0.00075,
  SBIN: 0.00075,
  BAJFINANCE: 0.00075,
  BHARTIARTL: 0.0006,
  WIPRO: 0.0006,
  HCLTECH: 0.0006,
  TECHM: 0.0006,
  LT: 0.0006,
  KOTAKBANK: 0.00045,
  MARUTI: 0.0006,
  TITAN: 0.0006,
  HINDUNILVR: 0.0003,
  NESTLEIND: 0.0003,
  BRITANNIA: 0.0003,
  COLPAL: 0.0003,
  ITC: 0.0003,
  MARICO: 0.0003,
  GODREJCP: 0.0003,
  PIDILITIND: 0.00045,
  GOLD: 0.0006,
  SILVER: 0.0007,
  GOLD_MCX: 0.0006,
  SILVER_MCX: 0.0007,
  CRUDEOIL_WTI: 0.00075,
  CRUDEOIL_BRENT: 0.00075,
  NATGAS: 0.00135,
  COPPER: 0.0006,
  WHEAT: 0.0006,
  CORN: 0.00045,
};
const DEFAULT_TICK_VOL = 0.00045;
const CLOSED_MARKET_VOL = 0.0002;

/** Reverse map: yahoo symbol -> app symbols */
function buildYahooToApp(appSymbols: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const sym of appSymbols) {
    const y = YAHOO_SYMBOL_MAP[sym];
    if (!y) continue;
    if (!map[y]) map[y] = [];
    map[y].push(sym);
  }
  return map;
}

/** Fetch URL via multiple CORS proxies in parallel — returns first success */
export async function fetchWithProxies(
  url: string,
  timeoutMs = 5000,
): Promise<Response | null> {
  const proxyUrls = [
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ];
  const makeRequests = proxyUrls.map(async (proxyUrl) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      throw new Error("not ok");
    } catch {
      clearTimeout(timer);
      throw new Error("failed");
    }
  });
  try {
    return await Promise.any(makeRequests);
  } catch {
    return null;
  }
}

async function fetchUsdInrFallback(): Promise<number> {
  try {
    const url =
      "https://query1.finance.yahoo.com/v7/finance/quote?symbols=INR%3DX";
    const res = await fetchWithProxies(url, 4000);
    if (!res) return 84;
    const data = await res.json();
    const rate = data?.quoteResponse?.result?.[0]?.regularMarketPrice;
    return typeof rate === "number" && rate > 0 ? rate : 84;
  } catch {
    return 84;
  }
}

/**
 * PRIMARY: Fetch via backend canister HTTP outcall (no CORS issues)
 * FALLBACK: Use CORS proxies
 */
async function fetchAllLivePrices(symbols: string[]): Promise<{
  prices: Record<string, number>;
  success: boolean;
}> {
  const yahooToApp = buildYahooToApp(symbols);
  const yahooSymbols = Object.keys(yahooToApp);
  if (yahooSymbols.length === 0) return { prices: {}, success: false };

  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < yahooSymbols.length; i += CHUNK_SIZE) {
    chunks.push(yahooSymbols.slice(i, i + CHUNK_SIZE));
  }

  const rawPrices: Record<string, number> = {};
  let anySuccess = false;

  // Try backend outcalls for each chunk
  await Promise.all(
    chunks.map(async (chunk) => {
      const symbolsParam = chunk.join(",");
      // PRIMARY: backend HTTP outcall
      const backendResult = await fetchPricesViaBackend(symbolsParam);
      if (Object.keys(backendResult).length > 0) {
        Object.assign(rawPrices, backendResult);
        anySuccess = true;
        return;
      }
      // FALLBACK: CORS proxy
      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}&fields=regularMarketPrice,symbol`;
        const res = await fetchWithProxies(url, 5000);
        if (!res) return;
        const data = await res.json();
        const results: Array<{ symbol: string; regularMarketPrice: number }> =
          data?.quoteResponse?.result ?? [];
        for (const item of results) {
          if (
            typeof item.regularMarketPrice === "number" &&
            item.regularMarketPrice > 0
          ) {
            rawPrices[item.symbol] = item.regularMarketPrice;
            anySuccess = true;
          }
        }
      } catch {
        // ignore
      }
    }),
  );

  // Get USD/INR rate
  let usdInr = 84;
  if (rawPrices["INR=X"]) {
    usdInr = rawPrices["INR=X"];
  } else {
    // Try backend for INR rate
    const inrResult = await fetchPricesViaBackend("INR%3DX");
    if (inrResult["INR=X"]) {
      usdInr = inrResult["INR=X"];
    } else {
      usdInr = await fetchUsdInrFallback();
    }
  }

  // Map yahoo symbols back to app symbols, handle MCX conversions
  const out: Record<string, number> = {};
  for (const [ySym, appSyms] of Object.entries(yahooToApp)) {
    const raw = rawPrices[ySym];
    if (!raw || raw <= 0) continue;
    for (const appSym of appSyms) {
      if (appSym === "GOLD_MCX") {
        out[appSym] = ((raw * usdInr) / 31.1035) * 10;
      } else if (appSym === "SILVER_MCX") {
        out[appSym] = ((raw * usdInr) / 31.1035) * 1000;
      } else {
        out[appSym] = raw;
      }
    }
  }

  if (symbols.includes("USDINR")) out.USDINR = usdInr;

  // Recompute MCX from live gold/silver if available
  if (out.GOLD) out.GOLD_MCX = ((out.GOLD * usdInr) / 31.1035) * 10;
  if (out.SILVER) out.SILVER_MCX = ((out.SILVER * usdInr) / 31.1035) * 1000;

  return { prices: out, success: anySuccess };
}

function applyTick(price: number, symbol: string, apiPrice: number): number {
  const marketOpen = isMarketOpen(symbol);
  const vol = marketOpen
    ? (TICK_VOLATILITY[symbol] ?? DEFAULT_TICK_VOL)
    : CLOSED_MARKET_VOL;
  const noise = Math.random() + Math.random() + Math.random() - 1.5;
  const reversion = apiPrice > 0 ? 0.03 * (apiPrice - price) : 0;
  const newPrice = price + reversion + price * vol * noise;
  if (apiPrice > 0) {
    const limit = apiPrice * 0.05;
    return Math.max(apiPrice - limit, Math.min(apiPrice + limit, newPrice));
  }
  return Math.max(newPrice, price * 0.95);
}

export function usePrices(symbols: string[]): {
  prices: Record<string, number>;
  lastUpdated: Date | null;
  isLive: boolean;
} {
  const symbolsKey = symbols.join(",");
  const pricesRef = useRef<Record<string, number>>({});
  const apiPricesRef = useRef<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const sym of symbols) {
      init[sym] = BASE_PRICE_MAP[sym] ?? 100;
    }
    pricesRef.current = init;
    return init;
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const syms = symbolsKey.split(",").filter(Boolean);
    let cancelled = false;
    let apiTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function anyMarketOpen(): boolean {
      return syms.some((s) => isMarketOpen(s));
    }

    async function refreshFromAPI() {
      if (cancelled) return;
      const { prices: live, success } = await fetchAllLivePrices(syms);
      if (!cancelled && success) {
        const updated = { ...pricesRef.current };
        for (const [sym, price] of Object.entries(live)) {
          if (price > 0) {
            updated[sym] = price;
            apiPricesRef.current[sym] = price;
          }
        }
        pricesRef.current = updated;
        setPrices({ ...updated });
        setLastUpdated(new Date());
        setIsLive(true);
      }
      if (!cancelled) {
        const nextDelay = success ? (anyMarketOpen() ? 15_000 : 60_000) : 5_000;
        apiTimeoutId = setTimeout(refreshFromAPI, nextDelay);
      }
    }

    void refreshFromAPI();

    const tickInterval = setInterval(() => {
      if (cancelled) return;
      const updated = { ...pricesRef.current };
      for (const sym of syms) {
        if (updated[sym]) {
          const apiPrice = apiPricesRef.current[sym] ?? 0;
          updated[sym] = applyTick(updated[sym], sym, apiPrice);
        }
      }
      pricesRef.current = updated;
      setPrices({ ...updated });
    }, 1500);

    return () => {
      cancelled = true;
      if (apiTimeoutId) clearTimeout(apiTimeoutId);
      clearInterval(tickInterval);
    };
  }, [symbolsKey]);

  return { prices, lastUpdated, isLive };
}

export function useAllPrices(): {
  prices: Record<string, number>;
  lastUpdated: Date | null;
  isLive: boolean;
} {
  const allSymbols = ALL_INSTRUMENTS.map((i) => i.symbol).concat([
    "NIFTY",
    "BANKNIFTY",
    "GOLD_MCX",
    "SILVER_MCX",
  ]);
  return usePrices(allSymbols);
}
