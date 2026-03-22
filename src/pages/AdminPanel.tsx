import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldCheck, ShieldX, Clock, Eye, CheckCircle2, XCircle,
  Loader2, LogIn, Car, BarChart3, RefreshCw, ExternalLink, MessageCircle, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Vehicle = {
  id: string;
  plate: string;
  phone: string;
  user_id: string;
  verification_status: string;
  ruhsat_photo_path: string | null;
  verification_note: string | null;
  created_at: string;
  photo_url: string | null;
  owner_name: string;
};

type Stats = {
  pending: number;
  verified: number;
  rejected: number;
  total_notifications: number;
};

type Conversation = {
  id: string;
  user_email: string | null;
  user_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

// ─── Support Panel Sub-component ───
const SupportPanel = ({ user }: { user: any }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    setConversations(data || []);
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setSelectedConv(convId);
    setLoadingMsgs(true);
    const { data, error } = await supabase.functions.invoke("support-chat", {
      body: { action: "read", conversation_id: convId },
    });
    if (!error && data?.messages) {
      setMessages(data.messages);
    }
    setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime - refetch decrypted messages on new insert
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`admin-support-${selectedConv}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${selectedConv}` },
        () => {
          loadMessages(selectedConv);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, loadMessages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || !user || sending) return;
    const text = reply.trim();
    setReply("");
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "send",
          conversation_id: selectedConv,
          message: text,
          sender_type: "admin",
        },
      });
      if (error) throw error;
    } catch {
      toast.error("Mesaj gönderilemedi");
      setReply(text);
    }
    setSending(false);
  };

  const closeConversation = async (convId: string) => {
    await supabase
      .from("support_conversations")
      .update({ status: "closed" })
      .eq("id", convId);
    toast.success("Konuşma kapatıldı");
    fetchConversations();
    if (selectedConv === convId) {
      setSelectedConv(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex gap-4 h-[500px]">
      {/* Conversations list */}
      <div className="w-72 flex-shrink-0 glass rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Konuşmalar</span>
          <button onClick={fetchConversations} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Henüz konuşma yok</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadMessages(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors ${
                  selectedConv === conv.id ? "bg-secondary" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {conv.user_name || conv.user_email || "Anonim"}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    conv.status === "open" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {conv.status === "open" ? "Açık" : "Kapalı"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.user_email}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(conv.updated_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 glass rounded-xl border border-border overflow-hidden flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Bir konuşma seçin</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {conversations.find((c) => c.id === selectedConv)?.user_name || "Kullanıcı"}
              </span>
              {conversations.find((c) => c.id === selectedConv)?.status === "open" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => closeConversation(selectedConv)}
                  className="text-xs h-7"
                >
                  Konuşmayı Kapat
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      msg.sender_type === "admin"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}>
                      {msg.message}
                      <p className={`text-[10px] mt-1 ${
                        msg.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            {conversations.find((c) => c.id === selectedConv)?.status === "open" && (
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Yanıt yazın..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button onClick={sendReply} disabled={!reply.trim() || sending} size="icon">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Admin Panel ───
const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [mainTab, setMainTab] = useState<"vehicles" | "support">("vehicles");
  const [tab, setTab] = useState<"pending" | "verified" | "rejected">("pending");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const checkAdmin = useCallback(async () => {
    if (!user) { setChecking(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "check" },
      });
      if (error || !data?.is_admin) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    } catch {
      setIsAdmin(false);
    }
    setChecking(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "stats" },
    });
    if (data && !data.error) setStats(data);
  }, []);

  const fetchVehicles = useCallback(async (status: string) => {
    setLoadingList(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "list", status },
    });
    if (data?.vehicles) setVehicles(data.vehicles);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    if (!authLoading) checkAdmin();
  }, [authLoading, checkAdmin]);

  useEffect(() => {
    if (isAdmin && mainTab === "vehicles") {
      fetchStats();
      fetchVehicles(tab);
    }
  }, [isAdmin, mainTab, tab, fetchStats, fetchVehicles]);

  const handleAction = async (vehicleId: string, status: "verified" | "rejected") => {
    setActionLoading(vehicleId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: {
          action: "update",
          vehicle_id: vehicleId,
          status,
          note: status === "rejected" ? rejectNote[vehicleId] || undefined : undefined,
        },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success(status === "verified" ? "Araç onaylandı!" : "Araç reddedildi!");
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız");
    }
    setActionLoading(null);
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="text-center max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Admin Paneli</h1>
          <p className="text-muted-foreground text-sm mb-6">Bu sayfaya erişmek için giriş yapmanız gerekiyor.</p>
          <Button onClick={() => window.location.href = "/auth?redirect=/admin"}
            className="gradient-primary text-primary-foreground font-semibold glow-primary">
            <LogIn className="w-4 h-4 mr-2" /> Giriş Yap
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div className="text-center max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Erişim Reddedildi</h1>
          <p className="text-muted-foreground text-sm">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
        </motion.div>
      </div>
    );
  }

  const vehicleTabs = [
    { key: "pending" as const, label: "Bekleyen", icon: Clock, count: stats?.pending },
    { key: "verified" as const, label: "Onaylı", icon: ShieldCheck, count: stats?.verified },
    { key: "rejected" as const, label: "Reddedilen", icon: ShieldX, count: stats?.rejected },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Admin Paneli</h1>
              <p className="text-xs text-muted-foreground">Araç doğrulama & destek yönetimi</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { fetchStats(); fetchVehicles(tab); }}
            className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Yenile
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Main tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMainTab("vehicles")}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mainTab === "vehicles" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Car className="w-4 h-4" /> Araç Doğrulama
          </button>
          <button
            onClick={() => setMainTab("support")}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mainTab === "support" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Canlı Destek
          </button>
        </div>

        {mainTab === "support" ? (
          <SupportPanel user={user} />
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Bekleyen", value: stats.pending, icon: Clock, color: "text-warning" },
                  { label: "Onaylı", value: stats.verified, icon: ShieldCheck, color: "text-primary" },
                  { label: "Reddedilen", value: stats.rejected, icon: ShieldX, color: "text-destructive" },
                  { label: "Bildirimler", value: stats.total_notifications, icon: BarChart3, color: "text-accent-foreground" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vehicle Tabs */}
            <div className="flex gap-2 mb-6">
              {vehicleTabs.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                      tab === t.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Vehicle List */}
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Bu kategoride kayıt bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((v) => (
                  <motion.div key={v.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-5">
                    <div className="flex flex-col md:flex-row gap-4">
                      {v.photo_url && (
                        <button onClick={() => setSelectedPhoto(v.photo_url)}
                          className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0 group">
                          <img src={v.photo_url} alt="Ruhsat" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-foreground" />
                          </div>
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Car className="w-4 h-4 text-primary" />
                              <span className="font-display font-bold text-foreground tracking-wider">{v.plate}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Sahip: <span className="text-foreground">{v.owner_name}</span></p>
                            <p className="text-sm text-muted-foreground">Tel: <span className="text-foreground">{v.phone}</span></p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(v.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        {v.verification_note && (
                          <div className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground mt-2">
                            <span className="font-medium text-foreground">AI Notu:</span> {v.verification_note}
                          </div>
                        )}
                        {tab === "pending" && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Red notu (isteğe bağlı)..."
                              value={rejectNote[v.id] || ""}
                              onChange={(e) => setRejectNote((prev) => ({ ...prev, [v.id]: e.target.value }))}
                              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAction(v.id, "verified")}
                                disabled={actionLoading === v.id}
                                className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                                {actionLoading === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                                Onayla
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAction(v.id, "rejected")}
                                disabled={actionLoading === v.id}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10">
                                <XCircle className="w-4 h-4 mr-1" /> Reddet
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedPhoto(null)}>
            <motion.img src={selectedPhoto} alt="Ruhsat" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            <a href={selectedPhoto} target="_blank" rel="noopener noreferrer"
              className="absolute top-6 right-6 p-2 rounded-lg bg-secondary text-foreground hover:bg-muted"
              onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="w-5 h-5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
