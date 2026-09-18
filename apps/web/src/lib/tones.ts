import type { Tone } from "./types";

/** Literal class strings per tone (Tailwind needs them spelled out). */
const TONES: Record<Tone, { soft: string; text: string; ring: string; solid: string; dot: string }> = {
  brand: { soft: "bg-brand-50", text: "text-brand-700", ring: "ring-brand-200", solid: "bg-brand-600", dot: "bg-brand-500" },
  sky: { soft: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", solid: "bg-sky-500", dot: "bg-sky-500" },
  teal: { soft: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", solid: "bg-teal-500", dot: "bg-teal-500" },
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", solid: "bg-emerald-500", dot: "bg-emerald-500" },
  amber: { soft: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", solid: "bg-amber-500", dot: "bg-amber-500" },
  orange: { soft: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", solid: "bg-orange-500", dot: "bg-orange-500" },
  rose: { soft: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", solid: "bg-rose-500", dot: "bg-rose-500" },
  violet: { soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", solid: "bg-violet-500", dot: "bg-violet-500" },
  slate: { soft: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200", solid: "bg-slate-500", dot: "bg-slate-400" },
};

export const tone = (t: Tone) => TONES[t];

/** Item kind → badge tone, shared by the task list, item page and concept page. */
export const KIND_TONE: Record<string, Tone> = {
  ASSIGNMENT: "brand",
  QUIZ: "orange",
  EXAM: "rose",
  READING: "teal",
};
