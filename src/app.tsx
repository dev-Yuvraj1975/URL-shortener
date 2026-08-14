import { useEffect, useMemo, useRef, useState } from "react";
import { Scissors, BarChart3, ListTree, Server, RotateCcw, Terminal } from "lucide-react";
import { Shortener } from "./components/Shortener";
import { LinksPanel } from "./components/LinksPanel";
import { Analytics } from "./components/Analytics";
import { Infra } from "./components/Infra";
import { QrCard } from "./components/QrCode";
import { RedirectSim, type RedirectResult } from "./components/RedirectSim";
import { LruCache, hashToCode, loadLinks, makeClick, resetAll, saveLinks, shortBase, uid } from "./lib/store";
import type { Link } from "./lib/types";

type Tab = "shorten" | "links" | "analytics" | "infra";

const TABS: { id: Tab; label: string; icon: typeof Scissors }[] = [
  { id: "shorten", label: "Shorten", icon: Scissors },
  { id: "links", label: "My links", icon: ListTree },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "infra", label: "Cache & API", icon: Server },
];

export default function App() {
  const [links, setLinks] = useState<Link[]>(() => loadLinks());
  const [tab, setTab] = useState<Tab>("shorten");
  const [qrLink, setQrLink] = useState<Link | null>(null);
  const [redirect, setRedirect] = useState<{ link: Link; result: RedirectResult } | null>(null);
  const [, setTick] = useState(0);

  const cache = useRef(new LruCache());

  useEffect(() => saveLinks(links), [links]);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const totalClicks = useMemo(() => links.reduce((s, l) => s + l.clicks.length, 0), [links]);

  function createLink(longUrl: string, alias: string | null, title: string): Link {
    let code = alias ?? hashToCode(longUrl);
    let salt = 1;
    while (!alias && links.some((l) => l.code === code)) code = hashToCode(longUrl, salt++);
    const link: Link = {
      id: uid(),
      code,
      longUrl,
      title,
      createdAt: Date.now(),
      active: true,
      custom: !!alias,
      clicks: [],
    };
    cache.current.set(code, longUrl);
    setLinks((prev) => [link, ...prev]);
    return link;
  }

  function visit(link: Link) {
    if (!link.active) {
      setRedirect({ link, result: { cached: false, latencyMs: 0 } });
      return;
    }
    const hit = cache.current.get(link.code);
    const cached = !!hit;
    if (!cached) cache.current.set(link.code, link.longUrl);
    const click = makeClick(Date.now(), cached);
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, clicks: [click, ...l.clicks] } : l)));
    setRedirect({ link, result: { cached, latencyMs: click.latencyMs } });
  }

  function remove(id: string) {
    const l = links.find((x) => x.id === id);
    if (l) cache.current.invalidate(l.code);
    setLinks((prev) => prev.filter((x) => x.id !== id));
  }

  function toggle(id: string) {
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        cache.current.invalidate(l.code);
        return { ...l, active: !l.active };
      }),
    );
  }

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(60rem_40rem_at_15%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(50rem_35rem_at_90%_0%,rgba(16,185,129,0.12),transparent)]" />

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <Scissors size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                snip<span className="text-indigo-400">.d</span>
              </h1>
              <p className="text-xs text-slate-400">URL shortener · React · Node · Postgres · Redis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold tabular-nums text-white">{totalClicks.toLocaleString()}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-500">redirects served</p>
            </div>
            <button
              onClick={() => {
                cache.current = new LruCache();
                setLinks(resetAll());
              }}
              title="Reset demo data"
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
            >
              <RotateCcw size={16} />
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
            >
              <Terminal size={16} />
            </a>
          </div>
        </header>

        <nav className="mt-7 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  on ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </nav>

        <main className="mt-6">
          {tab === "shorten" && (
            <div className="space-y-5">
              <Shortener links={links} onCreate={createLink} onShowQr={setQrLink} />
              <LinksPanel links={links.slice(0, 4)} onVisit={visit} onShowQr={setQrLink} onDelete={remove} onToggle={toggle} />
            </div>
          )}
          {tab === "links" && (
            <LinksPanel links={links} onVisit={visit} onShowQr={setQrLink} onDelete={remove} onToggle={toggle} />
          )}
          {tab === "analytics" && <Analytics links={links} />}
          {tab === "infra" && (
            <Infra
              entries={cache.current.snapshot()}
              hits={cache.current.hits}
              misses={cache.current.misses}
              evictions={cache.current.evictions}
              onFlush={() => {
                cache.current.entries = [];
                setTick((t) => t + 1);
              }}
            />
          )}
        </main>

        <footer className="mt-12 text-center text-xs text-slate-600">
          Front-end simulation of a production URL shortener — hashing, cache-first redirects, and click analytics all run in
          your browser.
        </footer>
      </div>

      {qrLink && (
        <QrCard
          value={`https://${shortBase()}/${qrLink.code}`}
          label={`${shortBase()}/${qrLink.code}`}
          onClose={() => setQrLink(null)}
        />
      )}
      {redirect && <RedirectSim link={redirect.link} result={redirect.result} onClose={() => setRedirect(null)} />}
    </div>
  );
}
