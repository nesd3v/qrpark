import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageCircle, Send, RefreshCw, Loader2, FileText, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  attachment_url: string | null;
  attachment_type: string | null;
};

const AdminAttachmentPreview = ({
  attachmentUrl,
  attachmentType,
  isAdmin,
}: {
  attachmentUrl: string;
  attachmentType: string | null;
  isAdmin: boolean;
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from("support-attachments")
        .createSignedUrl(attachmentUrl, 3600);
      if (data?.signedUrl) setSignedUrl(data.signedUrl);
    };
    getUrl();
  }, [attachmentUrl]);

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs">Ek yükleniyor...</span>
      </div>
    );
  }

  if (attachmentType === "image") {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img src={signedUrl} alt="Ek" className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border/30" />
      </a>
    );
  }

  const fileName = attachmentUrl.split("/").pop() || "dosya";
  return (
    <a href={signedUrl} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2 mt-1.5 px-2 py-1.5 rounded-md text-xs ${
        isAdmin ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-muted hover:bg-muted/80"
      } transition-colors`}>
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate max-w-[150px]">{fileName}</span>
      <Download className="w-3 h-3 flex-shrink-0 ml-auto" />
    </a>
  );
};

const AdminSupportPanel = ({ user }: { user: any }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
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

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setSelectedConv(convId);
    setLoadingMsgs(true);
    const { data, error } = await supabase.functions.invoke("support-chat", {
      body: { action: "read", conversation_id: convId },
    });
    if (!error && data?.messages) setMessages(data.messages);
    setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`admin-support-${selectedConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${selectedConv}` }, () => loadMessages(selectedConv))
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
        body: { action: "send", conversation_id: selectedConv, message: text, sender_type: "admin" },
      });
      if (error) throw error;
    } catch {
      toast.error("Mesaj gönderilemedi");
      setReply(text);
    }
    setSending(false);
  };

  const closeConversation = async (convId: string) => {
    await supabase.from("support_conversations").update({ status: "closed" }).eq("id", convId);
    toast.success("Konuşma kapatıldı");
    fetchConversations();
    if (selectedConv === convId) { setSelectedConv(null); setMessages([]); }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.user_name?.toLowerCase().includes(s) || c.user_email?.toLowerCase().includes(s));
  });

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
      <div className="w-72 flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="px-3 py-2.5 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Konuşmalar</span>
            <button onClick={fetchConversations} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
          <Input placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Sonuç yok</p>
          ) : filtered.map((conv) => (
            <button key={conv.id} onClick={() => loadMessages(conv.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors ${selectedConv === conv.id ? "bg-secondary" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground truncate">{conv.user_name || conv.user_email || "Anonim"}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${conv.status === "open" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {conv.status === "open" ? "Açık" : "Kapalı"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.user_email}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(conv.updated_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">Bir konuşma seçin</p></div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{conversations.find((c) => c.id === selectedConv)?.user_name || "Kullanıcı"}</span>
              {conversations.find((c) => c.id === selectedConv)?.status === "open" && (
                <Button size="sm" variant="outline" onClick={() => closeConversation(selectedConv)} className="text-xs h-7">Konuşmayı Kapat</Button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${msg.sender_type === "admin" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                    {msg.message && <span>{msg.message}</span>}
                    {msg.attachment_url && <AdminAttachmentPreview attachmentUrl={msg.attachment_url} attachmentType={msg.attachment_type} isAdmin={msg.sender_type === "admin"} />}
                    <p className={`text-[10px] mt-1 ${msg.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {conversations.find((c) => c.id === selectedConv)?.status === "open" && (
              <div className="p-3 border-t border-border flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Yanıt yazın..." className="flex-1" disabled={sending} />
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

export default AdminSupportPanel;
