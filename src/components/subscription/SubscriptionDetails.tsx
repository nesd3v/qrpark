import { useState } from "react";
import { Crown, Calendar, Clock, CreditCard, AlertTriangle, Loader2, ExternalLink, RefreshCw, RotateCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const SubscriptionDetails = () => {
  const { isPremium, planType, subscriptionEnd, loading, checkSubscription, individual, corporate } = useSubscription();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"stop" | "resume" | null>(null);

  const activeSub = individual ?? corporate;
  const autoRenew = activeSub?.auto_renew !== false; // default true

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="glass rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Crown className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Ücretsiz Plan</h3>
            <p className="text-xs text-muted-foreground">Sınırlı özelliklerle kullanıyorsunuz</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/pricing")}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Crown className="w-4 h-4" /> Premium'a Geç
        </button>
      </div>
    );
  }

  const endDate = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const daysLeft = subscriptionEnd
    ? Math.max(0, Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleStopRenewal = async () => {
    setBusy("stop");
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { action: "stop_renewal" },
      });
      if (error) throw error;
      toast.success("Otomatik yenileme kapatıldı. Mevcut dönem sonuna kadar Premium aktif.");
      await checkSubscription();
    } catch {
      toast.error("İşlem yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(null);
    }
  };

  const handleResumeRenewal = async () => {
    setBusy("resume");
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { action: "resume_renewal" },
      });
      if (error) throw error;
      toast.success("Otomatik yenileme yeniden açıldı.");
      await checkSubscription();
    } catch {
      toast.error("İşlem yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border bg-secondary/30">
        <Crown className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Abonelik Detayları</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Plan info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Premium {planType === "yearly" ? "Yıllık" : "Aylık"}
              </p>
              <p className="text-xs text-muted-foreground">Tüm özellikler aktif</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary">AKTİF</span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Plan Tipi</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {planType === "yearly" ? "Yıllık – ₺349" : "Aylık – ₺39"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Bitiş Tarihi</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{endDate || "—"}</p>
          </div>
          {daysLeft !== null && (
            <div className="col-span-2 rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Kalan Süre</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{daysLeft} gün</p>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(5, (daysLeft / (planType === "yearly" ? 365 : 30)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Auto renewal status */}
        <div className={`rounded-lg p-3 border ${autoRenew ? "border-primary/30 bg-primary/5" : "border-warning/40 bg-warning/5"}`}>
          <div className="flex items-center gap-2">
            {autoRenew ? (
              <RefreshCw className="w-4 h-4 text-primary" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
            <p className="text-xs font-semibold text-foreground">
              {autoRenew
                ? "Otomatik yenileme açık"
                : "Otomatik yenileme kapalı"}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {autoRenew
              ? "Üyeliğin dönem sonunda otomatik yenilenecek. İstediğin an tek tıkla kapatabilirsin."
              : `Üyeliğin ${endDate ?? "dönem sonunda"} sona erecek ve hesap ücretsiz plana dönecek.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => navigate("/pricing")}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Planları Gör
          </button>
          {autoRenew ? (
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={busy !== null}
                className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy === "stop" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {busy === "stop" ? "İşleniyor..." : "Yenilemeyi Kapat"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Otomatik yenilemeyi kapatmak istiyor musunuz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Mevcut abonelik süreniz bitene kadar Premium özelliklerden yararlanmaya devam edersiniz.
                  Süre sonunda hesap otomatik olarak ücretsiz plana döner; herhangi bir tahsilat yapılmaz.
                  {endDate && (
                    <span className="block mt-2 font-medium text-foreground">
                      Premium erişiminiz {endDate} tarihine kadar aktif kalacaktır.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleStopRenewal}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Evet, Yenilemeyi Kapat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          ) : (
            <button
              onClick={handleResumeRenewal}
              disabled={busy !== null}
              className="flex-1 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy === "resume" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
              {busy === "resume" ? "Açılıyor..." : "Yenilemeyi Aç"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;
