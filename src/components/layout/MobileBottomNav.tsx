import { NavLink, useLocation } from "react-router-dom";
import { Home, Bell, QrCode, User, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { haptic } from "@/hooks/useNative";

const items = [
  { to: "/dashboard", label: "Ana Sayfa", icon: Home },
  { to: "/generate", label: "QR", icon: QrCode },
  { to: "/notifications", label: "Bildirim", icon: Bell },
  { to: "/pricing", label: "Premium", icon: Crown },
  { to: "/profile", label: "Profil", icon: User },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { isPremium } = useSubscription();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="grid grid-cols-5 px-1 pt-1.5 pb-1.5">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          const isPremiumIcon = item.label === "Premium" && isPremium;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => haptic.light()}
              className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg active:bg-muted/40 transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${
                  isActive
                    ? "text-primary"
                    : isPremiumIcon
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                } ${isPremiumIcon ? "drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]" : ""}`}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
