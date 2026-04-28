import { useState } from "react";
import { Loader2, FileText, User, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { z } from "zod";

export type BillingInfo = {
  billing_type: "individual" | "corporate";
  billing_name?: string;
  billing_tckn?: string;
  billing_company?: string;
  billing_vkn?: string;
  billing_tax_office?: string;
  billing_address: string;
  billing_city: string;
  billing_email: string;
};

const baseSchema = z.object({
  billing_address: z.string().trim().min(10, "Adres en az 10 karakter").max(500),
  billing_city: z.string().trim().min(2, "Şehir gerekli").max(80),
  billing_email: z.string().trim().email("Geçerli e-posta giriniz").max(255),
});

const individualSchema = baseSchema.extend({
  billing_type: z.literal("individual"),
  billing_name: z.string().trim().min(3, "Ad soyad gerekli").max(120),
  billing_tckn: z
    .string()
    .trim()
    .regex(/^\d{11}$/u, "TCKN 11 haneli olmalı")
    .optional()
    .or(z.literal("")),
});

const corporateSchema = baseSchema.extend({
  billing_type: z.literal("corporate"),
  billing_company: z.string().trim().min(3, "Ünvan gerekli").max(160),
  billing_vkn: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/u, "VKN 10 veya 11 haneli olmalı"),
  billing_tax_office: z.string().trim().min(2, "Vergi dairesi gerekli").max(120),
});

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEmail?: string;
  defaultType?: "individual" | "corporate";
  loading?: boolean;
  onConfirm: (info: BillingInfo) => void;
};

const BillingInfoDialog = ({
  open,
  onOpenChange,
  defaultEmail,
  defaultType = "individual",
  loading,
  onConfirm,
}: Props) => {
  const [type, setType] = useState<"individual" | "corporate">(defaultType);
  const [form, setForm] = useState<Partial<BillingInfo>>({});
  const [accept, setAccept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: keyof BillingInfo, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      billing_type: type,
      billing_email: form.billing_email || defaultEmail || "",
    };
    const schema = type === "corporate" ? corporateSchema : individualSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        next[String(i.path[0])] = i.message;
      });
      setErrors(next);
      return;
    }
    if (!accept) {
      setErrors({ accept: "Sözleşmeleri onaylamanız gerekir" });
      return;
    }
    setErrors({});
    onConfirm(parsed.data as BillingInfo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Fatura Bilgileri
          </DialogTitle>
          <DialogDescription>
            e-Arşiv Faturanız bu bilgilere göre düzenlenecektir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tip seçimi */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("individual")}
              className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                type === "individual"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <User className="w-4 h-4" /> Bireysel
            </button>
            <button
              type="button"
              onClick={() => setType("corporate")}
              className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                type === "corporate"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Building2 className="w-4 h-4" /> Kurumsal
            </button>
          </div>

          {type === "individual" ? (
            <>
              <Field
                label="Ad Soyad *"
                value={form.billing_name || ""}
                onChange={(v) => update("billing_name", v)}
                error={errors.billing_name}
              />
              <Field
                label="T.C. Kimlik No (opsiyonel)"
                value={form.billing_tckn || ""}
                onChange={(v) => update("billing_tckn", v.replace(/\D/g, ""))}
                error={errors.billing_tckn}
                maxLength={11}
              />
            </>
          ) : (
            <>
              <Field
                label="Şirket Ünvanı *"
                value={form.billing_company || ""}
                onChange={(v) => update("billing_company", v)}
                error={errors.billing_company}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="VKN *"
                  value={form.billing_vkn || ""}
                  onChange={(v) => update("billing_vkn", v.replace(/\D/g, ""))}
                  error={errors.billing_vkn}
                  maxLength={11}
                />
                <Field
                  label="Vergi Dairesi *"
                  value={form.billing_tax_office || ""}
                  onChange={(v) => update("billing_tax_office", v)}
                  error={errors.billing_tax_office}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field
                label="Adres *"
                value={form.billing_address || ""}
                onChange={(v) => update("billing_address", v)}
                error={errors.billing_address}
              />
            </div>
            <Field
              label="Şehir *"
              value={form.billing_city || ""}
              onChange={(v) => update("billing_city", v)}
              error={errors.billing_city}
            />
          </div>

          <Field
            label="Fatura E-postası *"
            value={form.billing_email || defaultEmail || ""}
            onChange={(v) => update("billing_email", v)}
            error={errors.billing_email}
            type="email"
          />

          {/* Yasal onay */}
          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span>
              <Link to="/on-bilgilendirme" target="_blank" className="text-primary hover:underline">
                Ön Bilgilendirme Formu
              </Link>
              {" ve "}
              <Link to="/mesafeli-satis" target="_blank" className="text-primary hover:underline">
                Mesafeli Satış Sözleşmesi
              </Link>
              ’ni okudum, kabul ediyorum. Üyeliğin satın alma anında derhal aktif edilmesini
              ve dijital içerik için <strong>cayma hakkı bulunmadığını</strong> onaylıyorum.
            </span>
          </label>
          {errors.accept && (
            <p className="text-xs text-destructive">{errors.accept}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Ödemeye Geç
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({
  label,
  value,
  onChange,
  error,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  maxLength?: number;
}) => (
  <div>
    <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
    <input
      type={type}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm text-foreground focus:outline-none focus:border-primary"
    />
    {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
  </div>
);

export default BillingInfoDialog;