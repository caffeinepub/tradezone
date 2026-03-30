/**
 * Calls the backend canister's fetchYahooPrices method via IC HTTP outcall.
 * This bypasses CORS entirely — the HTTP request is made from the canister, not the browser.
 */
import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { loadConfig } from "../config";
import { fetchWithProxies } from "../hooks/usePrices";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FetchPricesIDL = ({ IDL: I }: { IDL: any }) =>
  I.Service({
    fetchYahooPrices: I.Func([I.Text], [I.Text], ["query"]),
  });

type FetchActor = {
  fetchYahooPrices: (symbols: string) => Promise<string>;
};

const _IDL = IDL;
void _IDL;

let cachedActor: FetchActor | null = null;

async function getPriceActor(): Promise<FetchActor> {
  if (cachedActor) return cachedActor;
  const config = await loadConfig();
  const agent = new HttpAgent({ host: config.backend_host });
  if (config.backend_host?.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cachedActor = Actor.createActor<FetchActor>(FetchPricesIDL as any, {
    agent,
    canisterId: config.backend_canister_id,
  });
  return cachedActor;
}

/**
 * Fetches prices from Yahoo Finance via the backend canister (no CORS).
 * @param yahooSymbols - comma-separated Yahoo Finance symbols
 * @returns parsed price map {symbol -> price}
 */
export async function fetchPricesViaBackend(
  yahooSymbols: string,
): Promise<Record<string, number>> {
  try {
    const actor = await getPriceActor();
    const raw = await actor.fetchYahooPrices(yahooSymbols);
    if (!raw) return {};
    const data = JSON.parse(raw) as unknown;

    let results: Array<{ symbol: string; regularMarketPrice: number }> =
      (
        data as {
          quoteResponse?: {
            result?: Array<{ symbol: string; regularMarketPrice: number }>;
          };
        }
      )?.quoteResponse?.result ?? [];

    if (results.length === 0) {
      const qsr = (
        data as {
          quoteSummary?: {
            result?: Array<{ symbol: string; regularMarketPrice: number }>;
          };
        }
      )?.quoteSummary?.result;
      if (Array.isArray(qsr) && qsr.length > 0) {
        results = qsr;
      }
    }

    const out: Record<string, number> = {};
    for (const item of results) {
      if (
        typeof item.regularMarketPrice === "number" &&
        item.regularMarketPrice > 0
      ) {
        out[item.symbol] = item.regularMarketPrice;
      }
    }

    if (Object.keys(out).length > 0) {
      console.log(
        `[backendPrices] success — got ${Object.keys(out).length} prices via canister outcall`,
      );
    } else {
      console.warn(
        "[backendPrices] canister returned data but no valid prices parsed. Raw snippet:",
        raw.slice(0, 200),
      );
    }

    return out;
  } catch (e) {
    console.warn("[backendPrices] Backend price fetch failed:", e);
    return {};
  }
}

const STOOQ_APP_SYMBOL_MAP: Record<string, string> = {
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
  USDINR: "USDINR.FX",
};

/**
 * Fetches prices from Stooq via CORS proxies.
 * @param appSymbols - array of app symbol strings (e.g. ["RELIANCE", "AAPL"])
 * @returns Record<appSymbol, price>
 */
export async function fetchPricesViaStooq(
  appSymbols: string[],
): Promise<Record<string, number>> {
  const results = await Promise.allSettled(
    appSymbols
      .filter((sym) => STOOQ_APP_SYMBOL_MAP[sym])
      .map(async (appSym) => {
        const stooqSym = STOOQ_APP_SYMBOL_MAP[appSym];
        const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSym)}&f=sd2t2ohlcv&e=json`;
        const res = await fetchWithProxies(url, 5000);
        if (!res) return null;
        const data = await res.json();
        const price = data?.symbols?.[0]?.close;
        if (typeof price === "number" && price > 0) {
          return { appSym, price };
        }
        return null;
      }),
  );

  const out: Record<string, number> = {};
  for (const result of results) {
    if (result.status === "fulfilled" && result.value !== null) {
      out[result.value.appSym] = result.value.price;
    }
  }
  return out;
}
