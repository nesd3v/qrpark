import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, CheckCircle2, AlertCircle, History } from "lucide-react";
import { Link } from "react-router-dom";

export type ConsentType =
  | "kvkk"
  | "acik_riza"
  | "terms"
  | "privacy"
  | "marketing_sms"
  | "marketing_email";

type ConsentRow = {
  id: string;
  consent_type: ConsentType;
  document_version: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  updated_at: string;
};

type AuditRow = {
  id: string;
  consent_type: ConsentType;
  action: string;
  document_version: string;
  created_at: string;
};

const CONSENT_META: Record<
  ConsentType,
  { label: string; description: string; required: boolean; href?: string }
> = {
  kvkk: {
    label: "KVKK Aydınlatma",
    description: "Kişisel verilerinizin işlenmesine dair bilgilendirme.",
    required: true,
    href: "/kvkk",
  },
  acik_riza: {
    label: "Açık Rıza",
    description: "KVKK kapsamında veri işleme ve yurt dışı aktarım rızası.",
    required: true,
    href: "/acik-riza",
  },
  terms: {
    label: "Kullanım Şartları",
    description: "Hizmet kullanım koşulları ve üyelik sözleşmesi.",
    required: true,
    href: "/terms",
  },
  privacy: {
    label: "Gizlilik Politikası",
    description: "Verilerinizin nasıl saklandığına ve korunduğuna dair politika.",
    required: true,
    href: "/privacy",
  },
  marketing_sms: {
    label: "SMS ile pazarlama bildirimleri",
    description: "Kampanya ve duyurular hakkında SMS almayı kabul ediyorum.",
    required: false,
  },
  marketing_email: {
    label: "E-posta ile pazarlama bildirimleri",
    description: "Kampanya ve duyurular hakkında e-posta almayı kabul ediyorum.",
    required: false,
  },
};

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const ConsentManager = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ConsentRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<ConsentType | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase
        .from("user_consents")
        .select("id, consent_type, document_version, granted, granted_at, revoked_at, updated_at")
        .eq("user_id", user!.id),
      supabase
        .from("consent_audit_log")
        .select("id, consent_type, action, document_version, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setRows((c as ConsentRow[]) || []);
    setAudit((a as AuditRow[]) || []);
    setLoading(false);
  };

  const getRow = (type: ConsentType) => rows.find((r) => r.consent_type === type);

  const toggle = async (type: ConsentType, next: boolean) => {
    if (!user) return;
    const meta = CONSENT_META[type];
    if (meta.required && !next) {
      toast.error(
        `${meta.label} zorunlu bir rızadır. Geri almak için hesabınızı silmeniz gerekir.`
      );
      return;
    }
    setSavingType(type);
    try {
      const ua = navigator.userAgent.slice(0, 255);
      const existing = getRow(type);
      const payload = {
        user_id: user.id,
        consent_type: type,
        granted: next,
        document_version: existing?.document_version || "1.0",
        user_agent: ua,
      };
      const { error } = await supabase
        .from("user_consents")
        .upsert(payload, { onConflict: "user_id,consent_type" });
      if (error) throw error;
      toast.success(next ? "Rıza kaydedildi" : "Rıza geri alındı");
      await load();
    } catch (e: any) {
      toast.error(e.message || "İşlem başarısız");
    } finally {
      setSavingType(null);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
        Rıza durumu yükleniyor...
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Rıza ve İletişim Tercihleri</h3>
          <p className="text-xs text-muted-foreground">
            KVKK kapsamındaki rızalarınızı ve iletişim tercihlerinizi yönetin.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(Object.keys(CONSENT_META) as ConsentType[]).map((type) => {
          const meta = CONSENT_META[type];
          const row = getRow(type);
          const granted = !!row?.granted;
          return (
            <div
              key={type}
              className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/40 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  {meta.required && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono uppercase tracking-wider">
                      zorunlu
                    </span>
                  )}
                  {granted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                <div className="mt-2 text-[11px] text-muted-foreground/80 space-x-3">
                  {meta.href && (
                    <Link
                      to={meta.href}
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      Metni oku
                    </Link>
                  )}
                  {row && (
                    <span>
                      Son işlem: {formatDate(row.updated_at)} · v{row.document_version}
                    </span>
                  )}
                </div>
              </div>
              <Switch
                checked={granted}
                disabled={savingType === type}
                onCheckedChange={(v) => toggle(type, v)}
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={() => setShowAudit((v) => !v)}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          {showAudit ? "Denetim kaydını gizle" : "Denetim kaydını göster"} ({audit.length})
        </button>
        {showAudit && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/50">
            {audit.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">Henüz kayıt yok.</p>
            ) : (
              audit.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-muted-foreground">
                    {formatDate(a.created_at)}
                  </span>
                  <span className="text-foreground truncate">
                    {CONSENT_META[a.consent_type]?.label || a.consent_type}
                  </span>
                  <span
                    className={
                      a.action === "granted"
                        ? "text-primary font-medium"
                        : a.action === "revoked"
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                    }
                  >
                    {a.action === "granted"
                      ? "Kabul"
                      : a.action === "revoked"
                        ? "Geri alındı"
                        : "Güncellendi"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentManager;