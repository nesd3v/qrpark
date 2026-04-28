import { useState, useEffect, useCallback } from "react";
import { Mail, Search, Loader2, RefreshCw, ArrowLeft, Send, Trash2, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type EmailListItem = {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labelIds: string[];
  unread: boolean;
};

type EmailDetail = EmailListItem & { text: string; html: string };

const parseFrom = (s: string) => {
  const m = s.match(/^(.*?)<([^>]+)>$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ""), email: m[2].trim() };
  return { name: "", email: s.trim() };
};

const formatDate = (d: string) => {
  try {
    const date = new Date(d);
    return date.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
};

const AdminEmailInboxPanel = () => {
  const [messages, setMessages] = useState<EmailListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selected, setSelected] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("gmail-inbox", {
      body: { action: "list", query: q || "in:inbox", maxResults: 30 },
    });
    if (error || data?.error) {
      setError(data?.error || "Gmail bağlantısı kurulamadı. Lütfen Gmail bağlantısını kontrol edin.");
      setMessages([]);
    } else {
      setMessages(data.messages || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInbox(activeQuery); }, [fetchInbox, activeQuery]);

  const openMessage = async (id: string) => {
    setLoadingDetail(true);
    setReplyMode(false);
    setReplyBody("");
    const { data, error } = await supabase.functions.invoke("gmail-inbox", {
      body: { action: "read", id },
    });
    setLoadingDetail(false);
    if (error || data?.error) { toast.error("Mesaj yüklenemedi"); return; }
    setSelected(data);
    if (data.labelIds?.includes("UNREAD")) {
      await supabase.functions.invoke("gmail-inbox", { body: { action: "mark-read", id } });
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, unread: false } : m));
    }
  };

  const trashMessage = async (id: string) => {
    if (!confirm("Bu e-postayı çöpe taşımak istediğinize emin misiniz?")) return;
    const { data, error } = await supabase.functions.invoke("gmail-inbox", {
      body: { action: "trash", id },
    });
    if (error || !data?.success) { toast.error("Silinemedi"); return; }
    toast.success("Çöpe taşındı");
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  };

  const sendReply = async () => {
    if (!selected || !replyBody.trim()) return;
    const { email } = parseFrom(selected.from);
    if (!email) { toast.error("Alıcı adresi okunamadı"); return; }
    setSending(true);
    const subject = selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`;
    const { data, error } = await supabase.functions.invoke("gmail-inbox", {
      body: {
        action: "send", to: email, subject, body: replyBody,
        threadId: selected.threadId, replyToMessageId: selected.id,
      },
    });
    setSending(false);
    if (error || data?.error) { toast.error("Yanıt gönderilemedi"); return; }
    toast.success("Yanıt gönderildi");
    setReplyMode(false);
    setReplyBody("");
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(search);
  };

  if (selected) {
    const from = parseFrom(selected.from);
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplyMode(!replyMode)}>
              <Send className="w-3.5 h-3.5 mr-1" /> Yanıtla
            </Button>
            <Button variant="outline" size="sm" onClick={() => trashMessage(selected.id)}
              className="text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-lg font-bold text-foreground mb-2">{selected.subject || "(konu yok)"}</h3>
          <div className="text-sm text-muted-foreground mb-4 space-y-0.5">
            <p><b className="text-foreground">{from.name || from.email}</b> &lt;{from.email}&gt;</p>
            <p>Kime: {selected.to}</p>
            <p>{formatDate(selected.date)}</p>
          </div>
          <div className="border-t border-border pt-4">
            {selected.html ? (
              <div className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selected.html }} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">{selected.text || selected.snippet}</pre>
            )}
          </div>

          {replyMode && (
            <div className="mt-6 border-t border-border pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Kime: {from.email}</p>
              <Textarea rows={6} placeholder="Yanıtınızı yazın..." value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setReplyMode(false)}>İptal</Button>
                <Button size="sm" onClick={sendReply} disabled={sending || !replyBody.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  Gönder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <form onSubmit={onSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Ara (örn: from:user@ veya is:unread)" value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button type="submit" size="sm" variant="outline">Ara</Button>
        </form>
        <Button size="sm" variant="ghost" onClick={() => fetchInbox(activeQuery)}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <div className="text-center py-12 px-6">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground mb-1">E-posta kutusu yüklenemedi</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Bu sorgu için e-posta bulunamadı</p>
          </div>
        ) : messages.map((m) => {
          const f = parseFrom(m.from);
          return (
            <button key={m.id} onClick={() => openMessage(m.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors ${
                m.unread ? "bg-primary/5" : ""
              }`}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className={`text-sm truncate flex-1 ${m.unread ? "font-bold text-foreground" : "text-foreground"}`}>
                  {f.name || f.email}
                </span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(m.date)}</span>
              </div>
              <p className={`text-sm truncate ${m.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {m.subject || "(konu yok)"}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{m.snippet}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminEmailInboxPanel;