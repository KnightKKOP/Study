import type { HourRange } from '../plan/types.ts'

export const WEEKS_PER_MONTH = 4.33
export const WEEKLY_OPTIONS = [8, 10, 12, 15, 20, 25] as const
export const DEFAULT_WEEKLY = 12

export interface NumberRange {
  low: number
  high: number
}

const roundHalf = (x: number) => Math.round(x * 2) / 2

export function monthRange(hours: HourRange, weekly: number): NumberRange {
  return {
    low: roundHalf(hours.low / weekly / WEEKS_PER_MONTH),
    high: roundHalf(hours.high / weekly / WEEKS_PER_MONTH),
  }
}

export function weekRange(hours: HourRange, weekly: number): NumberRange {
  return { low: Math.ceil(hours.low / weekly), high: Math.ceil(hours.high / weekly) }
}

export function formatSpan(range: NumberRange): string {
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1))
  return `${fmt(range.low)}～${fmt(range.high)}`
}

export function formatRange(range: NumberRange, unit: string): string {
  return `${formatSpan(range)} ${unit}`
}
