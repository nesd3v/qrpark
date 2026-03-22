import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const ISSUE_LABELS: Record<string, string> = {
  "wrong-park": "Hatalı Park",
  "lights-on": "Farlar Açık",
  "damaged": "Araç Hasarlı",
  "window-open": "Cam Açık",
  "other": "Diğer",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(346, 77%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(45, 90%, 50%)",
];

type Notification = {
  id: string;
  issue_type: string;
  created_at: string;
};

type Props = {
  notifications: Notification[];
  vehiclePlates?: string[];
  allNotifications?: Notification[];
};

const DashboardCharts = ({ notifications, vehiclePlates, allNotifications }: Props) => {
  // Issue type distribution (pie)
  const issueData = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      const label = ISSUE_LABELS[n.issue_type] || "Diğer";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [notifications]);

  // Last 7 days timeline (area)
  const timelineData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
      days[key] = 0;
    }
    notifications.forEach((n) => {
      const d = new Date(n.created_at);
      const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 7) {
        const key = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
        if (key in days) days[key]++;
      }
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [notifications]);

  // Per-vehicle bar chart
  const vehicleData = useMemo(() => {
    if (!vehiclePlates || !allNotifications) return null;
    const counts: Record<string, number> = {};
    vehiclePlates.forEach((p) => (counts[p] = 0));
    allNotifications.forEach((n: any) => {
      if (n.plate && counts[n.plate] !== undefined) counts[n.plate]++;
    });
    return Object.entries(counts).map(([plate, count]) => ({ plate, count }));
  }, [vehiclePlates, allNotifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Timeline - Last 7 days */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Son 7 Gün</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={timelineData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [`${value} bildirim`, ""]}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#areaGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Issue distribution pie */}
        <div className="glass rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Sorun Dağılımı</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={issueData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {issueData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {issueData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-vehicle bar (only if multiple vehicles) */}
        {vehicleData && vehicleData.length > 1 && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">Araç Başına Bildirim</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={vehicleData}>
                <XAxis
                  dataKey="plate"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [`${value} bildirim`, ""]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
