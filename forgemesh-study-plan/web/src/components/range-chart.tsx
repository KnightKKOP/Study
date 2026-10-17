import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface RangeRow {
  key: string
  label: ReactNode
  low: number
  high: number
  valueLabel: string
  tone: string
  detail?: ReactNode
}

function tickStep(max: number) {
  if (max <= 12) return 2
  if (max <= 30) return 3
  if (max <= 120) return 20
  return 30
}

export function RangeChart({ rows, unit }: { rows: RangeRow[]; unit: string }) {
  const highest = Math.max(...rows.map((r) => r.high))
  const step = tickStep(highest)
  const max = Math.ceil(highest / step) * step
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step)
  const pct = (x: number) => `${(x / max) * 100}%`

  return (
    <div className="space-y-5">
      {rows.map((row) => (
        <div key={row.key} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">{row.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">{row.valueLabel}</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-muted">
            <div
              className={cn('absolute inset-y-0 min-w-2 rounded-full', row.tone)}
              style={{ left: pct(row.low), width: pct(row.high - row.low) }}
            />
          </div>
          {row.detail}
        </div>
      ))}
      <div aria-hidden className="relative h-4 text-[11px] text-muted-foreground tabular-nums">
        {ticks.map((t) => (
          <span
            key={t}
            className={cn('absolute -translate-x-1/2 whitespace-nowrap', t === 0 && 'translate-x-0', t === max && '-translate-x-full')}
            style={{ left: pct(t) }}
          >
            {t}
            {t === max ? ` ${unit}` : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
