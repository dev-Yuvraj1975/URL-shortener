import type { CacheEntry, Click, Link } from "./types";

const KEY = "snipd.links.v1";
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ---------------------------------- ids ---------------------------------- */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Deterministic 64-bit-ish hash (FNV-1a style) folded into base62 — mirrors the
 *  server-side hashing strategy used to derive short codes from long URLs. */
export function hashToCode(input: string, salt = 0, length = 7): string {
  let h1 = 0x811c9dc5 ^ salt;
  let h2 = 0x01000193 + salt * 7919;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + c * (i + 13)) >>> 0;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  let n = (h1 >>> 0) * 4294967296 + (h2 >>> 0);
  let out = "";
  while (out.length < length) {
    out = BASE62[n % 62] + out;
    n = Math.floor(n / 62);
    if (n === 0 && out.length < length) n = (h1 ^ (out.length * 2654435761)) >>> 0;
  }
  return out.slice(0, length);
}

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return "https://" + t;
}

export function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function shortBase(): string {
  if (typeof window === "undefined") return "snp.ly";
  return "snp.ly";
}

/* -------------------------------- persistence ----------------------------- */

export function loadLinks(): Link[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Link[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

export function saveLinks(links: Link[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(links));
  } catch {
    /* quota */
  }
}

/* ----------------------------- click generation --------------------------- */

const REFERRERS = ["Direct", "Twitter/X", "LinkedIn", "Google", "Newsletter", "Reddit", "Slack"];
const COUNTRIES = ["United States", "India", "Germany", "Brazil", "United Kingdom", "Japan", "Canada"];
const DEVICES: Click["device"][] = ["Desktop", "Mobile", "Mobile", "Tablet"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function makeClick(at = Date.now(), cached = Math.random() > 0.22): Click {
  return {
    id: uid(),
    at,
    referrer: pick(REFERRERS),
    device: pick(DEVICES),
    country: pick(COUNTRIES),
    cached,
    latencyMs: cached ? +(1 + Math.random() * 3).toFixed(1) : +(28 + Math.random() * 45).toFixed(1),
  };
}

/* ---------------------------------- seed ---------------------------------- */

function seedLink(longUrl: string, title: string, custom: string | null, daysAgo: number, volume: number): Link {
  const createdAt = Date.now() - daysAgo * 86400000;
  const clicks: Click[] = [];
  for (let d = 0; d < Math.min(daysAgo, 14); d++) {
    const n = Math.max(0, Math.round(volume * (0.4 + Math.random()) * (1 - d / 20)));
    for (let i = 0; i < n; i++) {
      clicks.push(makeClick(Date.now() - d * 86400000 - Math.floor(Math.random() * 86400000)));
    }
  }
  return {
    id: uid(),
    code: custom ?? hashToCode(longUrl),
    longUrl,
    title,
    createdAt,
    active: true,
    custom: !!custom,
    clicks: clicks.sort((a, b) => b.at - a.at),
  };
}

function seed(): Link[] {
  const links = [
    seedLink(
      "https://engineering.example.com/blog/scaling-postgres-read-replicas-for-10x-traffic",
      "Scaling Postgres read replicas",
      "pg-scale",
      12,
      9,
    ),
    seedLink("https://github.com/vercel/next.js/releases/tag/v15.0.0", "Next.js 15 release notes", null, 9, 6),
    seedLink("https://docs.redis.io/latest/develop/reference/cluster-spec/", "Redis cluster spec", "redis-docs", 20, 4),
    seedLink("https://www.figma.com/file/9x8Kq/product-launch-deck-final-v3", "Launch deck", null, 5, 3),
    seedLink("https://calendly.com/acme-team/30min-intro-call", "Book a call", "meet", 30, 7),
  ];
  saveLinks(links);
  return links;
}

export function resetAll(): Link[] {
  localStorage.removeItem(KEY);
  return seed();
}

/* ------------------------------ redis cache sim ---------------------------- */

export const CACHE_TTL_MS = 90_000;
export const CACHE_CAPACITY = 6;

export class LruCache {
  entries: CacheEntry[] = [];
  hits = 0;
  misses = 0;
  evictions = 0;

  get(code: string): CacheEntry | null {
    const now = Date.now();
    this.entries = this.entries.filter((e) => now - e.insertedAt < e.ttlMs);
    const idx = this.entries.findIndex((e) => e.code === code);
    if (idx === -1) {
      this.misses++;
      return null;
    }
    const [e] = this.entries.splice(idx, 1);
    e.hits++;
    this.entries.unshift(e);
    this.hits++;
    return e;
  }

  set(code: string, longUrl: string) {
    this.entries = this.entries.filter((e) => e.code !== code);
    this.entries.unshift({ code, longUrl, insertedAt: Date.now(), ttlMs: CACHE_TTL_MS, hits: 0 });
    while (this.entries.length > CACHE_CAPACITY) {
      this.entries.pop();
      this.evictions++;
    }
  }

  invalidate(code: string) {
    this.entries = this.entries.filter((e) => e.code !== code);
  }

  snapshot(): CacheEntry[] {
    const now = Date.now();
    return this.entries.filter((e) => now - e.insertedAt < e.ttlMs);
  }
}

/* -------------------------------- analytics -------------------------------- */

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function seriesLast(links: Link[], days: number) {
  const out: { day: string; clicks: number; unique: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const from = start.getTime() - i * 86400000;
    const to = from + 86400000;
    const clicks = links.flatMap((l) => l.clicks).filter((c) => c.at >= from && c.at < to);
    out.push({
      day: dayKey(from),
      clicks: clicks.length,
      unique: Math.max(0, Math.round(clicks.length * (0.55 + Math.random() * 0.2))),
    });
  }
  return out;
}

export function groupCount<T extends string>(values: T[]): { name: string; value: number }[] {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
