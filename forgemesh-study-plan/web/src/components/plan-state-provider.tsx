import { useCallback, useMemo, type ReactNode } from 'react'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { PlanStateContext, type PlanState, type ProgressKind } from '@/lib/plan-state'
import { DEFAULT_WEEKLY } from '@/lib/time'
import type { LinkTarget } from '@/plan/types'

export function PlanStateProvider({ navigate, children }: { navigate: (target: LinkTarget) => void; children: ReactNode }) {
  // Only differences from the Markdown checkboxes are stored, so ticking `- [x]` in the docs still shows up here.
  const [overrides, setOverrides] = usePersistentState<Record<string, boolean>>('fm-plan:v1:done', {})
  const [weekly, setWeekly] = usePersistentState<number>('fm-plan:v1:weekly', DEFAULT_WEEKLY)

  const isDone = useCallback(
    (kind: ProgressKind, id: string, baseline: boolean) => overrides[`${kind}:${id}`] ?? baseline,
    [overrides],
  )

  const toggle = useCallback(
    (kind: ProgressKind, id: string, baseline: boolean) => {
      setOverrides((prev) => {
        const key = `${kind}:${id}`
        const next = !(prev[key] ?? baseline)
        const rest = { ...prev }
        delete rest[key]
        return next === baseline ? rest : { ...rest, [key]: next }
      })
    },
    [setOverrides],
  )

  const value = useMemo<PlanState>(
    () => ({
      isDone,
      toggle,
      resetProgress: () => setOverrides({}),
      hasLocalProgress: Object.keys(overrides).length > 0,
      weekly,
      setWeekly,
      navigate,
    }),
    [isDone, toggle, setOverrides, overrides, weekly, setWeekly, navigate],
  )

  return <PlanStateContext value={value}>{children}</PlanStateContext>
}
