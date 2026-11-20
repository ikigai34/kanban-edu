/**
 * Tag and Hashtag parsing utilities
 * Muted, sophisticated SaaS aesthetic with hairline borders
 */

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

// Предустановленные системные теги — мягкие, ненавязчивые оттенки без обводки (только строчные буквы)
export const SYSTEM_TAG_STYLES: Record<string, TagStyle> = {
  '#закладки': {
    bg: 'bg-orange-50/80 hover:bg-orange-100/70 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 text-orange-800 dark:text-orange-200/85',
    text: 'text-orange-800 dark:text-orange-200/85',
    border: 'border-transparent',
    dot: 'bg-orange-500 dark:bg-orange-400/80',
  },
  '#лекция': {
    bg: 'bg-purple-50/70 hover:bg-purple-100/70 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-200/85',
    text: 'text-purple-700 dark:text-purple-200/85',
    border: 'border-transparent',
    dot: 'bg-purple-500 dark:bg-purple-400/80',
  },
  '#лабораторная': {
    bg: 'bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-700 dark:text-blue-200/85',
    text: 'text-blue-700 dark:text-blue-200/85',
    border: 'border-transparent',
    dot: 'bg-blue-500 dark:bg-blue-400/80',
  },
  '#практика': {
    bg: 'bg-teal-50/70 hover:bg-teal-100/70 dark:bg-teal-500/15 dark:hover:bg-teal-500/25 text-teal-700 dark:text-teal-200/85',
    text: 'text-teal-700 dark:text-teal-200/85',
    border: 'border-transparent',
    dot: 'bg-teal-500 dark:bg-teal-400/80',
  },
  '#курсовая': {
    bg: 'bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-200/85',
    text: 'text-amber-800 dark:text-amber-200/85',
    border: 'border-transparent',
    dot: 'bg-amber-500 dark:bg-amber-400/80',
  },
  '#экзамен': {
    bg: 'bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-200/85',
    text: 'text-rose-700 dark:text-rose-200/85',
    border: 'border-transparent',
    dot: 'bg-rose-500 dark:bg-rose-400/80',
  },
  '#инфо': {
    bg: 'bg-slate-100/80 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300',
    text: 'text-slate-700 dark:text-neutral-300',
    border: 'border-transparent',
    dot: 'bg-slate-400 dark:bg-neutral-400',
  },
};

// Палитра для пользовательских тегов — мягкие бескаркасные тона
const CUSTOM_PALETTES: TagStyle[] = [
  {
    bg: 'bg-slate-50 hover:bg-slate-100/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300',
    text: 'text-slate-600 dark:text-neutral-300',
    border: 'border-transparent',
    dot: 'bg-slate-400 dark:bg-neutral-400',
  },
  {
    bg: 'bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-200/85',
    text: 'text-indigo-700 dark:text-indigo-200/85',
    border: 'border-transparent',
    dot: 'bg-indigo-500 dark:bg-indigo-400/80',
  },
  {
    bg: 'bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-200/85',
    text: 'text-emerald-700 dark:text-emerald-200/85',
    border: 'border-transparent',
    dot: 'bg-emerald-500 dark:bg-emerald-400/80',
  },
  {
    bg: 'bg-cyan-50/70 hover:bg-cyan-100/70 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-200/85',
    text: 'text-cyan-700 dark:text-cyan-200/85',
    border: 'border-transparent',
    dot: 'bg-cyan-500 dark:bg-cyan-400/80',
  },
  {
    bg: 'bg-violet-50/70 hover:bg-violet-100/70 dark:bg-violet-500/15 dark:hover:bg-violet-500/25 text-violet-700 dark:text-violet-200/85',
    text: 'text-violet-700 dark:text-violet-200/85',
    border: 'border-transparent',
    dot: 'bg-violet-500 dark:bg-violet-400/80',
  },
  {
    bg: 'bg-orange-50/70 hover:bg-orange-100/70 dark:bg-orange-500/15 dark:hover:bg-orange-500/25 text-orange-700 dark:text-orange-200/85',
    text: 'text-orange-700 dark:text-orange-200/85',
    border: 'border-transparent',
    dot: 'bg-orange-500 dark:bg-orange-400/80',
  },
];

/**
 * Извлекает все хештеги из текста (#слово) и приводит их к нижнему регистру
 */
export function extractHashtags(text?: string | null): string[] {
  if (!text) return [];
  const regex = /(?:^|\s)(#[a-zA-Zа-яА-ЯёЁ0-9_-]+)/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const tag = match[1].trim().toLowerCase();
    if (!matches.includes(tag)) {
      matches.push(tag);
    }
  }

  return matches;
}

/**
 * Получить стиль для тега (нормализует к нижнему регистру)
 */
export function getTagStyle(tag: string): TagStyle {
  const normalized = (tag.startsWith('#') ? tag : `#${tag}`).toLowerCase();
  
  if (SYSTEM_TAG_STYLES[normalized]) {
    return SYSTEM_TAG_STYLES[normalized];
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CUSTOM_PALETTES.length;
  return CUSTOM_PALETTES[index];
}
