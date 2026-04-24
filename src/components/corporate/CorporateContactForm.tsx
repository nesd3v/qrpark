import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { translateError } from "@/lib/translateError";
interface CorporateContactFormProps {
  planType?: string;
  onClose?: () => void;
}

const CorporateContactForm = ({ planType = "filo", onClose }: CorporateContactFormProps) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    vehicle_count: "",
    contact_phone: "",
    contact_email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.vehicle_count || !form.contact_phone || !form.contact_email) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    const vehicleCount = parseInt(form.vehicle_count);
    if (isNaN(vehicleCount) || vehicleCount < 1) {
      toast.error("Geçerli bir araç sayısı girin");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("corporate_inquiries" as any).insert({
        company_name: form.company_name.trim(),
        vehicle_count: vehicleCount,
        contact_phone: form.contact_phone.trim(),
        contact_email: form.contact_email.trim(),
        plan_type: planType,
        message: form.message.trim() || null,
      } as any);

      if (error) throw error;

      // Send admin email notification
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "corporate-inquiry-notification",
          recipientEmail: "admin@qrpark.xyz",
          idempotencyKey: `corporate-inquiry-${Date.now()}`,
          templateData: {
            companyName: form.company_name,
            vehicleCount,
            contactPhone: form.contact_phone,
            contactEmail: form.contact_email,
            planType,
            message: form.message || undefined,
          },
        },
      }).catch(() => {});

      setSubmitted(true);
      toast.success("Başvurunuz alındı! En kısa sürede sizinle iletişime geçeceğiz.");
    } catch (err: any) {
      toast.error("Başvuru gönderilemedi: " + translateError(err, "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        className="text-center py-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-display font-bold text-foreground mb-2">Başvurunuz Alındı!</h3>
        <p className="text-muted-foreground mb-6">
          Ekibimiz en kısa sürede sizinle iletişime geçecektir.
        </p>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Kapat</Button>
        )}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Şirket Adı *</label>
        <Input
          placeholder="Şirket adınızı girin"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          required
          maxLength={255}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Araç Sayısı *</label>
        <Input
          type="number"
          placeholder="Tahmini araç sayısı"
          value={form.vehicle_count}
          onChange={(e) => setForm({ ...form, vehicle_count: e.target.value })}
          required
          min={1}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Telefon *</label>
        <Input
          type="tel"
          placeholder="05XX XXX XX XX"
          value={form.contact_phone}
          onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
          required
          maxLength={20}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">E-posta *</label>
        <Input
          type="email"
          placeholder="sirket@ornek.com"
          value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          required
          maxLength={255}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Mesaj (Opsiyonel)</label>
        <textarea
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
          placeholder="Ek bilgi veya sorularınız..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          maxLength={1000}
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-primary text-primary-foreground font-bold py-3"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        Başvuru Gönder
      </Button>
    </form>
  );
};

export default CorporateContactForm;
