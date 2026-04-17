import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";

type Props = {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  hideBottomNav?: boolean;
  noPadding?: boolean;
};

const MobileLayout = ({ children, title, showBack, rightAction, hideBottomNav, noPadding }: Props) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Status bar safe area */}
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} className="bg-card" />

      {/* App header */}
      {(title || showBack || rightAction) && (
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  className="-ml-2 p-2 rounded-full active:bg-muted/50 transition-colors"
                  aria-label="Geri"
                >
                  <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>
              )}
              {title && (
                <h1 className="text-lg font-display font-bold text-foreground truncate">{title}</h1>
              )}
            </div>
            {rightAction && <div className="flex items-center gap-1">{rightAction}</div>}
          </div>
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 overflow-y-auto ${noPadding ? "" : "px-4 py-4"} ${hideBottomNav ? "pb-4" : "pb-24"}`}>
        {children}
      </main>

      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
};

export default MobileLayout;
