import { Toaster } from "@/components/ui/sonner";
import { Component, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
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

// ── Error Boundary ──────────────────────────────────────────────────────────
interface EBProps {
  children: ReactNode;
}
interface EBState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 p-6">
          <div className="text-teal-400 text-2xl font-bold">TradeZone</div>
          <div className="border border-red-500/40 rounded-xl p-6 max-w-sm w-full text-center space-y-3 bg-[#161b22]">
            <p className="text-red-400 font-semibold text-sm">
              App failed to load
            </p>
            <p className="text-gray-400 text-xs break-all">
              {this.state.error?.message ?? "Unknown error"}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-teal-500 text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-teal-400 transition-colors w-full"
            >
              Tap to Reload
            </button>
          </div>
          <p className="text-gray-600 text-xs">Built by Dhairya Devang Shah</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App Content ─────────────────────────────────────────────────────────────
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

  const trading = useTradingData(prices);
  const refreshRef = useRef(trading.refresh);
  refreshRef.current = trading.refresh;

  const refreshLeaderboardRef = useRef(trading.refreshLeaderboard);
  refreshLeaderboardRef.current = trading.refreshLeaderboard;

  useEffect(() => {
    if (isAuthenticated) {
      void refreshRef.current();
    }
  }, [isAuthenticated]);

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

  useEffect(() => {
    if (activePage === "Leaderboard") {
      void refreshLeaderboardRef.current();
    }
  }, [activePage]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-teal text-2xl font-bold animate-pulse">
            TradeZone
          </div>
          <div className="text-muted-foreground text-sm">Initializing...</div>
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
            onRefresh={trading.refreshLeaderboard}
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
          © {new Date().getFullYear()} TradeZone —{" "}
          <span className="text-foreground/60">
            Built by Dhairya Devang Shah
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
    <ErrorBoundary>
      <AppContent />
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  );
}
