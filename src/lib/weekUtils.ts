import {
  startOfYear, addDays, getISOWeek, getISOWeekYear, format,
  startOfISOWeek, endOfISOWeek, getMonth,
} from "date-fns";
import { es } from "date-fns/locale";

export interface WeekInfo {
  key: string;      // "2026-W15"
  weekNum: number;
  startDate: Date;
  endDate: Date;
  label: string;    // "7 Abr"
  month: number;    // 0-11
  isPast: boolean;
}

export function getWeeksOfYear(year: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const seen = new Set<string>();
  const now = new Date();

  // Start from Jan 1 and iterate day by day to collect all ISO weeks of this year
  let d = startOfYear(new Date(year, 0, 1));
  const endDate = new Date(year, 11, 31);

  while (d <= endDate) {
    const wy = getISOWeekYear(d);
    const wn = getISOWeek(d);
    const key = `${wy}-W${String(wn).padStart(2, "0")}`;

    if (!seen.has(key) && wy === year) {
      const ws = startOfISOWeek(d);
      const we = endOfISOWeek(d);
      seen.add(key);
      weeks.push({
        key,
        weekNum: wn,
        startDate: ws,
        endDate: we,
        label: format(ws, "d MMM", { locale: es }),
        month: getMonth(ws),
        isPast: we < now,
      });
    }
    d = addDays(d, 1);
  }

  return weeks.sort((a, b) => a.weekNum - b.weekNum);
}

export function getCurrentWeekKey(): string {
  const now = new Date();
  const wy = getISOWeekYear(now);
  const wn = getISOWeek(now);
  return `${wy}-W${String(wn).padStart(2, "0")}`;
}

export function weekKeyToLabel(key: string): string {
  const [yearStr, wStr] = key.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  // Find the Monday of that ISO week
  const jan4 = new Date(year, 0, 4);
  const start = startOfISOWeek(jan4);
  const target = addDays(start, (week - 1) * 7);
  return format(target, "d MMM", { locale: es });
}
