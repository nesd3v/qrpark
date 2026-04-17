import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle2, Loader2, Car, RefreshCw, Building2, Phone, Mail, Shield, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CorporateInquiry = {
  id: string;
  company_name: string;
  vehicle_count: number;
  contact_phone: string;
  contact_email: string;
  plan_type: string;
  status: string;
  message: string | null;
  created_at: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Yeni", color: "bg-primary/20 text-primary" },
  reviewing: { label: "Görüşülüyor", color: "bg-warning/20 text-warning" },
  completed: { label: "Tamamlandı", color: "bg-emerald-500/20 text-emerald-600" },
};

const AdminCorporatePanel = () => {
  const [inquiries, setInquiries] = useState<CorporateInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [approveEmail, setApproveEmail] = useState<Record<string, string>>({});
  const [approveVehicles, setApproveVehicles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "corporate_list", status: filter },
    });
    if (data?.inquiries) setInquiries(data.inquiries);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { data, error } = await supabase.functions.invoke("admin-panel", {
      body: { action: "corporate_update", vehicle_id: id, status: newStatus },
    });
    if (!error && data?.success) {
      toast.success("Durum güncellendi");
      setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    } else toast.error("Güncelleme başarısız");
    setUpdatingId(null);
  };

  const approveInquiry = async (id: string) => {
    const email = approveEmail[id]?.trim();
    if (!email) { toast.error("Kullanıcı e-postası gerekli"); return; }
    setUpdatingId(id);
    const maxV = parseInt(approveVehicles[id]) || undefined;
    const { data, error } = await supabase.functions.invoke("admin-panel", {
      body: { action: "corporate_approve", vehicle_id: id, user_email: email, max_vehicles: maxV },
    });
    if (!error && data?.success) {
      toast.success("Kurumsal üyelik oluşturuldu!");
      setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: "completed" } : i));
    } else toast.error(data?.error || "Onaylama başarısız");
    setUpdatingId(null);
  };

  const filtered = inquiries.filter((inq) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return inq.company_name.toLowerCase().includes(s) || inq.contact_email.toLowerCase().includes(s) || inq.contact_phone.includes(s);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["all", "new", "reviewing", "completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {f === "all" ? "Tümü" : statusLabels[f]?.label || f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Firma ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs pl-8 w-48" />
          </div>
          <button onClick={fetchInquiries} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12"><p className="text-muted-foreground">Başvuru bulunmuyor</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => (
            <motion.div key={inq.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-5 border border-border">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">{inq.company_name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusLabels[inq.status]?.color || "bg-muted text-muted-foreground"}`}>
                      {statusLabels[inq.status]?.label || inq.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> {inq.vehicle_count} araç</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {inq.contact_phone}</p>
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {inq.contact_email}</p>
                    <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {inq.plan_type === "avm" ? "AVM & Otopark" : "Filo Yönetimi"}</p>
                  </div>
                  {inq.message && <p className="mt-2 text-sm text-foreground bg-secondary rounded-lg px-3 py-2">{inq.message}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(inq.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {inq.status !== "completed" && (
                    <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-foreground">Kurumsal Üyelik Onayla</p>
                      <div className="flex gap-2 flex-wrap">
                        <Input placeholder="Kullanıcı e-postası" value={approveEmail[inq.id] || inq.contact_email}
                          onChange={(e) => setApproveEmail((p) => ({ ...p, [inq.id]: e.target.value }))} className="flex-1 min-w-[200px] h-8 text-xs" />
                        <Input type="number" placeholder="Araç limiti" value={approveVehicles[inq.id] || String(inq.vehicle_count)}
                          onChange={(e) => setApproveVehicles((p) => ({ ...p, [inq.id]: e.target.value }))} className="w-24 h-8 text-xs" />
                        <Button size="sm" onClick={() => approveInquiry(inq.id)} disabled={updatingId === inq.id}
                          className="gradient-primary text-primary-foreground text-xs h-8">
                          {updatingId === inq.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                          Onayla & Üyelik Oluştur
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {inq.status !== "reviewing" && inq.status !== "completed" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(inq.id, "reviewing")} disabled={updatingId === inq.id} className="text-xs">
                      {updatingId === inq.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3 mr-1" />}
                      Görüşülüyor
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCorporatePanel;
