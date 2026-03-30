/**
 * Calls the backend canister's fetchYahooPrices method via IC HTTP outcall.
 * This bypasses CORS entirely — the HTTP request is made from the canister, not the browser.
 */
import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { loadConfig } from "../config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FetchPricesIDL = ({ IDL: I }: { IDL: any }) =>
  I.Service({
    fetchYahooPrices: I.Func([I.Text], [I.Text], ["query"]),
  });

type FetchActor = {
  fetchYahooPrices: (symbols: string) => Promise<string>;
};

const _IDL = IDL; // ensure IDL is imported so the module doesn't tree-shake
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
    const results: Array<{ symbol: string; regularMarketPrice: number }> =
      (
        data as {
          quoteResponse?: {
            result?: Array<{ symbol: string; regularMarketPrice: number }>;
          };
        }
      )?.quoteResponse?.result ?? [];
    const out: Record<string, number> = {};
    for (const item of results) {
      if (
        typeof item.regularMarketPrice === "number" &&
        item.regularMarketPrice > 0
      ) {
        out[item.symbol] = item.regularMarketPrice;
      }
    }
    return out;
  } catch (e) {
    console.warn("Backend price fetch failed:", e);
    return {};
  }
}
