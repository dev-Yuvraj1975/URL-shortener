import { useMemo, useState } from "react";
import { Link2, Sparkles, Wand2, Copy, Check, QrCode as QrIcon, AlertTriangle } from "lucide-react";
import { Button, Card, Pill } from "./ui";
import { hashToCode, hostOf, isValidUrl, normalizeUrl, shortBase } from "../lib/store";
import type { Link } from "../lib/types";

type Props = {
  links: Link[];
  onCreate: (longUrl: string, alias: string | null, title: string) => Link;
  onShowQr: (link: Link) => void;
};

export function Shortener({ links, onCreate, onShowQr }: Props) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Link | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => {
    if (alias.trim()) return alias.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (isValidUrl(url)) return hashToCode(normalizeUrl(url));
    return "•••••••";
  }, [url, alias]);

  const aliasTaken = alias.trim() ? links.some((l) => l.code.toLowerCase() === preview) : false;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidUrl(url)) {
      setError("Enter a valid URL, e.g. https://example.com/very/long/path");
      return;
    }
    if (aliasTaken) {
      setError(`Alias “${preview}” is already taken — 409 Conflict.`);
      return;
    }
    const link = onCreate(normalizeUrl(url), alias.trim() ? preview : null, title.trim() || hostOf(normalizeUrl(url)));
    setResult(link);
    setUrl("");
    setAlias("");
    setTitle("");
    setCopied(false);
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-500/15 p-2 text-indigo-300">
            <Link2 size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Shorten a link</h2>
            <p className="text-xs text-slate-400">POST /api/v1/links → base62 hash, persisted in Postgres, warmed in Redis</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Destination URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/an/extremely/long/path?utm_source=newsletter"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Custom alias (optional)</label>
              <div className="mt-1.5 flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 focus-within:border-indigo-400/60 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <span className="flex items-center border-r border-white/10 bg-white/5 px-3 font-mono text-xs text-slate-400">
                  {shortBase()}/
                </span>
                <input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="launch-2026"
                  className="w-full bg-transparent px-3 py-2.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">Label (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q3 launch campaign"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Preview</p>
              <p className="truncate font-mono text-sm text-indigo-300">
                {shortBase()}/{preview}
              </p>
            </div>
            {aliasTaken ? (
              <Pill tone="amber">
                <AlertTriangle size={12} /> alias taken
              </Pill>
            ) : (
              <Pill tone="indigo">
                <Sparkles size={12} /> {alias.trim() ? "custom alias" : "FNV-1a → base62"}
              </Pill>
            )}
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <Button type="submit" className="w-full sm:w-auto">
            <Wand2 size={16} /> Create short link
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Latest</h3>
        {result ? (
          <div className="mt-4 flex flex-1 flex-col">
            <p className="truncate text-xs text-slate-500">{result.longUrl}</p>
            <p className="mt-2 font-mono text-xl font-semibold text-white">
              {shortBase()}/<span className="text-indigo-300">{result.code}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="green">201 Created</Pill>
              <Pill>{result.custom ? "custom" : "hashed"}</Pill>
              <Pill>cache warmed</Pill>
            </div>
            <div className="mt-auto flex gap-2 pt-5">
              <Button variant="ghost" className="flex-1" onClick={() => copy(`https://${shortBase()}/${result.code}`)}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => onShowQr(result)}>
                <QrIcon size={15} /> QR code
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-10 text-center">
            <QrIcon size={28} className="text-slate-600" />
            <p className="mt-3 max-w-[15rem] text-sm text-slate-500">
              Your freshly minted short link and its QR code will appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
