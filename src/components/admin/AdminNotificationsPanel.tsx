import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell, Search, Loader2, RefreshCw, Calendar, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  plate: string;
  issue_type: string;
  note: string | null;
  status: string;
  vehicle_id: string;
  created_at: string;
};

const issueLabels: Record<string, string> = {
  "Hatalı Park": "Hatalı Park",
  "Alarm Çalıyor": "Alarm",
  "Farlar Açık": "Farlar Açık",
  "Camlar Açık": "Camlar Açık",
  "Bagaj Açık": "Bagaj Açık",
  "Lastik Patlak": "Patlak Lastik",
  "Çekici Geliyor": "Çekici",
  "Aracınıza Çarptılar": "Çarpma",
  "Su Baskını Riski": "Su Baskını",
  "Aracınız Çizilmiş": "Çizik",
  "Otopark Kapanıyor": "Otopark Kapanıyor",
  "Acil Durum": "Acil Durum",
  "Diğer": "Diğer",
};

const AdminNotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [issueType, setIssueType] = useState("all");
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: {
        action: "notifications_list",
        search: search || undefined,
        issue_type: issueType,
        date_from: dateFrom || undefined,
        date_to: dateTo ? dateTo + "T23:59:59Z" : undefined,
        page,
      },
    });
    if (data) {
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      if (data.issue_types) setIssueTypes(data.issue_types);
    }
    setLoading(false);
  }, [search, issueType, dateFrom, dateTo, page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Plaka Ara</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="34 ABC 123..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 text-xs pl-8" />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="text-xs text-muted-foreground mb-1 block">Bildirim Türü</label>
            <select value={issueType} onChange={(e) => { setIssueType(e.target.value); setPage(1); }}
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground">
              <option value="all">Tümü</option>
              {issueTypes.map((t) => (
                <option key={t} value={t}>{issueLabels[t] || t}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Başlangıç</label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-8 text-xs" />
          </div>
          <div className="min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Bitiş</label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-8 text-xs" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setIssueType("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="text-xs h-8 text-muted-foreground">
            Temizle
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchNotifications} className="text-xs h-8 text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm text-muted-foreground">
          Toplam <span className="text-foreground font-semibold">{total}</span> bildirim
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Bildirim bulunamadı</div>
      ) : (
        <>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Plaka</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tür</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Not</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Durum</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n, i) => (
                    <motion.tr key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground tracking-wider">{n.plate}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                          {issueLabels[n.issue_type] || n.issue_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{n.note || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          n.status === "sent" ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
                        }`}>{n.status === "sent" ? "Gönderildi" : n.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">Sayfa {page} / {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 text-xs">
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Önceki
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 text-xs">
                  Sonraki <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminNotificationsPanel;
