export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekMonday(weekStr: string): Date {
  const [yearStr, weekPart] = weekStr.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekPart);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

export function getWeekFriday(weekStr: string): Date {
  const m = getWeekMonday(weekStr);
  m.setDate(m.getDate() + 4);
  return m;
}

export function getYearWeeks(year: number): string[] {
  const weeks: string[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  while (d.getFullYear() <= year) {
    const w = getISOWeek(d);
    if (w.startsWith(`${year}-`)) weeks.push(w);
    else if (parseInt(w.split('-W')[0]) > year) break;
    d.setDate(d.getDate() + 7);
  }
  return weeks.length > 0 ? weeks : [`${year}-W01`];
}

export function getCurrentWeek(): string {
  return getISOWeek(new Date());
}

export function formatWeekShort(weekStr: string): string {
  const m = getWeekMonday(weekStr);
  return `${m.getDate()}/${m.getMonth() + 1}`;
}

export function getWeekNumber(weekStr: string): number {
  return parseInt(weekStr.split('-W')[1]);
}

export function getWeekMonth(weekStr: string): number {
  return getWeekMonday(weekStr).getMonth();
}

export function formatDateShort(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
