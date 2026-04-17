import StaticPageShell from "@/components/layout/StaticPageShell";
import { Mail, MessageCircle, Phone, Clock } from "lucide-react";

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

const Contact = () => (
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

    <h2>Kurumsal Talepler</h2>
    <p>Filo yönetimi, toplu QR kod ve özel çözümler için kurumsal ekibimize ulaşın: <a href="/corporate-contact" className="text-primary">Kurumsal İletişim Formu</a></p>
  </StaticPageShell>
);

export default Contact;
