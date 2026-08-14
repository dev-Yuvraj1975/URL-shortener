export type Click = {
  id: string;
  at: number;
  referrer: string;
  device: "Desktop" | "Mobile" | "Tablet";
  country: string;
  cached: boolean;
  latencyMs: number;
};

export type Link = {
  id: string;
  code: string;
  longUrl: string;
  title: string;
  createdAt: number;
  active: boolean;
  custom: boolean;
  clicks: Click[];
};

export type CacheEntry = {
  code: string;
  longUrl: string;
  insertedAt: number;
  ttlMs: number;
  hits: number;
};
