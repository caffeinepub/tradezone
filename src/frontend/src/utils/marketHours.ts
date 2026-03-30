export type MarketName = "NSE" | "NYSE" | "MCX" | "COMEX";

const NSE_SYMBOLS = new Set([
  // Nifty 50
  "ADANIENT",
  "ADANIPORTS",
  "APOLLOHOSP",
  "ASIANPAINT",
  "AXISBANK",
  "BAJAJ_AUTO",
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
  "HDFCBANK",
  "HDFCLIFE",
  "HEROMOTOCO",
  "HINDALCO",
  "HINDUNILVR",
  "ICICIBANK",
  "INDUSINDBK",
  "INFY",
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
  "RELIANCE",
  "SBILIFE",
  "SBIN",
  "SHRIRAMFIN",
  "SUNPHARMA",
  "TATACONSUM",
  "TATAMOTORS",
  "TATASTEEL",
  "TCS",
  "TECHM",
  "TITAN",
  "TRENT",
  "ULTRACEMCO",
  "WIPRO",
  // Nifty Next 50 + extras
  "ZOMATO",
  "PAYTM",
  "NYKAA",
  "POLICYBZR",
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
  "IRFC",
  "HAL",
  "IRCTC",
  "VEDL",
  "BANKBARODA",
  "PNB",
  // Indices
  "NIFTY",
  "BANKNIFTY",
]);

const NYSE_SYMBOLS = new Set([
  "AAPL",
  "TSLA",
  "GOOGL",
  "MSFT",
  "AMZN",
  "NVDA",
  "META",
  "NFLX",
  "JPM",
  "V",
  "JNJ",
  "WMT",
  "PYPL",
  "DIS",
  "BABA",
  "CRM",
  "AMD",
  "INTC",
  "UBER",
  "SPOT",
  "COIN",
  "PLTR",
]);

const MCX_SYMBOLS = new Set(["GOLD_MCX", "SILVER_MCX"]);

const _COMEX_SYMBOLS = new Set([
  "GOLD",
  "SILVER",
  "CRUDEOIL_WTI",
  "CRUDEOIL_BRENT",
  "NATGAS",
  "COPPER",
  "WHEAT",
  "CORN",
]);

export function getMarket(symbol: string): MarketName {
  if (NSE_SYMBOLS.has(symbol)) return "NSE";
  if (NYSE_SYMBOLS.has(symbol)) return "NYSE";
  if (MCX_SYMBOLS.has(symbol)) return "MCX";
  return "COMEX";
}

export function isMarketOpen(symbol: string): boolean {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcTime = utcHour * 60 + utcMinute; // minutes since midnight UTC

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  const market = getMarket(symbol);

  switch (market) {
    case "NSE":
      // Mon–Fri 03:45–10:00 UTC (09:15–15:30 IST)
      return isWeekday && utcTime >= 225 && utcTime < 600;

    case "NYSE":
      // Mon–Fri 14:30–21:00 UTC (09:30–16:00 ET)
      return isWeekday && utcTime >= 870 && utcTime < 1260;

    case "MCX":
      // Mon–Fri 03:30–18:00 UTC (09:00–23:30 IST)
      return isWeekday && utcTime >= 210 && utcTime < 1080;

    case "COMEX":
      // Mon 00:00 UTC – Fri 22:00 UTC (closed weekends)
      if (dayOfWeek === 0) return false;
      if (dayOfWeek === 6) return false;
      if (dayOfWeek === 5 && utcTime >= 1320) return false;
      return true;

    default:
      return false;
  }
}

export function getMarketLabel(symbol: string): string {
  const market = getMarket(symbol);
  switch (market) {
    case "NSE":
      return "NSE/BSE (09:15–15:30 IST)";
    case "NYSE":
      return "NYSE/NASDAQ (09:30–16:00 ET)";
    case "MCX":
      return "MCX (09:00–23:30 IST)";
    case "COMEX":
      return "COMEX/NYMEX (24h Mon–Fri)";
    default:
      return market;
  }
}
