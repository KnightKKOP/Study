import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PLAN_SOURCE } from '../../plan.config.ts'
import { loadPlan } from '../../vite-plugin-plan.ts'
import { formatRange, monthRange } from '../lib/time.ts'
import { DOC_FILES, parsePlan, plain, PlanParseError } from './parse.ts'
import type { DocKey } from './types.ts'

const planRoot = fileURLToPath(new URL('../../..', import.meta.url))
const plan = loadPlan(planRoot, PLAN_SOURCE)

function sources(): Record<DocKey, string> {
  return Object.fromEntries(
    (Object.keys(DOC_FILES) as DocKey[]).map((key) => [key, readFileSync(`${planRoot}/${DOC_FILES[key]}`, 'utf8')]),
  ) as Record<DocKey, string>
}

describe('roadmap', () => {
  it('has the six stages and the interview prep track', () => {
    expect(plan.roadmap.stages.map((s) => s.id)).toEqual(['s0', 's1', 's2', 's3', 's4', 's5', 'prep'])
    expect(plan.roadmap.stages.map((s) => s.tasks.length)).toEqual([4, 9, 11, 7, 6, 5, 6])
  })

  it('separates optional tasks and strips the markers from the text', () => {
    const tasks = plan.roadmap.stages.flatMap((s) => s.tasks)
    expect(tasks.filter((t) => t.optional)).toHaveLength(9)
    for (const task of tasks) expect(plain(task.text)).not.toMatch(/（(选做|\d+～\d+ 小时)）$/)
  })

  it('reads the hours of every prep task', () => {
    const prep = plan.roadmap.stages.at(-1)!
    expect(prep.tasks.map((t) => t.hours)).toEqual(['5～10 小时', '60～80 小时', '15～20 小时', '30～40 小时', '10～15 小时', undefined])
  })

  it('resolves links between documents to in-page targets', () => {
    const targets = plan.roadmap.intro.flatMap((n) => (n.type === 'link' && n.target ? [n.target] : []))
    expect(targets).toEqual([{ doc: 'time' }, { doc: 'overview', anchor: '两点提醒' }])
  })
})

describe('time estimate', () => {
  it('matches the conversion table in the document', () => {
    const { milestones, conversionTable } = plan.time
    expect(conversionTable.map((r) => r.weeklyHours)).toEqual([10, 12, 15, 20])
    for (const row of conversionTable) {
      expect(milestones.map((m) => formatRange(monthRange(m.hours, row.weeklyHours), '个月'))).toEqual(row.months)
    }
  })

  it('adds the stage efforts up to the full plan', () => {
    const total = plan.time.stageEfforts.reduce((acc, s) => ({ low: acc.low + s.hours.low, high: acc.high + s.hours.high }), { low: 0, high: 0 })
    expect(plan.time.milestones.at(-1)!.hours).toEqual(total)
  })

  it('agrees with the effort stated in each roadmap stage', () => {
    expect(plan.time.stageEfforts.map((s) => s.hours)).toEqual(plan.roadmap.stages.map((s) => s.effortHours))
  })
})

describe('other documents', () => {
  it('reads the knowledge areas in order', () => {
    expect(plan.knowledge.areas.map((a) => a.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(plan.knowledge.areas[1].table?.rows).toHaveLength(4)
  })

  it('reads the feature list', () => {
    expect(plan.features.features.filter((f) => f.tier === 'must')).toHaveLength(8)
    expect(plan.features.features.filter((f) => f.tier === 'optional')).toHaveLength(5)
  })

  it('reads every interview question with its hint', () => {
    expect(plan.questions.groups.map((g) => g.questions.length)).toEqual([4, 5, 5, 5, 2])
    for (const q of plan.questions.groups.flatMap((g) => g.questions)) expect(plain(q.hint)).not.toBe('')
  })

  it('reads the overview facts and reminders', () => {
    expect(plan.overview.facts.map((f) => f.label)).toEqual(['目标岗位', '主线', '节奏'])
    expect(plan.overview.reminders.map((f) => f.label)).toEqual(['合规', '面试时怎么讲 AI 辅助'])
  })
})

describe('validation', () => {
  it('names the file and the stage when a required field is missing', () => {
    const src = sources()
    src.roadmap = src.roadmap.replace(/^\*\*出关标准\*\*：.*\n/m, '')
    expect(() => parsePlan(src, PLAN_SOURCE)).toThrow(PlanParseError)
    expect(() => parsePlan(src, PLAN_SOURCE)).toThrow('docs/roadmap.md: 「阶段 0：准备：合规与发布 1.1.0」缺少“**出关标准**：”')
  })

  it('rejects a table whose header changed', () => {
    const src = sources()
    src.features = src.features.replace('| 功能 | 路线图编号 |', '| 功能名 | 路线图编号 |')
    expect(() => parsePlan(src, PLAN_SOURCE)).toThrow(/docs\/features\.md: 「必做」表的表头/)
  })
})
