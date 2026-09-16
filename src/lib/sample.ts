// Weighted random sample, without replacement, favouring earlier/higher-
// weighted items — but never a fixed "top N," so nothing in the pool is
// permanently excluded. This is the "A-ES" algorithm: each item gets a
// random key raised to 1/weight, and the highest keys win.
export function weightedSample<T>(pool: T[], count: number, weightOf: (item: T) => number): T[] {
  return pool
    .map((item) => ({ item, key: Math.random() ** (1 / Math.max(weightOf(item), 0.1)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map(({ item }) => item);
}
