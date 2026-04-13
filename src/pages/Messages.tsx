import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Clock, ChevronRight, Loader2, Home, Car, ScanLine, User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

type Conversation = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
};

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/messages");
      return;
    }
    if (user) fetchConversations();
  }, [user, authLoading]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data: convos } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    if (convos) {
      // Fetch last message for each conversation
      const enriched = await Promise.all(
        convos.map(async (c) => {
          const { data: msgs } = await supabase
            .from("support_messages")
            .select("message, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);
          return {
            ...c,
            last_message: msgs?.[0]?.message || "Mesaj yok",
          } as Conversation;
        })
      );
      setConversations(enriched);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa önce`;
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">Mesajlar</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
          {conversations.length === 0 ? (
            <motion.div
              className="rounded-xl bg-card border border-border p-10 text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-display font-bold text-foreground mb-1">Henüz mesaj yok</h2>
              <p className="text-sm text-muted-foreground">
                Destek ekibimizle sohbet başlatmak için sağ alttaki destek butonunu kullanın.
              </p>
            </motion.div>
          ) : (
            conversations.map((convo, index) => (
              <motion.div
                key={convo.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => {
                  // Open the support chat widget - for now navigate to dashboard
                  navigate("/dashboard");
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-foreground">Destek Sohbeti</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      convo.status === "open"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {convo.status === "open" ? "Açık" : "Kapalı"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{convo.last_message}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{formatDate(convo.updated_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { id: "home", icon: Home, label: "Ana Sayfa", path: "/dashboard" },
            { id: "vehicles", icon: Car, label: "Araçlarım", path: "/generate" },
            { id: "scan", icon: ScanLine, label: "Tara", path: "/scan" },
            { id: "messages", icon: MessageSquare, label: "Mesajlar", path: "/messages" },
            { id: "profile", icon: User, label: "Profil", path: "/profile" },
          ].map((tab) => {
            const isCenter = tab.id === "scan";
            const isActive = tab.id === "messages";

            if (isCenter) {
              return (
                <Link key={tab.id} to="/scan" className="flex flex-col items-center -mt-5">
                  <div className="w-14 h-14 rounded-full gradient-primary glow-primary flex items-center justify-center shadow-lg">
                    <ScanLine className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] text-primary font-medium mt-1">{tab.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center py-1 px-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="h-safe-area-bottom" />
      </nav>
    </div>
  );
};

export default Messages;
