// The one search function behind the agent's `search_providers` tool, the
// simulated agent, and the browsable directory page.

import { CATEGORY_BY_ID, DISTRICT_BY_ID, PROVIDERS } from "./directory";
import type { SearchInput } from "./schemas";
import type { OpenInterval, Provider } from "./types";

const TIME_ZONE = "Europe/London";

/** Weekday (0 = Sunday) and minutes since midnight for `now` in the town's time zone. */
export function localClock(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day: day < 0 ? now.getDay() : day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + (m ?? 0);
};

export function isOpenAt(provider: Provider, now: Date): boolean {
  const { day, minutes } = localClock(now);
  return openAtMinutes(provider, day, minutes);
}

function openAtMinutes(provider: Provider, day: number, minutes: number): boolean {
  return provider.hours[day]!.some((i) => minutes >= toMinutes(i.open) && minutes < toMinutes(i.close));
}

/** The interval currently open, if any. */
export function currentInterval(provider: Provider, now: Date): OpenInterval | undefined {
  const { day, minutes } = localClock(now);
  return provider.hours[day]!.find((i) => minutes >= toMinutes(i.open) && minutes < toMinutes(i.close));
}

/** When a closed provider next opens: day offset (0 = today) and the interval. */
export function nextOpening(provider: Provider, now: Date): { dayOffset: number; interval: OpenInterval } | undefined {
  const { day, minutes } = localClock(now);
  for (let offset = 0; offset < 7; offset++) {
    const d = (day + offset) % 7;
    const interval = provider.hours[d]!.find((i) => offset > 0 || minutes < toMinutes(i.open));
    if (interval) return { dayOffset: offset, interval };
  }
  return undefined;
}

export interface SearchResult {
  matches: Provider[];
  total: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();

function queryScore(provider: Provider, query: string): number {
  const words = norm(query).split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const hay = norm([provider.name, provider.blurb, ...provider.tags].join(" "));
  const full = norm(query);
  let score = provider.tags.some((t) => norm(t) === full) ? 6 : hay.includes(full) ? 4 : 0;
  for (const w of words) if (hay.includes(w)) score += 1;
  return score;
}

/**
 * Filter then rank. Hard filters: category, district, nhs, walkIn, accessible,
 * openNow. Ranking: query relevance, then open now, then walk-in. Capped at
 * `limit` so tool results stay small; `total` reports the uncapped count.
 */
export function searchProviders(input: SearchInput, now: Date, limit = 8): SearchResult {
  const filtered = PROVIDERS.filter((p) => {
    if (input.category && p.category !== input.category) return false;
    if (input.district && p.district !== input.district) return false;
    if (input.nhs && !p.nhs) return false;
    if (input.walkIn && !p.walkIn) return false;
    if (input.accessible && !p.accessible) return false;
    if (input.openNow && !isOpenAt(p, now)) return false;
    if (input.openAt && !openAtMinutes(p, localClock(now).day, toMinutes(input.openAt))) return false;
    if (input.query && !input.category && queryScore(p, input.query) === 0) return false;
    return true;
  });

  const ranked = filtered
    .map((p) => ({
      p,
      score:
        (input.query ? queryScore(p, input.query) * 10 : 0) +
        (isOpenAt(p, now) ? 3 : 0) +
        (p.walkIn ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .map((r) => r.p);

  return { matches: ranked.slice(0, limit), total: ranked.length };
}

/** Human label for a search, used for the progress steps in both modes. */
export function describeSearch(input: SearchInput): string {
  const what = input.category ? CATEGORY_BY_ID[input.category].plural : "services";
  const bits: string[] = [];
  if (input.nhs) bits.push("NHS");
  if (input.walkIn) bits.push("walk-in");
  if (input.accessible) bits.push("step-free");
  const where = input.district ? ` in ${DISTRICT_BY_ID[input.district].name}` : " across town";
  const when = input.openNow ? " open now" : input.openAt ? ` open at ${input.openAt}` : "";
  const q = input.query ? ` matching “${input.query}”` : "";
  return `Searching ${bits.length ? bits.join(", ") + " " : ""}${what}${when}${where}${q}`;
}

/** Compact JSON for the tool result: enough for Claude to reason and recommend. */
export function describeForTool(result: SearchResult, now: Date) {
  return {
    total: result.total,
    matches: result.matches.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      district: DISTRICT_BY_ID[p.district].name,
      openNow: isOpenAt(p, now),
      todayHours: p.hours[localClock(now).day]!.map((i) => `${i.open}–${i.close}`).join(", ") || "closed today",
      nhs: p.nhs,
      walkIn: p.walkIn,
      accessible: p.accessible,
      tags: p.tags,
      blurb: p.blurb,
    })),
  };
}
