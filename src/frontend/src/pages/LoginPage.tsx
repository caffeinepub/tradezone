import { Button } from "@/components/ui/button";
import { BarChart2, Loader2, Shield, TrendingUp, Trophy } from "lucide-react";
import { motion } from "motion/react";

interface LoginPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
}

const features = [
  {
    icon: <TrendingUp size={16} />,
    text: "US & Indian stocks with live simulated prices",
    id: "f1",
  },
  {
    icon: <BarChart2 size={16} />,
    text: "Commodities: Gold, Silver, Crude Oil & more",
    id: "f2",
  },
  {
    icon: <BarChart2 size={16} />,
    text: "Options Chain: NIFTY, BANKNIFTY, CE & PE",
    id: "f3",
  },
  {
    icon: <Trophy size={16} />,
    text: "Leaderboard — compete with other traders",
    id: "f4",
  },
  {
    icon: <Shield size={16} />,
    text: "₹1,00,000 virtual money — zero real risk",
    id: "f5",
  },
];

export function LoginPage({ onLogin, isLoggingIn }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-positive/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal/15 rounded-2xl mb-4">
              <TrendingUp size={28} className="text-teal" />
            </div>
            <h1 className="text-3xl font-bold text-teal tracking-tight">
              TradeZone
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Dhairya Devang Shah's Paper Trading Platform
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start Trading with{" "}
              <span className="text-positive font-semibold">₹1,00,000</span>{" "}
              Virtual Money
            </p>
          </div>

          {/* Features */}
          <div className="space-y-2.5 mb-8">
            {features.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="text-teal flex-shrink-0">{f.icon}</div>
                {f.text}
              </motion.div>
            ))}
          </div>

          {/* Login button */}
          <Button
            className="w-full bg-teal hover:bg-teal/80 text-background font-semibold py-5 text-base"
            onClick={onLogin}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Secure, decentralized authentication via Internet Computer
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-teal hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
