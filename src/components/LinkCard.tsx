import { useState } from "react";
import type { ShortLink } from "../lib/store";
import { displayShortUrl, shortUrlFor } from "../lib/store";

interface Props {
  link: ShortLink;
  justCreated?: boolean;
  onShowQR: (link: ShortLink) => void;
  onDelete: (code: string) => void;
  onVisit: (code: string) => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function LinkCard({ link, justCreated, onShowQR, onDelete, onVisit }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrlFor(link.code));
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  let host = "";
  try {
    host = new URL(link.longUrl).hostname.replace(/^www\./, "");
  } catch {
    host = link.longUrl;
  }

  return (
    <div
      className={`group rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        justCreated ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onVisit(link.code)}
              title="Follow redirect (GET /:code)"
              className="truncate text-sm font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
            >
              {displayShortUrl(link.code)}
            </button>
            {link.isCustom && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                alias
              </span>
            )}
            {justCreated && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                new
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-slate-500" title={link.longUrl}>
            <img
              src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
              alt=""
              className="mr-1.5 inline-block h-3.5 w-3.5 rounded-sm align-[-2px]"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
            {link.longUrl}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M7 16h8" /><path d="M7 11h12" /><path d="M7 6h3" />
              </svg>
              {link.clicks.length.toLocaleString()} clicks
            </span>
            <span>·</span>
            <span>{timeAgo(link.createdAt)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden font-mono sm:inline">{link.isCustom ? "custom" : "fnv1a→b62"}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={copy}
            title="Copy short link"
            className={`rounded-lg p-2 transition ${
              copied
                ? "bg-emerald-100 text-emerald-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {copied ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onShowQR(link)}
            title="QR code"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" />
              <path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(link.code)}
            title="Delete link"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
