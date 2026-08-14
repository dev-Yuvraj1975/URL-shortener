import { useMemo, useState } from "react";
import { Copy, Check, QrCode as QrIcon, Trash2, Search, ExternalLink, Power } from "lucide-react";
import { Card, Pill } from "./ui";
import { hostOf, shortBase } from "../lib/store";
import type { Link } from "../lib/types";

type Props = {
  links: Link[];
  onVisit: (link: Link) => void;
  onShowQr: (link: Link) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

function ago(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function LinksPanel({ links, onVisit, onShowQr, onDelete, onToggle }: Props) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "clicks">("recent");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const f = links.filter(
      (l) =>
        l.code.toLowerCase().includes(q.toLowerCase()) ||
        l.longUrl.toLowerCase().includes(q.toLowerCase()) ||
        l.title.toLowerCase().includes(q.toLowerCase()),
    );
    return f.sort((a, b) => (sort === "recent" ? b.createdAt - a.createdAt : b.clicks.length - a.clicks.length));
  }, [links, q, sort]);

  function copy(l: Link) {
    navigator.clipboard?.writeText(`https://${shortBase()}/${l.code}`);
    setCopiedId(l.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search links, aliases, destinations…"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/60"
          />
        </div>
        <div className="flex rounded-xl border border-white/10 bg-slate-950/60 p-1 text-xs">
          {(["recent", "clicks"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                sort === s ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s === "recent" ? "Newest" : "Most clicks"}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{rows.length} links</span>
      </div>

      <div className="divide-y divide-white/5">
        {rows.map((l) => {
          const last = l.clicks[0];
          return (
            <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onVisit(l)}
                    className="font-mono text-sm font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
                  >
                    {shortBase()}/{l.code}
                  </button>
                  {l.custom && <Pill tone="indigo">alias</Pill>}
                  {!l.active && <Pill tone="amber">paused</Pill>}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {l.title} · {hostOf(l.longUrl)}
                </p>
              </div>

              <div className="hidden w-28 text-right sm:block">
                <p className="text-sm font-semibold tabular-nums text-slate-100">{l.clicks.length}</p>
                <p className="text-[11px] text-slate-500">clicks</p>
              </div>
              <div className="hidden w-24 text-right md:block">
                <p className="text-xs text-slate-400">{last ? ago(last.at) : "—"}</p>
                <p className="text-[11px] text-slate-600">last click</p>
              </div>

              <div className="flex items-center gap-1">
                <IconBtn title="Copy" onClick={() => copy(l)}>
                  {copiedId === l.id ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </IconBtn>
                <IconBtn title="QR code" onClick={() => onShowQr(l)}>
                  <QrIcon size={15} />
                </IconBtn>
                <IconBtn title="Resolve redirect" onClick={() => onVisit(l)}>
                  <ExternalLink size={15} />
                </IconBtn>
                <IconBtn title={l.active ? "Pause" : "Activate"} onClick={() => onToggle(l.id)}>
                  <Power size={15} className={l.active ? "text-emerald-400" : "text-slate-500"} />
                </IconBtn>
                <IconBtn title="Delete" onClick={() => onDelete(l.id)}>
                  <Trash2 size={15} className="text-rose-400" />
                </IconBtn>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No links match “{q}”.</p>}
      </div>
    </Card>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-100"
    >
      {children}
    </button>
  );
}
