import { Link, useLocation } from "react-router-dom";
import { Home, Car, ScanLine, Bell, User } from "lucide-react";

const tabs = [
  { id: "home", icon: Home, label: "Ana Sayfa", path: "/dashboard" },
  { id: "vehicles", icon: Car, label: "Araçlarım", path: "/generate" },
  { id: "scan", icon: ScanLine, label: "Tara", path: "/scan" },
  { id: "messages", icon: Bell, label: "Bildirimler", path: "/messages" },
  { id: "profile", icon: User, label: "Profil", path: "/profile" },
];

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
}

const MobileLayout = ({ children, title, hideHeader }: MobileLayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header bar */}
      {!hideHeader && title && (
        <header className="sticky top-0 z-50 glass px-4 py-3">
          <div className="max-w-lg mx-auto">
            <h1 className="text-lg font-display font-bold text-foreground text-center">{title}</h1>
          </div>
        </header>
      )}

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {tabs.map((tab) => {
            const isCenter = tab.id === "scan";
            const isActive = currentPath === tab.path;

            if (isCenter) {
              return (
                <Link key={tab.id} to="/scan" className="flex flex-col items-center -mt-5">
                  <div className="w-14 h-14 rounded-full gradient-primary glow-primary flex items-center justify-center shadow-lg">
                    <ScanLine className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] text-primary font-medium mt-1">{tab.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center py-1 px-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="h-safe-area-bottom" />
      </nav>
    </div>
  );
};

export default MobileLayout;
