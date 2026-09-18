export const cn = (...c: (string | number | bigint | boolean | null | undefined)[]) => c.filter(Boolean).join(' ')

let seq = 0
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`

/** Simulated latency for fake async work (sync, import, verification...). */
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`

/** FNV-1a string hash → uint32 */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Deterministic PRNG (mulberry32) */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
