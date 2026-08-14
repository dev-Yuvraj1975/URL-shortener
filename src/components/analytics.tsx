import { useMemo } from "react";
import type { CacheStats, ShortLink } from "../lib/store";
import { displayShortUrl } from "../lib/store";

interface Props {
  links: ShortLink[];
  cacheStats: CacheStats;
}

const DAY = 86400000;

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

export default function Analytics({ links, cacheStats }: Props) {
  const allClicks = useMemo(() => links.flatMap((l) => l.clicks), [links]);
  const totalClicks = allClicks.length;
  const totalCache = cacheStats.hits + cacheStats.misses;
  const hitRate = totalCache ? Math.round((cacheStats.hits / totalCache) * 100) : 0;

  // Clicks per day, last 7 days
  const days = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const start = now.getTime() - (6 - i) * DAY;
      const count = allClicks.filter((c) => c.ts >= start && c.ts < start + DAY).length;
      const d = new Date(start);
      return { label: d.toLocaleDateString(undefined, { weekday: "short" }), count };
    });
  }, [allClicks]);
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  // Devices
  const devices = useMemo(() => {
    const m: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    allClicks.forEach((c) => (m[c.device] = (m[c.device] || 0) + 1));
    return m;
  }, [allClicks]);

  // Referrers
  const referrers = useMemo(() => {
    const m = new Map<string, number>();
    allClicks.forEach((c) => m.set(c.referrer, (m.get(c.referrer) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allClicks]);

  const topLinks = useMemo(
    () => [...links].sort((a, b) => b.clicks.length - a.clicks.length).slice(0, 5),
    [links]
  );

  const clicks24h = allClicks.filter((c) => c.ts > Date.now() - DAY).length;
  const avgLatency = totalCache
    ? ((cacheStats.hits * 4 + cacheStats.misses * 38) / totalCache).toFixed(1)
    : "—";

  const deviceColors: Record<string, string> = {
    Desktop: "bg-indigo-500",
    Mobile: "bg-violet-400",
    Tablet: "bg-sky-400",
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Links"
          value={links.length.toLocaleString()}
          sub={`${links.filter((l) => l.isCustom).length} custom aliases`}
          accent="bg-indigo-50 text-indigo-600"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          }
        />
        <StatCard
          label="Total Clicks"
          value={totalClicks.toLocaleString()}
          sub={`${clicks24h} in last 24h`}
          accent="bg-violet-50 text-violet-600"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 9 5 12 1.8-5.2L21 14Z" /><path d="M7.2 2.2 8 5.1" /><path d="m5.1 8-2.9-.8" />
              <path d="M14 4.1 12 6" /><path d="m6 12-1.9 2" />
            </svg>
          }
        />
        <StatCard
          label="Cache Hit Rate"
          value={`${hitRate}%`}
          sub={`${cacheStats.hits.toLocaleString()} hits · ${cacheStats.misses.toLocaleString()} misses`}
          accent="bg-rose-50 text-rose-600"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        />
        <StatCard
          label="Avg Redirect"
          value={`${avgLatency}ms`}
          sub="Redis 4ms · Postgres 38ms"
          accent="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-900">Clicks — last 7 days</h3>
          <div className="mt-5 flex h-44 items-end gap-3">
            {days.map((d, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500 opacity-0 transition group-hover:opacity-100">
                  {d.count}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400 transition-all group-hover:from-indigo-500 group-hover:to-violet-300"
                  style={{ height: `${Math.max(3, (d.count / maxDay) * 100)}%` }}
                />
                <span className="text-[10px] font-medium text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices + cache */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Devices</h3>
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {Object.entries(devices).map(([k, v]) =>
                totalClicks ? (
                  <div
                    key={k}
                    className={deviceColors[k]}
                    style={{ width: `${(v / totalClicks) * 100}%` }}
                  />
                ) : null
              )}
            </div>
            <div className="mt-3 space-y-1.5">
              {Object.entries(devices).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${deviceColors[k]}`} />
                    {k}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {totalClicks ? Math.round((v / totalClicks) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Top Referrers</h3>
            <div className="mt-3 space-y-2">
              {referrers.length === 0 && (
                <p className="text-xs text-slate-400">No clicks recorded yet.</p>
              )}
              {referrers.map(([ref, count]) => (
                <div key={ref} className="flex items-center justify-between text-xs">
                  <span className="truncate text-slate-600">{ref}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top links table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Top Performing Links</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-2.5 font-semibold">Short link</th>
              <th className="hidden px-5 py-2.5 font-semibold sm:table-cell">Destination</th>
              <th className="px-5 py-2.5 text-right font-semibold">Clicks</th>
              <th className="hidden px-5 py-2.5 text-right font-semibold md:table-cell">Cache hit %</th>
            </tr>
          </thead>
          <tbody>
            {topLinks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                  Create some links to see analytics here.
                </td>
              </tr>
            )}
            {topLinks.map((l) => {
              const hits = l.clicks.filter((c) => c.cacheHit).length;
              const pct = l.clicks.length ? Math.round((hits / l.clicks.length) * 100) : 0;
              return (
                <tr key={l.code} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-semibold text-indigo-600">{displayShortUrl(l.code)}</td>
                  <td className="hidden max-w-[280px] truncate px-5 py-3 text-slate-500 sm:table-cell">
                    {l.longUrl}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-800">
                    {l.clicks.length.toLocaleString()}
                  </td>
                  <td className="hidden px-5 py-3 text-right md:table-cell">
                    <span className={`font-semibold ${pct >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
