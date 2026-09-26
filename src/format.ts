import { currentInterval, isOpenAt, localClock, nextOpening } from "../shared/search";
import type { OpenInterval, Provider } from "../shared/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const formatInterval = (i: OpenInterval) =>
  i.close === "24:00" && i.open === "00:00" ? "24 hours" : `${i.open}–${i.close}`;

export const formatDay = (intervals: OpenInterval[]) =>
  intervals.length === 0 ? "Closed" : intervals.map(formatInterval).join(", ");

export const dayName = (day: number) => DAY_NAMES[day]!;

export interface OpenStatus {
  open: boolean;
  /** "Open until 23:00", "Open 24 hours", "Closed · opens 08:30", "Closed · opens Monday 09:00". */
  label: string;
}

export function openStatus(provider: Provider, now: Date): OpenStatus {
  const current = currentInterval(provider, now);
  if (current) {
    return {
      open: true,
      label: current.open === "00:00" && current.close === "24:00" ? "Open 24 hours" : `Open until ${current.close}`,
    };
  }
  const next = nextOpening(provider, now);
  if (!next) return { open: false, label: "Closed" };
  const day = next.dayOffset === 0 ? "" : next.dayOffset === 1 ? "tomorrow " : `${dayName((localClock(now).day + next.dayOffset) % 7)} `;
  return { open: false, label: `Closed · opens ${day}${next.interval.open}` };
}

export { isOpenAt };

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
