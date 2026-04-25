import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { translateError } from "@/lib/translateError";
import {
  ShieldCheck, ShieldX, Clock, Eye, CheckCircle2, XCircle,
  Loader2, Car, BarChart3, RefreshCw, ExternalLink, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Vehicle = {
  id: string;
  plate: string;
  phone: string;
  user_id: string;
  verification_status: string;
  ruhsat_photo_path: string | null;
  verification_note: string | null;
  created_at: string;
  photo_url: string | null;
  owner_name: string;
};

type Stats = {
  pending: number;
  verified: number;
  rejected: number;
  total_notifications: number;
  corporate_new: number;
};

const AdminVehiclePanel = ({ stats, onRefreshStats }: { stats: Stats | null; onRefreshStats: () => void }) => {
  const [tab, setTab] = useState<"pending" | "verified" | "rejected">("pending");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [aiRedFilter, setAiRedFilter] = useState(false);
  const [search, setSearch] = useState("");

  const fetchVehicles = useCallback(async (status: string) => {
    setLoadingList(true);
    const { data } = await supabase.functions.invoke("admin-panel", { body: { action: "list", status } });
    if (data?.vehicles) setVehicles(data.vehicles);
    setLoadingList(false);
  }, []);

  useEffect(() => { fetchVehicles(tab); }, [tab, fetchVehicles]);

  const handleAction = async (vehicleId: string, status: "verified" | "rejected") => {
    setActionLoading(vehicleId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "update", vehicle_id: vehicleId, status, note: status === "rejected" ? rejectNote[vehicleId] || undefined : undefined },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success(status === "verified" ? "Araç onaylandı!" : "Araç reddedildi!");
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      onRefreshStats();
    } catch (err: any) {
      toast.error(translateError(err, "İşlem başarısız");
    }
    setActionLoading(null);
  };

  const vehicleTabs = [
    { key: "pending" as const, label: "Bekleyen", icon: Clock, count: stats?.pending },
    { key: "verified" as const, label: "Onaylı", icon: ShieldCheck, count: stats?.verified },
    { key: "rejected" as const, label: "Reddedilen", icon: ShieldX, count: stats?.rejected },
  ];

  const filtered = vehicles.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return v.plate.toLowerCase().includes(s) || v.owner_name.toLowerCase().includes(s) || v.phone.includes(s);
  });

  const displayList = aiRedFilter ? filtered.filter((v) => v.verification_note?.includes("[AI Red]")) : filtered;

  return (
    <div>
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Bekleyen", value: stats.pending, icon: Clock, color: "text-warning" },
            { label: "Onaylı", value: stats.verified, icon: ShieldCheck, color: "text-primary" },
            { label: "Reddedilen", value: stats.rejected, icon: ShieldX, color: "text-destructive" },
            { label: "Bildirimler", value: stats.total_notifications, icon: BarChart3, color: "text-accent-foreground" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {vehicleTabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setAiRedFilter(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${tab === t.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t.count}</span>
            )}
          </button>
        ))}
        {tab === "pending" && (
          <button onClick={() => setAiRedFilter((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              aiRedFilter ? "bg-destructive/15 border-destructive/40 text-destructive" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}>
            <ShieldX className="w-3.5 h-3.5" /> AI Red
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Plaka, isim, telefon..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs pl-8 w-52" />
          </div>
          <button onClick={() => { fetchVehicles(tab); onRefreshStats(); }} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Vehicle list */}
      {loadingList ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12"><p className="text-muted-foreground">Bu kategoride kayıt bulunmuyor</p></div>
      ) : (
        <div className="space-y-4">
          {displayList.map((v) => (
            <motion.div key={v.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-card rounded-xl p-5 border ${v.verification_note?.includes("[AI Red]") ? "border-2 border-destructive/70 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.3)]" : "border-border"}`}>
              <div className="flex flex-col md:flex-row gap-4">
                {v.photo_url && (
                  <button onClick={() => setSelectedPhoto(v.photo_url)}
                    className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0 group">
                    <img src={v.photo_url} alt="Ruhsat" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-foreground" />
                    </div>
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground tracking-wider">{v.plate}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Sahip: <span className="text-foreground">{v.owner_name}</span></p>
                  <p className="text-sm text-muted-foreground">Tel: <span className="text-foreground">{v.phone}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(v.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {v.verification_note && (
                    <div className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">AI Notu:</span> {v.verification_note}
                    </div>
                  )}
                  {tab === "pending" && (
                    <div className="mt-3 space-y-2">
                      <Textarea placeholder="Red notu (isteğe bağlı)..." value={rejectNote[v.id] || ""}
                        onChange={(e) => setRejectNote((prev) => ({ ...prev, [v.id]: e.target.value }))}
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none text-sm" rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAction(v.id, "verified")} disabled={actionLoading === v.id}
                          className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                          {actionLoading === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} Onayla
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(v.id, "rejected")} disabled={actionLoading === v.id}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10">
                          <XCircle className="w-4 h-4 mr-1" /> Reddet
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedPhoto(null)}>
            <motion.img src={selectedPhoto} alt="Ruhsat" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            <a href={selectedPhoto} target="_blank" rel="noopener noreferrer"
              className="absolute top-6 right-6 p-2 rounded-lg bg-secondary text-foreground hover:bg-muted"
              onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="w-5 h-5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminVehiclePanel;
