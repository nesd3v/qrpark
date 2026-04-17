import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Loader2, RefreshCw, Car, CreditCard, ChevronLeft, ChevronRight,
  Mail, Phone, Calendar, Crown, ChevronDown, ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type UserProfile = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  email: string;
  vehicle_count: number;
  subscription: {
    plan_type: string;
    status: string;
    subscription_start: string | null;
    subscription_end: string | null;
    amount: number;
  } | null;
  corporate_member?: {
    company_name: string;
    plan_type: string;
    max_vehicles: number;
  } | null;
};

const AdminUsersPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("admin-panel", {
      body: { action: "users_list", search: search || undefined, page },
    });
    if (data) {
      setUsers(data.users || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / 50);

  const getSubBadge = (sub: UserProfile["subscription"]) => {
    if (!sub) return { label: "Ücretsiz", color: "bg-muted text-muted-foreground" };
    if (sub.status === "active") {
      const end = sub.subscription_end ? new Date(sub.subscription_end) : null;
      if (end && end < new Date()) return { label: "Süresi Dolmuş", color: "bg-destructive/15 text-destructive" };
      return { label: "Premium", color: "bg-primary/15 text-primary" };
    }
    if (sub.status === "pending") return { label: "Bekliyor", color: "bg-warning/15 text-warning" };
    return { label: sub.status, color: "bg-muted text-muted-foreground" };
  };

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="İsim veya telefon ara..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 pl-9 text-sm" />
        </div>
        <Button variant="ghost" size="sm" onClick={fetchUsers} className="text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <p className="text-sm text-muted-foreground ml-auto">
          Toplam <span className="text-foreground font-semibold">{total}</span> kullanıcı
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Kullanıcı bulunamadı</div>
      ) : (
        <>
          <div className="space-y-2">
            {users.map((u, i) => {
              const badge = getSubBadge(u.subscription);
              const isExpanded = expandedUser === u.user_id;

              return (
                <motion.div key={u.user_id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Main row */}
                  <button onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-secondary/30 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm truncate">{u.full_name || "İsimsiz"}</span>
                        {u.corporate_member ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-primary/20 text-primary border border-primary/30">
                            <Crown className="w-3 h-3 fill-current" /> Kurumsal
                          </span>
                        ) : u.subscription?.status === "active" && (!u.subscription.subscription_end || new Date(u.subscription.subscription_end) > new Date()) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <Crown className="w-3 h-3 fill-current" /> Premium
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.color}`}>{badge.label}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>

                    {/* Quick stats */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {u.vehicle_count}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />
                        {new Date(u.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border px-5 py-4 bg-secondary/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Contact */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">İletişim</h4>
                          <div className="space-y-1.5 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-3.5 h-3.5" /> <span className="text-foreground">{u.email || "—"}</span>
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" /> <span className="text-foreground">{u.phone || "—"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Subscription */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Abonelik</h4>
                          {u.subscription ? (
                            <div className="space-y-1.5 text-sm">
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <Crown className="w-3.5 h-3.5" />
                                <span className="text-foreground capitalize">{u.subscription.plan_type}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  u.subscription.status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                                }`}>{u.subscription.status === "active" ? "Aktif" : u.subscription.status}</span>
                              </p>
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="w-3.5 h-3.5" />
                                <span className="text-foreground">{(u.subscription.amount / 100).toFixed(2)} ₺</span>
                              </p>
                              {u.subscription.subscription_end && (
                                <p className="text-xs text-muted-foreground">
                                  Bitiş: {new Date(u.subscription.subscription_end).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Abonelik yok</p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">İstatistik</h4>
                          <div className="space-y-1.5 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Car className="w-3.5 h-3.5" /> <span className="text-foreground">{u.vehicle_count} araç</span>
                            </p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              Kayıt: <span className="text-foreground">{new Date(u.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
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

export default AdminUsersPanel;
