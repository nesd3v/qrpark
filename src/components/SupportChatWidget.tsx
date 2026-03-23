import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, LogIn, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Message = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

const SupportChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase.functions.invoke("support-chat", {
      body: { action: "read", conversation_id: convId },
    });
    if (!error && data?.messages) {
      setMessages(data.messages);
    }
  }, []);

  // Load or create conversation
  const loadConversation = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: convs } = await supabase
        .from("support_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);

      if (convs && convs.length > 0) {
        setConversationId(convs[0].id);
        await fetchMessages(convs[0].id);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [user, fetchMessages]);

  useEffect(() => {
    if (open && user) loadConversation();
  }, [open, user, loadConversation]);

  // Realtime subscription - refetch decrypted messages on new insert
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`support-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Refetch to get decrypted messages
          fetchMessages(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);

    try {
      let convId = conversationId;

      // Create conversation if needed
      if (!convId) {
        const { data, error } = await supabase.functions.invoke("support-chat", {
          body: { action: "create-conversation" },
        });
        if (error || !data?.conversation_id) throw new Error("Konuşma oluşturulamadı");
        convId = data.conversation_id;
        setConversationId(convId);
      }

      const { error } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "send",
          conversation_id: convId,
          message: messageText,
          sender_type: "user",
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast.error("Mesaj gönderilemedi");
      setInput(messageText);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[480px] max-h-[calc(100vh-140px)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-secondary/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Canlı Destek</p>
                <p className="text-xs text-muted-foreground">Size yardımcı olmaya hazırız</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary">
                <Lock className="w-3 h-3" />
                <span>Şifreli</span>
              </div>
            </div>

            {!user ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <LogIn className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Destek almak için lütfen giriş yapın</p>
                  <a
                    href="/auth?redirect=/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <LogIn className="w-4 h-4" /> Giriş Yap
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Merhaba! 👋 Size nasıl yardımcı olabiliriz?
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                            msg.sender_type === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.message}
                          <p className={`text-[10px] mt-1 ${
                            msg.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChatWidget;
