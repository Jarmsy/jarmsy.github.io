/** "July 6, 2026" */
export function longDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** "Jul 2026" — for stamps */
export function monthYear(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** "2026-07-06" — for <time datetime> */
export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Newest first, by a date field. */
export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
  return b.data.date.valueOf() - a.data.date.valueOf();
}
