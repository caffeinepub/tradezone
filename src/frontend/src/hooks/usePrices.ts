import { useCallback, useEffect, useRef, useState } from "react";
import { ALL_INSTRUMENTS } from "../data/instruments";
import { fetchPricesViaBackend } from "../utils/backendPrices";
import { isMarketOpen } from "../utils/marketHours";

const STOOQ_SYMBOL_MAP: Record<string, string | null> = {
  // US stocks
  AAPL: "AAPL.US",
  TSLA: "TSLA.US",
  GOOGL: "GOOGL.US",
  MSFT: "MSFT.US",
  AMZN: "AMZN.US",
  NVDA: "NVDA.US",
  META: "META.US",
  NFLX: "NFLX.US",
  JPM: "JPM.US",
  V: "V.US",
  JNJ: "JNJ.US",
  WMT: "WMT.US",
  PYPL: "PYPL.US",
  DIS: "DIS.US",
  BABA: "BABA.US",
  CRM: "CRM.US",
  AMD: "AMD.US",
  INTC: "INTC.US",
  UBER: "UBER.US",
  SPOT: "SPOT.US",
  COIN: "COIN.US",
  PLTR: "PLTR.US",
  // NSE stocks
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
  MNM: "MNM.NS",
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
  // Commodities
  GOLD: "GC.F",
  SILVER: "SI.F",
  CRUDEOIL_WTI: "CL.F",
  CRUDEOIL_BRENT: "BZ.F",
  NATGAS: "NG.F",
  COPPER: "HG.F",
  WHEAT: "ZW.F",
  CORN: "ZC.F",
  GOLD_MCX: "GC.F",
  SILVER_MCX: "SI.F",
  // Indices — no Stooq equivalent, use Yahoo fallback
  NIFTY: null,
  BANKNIFTY: null,
  // FX
  USDINR: "USDINR.FX",
};

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

// Market Pulse-calibrated volatility profiles
const TICK_VOLATILITY: Record<string, number> = {
  // High volatility US tech
  TSLA: 0.0015,
  NVDA: 0.0013,
  COIN: 0.002,
  PLTR: 0.0018,
  AMD: 0.0013,
  NFLX: 0.001,
  META: 0.001,
  SPOT: 0.0012,
  UBER: 0.0012,
  BABA: 0.0012,
  INTC: 0.001,
  DIS: 0.001,
  // Steady US blue chips
  AAPL: 0.0007,
  GOOGL: 0.0007,
  MSFT: 0.0007,
  AMZN: 0.0007,
  JPM: 0.0007,
  V: 0.0005,
  WMT: 0.0005,
  JNJ: 0.0005,
  CRM: 0.0008,
  // High beta Indian
  ADANIENT: 0.0018,
  ADANIPORTS: 0.0014,
  ZOMATO: 0.002,
  PAYTM: 0.0022,
  NYKAA: 0.0018,
  POLICYBZR: 0.002,
  TRENT: 0.0016,
  HAL: 0.0014,
  TATAMOTORS: 0.0013,
  TATASTEEL: 0.0013,
  JSWSTEEL: 0.0013,
  HINDALCO: 0.0012,
  INDUSINDBK: 0.0013,
  AXISBANK: 0.0012,
  VEDL: 0.0015,
  IRFC: 0.0014,
  DLF: 0.0015,
  IRCTC: 0.0014,
  // Mid volatility Indian
  RELIANCE: 0.0008,
  ICICIBANK: 0.0009,
  SBIN: 0.001,
  BANKBARODA: 0.0012,
  PNB: 0.0012,
  BAJFINANCE: 0.0011,
  BAJAJFINSV: 0.001,
  HDFCBANK: 0.0007,
  INFY: 0.0008,
  TCS: 0.0006,
  WIPRO: 0.0008,
  HCLTECH: 0.0008,
  TECHM: 0.0009,
  LT: 0.0008,
  MARUTI: 0.0009,
  TITAN: 0.0009,
  BHARTIARTL: 0.0008,
  KOTAKBANK: 0.0007,
  APOLLOHOSP: 0.001,
  MUTHOOTFIN: 0.0012,
  SIEMENS: 0.001,
  ABB: 0.001,
  HAVELLS: 0.001,
  EICHERMOT: 0.001,
  HEROMOTOCO: 0.001,
  DRREDDY: 0.0009,
  CIPLA: 0.0009,
  SUNPHARMA: 0.0008,
  GODREJCP: 0.0007,
  PIDILITIND: 0.0008,
  DMART: 0.0009,
  GRASIM: 0.0009,
  SHRIRAMFIN: 0.0012,
  // Defensive Indian (low volatility)
  HINDUNILVR: 0.0004,
  NESTLEIND: 0.0004,
  BRITANNIA: 0.0004,
  COLPAL: 0.0004,
  ITC: 0.0004,
  MARICO: 0.0004,
  TATACONSUM: 0.0005,
  BPCL: 0.0006,
  ONGC: 0.0006,
  POWERGRID: 0.0005,
  NTPC: 0.0005,
  COALINDIA: 0.0006,
  HDFCLIFE: 0.0006,
  SBILIFE: 0.0006,
  BEL: 0.001,
  // Indices
  NIFTY: 0.0004,
  BANKNIFTY: 0.0006,
  // Commodities
  GOLD: 0.0005,
  GOLD_MCX: 0.0005,
  SILVER: 0.0008,
  SILVER_MCX: 0.0008,
  CRUDEOIL_WTI: 0.001,
  CRUDEOIL_BRENT: 0.001,
  NATGAS: 0.0018,
  COPPER: 0.0008,
  WHEAT: 0.0007,
  CORN: 0.0006,
};
const DEFAULT_TICK_VOL = 0.0006;
const CLOSED_MARKET_VOL = 0.00015;

/** Round price to exchange-appropriate tick size (Market Pulse behavior) */
function roundToTickSize(price: number, symbol: string): number {
  // Indian stocks (NSE/BSE): ₹0.05 tick
  const indianStocks = [
    "RELIANCE",
    "TCS",
    "INFY",
    "HDFCBANK",
    "ICICIBANK",
    "SBIN",
    "ZOMATO",
    "PAYTM",
    "NYKAA",
    "TRENT",
    "HAL",
    "IRFC",
    "IRCTC",
    "ADANIENT",
    "ADANIPORTS",
    "AXISBANK",
    "BAJFINANCE",
    "BAJAJFINSV",
    "BEL",
    "BPCL",
    "BHARTIARTL",
    "BRITANNIA",
    "CIPLA",
    "COALINDIA",
    "DRREDDY",
    "EICHERMOT",
    "GRASIM",
    "HCLTECH",
    "HDFCLIFE",
    "HEROMOTOCO",
    "HINDALCO",
    "HINDUNILVR",
    "INDUSINDBK",
    "ITC",
    "JSWSTEEL",
    "KOTAKBANK",
    "LT",
    "MNM",
    "MARUTI",
    "NESTLEIND",
    "NTPC",
    "ONGC",
    "POWERGRID",
    "SBILIFE",
    "SHRIRAMFIN",
    "SUNPHARMA",
    "TATACONSUM",
    "TATAMOTORS",
    "TATASTEEL",
    "TECHM",
    "TITAN",
    "ULTRACEMCO",
    "WIPRO",
    "APOLLOHOSP",
    "DMART",
    "PIDILITIND",
    "HAVELLS",
    "SIEMENS",
    "ABB",
    "DLF",
    "GODREJCP",
    "MARICO",
    "COLPAL",
    "MUTHOOTFIN",
    "VEDL",
    "BANKBARODA",
    "PNB",
    "POLICYBZR",
    "ASIANPAINT",
    "BAJAJ_AUTO",
  ];
  if (indianStocks.includes(symbol)) return Math.round(price / 0.05) * 0.05;
  // Commodities
  if (symbol === "GOLD" || symbol === "GOLD_MCX")
    return Math.round(price / 0.5) * 0.5;
  if (symbol === "SILVER" || symbol === "SILVER_MCX")
    return Math.round(price * 100) / 100;
  if (symbol === "CRUDEOIL_WTI" || symbol === "CRUDEOIL_BRENT")
    return Math.round(price * 100) / 100;
  // Indices
  if (symbol === "NIFTY" || symbol === "BANKNIFTY")
    return Math.round(price * 10) / 10;
  // US stocks — $0.01 tick
  return Math.round(price * 100) / 100;
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

async function fetchUsdInr(): Promise<number> {
  // Try Stooq FX first
  try {
    const stooqUrl = "https://stooq.com/q/l/?s=USDINR.FX&f=sd2t2ohlcv&e=json";
    const res = await fetchWithProxies(stooqUrl, 4000);
    if (res) {
      const data = await res.json();
      const price = data?.symbols?.[0]?.close;
      if (typeof price === "number" && price > 0) return price;
    }
  } catch {
    /* ignore */
  }
  // Yahoo fallback
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

/** Fetch a single symbol from Stooq */
async function fetchStooqPrice(stooqSymbol: string): Promise<number | null> {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&e=json`;
  const res = await fetchWithProxies(url, 5000);
  if (!res) return null;
  const data = await res.json();
  const price = data?.symbols?.[0]?.close;
  return typeof price === "number" && price > 0 ? price : null;
}

/** Stooq primary + Yahoo Finance fallback */
async function fetchAllLivePrices(symbols: string[]): Promise<{
  prices: Record<string, number>;
  success: boolean;
}> {
  if (symbols.length === 0) return { prices: {}, success: false };

  // Separate symbols by whether they have a Stooq mapping
  const stooqSymbols: Array<{ appSym: string; stooqSym: string }> = [];
  const yahooOnlySymbols: string[] = []; // null-mapped (e.g. NIFTY, BANKNIFTY)

  for (const sym of symbols) {
    const stooqSym = STOOQ_SYMBOL_MAP[sym];
    if (stooqSym === undefined) {
      // Not in map — try Yahoo
      yahooOnlySymbols.push(sym);
    } else if (stooqSym === null) {
      // Explicitly null — Yahoo only
      yahooOnlySymbols.push(sym);
    } else {
      stooqSymbols.push({ appSym: sym, stooqSym });
    }
  }

  // Fetch USD/INR in parallel with stock prices
  const usdInrPromise = fetchUsdInr();

  // PRIMARY: Fetch all Stooq prices in parallel
  const stooqResults = await Promise.allSettled(
    stooqSymbols.map(async ({ appSym, stooqSym }) => {
      const price = await fetchStooqPrice(stooqSym);
      return { appSym, stooqSym, price };
    }),
  );

  const rawPrices: Record<string, number> = {};
  let stooqSuccessCount = 0;

  for (const result of stooqResults) {
    if (result.status === "fulfilled" && result.value.price !== null) {
      rawPrices[result.value.appSym] = result.value.price;
      stooqSuccessCount++;
    }
  }

  const stooqSuccessRate =
    stooqSymbols.length > 0 ? stooqSuccessCount / stooqSymbols.length : 1;

  console.log(
    `[usePrices] Stooq: ${stooqSuccessCount}/${stooqSymbols.length} (${Math.round(stooqSuccessRate * 100)}%)`,
  );

  // FALLBACK: If Stooq success rate < 30%, fall back to Yahoo Finance for all symbols
  const needsYahooFallback = stooqSuccessRate < 0.3;
  const yahooFallbackSymbols = needsYahooFallback
    ? [...stooqSymbols.map((s) => s.appSym), ...yahooOnlySymbols]
    : yahooOnlySymbols;

  if (yahooFallbackSymbols.length > 0) {
    const yahooToApp: Record<string, string[]> = {};
    for (const sym of yahooFallbackSymbols) {
      const y = YAHOO_SYMBOL_MAP[sym];
      if (!y) continue;
      if (!yahooToApp[y]) yahooToApp[y] = [];
      yahooToApp[y].push(sym);
    }
    const yahooSymbolList = Object.keys(yahooToApp);
    const CHUNK_SIZE = 30;

    await Promise.allSettled(
      Array.from(
        { length: Math.ceil(yahooSymbolList.length / CHUNK_SIZE) },
        (_, i) => yahooSymbolList.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      ).map(async (chunk) => {
        const symbolsParam = chunk.join(",");
        // Try backend outcall first for Yahoo
        const backendResult = await fetchPricesViaBackend(symbolsParam);
        if (Object.keys(backendResult).length > 0) {
          for (const [ySym, price] of Object.entries(backendResult)) {
            for (const appSym of yahooToApp[ySym] ?? []) {
              if (!rawPrices[appSym]) rawPrices[appSym] = price;
            }
          }
          return;
        }
        // CORS proxy fallback
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
              for (const appSym of yahooToApp[item.symbol] ?? []) {
                if (!rawPrices[appSym])
                  rawPrices[appSym] = item.regularMarketPrice;
              }
            }
          }
        } catch {
          /* ignore */
        }
      }),
    );
  }

  const usdInr = await usdInrPromise;

  // MCX conversions
  if (rawPrices.GOLD)
    rawPrices.GOLD_MCX = ((rawPrices.GOLD * usdInr) / 31.1035) * 10;
  if (rawPrices.SILVER)
    rawPrices.SILVER_MCX = ((rawPrices.SILVER * usdInr) / 31.1035) * 1000;
  if (symbols.includes("USDINR") && usdInr > 0) rawPrices.USDINR = usdInr;

  const anySuccess = Object.keys(rawPrices).length > 0;
  return { prices: rawPrices, success: anySuccess };
}

function applyTick(price: number, symbol: string, apiPrice: number): number {
  const marketOpen = isMarketOpen(symbol);
  const vol = marketOpen
    ? (TICK_VOLATILITY[symbol] ?? DEFAULT_TICK_VOL)
    : CLOSED_MARKET_VOL;
  const noise = Math.random() + Math.random() + Math.random() - 1.5;
  const reversion = apiPrice > 0 ? 0.03 * (apiPrice - price) : 0;
  const newPrice = price + reversion + price * vol * noise;
  let clampedPrice: number;
  if (apiPrice > 0) {
    const limit = apiPrice * 0.05;
    clampedPrice = Math.max(
      apiPrice - limit,
      Math.min(apiPrice + limit, newPrice),
    );
  } else {
    clampedPrice = Math.max(newPrice, price * 0.95);
  }
  return roundToTickSize(clampedPrice, symbol);
}

export function usePrices(symbols: string[]): {
  prices: Record<string, number>;
  lastUpdated: Date | null;
  isLive: boolean;
  refresh: () => void;
} {
  const symbolsKey = symbols.join(",");
  const pricesRef = useRef<Record<string, number>>({});
  const apiPricesRef = useRef<Record<string, number>>({});
  const refreshTriggerRef = useRef<(() => void) | null>(null);
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

    refreshTriggerRef.current = () => {
      if (apiTimeoutId) clearTimeout(apiTimeoutId);
      void refreshFromAPI();
    };

    void refreshFromAPI();

    // Market Pulse tick frequency: 1 second
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
    }, 1000);

    return () => {
      cancelled = true;
      refreshTriggerRef.current = null;
      if (apiTimeoutId) clearTimeout(apiTimeoutId);
      clearInterval(tickInterval);
    };
  }, [symbolsKey]);

  const refresh = useCallback(() => {
    refreshTriggerRef.current?.();
  }, []);

  return { prices, lastUpdated, isLive, refresh };
}

export function useAllPrices(): {
  prices: Record<string, number>;
  lastUpdated: Date | null;
  isLive: boolean;
  refresh: () => void;
} {
  const allSymbols = ALL_INSTRUMENTS.map((i) => i.symbol).concat([
    "NIFTY",
    "BANKNIFTY",
    "GOLD_MCX",
    "SILVER_MCX",
  ]);
  return usePrices(allSymbols);
}
