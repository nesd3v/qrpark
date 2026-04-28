import { useState } from "react";
import StaticPageShell from "@/components/layout/StaticPageShell";
import { Mail, MessageCircle, Clock, Send, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const items = [
  {
    icon: Mail,
    label: "E-posta",
    value: "destek@qrpark.xyz",
    href: "mailto:destek@qrpark.xyz",
  },
  {
    icon: MessageCircle,
    label: "Canlı Destek",
    value: "Uygulama içi sohbet",
    href: "/dashboard",
  },
  {
    icon: Clock,
    label: "Çalışma Saatleri",
    value: "Hafta içi 09:00 - 18:00",
  },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Ad, e-posta ve mesaj zorunludur");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error("Geçerli bir e-posta girin");
      return;
    }
    setLoading(true);
    const { error } = await supabase.functions.invoke("notify-admin-email", {
      body: { type: "contact", payload: form },
    });
    setLoading(false);
    if (error) {
      toast.error("Mesaj gönderilemedi, lütfen tekrar deneyin");
      return;
    }
    setDone(true);
    toast.success("Mesajınız gönderildi!");
  };

  return (
  <StaticPageShell title="Bize Ulaşın">
    <p>Soru, görüş veya şikayetleriniz için aşağıdaki kanallardan bize ulaşabilirsiniz. Genellikle 24 saat içinde dönüş yapıyoruz.</p>

    <div className="not-prose space-y-2.5 mt-6">
      {items.map((it) => {
        const Icon = it.icon;
        const inner = (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border active:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{it.label}</p>
              <p className="text-sm font-medium text-foreground">{it.value}</p>
            </div>
          </div>
        );
        return it.href ? (
          <a key={it.label} href={it.href} className="block">{inner}</a>
        ) : (
          <div key={it.label}>{inner}</div>
        );
      })}
    </div>

    <h2>İletişim Formu</h2>
    {done ? (
      <div className="not-prose flex flex-col items-center text-center py-8 px-4 rounded-2xl bg-primary/5 border border-primary/20">
        <CheckCircle className="w-12 h-12 text-primary mb-3" />
        <p className="font-medium text-foreground">Mesajınız ekibimize ulaştı.</p>
        <p className="text-sm text-muted-foreground mt-1">En kısa sürede dönüş yapacağız.</p>
      </div>
    ) : (
      <form onSubmit={submit} className="not-prose space-y-3 mt-3">
        <Input placeholder="Adınız *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input type="email" placeholder="E-posta *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Telefon (opsiyonel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Textarea rows={5} placeholder="Mesajınız *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Gönder
        </Button>
      </form>
    )}

    <h2>Kurumsal Talepler</h2>
    <p>Filo yönetimi, toplu QR kod ve özel çözümler için kurumsal ekibimize ulaşın: <a href="/corporate-contact" className="text-primary">Kurumsal İletişim Formu</a></p>
  </StaticPageShell>
  );
};

export default Contact;
