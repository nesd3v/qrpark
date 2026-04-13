import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Clock, ChevronRight, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

type Conversation = {
  id: string;
  status: string;
  updated_at: string;
  last_message: string;
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
    const { data: convos } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false });

    if (convos) {
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
      <AppLayout>
        <div className="flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mesajlar">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
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
              onClick={() => navigate("/dashboard")}
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
    </AppLayout>
  );
};

export default Messages;
