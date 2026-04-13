import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, LogIn, ShieldCheck, Paperclip, Image as ImageIcon, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Message = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
};

const isImageType = (type: string | null | undefined) =>
  type === "image" || type?.startsWith("image/");

const TABBAR_PAGES = ["/dashboard", "/messages", "/scan", "/generate", "/profile"];

const SupportChatWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hasTabBar = TABBAR_PAGES.some(p => location.pathname.startsWith(p));
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          fetchMessages(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  const ensureConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    const { data, error } = await supabase.functions.invoke("support-chat", {
      body: { action: "create-conversation" },
    });
    if (error || !data?.conversation_id) {
      toast.error("Konuşma oluşturulamadı");
      return null;
    }
    setConversationId(data.conversation_id);
    return data.conversation_id;
  };

  const sendMessage = async (attachmentUrl?: string, attachmentType?: string) => {
    if ((!input.trim() && !attachmentUrl) || !user || sending) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);

    try {
      const convId = await ensureConversation();
      if (!convId) throw new Error("No conversation");

      const { error } = await supabase.functions.invoke("support-chat", {
        body: {
          action: "send",
          conversation_id: convId,
          message: messageText || (attachmentUrl ? "📎 Dosya gönderildi" : ""),
          sender_type: "user",
          ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType }),
        },
      });

      if (error) throw error;
    } catch {
      toast.error("Mesaj gönderilemedi");
      if (messageText) setInput(messageText);
    }
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    setUploading(true);
    try {
      const convId = await ensureConversation();
      if (!convId) throw new Error("No conversation");

      const ext = file.name.split(".").pop() || "bin";
      const filePath = `${convId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("support-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("support-attachments")
        .getPublicUrl(filePath);

      // Since bucket is private, we store the path and use signed URLs
      const attachmentType = file.type.startsWith("image/") ? "image" : "file";
      await sendMessage(filePath, attachmentType);
    } catch {
      toast.error("Dosya yüklenemedi");
    }
    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const AttachmentPreview = ({ msg }: { msg: Message }) => {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);

    useEffect(() => {
      if (!msg.attachment_url) return;
      supabase.storage
        .from("support-attachments")
        .createSignedUrl(msg.attachment_url, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setSignedUrl(data.signedUrl);
        });
    }, [msg.attachment_url]);

    if (!msg.attachment_url || !signedUrl) return null;

    if (isImageType(msg.attachment_type)) {
      return (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={signedUrl}
            alt="Ek"
            className="max-w-full max-h-40 rounded-lg object-cover"
            loading="lazy"
          />
        </a>
      );
    }

    return (
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-1 text-xs underline opacity-80 hover:opacity-100"
      >
        <FileText className="w-3.5 h-3.5" />
        Dosyayı Aç
      </a>
    );
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className={`fixed ${hasTabBar ? "bottom-20" : "bottom-6"} right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors`}
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
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-primary cursor-help">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Şifreli</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="max-w-[240px] text-xs leading-relaxed">
                    <p className="font-semibold mb-1">🔒 Uçtan Uca Şifreleme</p>
                    <p>Canlı Destek konuşmaları uçtan uca şifrelenir.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                          {msg.message && msg.message !== "📎 Dosya gönderildi" && msg.message}
                          <AttachmentPreview msg={msg} />
                          {msg.message === "📎 Dosya gönderildi" && !msg.attachment_url && msg.message}
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                      title="Dosya ekle"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={sending || uploading}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={(!input.trim() && !uploading) || sending}
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
