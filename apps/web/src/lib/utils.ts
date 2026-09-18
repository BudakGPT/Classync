export const cn = (...c: (string | number | bigint | boolean | null | undefined)[]) => c.filter(Boolean).join(" ");

export const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n === 1 ? word : pluralWord}`;
