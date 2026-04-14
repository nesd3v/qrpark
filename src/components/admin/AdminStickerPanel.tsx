import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package, Loader2, Search, RefreshCw, Truck, CheckCircle2, Clock, MapPin,
  QrCode, Plus, Trash2, Copy, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StickerOrder = {
  id: string;
  plate: string;
  address: string | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  owner_name: string;
  owner_phone: string;
};

type StickerCode = {
  id: string;
  code: string;
  status: string;
  vehicle_id: string | null;
  activated_at: string | null;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: "Bekliyor", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  preparing: { label: "Hazırlanıyor", icon: Package, color: "text-info", bg: "bg-info/10" },
  shipped: { label: "Kargoda", icon: Truck, color: "text-primary", bg: "bg-primary/10" },
  delivered: { label: "Teslim Edildi", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "shipped",
  shipped: "delivered",
};

const AdminStickerPanel = () => {
  const [mainTab, setMainTab] = useState("orders");
  const [tab, setTab] = useState<string>("pending");
  const [orders, setOrders] = useState<StickerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Sticker codes
  const [codes, setCodes] = useState<StickerCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [bulkCount, setBulkCount] = useState(10);
  const [addingCode, setAddingCode] = useState(false);
  const [codeFilter, setCodeFilter] = useState<"all" | "available" | "activated">("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "sticker-orders", status: tab },
    });
    if (data?.orders) setOrders(data.orders);
    setLoading(false);
  }, [tab]);

  useEffect(() => { if (mainTab === "orders") fetchOrders(); }, [fetchOrders, mainTab]);

  const fetchCodes = useCallback(async () => {
    setCodesLoading(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "sticker-codes-list", status: codeFilter },
    });
    if (data?.codes) setCodes(data.codes);
    setCodesLoading(false);
  }, [codeFilter]);

  useEffect(() => { if (mainTab === "codes") fetchCodes(); }, [fetchCodes, mainTab]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "update-sticker-order", order_id: orderId, status: newStatus },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success(`Sipariş durumu güncellendi: ${STATUS_MAP[newStatus]?.label}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız");
    }
    setActionLoading(null);
  };

  const handleAddSingleCode = async () => {
    if (!newCode.trim()) { toast.error("Kod giriniz"); return; }
    setAddingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "sticker-codes-add", codes: [newCode.trim().toUpperCase()] },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success("Kod eklendi");
      setNewCode("");
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message || "Kod eklenemedi");
    }
    setAddingCode(false);
  };

  const handleBulkGenerate = async () => {
    if (bulkCount < 1 || bulkCount > 500) { toast.error("1-500 arası sayı girin"); return; }
    setAddingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "sticker-codes-generate", count: bulkCount },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success(`${data?.count || bulkCount} adet kod oluşturuldu`);
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message || "Toplu oluşturma başarısız");
    }
    setAddingCode(false);
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Bu kodu silmek istediğinize emin misiniz?")) return;
    setActionLoading(id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-panel", {
        body: { action: "sticker-codes-delete", code_id: id },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success("Kod silindi");
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Silinemedi");
    }
    setActionLoading(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kod kopyalandı");
  };

  const orderTabs = [
    { key: "pending", label: "Bekleyen", icon: Clock },
    { key: "preparing", label: "Hazırlanan", icon: Package },
    { key: "shipped", label: "Kargoda", icon: Truck },
    { key: "delivered", label: "Teslim Edildi", icon: CheckCircle2 },
  ];

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.plate.toLowerCase().includes(s) || o.owner_name.toLowerCase().includes(s) || o.address?.toLowerCase().includes(s);
  });

  return (
    <div>
      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="orders" className="gap-1.5"><Package className="w-4 h-4" /> Siparişler</TabsTrigger>
          <TabsTrigger value="codes" className="gap-1.5"><QrCode className="w-4 h-4" /> Sticker Kodları</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {/* Order tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {orderTabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Plaka, isim, adres..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs pl-8 w-52" />
              </div>
              <button onClick={fetchOrders} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">Bu kategoride sipariş bulunmuyor</p></div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                const nextStatus = NEXT_STATUS[order.status];
                const nextStatusInfo = nextStatus ? STATUS_MAP[nextStatus] : null;
                return (
                  <motion.div key={order.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="font-bold text-foreground tracking-wider">{order.plate}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                            <statusInfo.icon className="w-3 h-3" /> {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Sipariş Sahibi: <span className="text-foreground">{order.owner_name}</span></p>
                        <p className="text-sm text-muted-foreground">Telefon: <span className="text-foreground">{order.owner_phone}</span></p>
                        {order.address && (
                          <div className="flex items-start gap-1.5 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground">{order.address}</p>
                          </div>
                        )}
                        {order.note && <p className="text-xs text-muted-foreground mt-1 italic">Not: {order.note}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(order.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {nextStatus && nextStatusInfo && (
                        <div className="flex items-center">
                          <Button size="sm" onClick={() => handleUpdateStatus(order.id, nextStatus)}
                            disabled={actionLoading === order.id}
                            className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                            {actionLoading === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <nextStatusInfo.icon className="w-4 h-4 mr-1" />}
                            {nextStatusInfo.label}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="codes" className="mt-4">
          {/* Add codes section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Single code */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Tekli Kod Ekle
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="QRPARK-XXXX"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="flex-1 font-mono text-sm"
                />
                <Button size="sm" onClick={handleAddSingleCode} disabled={addingCode || !newCode.trim()}>
                  {addingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Bulk generate */}
            <div className="bg-card rounded-xl p-5 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Toplu Oluştur
              </h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Adet"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={500}
                  className="w-24 text-sm"
                />
                <Button size="sm" onClick={handleBulkGenerate} disabled={addingCode}
                  className="gradient-primary text-primary-foreground">
                  {addingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Oluştur
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Otomatik benzersiz kodlar oluşturur (max 500)</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            {(["all", "available", "activated"] as const).map((f) => (
              <button key={f} onClick={() => setCodeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  codeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                {f === "all" ? "Tümü" : f === "available" ? "Kullanılabilir" : "Aktif"}
              </button>
            ))}
            <button onClick={fetchCodes} className="ml-auto text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Codes list */}
          {codesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : codes.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">Sticker kodu bulunamadı</p></div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">{codes.length} kod listeleniyor</p>
              {codes.map((code) => (
                <div key={code.id} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border">
                  <QrCode className={`w-4 h-4 flex-shrink-0 ${code.status === "activated" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-mono text-sm text-foreground font-medium flex-1">{code.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    code.status === "activated" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {code.status === "activated" ? "Aktif" : "Bekliyor"}
                  </span>
                  <button onClick={() => copyCode(code.code)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {code.status === "available" && (
                    <button onClick={() => handleDeleteCode(code.id)}
                      disabled={actionLoading === code.id}
                      className="text-muted-foreground hover:text-destructive">
                      {actionLoading === code.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStickerPanel;
