import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Download, Loader2, CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import { translateError } from "@/lib/translateError";
type Subscription = {
  id: string;
  plan_type: string;
  amount: number;
  status: string;
  payment_date: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
  merchant_oid: string;
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; color: string }> = {
  active: { icon: CheckCircle2, label: "Aktif", color: "text-primary" },
  pending: { icon: Clock, label: "Bekliyor", color: "text-warning" },
  failed: { icon: XCircle, label: "Başarısız", color: "text-destructive" },
};

const PaymentHistory = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error) setSubscriptions((data as Subscription[]) || []);
    setLoading(false);
  };

  const handleDownloadReceipt = async (subId: string) => {
    setDownloadingId(subId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-receipt", {
        body: { subscription_id: subId },
      });

      if (error) throw error;

      // data is HTML string - open in new window for print/save
      const blob = new Blob([data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () => URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      toast.error("Makbuz oluşturulamadı: " + translateError(err, "Bilinmeyen hata"));
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => `₺${(amount / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Henüz ödeme geçmişi bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border bg-secondary/30">
        <Receipt className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Ödeme Geçmişi</h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left p-3 font-medium">Tarih</th>
              <th className="text-left p-3 font-medium">Plan</th>
              <th className="text-left p-3 font-medium">Tutar</th>
              <th className="text-left p-3 font-medium">Dönem</th>
              <th className="text-left p-3 font-medium">Durum</th>
              <th className="text-right p-3 font-medium">Makbuz</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub, i) => {
              const statusInfo = statusConfig[sub.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;
              return (
                <motion.tr
                  key={sub.id}
                  className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="p-3 text-foreground">{formatDate(sub.payment_date || sub.created_at)}</td>
                  <td className="p-3 text-foreground font-medium">
                    {sub.plan_type === "yearly" ? "Yıllık" : "Aylık"}
                  </td>
                  <td className="p-3 text-foreground font-semibold">{formatAmount(sub.amount)}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {formatDate(sub.subscription_start)} – {formatDate(sub.subscription_end)}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {sub.status === "active" && (
                      <button
                        onClick={() => handleDownloadReceipt(sub.id)}
                        disabled={downloadingId === sub.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {downloadingId === sub.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        İndir
                      </button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border/30">
        {subscriptions.map((sub, i) => {
          const statusInfo = statusConfig[sub.status] || statusConfig.pending;
          const StatusIcon = statusInfo.icon;
          return (
            <motion.div
              key={sub.id}
              className="p-4 space-y-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{formatAmount(sub.amount)}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{sub.plan_type === "yearly" ? "Yıllık Plan" : "Aylık Plan"}</span>
                <span>{formatDate(sub.payment_date || sub.created_at)}</span>
              </div>
              {sub.status === "active" && (
                <button
                  onClick={() => handleDownloadReceipt(sub.id)}
                  disabled={downloadingId === sub.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 mt-1"
                >
                  {downloadingId === sub.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Makbuz İndir
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentHistory;
