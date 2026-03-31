import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { type Page, Sidebar } from "./components/Sidebar";
import { TickerBanner } from "./components/TickerBanner";
import { TopBar } from "./components/TopBar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useAllPrices } from "./hooks/usePrices";
import { useTradingData } from "./hooks/useTradingData";
import { Dashboard } from "./pages/Dashboard";
import { FnO } from "./pages/FnO";
import { History } from "./pages/History";
import { Leaderboard } from "./pages/Leaderboard";
import { LoginPage } from "./pages/LoginPage";
import { Markets } from "./pages/Markets";
import { Portfolio } from "./pages/Portfolio";
import { WatchlistPage } from "./pages/WatchlistPage";

const queryClient = new QueryClient();

function AppContent() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;

  const { actor, isFetching: actorFetching } = useActor();

  const [activePage, setActivePage] = useState<Page>("Dashboard");

  const {
    prices,
    lastUpdated,
    isLive,
    refresh: refreshPrices,
  } = useAllPrices();
  const trading = useTradingData();
  const refreshRef = useRef(trading.refresh);
  refreshRef.current = trading.refresh;

  useEffect(() => {
    if (isAuthenticated) {
      void refreshRef.current();
    }
  }, [isAuthenticated]);

  // Register user on backend and sync stored name when actor is ready
  useEffect(() => {
    if (!actor || actorFetching || !identity) return;
    const userId = identity.getPrincipal().toString();
    const nameKey = `tradezone_name_${userId}`;
    const storedName = localStorage.getItem(nameKey);
    (async () => {
      try {
        await (actor as any).initUser();
        if (storedName) {
          await (actor as any).setDisplayName(storedName);
        }
      } catch {
        // Backend unreachable — local data is the fallback
      }
    })();
  }, [actor, actorFetching, identity]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-teal text-lg font-bold animate-pulse">
          TradeZone
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isLoggingIn={isLoggingIn} />;
  }

  const portfolioValue = trading.portfolio.reduce((sum, h) => {
    const price = prices[h.symbol] ?? h.avgBuyPrice;
    return sum + price * h.quantity;
  }, 0);

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return (
          <Dashboard
            prices={prices}
            portfolio={trading.portfolio}
            profile={trading.profile}
            onBuy={trading.executeBuy}
            onSell={trading.executeSell}
            lastUpdated={lastUpdated}
            userId={identity?.getPrincipal().toString()}
          />
        );
      case "Markets":
        return (
          <Markets
            prices={prices}
            lastUpdated={lastUpdated}
            isLive={isLive}
            refresh={refreshPrices}
            portfolio={trading.portfolio}
            profile={trading.profile}
            onBuy={trading.executeBuy}
            onSell={trading.executeSell}
          />
        );
      case "FnO":
        return (
          <FnO
            prices={prices}
            portfolio={trading.portfolio}
            profile={trading.profile}
            onBuy={trading.executeBuy}
            onSell={trading.executeSell}
          />
        );
      case "Portfolio":
        return (
          <Portfolio
            prices={prices}
            portfolio={trading.portfolio}
            profile={trading.profile}
          />
        );
      case "History":
        return <History history={trading.history} />;
      case "Watchlist":
        return (
          <WatchlistPage
            watchlist={trading.watchlist}
            prices={prices}
            portfolio={trading.portfolio}
            profile={trading.profile}
            onAdd={trading.addWatch}
            onRemove={trading.removeWatch}
            onBuy={trading.executeBuy}
            onSell={trading.executeSell}
          />
        );
      case "Leaderboard":
        return (
          <Leaderboard
            leaderboard={trading.leaderboard}
            currentUserId={identity?.getPrincipal().toString()}
            userPortfolioValue={portfolioValue}
            profile={trading.profile}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          onLogout={clear}
          balance={trading.profile?.balance ?? 1000000}
        />
        <TickerBanner prices={prices} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {renderPage()}
        </main>
        <footer className="hidden md:block px-4 py-2 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-teal hover:underline"
          >
            caffeine.ai
          </a>
          {" — "}
          <span className="text-foreground/60">
            TradeZone by Dhairya Devang Shah
          </span>
        </footer>
      </div>
      <BottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={clear}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
