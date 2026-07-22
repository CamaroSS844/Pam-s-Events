/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThemeConfig, ThemeId } from '../types';

export const THEMES: ThemeConfig[] = [
  {
    id: 'luxury',
    name: 'Luxury Gold',
    description: 'A timeless royal theme featuring rich gold highlights, deep serif titles, and fine borders.',
    primaryColor: '#D4AF37', // Gold
    accentColor: '#AA7C11',
    bgColor: 'bg-stone-50',
    cardBg: 'bg-white',
    textColor: 'text-stone-900',
    textMutedColor: 'text-stone-500',
    fontHeading: 'font-serif', // Playfair Display / Great Vibes feel
    fontBody: 'font-sans',
    borderStyle: 'border border-amber-200 rounded-none shadow-[0_4px_20px_-4px_rgba(212,175,55,0.15)]',
    buttonStyle: 'bg-amber-600 hover:bg-amber-700 text-white rounded-none tracking-widest uppercase text-xs',
    heroOverlay: 'bg-stone-950/40',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-200 rounded-none uppercase text-[10px] tracking-wider'
  },
  {
    id: 'elegant',
    name: 'Elegant White',
    description: 'Crisp, minimalist design centering high negative space, clean thin lines, and classic typography.',
    primaryColor: '#1A1A1A',
    accentColor: '#737373',
    bgColor: 'bg-zinc-50',
    cardBg: 'bg-white',
    textColor: 'text-zinc-900',
    textMutedColor: 'text-zinc-500',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    borderStyle: 'border border-zinc-200 rounded-none shadow-sm',
    buttonStyle: 'bg-zinc-900 hover:bg-zinc-800 text-white rounded-none text-xs tracking-wider uppercase',
    heroOverlay: 'bg-zinc-900/30',
    badgeStyle: 'bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-none'
  },
  {
    id: 'modern',
    name: 'Modern Navy',
    description: 'Bold cobalt and deep marine tones paired with round cards and clean geometric layouts.',
    primaryColor: '#1E40AF', // Blue
    accentColor: '#3B82F6',
    bgColor: 'bg-slate-50',
    cardBg: 'bg-white',
    textColor: 'text-slate-900',
    textMutedColor: 'text-slate-500',
    fontHeading: 'font-sans font-bold tracking-tight',
    fontBody: 'font-sans',
    borderStyle: 'border border-slate-100 rounded-2xl shadow-md',
    buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all',
    heroOverlay: 'bg-slate-950/45',
    badgeStyle: 'bg-blue-50 text-blue-700 border border-blue-100 rounded-full'
  },
  {
    id: 'rustic',
    name: 'Rustic Warmth',
    description: 'Earthy forest tones, natural beige surfaces, and wood-like textured boundaries.',
    primaryColor: '#15803D', // Green
    accentColor: '#854D0E', // Brown
    bgColor: 'bg-[#FDFBF7]',
    cardBg: 'bg-white',
    textColor: 'text-stone-800',
    textMutedColor: 'text-stone-500',
    fontHeading: 'font-serif font-semibold',
    fontBody: 'font-sans',
    borderStyle: 'border-2 border-stone-200/60 rounded-lg shadow-sm',
    buttonStyle: 'bg-emerald-850 hover:bg-emerald-900 text-white rounded-lg text-sm bg-emerald-800',
    heroOverlay: 'bg-stone-900/40',
    badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-100 rounded-md'
  },
  {
    id: 'floral',
    name: 'Floral Rose',
    description: 'Soft pastel pinks, delicate details, and script typography suited for botanical affairs.',
    primaryColor: '#DB2777', // Pink
    accentColor: '#F472B6',
    bgColor: 'bg-rose-50/40',
    cardBg: 'bg-white',
    textColor: 'text-rose-950',
    textMutedColor: 'text-rose-600/70',
    fontHeading: 'font-serif italic',
    fontBody: 'font-sans',
    borderStyle: 'border border-pink-100 rounded-xl shadow-lg shadow-pink-500/5',
    buttonStyle: 'bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-medium',
    heroOverlay: 'bg-rose-950/20',
    badgeStyle: 'bg-rose-50 text-pink-600 border border-pink-100 rounded-full'
  },
  {
    id: 'traditional',
    name: 'Traditional Brown',
    description: 'Warm mahogany and cream colors with rich, centered compositions and double borders.',
    primaryColor: '#78350F', // Warm mahogany
    accentColor: '#B45309',
    bgColor: 'bg-amber-50/20',
    cardBg: 'bg-white',
    textColor: 'text-amber-950',
    textMutedColor: 'text-amber-800/60',
    fontHeading: 'font-serif font-bold',
    fontBody: 'font-sans',
    borderStyle: 'border-4 border-double border-amber-900/40 rounded-none shadow-sm',
    buttonStyle: 'bg-amber-900 hover:bg-amber-850 text-white rounded-none tracking-widest text-xs font-semibold uppercase',
    heroOverlay: 'bg-amber-950/40',
    badgeStyle: 'bg-amber-100 text-amber-900 border border-amber-200 rounded-none'
  },
  {
    id: 'minimal',
    name: 'Ultra Minimal',
    description: 'A pure typography experience, stripping back all decorations to let words shine.',
    primaryColor: '#000000',
    accentColor: '#1F2937',
    bgColor: 'bg-white',
    cardBg: 'bg-neutral-50',
    textColor: 'text-black',
    textMutedColor: 'text-neutral-500',
    fontHeading: 'font-mono uppercase tracking-widest text-sm',
    fontBody: 'font-mono text-sm',
    borderStyle: 'border border-black rounded-none',
    buttonStyle: 'bg-black hover:bg-neutral-900 text-white rounded-none text-xs tracking-wider uppercase border border-black',
    heroOverlay: 'bg-black/25',
    badgeStyle: 'bg-white text-black border border-black rounded-none text-[9px] tracking-tight'
  }
];

export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
