import {
  ShieldCheck, ShieldX, Clock, BarChart3, Building2, MessageCircle, Car, ArrowRight,
} from "lucide-react";

type Stats = {
  pending: number;
  verified: number;
  rejected: number;
  total_notifications: number;
  corporate_new: number;
};

const AdminDashboardOverview = ({
  stats,
  onNavigate,
}: {
  stats: Stats | null;
  onNavigate: (tab: string) => void;
}) => {
  if (!stats) return null;

  const cards = [
    {
      label: "Bekleyen Araçlar",
      value: stats.pending,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
      action: () => onNavigate("vehicles"),
      urgent: stats.pending > 0,
    },
    {
      label: "Onaylı Araçlar",
      value: stats.verified,
      icon: ShieldCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => onNavigate("vehicles"),
    },
    {
      label: "Reddedilen Araçlar",
      value: stats.rejected,
      icon: ShieldX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      action: () => onNavigate("vehicles"),
    },
    {
      label: "Toplam Bildirimler",
      value: stats.total_notifications,
      icon: BarChart3,
      color: "text-accent-foreground",
      bgColor: "bg-accent/10",
    },
    {
      label: "Yeni Kurumsal Başvuru",
      value: stats.corporate_new,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => onNavigate("corporate"),
      urgent: stats.corporate_new > 0,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Genel Bakış</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.action}
            disabled={!c.action}
            className={`bg-card rounded-xl p-5 border text-left transition-all group ${
              c.urgent ? "border-warning/50 shadow-[0_0_20px_-5px_hsl(var(--warning)/0.2)]" : "border-border"
            } ${c.action ? "hover:border-primary/40 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${c.bgColor} flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              {c.action && (
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <p className="text-3xl font-bold text-foreground">{c.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
            {c.urgent && <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning font-medium">İlgilenilmesi gerekiyor</span>}
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-bold text-foreground mb-4">Hızlı Erişim</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Araç Doğrulama", desc: "Bekleyen araçları incele ve onayla", icon: Car, tab: "vehicles" },
          { label: "Kurumsal Başvurular", desc: "Filo ve AVM başvurularını yönet", icon: Building2, tab: "corporate" },
          { label: "Canlı Destek", desc: "Kullanıcı mesajlarını yanıtla", icon: MessageCircle, tab: "support" },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            className="bg-card rounded-xl p-4 border border-border hover:border-primary/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <item.icon className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">{item.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
