import { Database, Zap, Server } from "lucide-react";
import { Card, Pill, Stat } from "./ui";
import { CACHE_CAPACITY, CACHE_TTL_MS } from "../lib/store";
import type { CacheEntry } from "../lib/types";

const ENDPOINTS = [
  { m: "POST", p: "/api/v1/links", d: "Create a short link (hash or custom alias)", tone: "green" as const },
  { m: "GET", p: "/:code", d: "Resolve + 301 redirect, cache-first", tone: "indigo" as const },
  { m: "GET", p: "/api/v1/links/:code/stats", d: "Click analytics for a link", tone: "indigo" as const },
  { m: "GET", p: "/api/v1/links/:code/qr", d: "PNG/SVG QR code for the short link", tone: "indigo" as const },
  { m: "PATCH", p: "/api/v1/links/:code", d: "Pause, resume or retarget a link", tone: "amber" as const },
  { m: "DELETE", p: "/api/v1/links/:code", d: "Soft-delete + cache invalidate", tone: "slate" as const },
];

export function Infra({
  entries,
  hits,
  misses,
  evictions,
  onFlush,
}: {
  entries: CacheEntry[];
  hits: number;
  misses: number;
  evictions: number;
  onFlush: () => void;
}) {
  const total = hits + misses;
  const ratio = total ? Math.round((hits / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Cache hits" value={hits} accent="text-emerald-300" icon={<Zap size={16} />} />
        <Stat label="Cache misses" value={misses} sub="fell through to Postgres" accent="text-amber-300" icon={<Database size={16} />} />
        <Stat label="Hit ratio (session)" value={`${ratio}%`} icon={<Server size={16} />} />
        <Stat label="LRU evictions" value={evictions} sub={`capacity ${CACHE_CAPACITY} keys`} accent="text-rose-300" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Redis keyspace</h3>
              <p className="text-xs text-slate-500">
                LRU, TTL {CACHE_TTL_MS / 1000}s · resolve a link to warm a key
              </p>
            </div>
            <button
              onClick={onFlush}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
            >
              FLUSHDB
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {entries.map((e) => {
              const pct = Math.max(0, 100 - ((Date.now() - e.insertedAt) / e.ttlMs) * 100);
              return (
                <li key={e.code} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-emerald-300">url:{e.code}</span>
                    <span className="shrink-0 text-[11px] text-slate-500">{e.hits} hits</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{e.longUrl}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-emerald-400/70 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
            {entries.length === 0 && (
              <li className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                Keyspace empty — resolve a short link to populate the cache.
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white">REST API surface</h3>
          <p className="text-xs text-slate-500">Express.js · Node · versioned, rate-limited routes</p>
          <ul className="mt-4 space-y-2">
            {ENDPOINTS.map((e) => (
              <li key={e.p + e.m} className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5">
                <Pill tone={e.tone}>{e.m}</Pill>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-slate-200">{e.p}</p>
                  <p className="truncate text-[11px] text-slate-500">{e.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-white">Schema</h3>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70 p-4 font-mono text-[11.5px] leading-relaxed text-slate-300">
{`CREATE TABLE links (
  id           BIGSERIAL PRIMARY KEY,
  code         VARCHAR(16) UNIQUE NOT NULL,   -- base62(FNV-1a(long_url)) or custom alias
  long_url     TEXT        NOT NULL,
  title        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_links_code ON links (code);

CREATE TABLE click_events (
  id         BIGSERIAL PRIMARY KEY,
  link_id    BIGINT REFERENCES links(id) ON DELETE CASCADE,
  referrer   TEXT, device TEXT, country TEXT,
  cache_hit  BOOLEAN, latency_ms NUMERIC(6,2),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clicks_link_time ON click_events (link_id, clicked_at DESC);`}
        </pre>
      </Card>
    </div>
  );
}
