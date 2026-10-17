import type { PriorityKind } from '@/plan/types'

export interface Tone {
  dot: string
  chip: string
  bar: string
}

export const STAGE_TONES: Record<string, Tone> = {
  s0: {
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    bar: 'bg-slate-400',
  },
  s1: {
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    bar: 'bg-indigo-500',
  },
  s2: {
    dot: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
  s3: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    bar: 'bg-sky-500',
  },
  s4: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  s5: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  prep: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
}

export const toneFor = (stageId: string): Tone => STAGE_TONES[stageId] ?? STAGE_TONES.s0

export const MILESTONE_TONES = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500']

export const PRIORITY: Record<PriorityKind, { label: string; className: string }> = {
  must: { label: '必须', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  plus: { label: '加分', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  edge: { label: '差异化', className: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  strength: { label: '长处', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
}
