import { createContext, useContext } from 'react'
import type { LinkTarget } from '@/plan/types'

export type ProgressKind = 'task' | 'question'

export interface PlanState {
  isDone: (kind: ProgressKind, id: string, baseline: boolean) => boolean
  toggle: (kind: ProgressKind, id: string, baseline: boolean) => void
  resetProgress: () => void
  hasLocalProgress: boolean
  weekly: number
  setWeekly: (hours: number) => void
  navigate: (target: LinkTarget) => void
}

export const PlanStateContext = createContext<PlanState | null>(null)

export function usePlanState(): PlanState {
  const state = useContext(PlanStateContext)
  if (!state) throw new Error('usePlanState must be used inside PlanStateProvider')
  return state
}
