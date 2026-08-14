import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MousePointerClick, Link2, Gauge, Users } from "lucide-react";
import { Card, Stat } from "./ui";
import { groupCount, seriesLast, shortBase } from "../lib/store";
import type { Link } from "../lib/types";

const COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f472b6", "#38bdf8", "#a78bfa", "#fb7185"];

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#e2e8f0",
};

export function Analytics({ links }: { links: Link[] }) {
  const all = useMemo(() => links.flatMap((l) => l.clicks), [links]);
  const series = useMemo(() => seriesLast(links, 14), [links]);
  const devices = useMemo(() => groupCount(all.map((c) => c.device)), [all]);
  const referrers = useMemo(() => groupCount(all.map((c) => c.referrer)).slice(0, 6), [all]);
  const countries = useMemo(() => groupCount(all.map((c) => c.country)).slice(0, 5), [all]);
  const top = useMemo(
    () =>
      [...links]
        .sort((a, b) => b.clicks.length - a.clicks.length)
        .slice(0, 6)
        .map((l) => ({ name: `/${l.code}`, clicks: l.clicks.length })),
    [links],
  );

  const cachedShare = all.length ? Math.round((all.filter((c) => c.cached).length / all.length) * 100) : 0;
  const avgLatency = all.length ? (all.reduce((s, c) => s + c.latencyMs, 0) / all.length).toFixed(1) : "0";
  const last24 = all.filter((c) => c.at > Date.now() - 86400000).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total clicks" value={all.length.toLocaleString()} sub={`${last24} in last 24h`} icon={<MousePointerClick size={16} />} />
        <Stat label="Active links" value={links.filter((l) => l.active).length} sub={`${links.length} total`} accent="text-emerald-300" icon={<Link2 size={16} />} />
        <Stat label="Cache hit rate" value={`${cachedShare}%`} sub="Redis lookup vs Postgres" accent="text-amber-300" icon={<Gauge size={16} />} />
        <Stat label="Avg redirect" value={`${avgLatency}ms`} sub="p50 across all clicks" accent="text-sky-300" icon={<Users size={16} />} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Clicks over time</h3>
            <p className="text-xs text-slate-500">Last 14 days · aggregated from the click_events table</p>
          </div>
          <div className="flex gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-indigo-400" /> clicks</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" /> unique</span>
          </div>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "#475569" }} />
              <Area type="monotone" dataKey="clicks" stroke="#818cf8" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="unique" stroke="#34d399" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">Top performing links</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                  {top.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">Devices</h3>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={devices} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={3}>
                  {devices.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {devices.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <i className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name}
                </span>
                <span className="tabular-nums text-slate-200">{d.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <BreakdownList title="Referrers" rows={referrers} total={all.length} />
        <BreakdownList title="Top countries" rows={countries} total={all.length} />
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">Recent click events</h3>
          <ul className="mt-3 space-y-2">
            {links
              .flatMap((l) => l.clicks.map((c) => ({ c, l })))
              .sort((a, b) => b.c.at - a.c.at)
              .slice(0, 6)
              .map(({ c, l }) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-mono text-indigo-300">
                    {shortBase()}/{l.code}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {c.referrer} · {c.device} · {c.cached ? "hit" : "miss"} {c.latencyMs}ms
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function BreakdownList({ title, rows, total }: { title: string; rows: { name: string; value: number }[]; total: number }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <li key={r.name}>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{r.name}</span>
              <span className="tabular-nums text-slate-200">{r.value}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${total ? (r.value / total) * 100 : 0}%`, background: COLORS[i % COLORS.length] }}
              />
            </div>
          </li>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-500">No data yet.</p>}
      </ul>
    </Card>
  );
}
