import { ReactNode } from "react";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";
import MobileLayout from "@/components/layout/MobileLayout";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface AppLayoutProps {
  children: ReactNode;
  /** Title shown in MobileLayout header (mobile only) */
  title?: string;
  /** Hide the mobile header bar */
  hideHeader?: boolean;
  /** Hide navbar+footer on web too (for special pages like Scan) */
  forceMinimal?: boolean;
}

/**
 * Switches between MobileLayout (Capacitor native app) and
 * web layout (Navbar + Footer) based on the runtime environment.
 */
const AppLayout = ({ children, title, hideHeader, forceMinimal }: AppLayoutProps) => {
  const isMobile = useIsMobileApp();

  if (isMobile) {
    return (
      <MobileLayout title={title} hideHeader={hideHeader}>
        {children}
      </MobileLayout>
    );
  }

  // Web layout
  if (forceMinimal) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default AppLayout;
