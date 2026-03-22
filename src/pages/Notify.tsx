import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ParkingCircle,
  Lightbulb,
  AlertTriangle,
  Wind,
  MoreHorizontal,
  CheckCircle2,
  Send,
  Car,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const issueTypes = [
  { id: "wrong-park", icon: ParkingCircle, label: "Hatalı Park", desc: "Araç uygunsuz şekilde park etmiş", color: "text-destructive", bg: "bg-destructive/10" },
  { id: "lights-on", icon: Lightbulb, label: "Farlar Açık", desc: "Araç farları açık kalmış", color: "text-warning", bg: "bg-warning/10" },
  { id: "damaged", icon: AlertTriangle, label: "Araç Hasarlı", desc: "Araçta hasar tespit edildi", color: "text-destructive", bg: "bg-destructive/10" },
  { id: "window-open", icon: Wind, label: "Cam Açık", desc: "Araç camı açık kalmış", color: "text-info", bg: "bg-info/10" },
  { id: "other", icon: MoreHorizontal, label: "Diğer", desc: "Başka bir durum bildirin", color: "text-primary", bg: "bg-primary/10" },
];

type ContactMethod = "sms" | "call";

const Notify = () => {
  const { plateId } = useParams<{ plateId: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactMethod, setContactMethod] = useState<ContactMethod>("sms");
  const [callerPhone, setCallerPhone] = useState("+90 ");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [callEnabled, setCallEnabled] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const plate = decodeURIComponent(plateId || "");

  useEffect(() => {
    const fetchPrefs = async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("sms_enabled, call_enabled")
        .eq("plate", plate)
        .maybeSingle();

      if (data) {
        setSmsEnabled(data.sms_enabled ?? true);
        setCallEnabled(data.call_enabled ?? false);
        // Default to whichever is available
        if (data.sms_enabled) setContactMethod("sms");
        else if (data.call_enabled) setContactMethod("call");
      }
      setLoadingPrefs(false);
    };
    if (plate) fetchPrefs();
  }, [plate]);

  const handleSend = async () => {
    if (!selected) {
      toast.error("Lütfen bir sorun türü seçin");
      return;
    }

    if (contactMethod === "call") {
      const digits = callerPhone.replace(/\D/g, "");
      if (digits.length < 12) {
        toast.error("Lütfen geçerli bir telefon numarası girin");
        return;
      }
    }

    setSending(true);

    try {
      if (contactMethod === "sms") {
        const { data, error } = await supabase.functions.invoke("send-notification", {
          body: { plate, issue_type: selected, note: note || null },
        });

        if (error) {
          toast.error("Bildirim gönderilemedi!");
          setSending(false);
          return;
        }
        if (data?.error) {
          toast.error(data.error);
          setSending(false);
          return;
        }
      } else {
        const { data, error } = await supabase.functions.invoke("initiate-call", {
          body: { plate, caller_phone: callerPhone },
        });

        if (error) {
          toast.error("Arama başlatılamadı!");
          setSending(false);
          return;
        }
        if (data?.error) {
          toast.error(data.error);
          setSending(false);
          return;
        }
      }

      setSent(true);
      toast.success(contactMethod === "sms" ? "Bildirim başarıyla gönderildi!" : "Arama başlatıldı! Telefonunuzu kontrol edin.");
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="text-center max-w-md" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-3">
            {contactMethod === "sms" ? "Bildirim Gönderildi!" : "Arama Başlatıldı!"}
          </h1>
          <p className="text-muted-foreground mb-2">
            <span className="font-display font-bold text-foreground tracking-wider">{plate}</span>
            {" "}plakalı aracın sahibi {contactMethod === "sms" ? "bilgilendirildi" : "aranıyor"}.
          </p>
          <p className="text-sm text-muted-foreground">
            {contactMethod === "call" ? "Telefonunuz çalacak ve araç sahibine bağlanacaksınız." : "İlginiz için teşekkür ederiz."}
          </p>
        </motion.div>
      </div>
    );
  }

  const noMethodAvailable = !smsEnabled && !callEnabled;

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-12 pb-16">
        <div className="container mx-auto px-6">
          <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Car className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-1">Araç Bildirimi</h1>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary mt-3">
                <span className="text-sm text-muted-foreground">Plaka:</span>
                <span className="font-display font-bold text-foreground tracking-wider">{plate}</span>
              </div>
            </div>

            {loadingPrefs ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : noMethodAvailable ? (
              <motion.div className="text-center py-12 glass rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-display font-bold text-foreground mb-2">İletişim Kapalı</h2>
                <p className="text-muted-foreground text-sm">Bu araç sahibi tüm iletişim kanallarını kapatmıştır.</p>
              </motion.div>
            ) : (
              <>
                {/* Contact Method Selector */}
                {smsEnabled && callEnabled && (
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setContactMethod("sms")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-medium ${
                        contactMethod === "sms"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      SMS Gönder
                    </button>
                    <button
                      onClick={() => setContactMethod("call")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-medium ${
                        contactMethod === "call"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      <PhoneCall className="w-4 h-4" />
                      Ara
                    </button>
                  </div>
                )}

                {/* Only SMS available badge */}
                {smsEnabled && !callEnabled && (
                  <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Bu araç sahibi sadece SMS bildirimi almaktadır</span>
                  </div>
                )}

                {/* Only Call available badge */}
                {!smsEnabled && callEnabled && (
                  <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
                    <PhoneCall className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Bu araç sahibi sadece arama bildirimi almaktadır</span>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-muted-foreground">Sorunu seçin:</p>
                  {issueTypes.map((issue) => (
                    <motion.button
                      key={issue.id}
                      onClick={() => setSelected(issue.id)}
                      className={`w-full glass rounded-xl p-4 flex items-center gap-4 transition-all text-left ${
                        selected === issue.id ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-border/80"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-11 h-11 rounded-lg ${issue.bg} flex items-center justify-center flex-shrink-0`}>
                        <issue.icon className={`w-5 h-5 ${issue.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{issue.label}</p>
                        <p className="text-sm text-muted-foreground">{issue.desc}</p>
                      </div>
                      {selected === issue.id && <CheckCircle2 className="w-5 h-5 text-primary ml-auto flex-shrink-0" />}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {selected && contactMethod === "sms" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                      <Textarea
                        placeholder="Ek not ekleyin (isteğe bağlı)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                        rows={3}
                        maxLength={500}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Caller phone input for call method */}
                <AnimatePresence>
                  {selected && contactMethod === "call" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5" />
                        Telefon Numaranız
                      </Label>
                      <p className="text-xs text-muted-foreground">Numaranız gizli kalacak, araç sahibi QRPark numarasını görecektir.</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">🇹🇷</span>
                        <Input
                          placeholder="5XX XXX XX XX"
                          value={callerPhone}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith("+90")) {
                              val = "+90 " + val.replace(/^\+?9?0?\s*/, "");
                            }
                            const afterPrefix = val.slice(3).replace(/[^\d\s]/g, "");
                            const digits = afterPrefix.replace(/\s/g, "");
                            let formatted = "+90 ";
                            if (digits.length > 0) formatted += digits.slice(0, 3);
                            if (digits.length > 3) formatted += " " + digits.slice(3, 6);
                            if (digits.length > 6) formatted += " " + digits.slice(6, 8);
                            if (digits.length > 8) formatted += " " + digits.slice(8, 10);
                            setCallerPhone(formatted);
                          }}
                          className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground h-10 text-sm focus:border-primary/50 transition-colors pl-8 tracking-wide"
                          maxLength={17}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSend}
                  disabled={!selected || sending}
                  className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base glow-primary hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {contactMethod === "sms" ? "Gönderiliyor..." : "Aranıyor..."}
                    </span>
                  ) : (
                    <>
                      {contactMethod === "sms" ? <Send className="w-5 h-5 mr-2" /> : <PhoneCall className="w-5 h-5 mr-2" />}
                      {contactMethod === "sms" ? "Bildirimi Gönder" : "Araç Sahibini Ara"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {contactMethod === "sms"
                    ? "Bildiriminiz araç sahibine anonim olarak iletilecektir."
                    : "Numaranız gizli kalacak, araç sahibi QRPark numarasını görecektir."}
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Notify;
