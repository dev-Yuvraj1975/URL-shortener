import { useEffect, useState } from "react";
import { Zap, Database, Server, ArrowRight, CheckCircle2 } from "lucide-react";
import { shortBase } from "../lib/store";
import type { Link } from "../lib/types";

export type RedirectResult = { cached: boolean; latencyMs: number };

const stepsFor = (cached: boolean) =>
  cached
    ? [
        { icon: Server, label: "GET /:code hits edge API", detail: "express router · rate-limit ok" },
        { icon: Zap, label: "Redis GET url:code", detail: "CACHE HIT · TTL refreshed" },
        { icon: ArrowRight, label: "301 Moved Permanently", detail: "Location header set" },
        { icon: CheckCircle2, label: "Click event queued", detail: "async analytics write" },
      ]
    : [
        { icon: Server, label: "GET /:code hits edge API", detail: "express router · rate-limit ok" },
        { icon: Zap, label: "Redis GET url:code", detail: "CACHE MISS" },
        { icon: Database, label: "SELECT long_url FROM links", detail: "Postgres index scan on code" },
        { icon: Zap, label: "SETEX url:code 90", detail: "cache warmed for next hit" },
        { icon: ArrowRight, label: "301 Moved Permanently", detail: "Location header set" },
      ];

export function RedirectSim({ link, result, onClose }: { link: Link; result: RedirectResult; onClose: () => void }) {
  const steps = stepsFor(result.cached);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= steps.length) return;
    const t = setTimeout(() => setActive((a) => a + 1), 260);
    return () => clearTimeout(t);
  }, [active, steps.length]);

  const done = active >= steps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-sm text-indigo-300">
            {shortBase()}/{link.code}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              result.cached
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/25 bg-amber-400/10 text-amber-300"
            }`}
          >
            {result.cached ? "REDIS HIT" : "CACHE MISS"} · {result.latencyMs}ms
          </span>
        </div>

        <ol className="mt-5 space-y-2.5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const on = i < active;
            return (
              <li
                key={s.label}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
                  on ? "border-white/10 bg-white/[0.04] opacity-100" : "border-transparent bg-transparent opacity-30"
                }`}
              >
                <span className={`rounded-lg p-1.5 ${on ? "bg-indigo-500/15 text-indigo-300" : "bg-white/5 text-slate-500"}`}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-100">{s.label}</p>
                  <p className="truncate font-mono text-[11px] text-slate-500">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Resolved destination</p>
          <p className="mt-1 break-all text-sm text-slate-200">{link.longUrl}</p>
        </div>

        <div className="mt-5 flex gap-2">
          <a
            href={link.longUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-indigo-500 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-400"
          >
            {done ? "Follow redirect ↗" : "Resolving…"}
          </a>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
