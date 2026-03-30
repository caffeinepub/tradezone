import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { type Page, Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
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

  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { prices, lastUpdated, isLive } = useAllPrices();
  const trading = useTradingData();
  const refreshRef = useRef(trading.refresh);
  refreshRef.current = trading.refresh;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshRef.current();
    }
  }, [isAuthenticated]);

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
          />
        );
      case "Markets":
        return (
          <Markets
            prices={prices}
            lastUpdated={lastUpdated}
            isLive={isLive}
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
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          onLogout={clear}
          balance={trading.profile?.balance ?? 1000000}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{renderPage()}</main>
        <footer className="px-4 py-2 border-t border-border text-center text-xs text-muted-foreground">
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
