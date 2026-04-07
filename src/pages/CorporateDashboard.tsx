import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import VehicleVerifyDialog from "@/components/VehicleVerifyDialog";
import { motion } from "framer-motion";
import {
  Building2, Car, Shield, ShieldCheck, ShieldX, Clock, BarChart3,
  Upload, Download, QrCode, Bell, Loader2, RefreshCw, FileText,
  AlertTriangle, CheckCircle2, TrendingUp, ParkingCircle, Lightbulb,
  Wind, Siren, Fuel, MoreHorizontal, CarFront, DoorOpen, ShieldAlert,
  CircleSlash, Crown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const issueLabels: Record<string, string> = {
  "wrong-park": "Hatalı Park", "double-park": "Çift Sıra Park", "blocking": "Yol Kapatmış",
  "lights-on": "Farlar Açık", "window-open": "Cam Açık", "door-open": "Kapı Açık",
  "trunk-open": "Bagaj Açık", "alarm": "Alarm Çalıyor", "damaged": "Araç Hasarlı",
  "flat-tire": "Lastik Patlak", "handbrake": "El Freni Çekilmemiş",
  "fuel-leak": "Yakıt/Sıvı Sızıntısı", "tow-needed": "Çekilmesi Gerekiyor", "other": "Diğer",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];

type Membership = {
  id: string;
  company_name: string;
  plan_type: string;
  max_vehicles: number;
};

type Vehicle = {
  id: string;
  plate: string;
  phone: string;
  verification_status: string;
  last_qr_generated_at: string | null;
  qr_expires_at: string | null;
  created_at: string;
};

type Report = {
  totalVehicles: number;
  verified: number;
  pending: number;
  rejected: number;
  activeQr: number;
  expiredQr: number;
  totalNotifications: number;
  maxVehicles: number;
};

const CorporateDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"overview" | "vehicles" | "notifications" | "reports">("overview");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifStats, setNotifStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verifyVehicle, setVerifyVehicle] = useState<Vehicle | null>(null);
  const invoke = useCallback(async (action: string, extra: any = {}) => {
    const { data, error } = await supabase.functions.invoke("corporate-dashboard", {
      body: { action, ...extra },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  // Check membership
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    invoke("check").then((d) => {
      setMembership(d.membership);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [user, authLoading, invoke]);

  // Load data based on tab
  useEffect(() => {
    if (!membership) return;
    setLoading(true);
    if (tab === "overview" || tab === "reports") {
      invoke("report").then((d) => setReport(d.report)).finally(() => setLoading(false));
    } else if (tab === "vehicles") {
      invoke("vehicles").then((d) => setVehicles(d.vehicles)).finally(() => setLoading(false));
    } else if (tab === "notifications") {
      invoke("notifications").then((d) => {
        setNotifications(d.notifications);
        setNotifStats(d.stats);
      }).finally(() => setLoading(false));
    }
  }, [membership, tab, invoke]);

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const rows: { plate: string; phone: string }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(/[,;\t]/);
        if (parts.length < 2) continue;
        const plate = parts[0].trim();
        const phone = parts[1].trim();
        if (i === 0 && (plate.toLowerCase().includes("plaka") || plate.toLowerCase().includes("plate"))) continue;
        if (plate && phone) rows.push({ plate, phone });
      }
      if (rows.length === 0) { toast.error("CSV dosyasında geçerli veri bulunamadı"); return; }
      const data = await invoke("bulk_import", { vehicles: rows });
      toast.success(`${data.results.added} araç eklendi, ${data.results.skipped} atlandı`);
      if (data.results.errors.length > 0) {
        toast.error(`${data.results.errors.length} hata oluştu`);
      }
      invoke("vehicles").then((d) => setVehicles(d.vehicles));
      invoke("report").then((d) => setReport(d.report));
    } catch (err: any) {
      toast.error(err.message || "İçe aktarma başarısız");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const exportCSV = () => {
    const csv = "Plaka,Telefon,Durum,QR Son Oluşturma,QR Bitiş\n" + vehicles.map(v =>
      `${v.plate},${v.phone},${v.verification_status},${v.last_qr_generated_at || "-"},${v.qr_expires_at || "Süresiz"}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "araclar.csv"; a.click();
    URL.revokeObjectURL(url);
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <motion.div className="text-center max-w-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold text-foreground mb-2">Kurumsal Panel</h1>
            <p className="text-muted-foreground text-sm mb-6">Bu sayfaya erişmek için giriş yapın.</p>
            <Button onClick={() => navigate("/auth?redirect=/corporate")} className="gradient-primary text-primary-foreground">Giriş Yap</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <motion.div className="text-center max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold text-foreground mb-2">Kurumsal Erişim Gerekli</h1>
            <p className="text-muted-foreground text-sm mb-6">Kurumsal panele erişmek için başvurunuzun onaylanması gerekiyor.</p>
            <Button onClick={() => navigate("/corporate-contact")} variant="outline">Kurumsal Başvuru Yap</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { key: "overview" as const, label: "Genel Bakış", icon: BarChart3 },
    { key: "vehicles" as const, label: "Araçlar", icon: Car },
    { key: "notifications" as const, label: "Bildirimler", icon: Bell },
    { key: "reports" as const, label: "Raporlar", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="border-b border-border glass">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">{membership.company_name}</h1>
              <p className="text-xs text-muted-foreground">
                {membership.plan_type === "avm" ? "AVM & Otopark" : "Filo Yönetimi"} • Kurumsal Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {report ? `${report.totalVehicles}/${report.maxVehicles} araç` : ""}
            </span>
            <Crown className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && report && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Toplam Araç", value: report.totalVehicles, icon: Car, color: "text-primary" },
                    { label: "Onaylı", value: report.verified, icon: ShieldCheck, color: "text-emerald-500" },
                    { label: "Aktif QR", value: report.activeQr, icon: QrCode, color: "text-primary" },
                    { label: "Bildirimler", value: report.totalNotifications, icon: Bell, color: "text-warning" },
                  ].map((s) => (
                    <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3 border border-border">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                      <div>
                        <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-5 border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Araç Durumu</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={[
                          { name: "Onaylı", value: report.verified },
                          { name: "Bekleyen", value: report.pending },
                          { name: "Reddedilen", value: report.rejected },
                        ]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(var(--warning))" />
                          <Cell fill="hsl(var(--destructive))" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass rounded-xl p-5 border border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-3">QR Durumu</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={[
                          { name: "Aktif QR", value: report.activeQr },
                          { name: "Süresi Dolmuş", value: report.expiredQr },
                        ]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          <Cell fill="#10b981" />
                          <Cell fill="hsl(var(--destructive))" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass rounded-xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground">Araç Kapasitesi</h3>
                    <span className="text-xs text-muted-foreground">{report.totalVehicles} / {report.maxVehicles}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${Math.min((report.totalVehicles / report.maxVehicles) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* VEHICLES */}
            {tab === "vehicles" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={importing} variant="outline" className="gap-1.5">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    CSV ile Toplu Ekle
                  </Button>
                  <Button onClick={exportCSV} variant="outline" className="gap-1.5" disabled={vehicles.length === 0}>
                    <Download className="w-4 h-4" /> Dışa Aktar
                  </Button>
                  <Button onClick={() => navigate("/generate")} className="gradient-primary text-primary-foreground gap-1.5">
                    <QrCode className="w-4 h-4" /> QR Oluştur
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {vehicles.length} araç {report ? `/ ${report.maxVehicles} limit` : ""}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                  💡 CSV formatı: <code className="bg-background px-1 rounded">Plaka,Telefon</code> (ilk satır başlık olabilir)
                </div>

                <div className="glass rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plaka</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>QR</TableHead>
                        <TableHead>Kayıt</TableHead>
                        <TableHead>İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Henüz araç eklenmemiş
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="font-mono font-bold">{v.plate}</TableCell>
                            <TableCell className="text-sm">{v.phone}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                v.verification_status === "verified" ? "bg-emerald-500/20 text-emerald-600" :
                                v.verification_status === "rejected" ? "bg-destructive/20 text-destructive" :
                                "bg-warning/20 text-warning"
                              }`}>
                                {v.verification_status === "verified" ? "Onaylı" : v.verification_status === "rejected" ? "Reddedildi" : "Bekliyor"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <QRCodeSVG
                                  value={`${window.location.origin}/notify?plate=${encodeURIComponent(v.plate)}`}
                                  size={48}
                                  level="M"
                                  className="rounded"
                                />
                                {v.qr_expires_at ? (
                                  new Date(v.qr_expires_at) > new Date() ?
                                    <span className="text-xs text-emerald-500">Aktif</span> :
                                    <span className="text-xs text-destructive">Süresi Dolmuş</span>
                                ) : v.last_qr_generated_at ? (
                                  <span className="text-xs text-primary">Süresiz</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(v.created_at).toLocaleDateString("tr-TR")}
                            </TableCell>
                            <TableCell>
                              {v.verification_status !== "verified" && (
                                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setVerifyVehicle(v)}>
                                  <Shield className="w-3 h-3" /> Doğrula
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {verifyVehicle && (
                  <VehicleVerifyDialog
                    open={!!verifyVehicle}
                    onOpenChange={(open) => !open && setVerifyVehicle(null)}
                    vehicleId={verifyVehicle.id}
                    plate={verifyVehicle.plate}
                    phone={verifyVehicle.phone}
                    onVerified={() => {
                      setVerifyVehicle(null);
                      invoke("vehicles").then((d) => setVehicles(d.vehicles));
                      invoke("report").then((d) => setReport(d.report));
                    }}
                  />
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab === "notifications" && (
              <div className="space-y-6">
                {notifStats && notifStats.total > 0 && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="glass rounded-xl p-4 border border-border">
                        <p className="text-2xl font-display font-bold text-foreground">{notifStats.total}</p>
                        <p className="text-xs text-muted-foreground">Toplam Bildirim</p>
                      </div>
                      <div className="glass rounded-xl p-4 border border-border">
                        <p className="text-2xl font-display font-bold text-foreground">{Object.keys(notifStats.byVehicle).length}</p>
                        <p className="text-xs text-muted-foreground">Bildirim Alan Araç</p>
                      </div>
                      <div className="glass rounded-xl p-4 border border-border">
                        <p className="text-2xl font-display font-bold text-foreground">{Object.keys(notifStats.byType).length}</p>
                        <p className="text-xs text-muted-foreground">Farklı Sorun Tipi</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="glass rounded-xl p-5 border border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Sorun Türlerine Göre</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={Object.entries(notifStats.byType).map(([k, v]) => ({ name: issueLabels[k] || k, count: v }))}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="glass rounded-xl p-5 border border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Günlük Trend</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={Object.entries(notifStats.byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([k, v]) => ({ date: k.slice(5), count: v }))}>
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top vehicles */}
                    <div className="glass rounded-xl p-5 border border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">En Çok Bildirim Alan Araçlar</h3>
                      <div className="space-y-2">
                        {Object.entries(notifStats.byVehicle)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 10)
                          .map(([plate, count]) => (
                            <div key={plate} className="flex items-center justify-between">
                              <span className="font-mono text-sm font-bold text-foreground">{plate}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-secondary rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(((count as number) / notifStats.total) * 100 * 3, 100)}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right">{count as number}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Recent notifications list */}
                <div className="glass rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Son Bildirimler</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Henüz bildirim yok</div>
                  ) : (
                    <div className="divide-y divide-border max-h-96 overflow-y-auto">
                      {notifications.slice(0, 50).map((n) => (
                        <div key={n.id} className="px-4 py-3 flex items-center gap-3">
                          <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-foreground">{n.plate}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {issueLabels[n.issue_type] || n.issue_type}
                              </span>
                            </div>
                            {n.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.note}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(n.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REPORTS */}
            {tab === "reports" && report && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Toplam Araç", value: report.totalVehicles, sub: `Limit: ${report.maxVehicles}` },
                    { label: "Onaylı / Bekleyen / Red", value: `${report.verified}/${report.pending}/${report.rejected}`, sub: "Doğrulama durumu" },
                    { label: "Aktif QR", value: report.activeQr, sub: `${report.expiredQr} süresi dolmuş` },
                    { label: "Bildirimler", value: report.totalNotifications, sub: "Toplam bildirim" },
                  ].map((s, i) => (
                    <div key={i} className="glass rounded-xl p-4 border border-border">
                      <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={exportCSV} variant="outline" className="gap-1.5">
                    <FileText className="w-4 h-4" /> CSV İndir
                  </Button>
                  <Button onClick={() => { setTab("notifications"); }} variant="outline" className="gap-1.5">
                    <Bell className="w-4 h-4" /> Bildirimleri Gör
                  </Button>
                </div>

                <div className="glass rounded-xl p-5 border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Özet Rapor</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Araç Kullanım Oranı</span>
                      <span className="font-semibold text-foreground">{report.maxVehicles > 0 ? Math.round((report.totalVehicles / report.maxVehicles) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Doğrulama Oranı</span>
                      <span className="font-semibold text-foreground">{report.totalVehicles > 0 ? Math.round((report.verified / report.totalVehicles) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Aktif QR Oranı</span>
                      <span className="font-semibold text-foreground">{report.totalVehicles > 0 ? Math.round((report.activeQr / report.totalVehicles) * 100) : 0}%</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Araç Başına Bildirim</span>
                      <span className="font-semibold text-foreground">{report.totalVehicles > 0 ? (report.totalNotifications / report.totalVehicles).toFixed(1) : 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CorporateDashboard;
