import type { DocKey, LinkTarget } from '@/plan/types'

export const TABS = ['roadmap', 'time', 'knowledge', 'features', 'questions'] as const satisfies readonly DocKey[]
export type TabKey = (typeof TABS)[number]

const OVERVIEW_ANCHORS: Record<string, string> = { 两点提醒: 'reminders' }

export function isTab(value: string): value is TabKey {
  return (TABS as readonly string[]).includes(value)
}

export function resolveTarget(target: LinkTarget): { tab: TabKey; anchor: string } {
  if (target.doc === 'overview') {
    return { tab: 'roadmap', anchor: (target.anchor && OVERVIEW_ANCHORS[target.anchor]) || 'top' }
  }
  return { tab: target.doc, anchor: 'content' }
}
