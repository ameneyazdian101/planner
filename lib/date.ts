/**
 * Canonical date representation used everywhere in the app: a "date key"
 * string `yyyy-MM-dd` that names a calendar day, independent of any
 * timezone. The browser computes it from the user's local clock; the
 * server buckets tasks by parsing it as a UTC-midnight instant. This
 * avoids day-boundary drift between a client and a server in different
 * timezones (e.g. Vercel's UTC runtime vs. a user in Iran).
 */

export function dateKeyFromLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKeyFromLocalDate(new Date());
}

export function keyToUtcDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function dateKeyFromUtcDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysToKey(key: string, days: number): string {
  const d = keyToUtcDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return dateKeyFromUtcDate(d);
}

export function dayRangeForKey(key: string) {
  const start = keyToUtcDate(key);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

export function rangeForKeys(fromKey: string, toKey: string) {
  return { gte: keyToUtcDate(fromKey), lt: addDaysToKeyAsDate(toKey, 1) };
}

function addDaysToKeyAsDate(key: string, days: number): Date {
  const d = keyToUtcDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function isValidDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(keyToUtcDate(key).getTime());
}
