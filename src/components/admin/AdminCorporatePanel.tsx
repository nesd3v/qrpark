import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Check, X, Mail, Phone, Hash, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Inquiry = {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  vehicle_count: number;
  plan_type: string;
  message: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
};

const AdminCorporatePanel = () => {
  const [tab, setTab] = useState<string>("new");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [approveEmail, setApproveEmail] = useState("");
  const [maxVehicles, setMaxVehicles] = useState("50");

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "corporate_list", status: tab },
    });
    if (data?.inquiries) setInquiries(data.inquiries);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "corporate_update", vehicle_id: id, status },
      });
      if (error) throw error;
      toast.success("Durum güncellendi");
      await fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu");
    } finally {
      setActionLoading(null);
    }
  };

  const openApprove = (inq: Inquiry) => {
    setSelected(inq);
    setApproveEmail(inq.contact_email);
    setMaxVehicles(String(inq.vehicle_count || 50));
    setApproveOpen(true);
  };

  const approve = async () => {
    if (!selected) return;
    if (!approveEmail.trim()) { toast.error("E-posta gerekli"); return; }
    setActionLoading(selected.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: {
          action: "corporate_approve",
          vehicle_id: selected.id,
          user_email: approveEmail.trim().toLowerCase(),
          max_vehicles: parseInt(maxVehicles, 10) || 50,
        },
      });
      if (error || data?.error) throw new Error(data?.error || "Onaylanamadı");
      toast.success("Kurumsal üyelik oluşturuldu!");
      setApproveOpen(false);
      await fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || "Hata oluştu");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="new">Yeni</TabsTrigger>
          <TabsTrigger value="reviewing">İnceleme</TabsTrigger>
          <TabsTrigger value="completed">Tamamlanan</TabsTrigger>
          <TabsTrigger value="all">Tümü</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Talep bulunamadı</div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq, i) => (
            <motion.div
              key={inq.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl p-5 border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{inq.company_name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      inq.status === "new" ? "bg-warning/15 text-warning"
                      : inq.status === "reviewing" ? "bg-info/15 text-info"
                      : "bg-primary/15 text-primary"
                    }`}>
                      {inq.status === "new" ? "Yeni" : inq.status === "reviewing" ? "İnceleniyor" : "Tamamlandı"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {inq.contact_email}</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {inq.contact_phone}</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Hash className="w-3.5 h-3.5" /> {inq.vehicle_count} araç</p>
                    <p className="text-xs text-muted-foreground">{new Date(inq.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  {inq.message && (
                    <p className="mt-2 text-sm text-foreground bg-secondary/50 rounded-lg p-2 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" /> {inq.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {inq.status !== "completed" && (
                      <>
                        <Button size="sm" onClick={() => openApprove(inq)} disabled={actionLoading === inq.id}
                          className="gradient-primary text-primary-foreground">
                          <Check className="w-3.5 h-3.5 mr-1" /> Onayla & Üyelik Oluştur
                        </Button>
                        {inq.status === "new" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(inq.id, "reviewing")} disabled={actionLoading === inq.id}>
                            İncelemeye Al
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => updateStatus(inq.id, "completed")} disabled={actionLoading === inq.id}
                          className="text-destructive border-destructive/30">
                          <X className="w-3.5 h-3.5 mr-1" /> Reddet/Kapat
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kurumsal Üyelik Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{selected?.company_name}</strong> için bir kullanıcıyı kurumsal üyeliğe ekleyin. Kullanıcının önceden kayıtlı olması gerekir.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Kullanıcının E-postası</Label>
              <Input value={approveEmail} onChange={(e) => setApproveEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maks. Araç Sayısı</Label>
              <Input type="number" min="1" value={maxVehicles} onChange={(e) => setMaxVehicles(e.target.value)} />
            </div>
            <Button onClick={approve} disabled={actionLoading === selected?.id} className="w-full gradient-primary text-primary-foreground">
              {actionLoading === selected?.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Onayla & Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCorporatePanel;
