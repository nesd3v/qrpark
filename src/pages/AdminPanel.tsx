import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield, ShieldX, Loader2, LogIn, Car, RefreshCw, MessageCircle, Building2,
  LayoutDashboard, ChevronLeft, ChevronRight, Bell, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AdminVehiclePanel from "@/components/admin/AdminVehiclePanel";
import AdminSupportPanel from "@/components/admin/AdminSupportPanel";
import AdminNotificationsPanel from "@/components/admin/AdminNotificationsPanel";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import AdminCorporatePanel from "@/components/admin/AdminCorporatePanel";

type Stats = {
  pending: number;
  verified: number;
  rejected: number;
  total_notifications: number;
  corporate_new: number;
};

type NavItem = {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const checkAdmin = useCallback(async () => {
    if (!user) { setChecking(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "check" },
      });
      setIsAdmin(!error && data?.is_admin ? true : false);
    } catch {
      setIsAdmin(false);
    }
    setChecking(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "stats" },
    });
    if (data && !data.error) setStats(data);
  }, []);

  useEffect(() => {
    if (!authLoading) checkAdmin();
  }, [authLoading, checkAdmin]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="text-center max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Admin Paneli</h1>
          <p className="text-muted-foreground text-sm mb-6">Bu sayfaya erişmek için giriş yapmanız gerekiyor.</p>
          <Button onClick={() => window.location.href = "/auth?redirect=/admin"}
            className="gradient-primary text-primary-foreground font-semibold glow-primary">
            <LogIn className="w-4 h-4 mr-2" /> Giriş Yap
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="text-center max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Erişim Reddedildi</h1>
          <p className="text-muted-foreground text-sm">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
        </motion.div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { key: "dashboard", label: "Genel Bakış", icon: LayoutDashboard },
    { key: "vehicles", label: "Araç Doğrulama", icon: Car, badge: stats?.pending },
    { key: "corporate", label: "Kurumsal Talepler", icon: Building2, badge: stats?.corporate_new },
    { key: "users", label: "Kullanıcılar", icon: Users },
    { key: "notifications", label: "Bildirim Geçmişi", icon: Bell, badge: stats?.total_notifications },
    { key: "support", label: "Canlı Destek", icon: MessageCircle },
  ];

  const currentNav = navItems.find((n) => n.key === activeSection);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`${sidebarCollapsed ? "w-16" : "w-56"} flex-shrink-0 border-r border-border bg-card flex flex-col transition-all duration-200 sticky top-0 h-screen`}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground">QRPark Yönetim</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                activeSection === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && item.key !== "notifications" && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeSection === item.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground"
                    }`}>{item.badge}</span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && item.key !== "notifications" && (
                <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-destructive" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentNav && <currentNav.icon className="w-5 h-5 text-primary" />}
              <h2 className="text-base font-bold text-foreground">{currentNav?.label || "Admin"}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchStats} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {activeSection === "dashboard" && <AdminDashboardOverview stats={stats} onNavigate={setActiveSection} />}
            {activeSection === "vehicles" && <AdminVehiclePanel stats={stats} onRefreshStats={fetchStats} />}
            {activeSection === "corporate" && <AdminCorporatePanel />}
            {activeSection === "users" && <AdminUsersPanel />}
            {activeSection === "notifications" && <AdminNotificationsPanel />}
            {activeSection === "support" && <AdminSupportPanel user={user} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
