import type { Link, List, PhrasingContent, Root, RootContent, Table, Text } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import type {
  DocKey,
  Feature,
  Features,
  HourRange,
  Inline,
  KnowledgeArea,
  KnowledgeMap,
  Labeled,
  Milestone,
  Overview,
  Plan,
  PriorityKind,
  QuestionGroup,
  Questions,
  Rich,
  Roadmap,
  SimpleTable,
  Stage,
  StageEffort,
  Task,
  TimeEstimate,
} from './types.ts'

export const DOC_FILES: Record<DocKey, string> = {
  overview: 'README.md',
  roadmap: 'docs/roadmap.md',
  time: 'docs/time-estimate.md',
  knowledge: 'docs/knowledge-map.md',
  features: 'docs/features.md',
  questions: 'docs/interview-questions.md',
}

export interface ParseOptions {
  repo: string
  branch: string
  planDir: string
}

export class PlanParseError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`)
    this.name = 'PlanParseError'
  }
}

interface Ctx {
  file: string
  opts: ParseOptions
  fail(message: string): never
}

interface Section {
  title: string
  nodes: RootContent[]
}

interface Doc {
  title: string
  preamble: RootContent[]
  sections: Section[]
}

const HOURS_RE = /(\d+)～(\d+) 小时/

function makeCtx(doc: DocKey, opts: ParseOptions): Ctx {
  const file = DOC_FILES[doc]
  return {
    file,
    opts,
    fail(message) {
      throw new PlanParseError(file, message)
    },
  }
}

function parseDoc(src: string, ctx: Ctx): Doc {
  const root: Root = fromMarkdown(src, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })
  const [first, ...rest] = root.children
  if (first?.type !== 'heading' || first.depth !== 1) ctx.fail('文档必须以一级标题开头')
  const doc: Doc = { title: plain(first.children), preamble: [], sections: [] }
  for (const node of rest) {
    if (node.type === 'heading') {
      if (node.depth !== 2) ctx.fail(`只支持一级和二级标题：${plain(node.children)}`)
      doc.sections.push({ title: plain(node.children), nodes: [] })
      continue
    }
    const current = doc.sections.at(-1)
    ;(current ? current.nodes : doc.preamble).push(node)
  }
  return doc
}

function section(doc: Doc, title: string, ctx: Ctx): Section {
  const found = doc.sections.find((s) => s.title === title)
  if (!found) ctx.fail(`缺少「${title}」一节`)
  return found
}

export function plain(nodes: readonly (PhrasingContent | Inline)[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
        case 'inlineCode':
        case 'code':
          return n.value
        case 'break':
          return ' '
        default:
          return 'children' in n ? plain(n.children as (PhrasingContent | Inline)[]) : ''
      }
    })
    .join('')
}

function toRich(nodes: readonly PhrasingContent[], ctx: Ctx): Rich {
  const out: Rich = []
  for (const n of nodes) {
    switch (n.type) {
      case 'text':
        out.push({ type: 'text', value: n.value })
        break
      case 'inlineCode':
        out.push({ type: 'code', value: n.value })
        break
      case 'strong':
        out.push({ type: 'strong', children: toRich(n.children, ctx) })
        break
      case 'emphasis':
        out.push({ type: 'em', children: toRich(n.children, ctx) })
        break
      case 'link':
        out.push(toLink(n, ctx))
        break
      case 'break':
        out.push({ type: 'text', value: '\n' })
        break
      default:
        ctx.fail(`不支持的行内元素：${n.type}`)
    }
  }
  return out
}

function normalizePath(path: string, ctx: Ctx): string {
  const out: string[] = []
  for (const seg of path.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') {
      if (!out.length) ctx.fail(`链接超出了计划目录：${path}`)
      out.pop()
    } else {
      out.push(seg)
    }
  }
  return out.join('/')
}

function toLink(n: Link, ctx: Ctx): Inline {
  const children = toRich(n.children, ctx)
  if (/^[a-z][a-z0-9+.-]*:/i.test(n.url)) return { type: 'link', url: n.url, children }
  const hash = n.url.indexOf('#')
  const pathPart = hash === -1 ? n.url : n.url.slice(0, hash)
  const anchor = hash === -1 ? undefined : decodeURIComponent(n.url.slice(hash + 1))
  const dir = ctx.file.includes('/') ? ctx.file.slice(0, ctx.file.lastIndexOf('/')) : ''
  const resolved = pathPart ? normalizePath(`${dir}/${pathPart}`, ctx) : ctx.file
  const { repo, branch, planDir } = ctx.opts
  const kind = resolved.endsWith('.md') ? 'blob' : 'tree'
  const url = `${repo}/${kind}/${branch}/${planDir}/${resolved}${anchor ? `#${anchor}` : ''}`
  const doc = (Object.keys(DOC_FILES) as DocKey[]).find((k) => DOC_FILES[k] === resolved)
  return doc ? { type: 'link', url, target: { doc, anchor }, children } : { type: 'link', url, children }
}

function labeledParts(nodes: readonly PhrasingContent[], ctx: Ctx): Labeled | null {
  const [first, second, ...rest] = nodes
  if (first?.type !== 'strong' || second?.type !== 'text' || !second.value.startsWith('：')) return null
  const remainder = second.value.slice(1)
  const tail: PhrasingContent[] = remainder ? [{ type: 'text', value: remainder } satisfies Text, ...rest] : rest
  return { label: plain(first.children), text: toRich(tail, ctx) }
}

function labeled(node: RootContent | undefined, ctx: Ctx): Labeled | null {
  return node?.type === 'paragraph' ? labeledParts(node.children, ctx) : null
}

function paragraph(node: RootContent | undefined, ctx: Ctx, what: string): Rich {
  if (node?.type !== 'paragraph') ctx.fail(`${what}应该是一个段落`)
  return toRich(node.children, ctx)
}

function listItems(node: RootContent | undefined, ctx: Ctx, what: string): Rich[] {
  if (node?.type !== 'list') ctx.fail(`${what}应该是一个列表`)
  return node.children.map((item) => {
    const [para, ...more] = item.children
    if (para?.type !== 'paragraph' || more.length) ctx.fail(`${what}的每一项都应该是单个段落`)
    return toRich(para.children, ctx)
  })
}

function labeledList(node: RootContent | undefined, ctx: Ctx, what: string): Labeled[] {
  if (node?.type !== 'list') ctx.fail(`${what}应该是一个列表`)
  return node.children.map((item) => {
    const para = item.children[0]
    const parts = para?.type === 'paragraph' ? labeledParts(para.children, ctx) : null
    if (!parts || item.children.length !== 1) ctx.fail(`${what}的每一项都应该是“**标签**：内容”`)
    return parts
  })
}

function hours(text: string, ctx: Ctx, what: string): HourRange {
  const m = HOURS_RE.exec(text)
  if (!m) ctx.fail(`${what}里找不到“N～M 小时”形式的投入：${text}`)
  return { low: Number(m[1]), high: Number(m[2]) }
}

function hashId(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

function assertUniqueIds(ids: string[], ctx: Ctx, what: string) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) ctx.fail(`${what}里有两项内容完全相同`)
    seen.add(id)
  }
}

function stripTrailing(text: Rich, re: RegExp): RegExpExecArray | null {
  const last = text.at(-1)
  if (last?.type !== 'text') return null
  const m = re.exec(last.value)
  if (!m) return null
  const value = last.value.slice(0, m.index).trimEnd()
  if (value) text[text.length - 1] = { type: 'text', value }
  else text.pop()
  return m
}

function table(node: RootContent | undefined, ctx: Ctx, header: string[] | null, what: string) {
  if (node?.type !== 'table') ctx.fail(`${what}应该是一个表格`)
  const [head, ...body] = (node as Table).children
  const cols = head.children.map((cell) => plain(cell.children))
  if (header && cols.join('|') !== header.join('|')) {
    ctx.fail(`${what}的表头应该是「${header.join(' | ')}」，实际是「${cols.join(' | ')}」`)
  }
  const rows = body.map((row) => {
    if (row.children.length !== cols.length) ctx.fail(`${what}有一行的列数和表头不一致`)
    return row.children.map((cell) => toRich(cell.children, ctx))
  })
  return { header: cols, rows }
}

function taskList(node: List, scope: string, ctx: Ctx): Task[] {
  return node.children.map((item) => {
    if (item.checked === null || item.checked === undefined) ctx.fail(`「${scope}」的任务列表里混入了普通列表项`)
    const [para, ...more] = item.children
    if (para?.type !== 'paragraph') ctx.fail(`「${scope}」有一个任务不是以段落开头`)
    const text = toRich(para.children, ctx)
    const hoursMatch = stripTrailing(text, /（(\d+～\d+ 小时)）$/)
    const optional = stripTrailing(text, /（选做）$/) !== null
    const details = more.flatMap((child) => listItems(child, ctx, `「${scope}」的任务说明`))
    return {
      id: hashId(`${scope}|${plain(text)}`),
      text,
      details,
      optional,
      hours: hoursMatch?.[1],
      checked: item.checked,
    }
  })
}

const STAGE_RE = /^阶段 (\d+)：(.+)$/
const PREP_RE = /^(.+线)（(.+)）$/
const STAGE_FIELDS = ['目标', '预计投入', '出关标准', '产出', '面试时能讲']

function parseStage(sec: Section, ctx: Ctx): Stage {
  const stageMatch = STAGE_RE.exec(sec.title)
  const prepMatch = stageMatch ? null : PREP_RE.exec(sec.title)
  if (!stageMatch && !prepMatch) ctx.fail(`无法识别的阶段标题：${sec.title}`)
  const fields = new Map<string, Rich>()
  const tasks: Task[] = []
  const scope = stageMatch ? `s${stageMatch[1]}` : 'prep'
  for (const node of sec.nodes) {
    const field = labeled(node, ctx)
    if (field) {
      if (!STAGE_FIELDS.includes(field.label)) ctx.fail(`「${sec.title}」里有未知的字段：${field.label}`)
      fields.set(field.label, field.text)
    } else if (node.type === 'list') {
      tasks.push(...taskList(node, scope, ctx))
    } else {
      ctx.fail(`「${sec.title}」里有无法识别的内容（${node.type}）`)
    }
  }
  const required = stageMatch ? STAGE_FIELDS : ['预计投入']
  for (const name of required) {
    if (!fields.has(name)) ctx.fail(`「${sec.title}」缺少“**${name}**：”`)
  }
  if (!tasks.length) ctx.fail(`「${sec.title}」没有任务`)
  assertUniqueIds(tasks.map((t) => t.id), ctx, `「${sec.title}」的任务`)
  const effort = fields.get('预计投入')!
  return {
    id: scope,
    label: stageMatch ? `阶段 ${stageMatch[1]}` : '并行',
    title: stageMatch ? stageMatch[2] : prepMatch![1],
    note: prepMatch?.[2],
    goal: fields.get('目标'),
    effort,
    effortHours: hours(plain(effort), ctx, `「${sec.title}」的预计投入`),
    tasks,
    exit: fields.get('出关标准'),
    outputs: fields.get('产出'),
    talkingPoints: fields.get('面试时能讲'),
  }
}

function parseRoadmap(src: string, opts: ParseOptions): Roadmap {
  const ctx: Ctx = makeCtx('roadmap', opts)
  const doc = parseDoc(src, ctx)
  const [intro, notes, ...extra] = doc.preamble
  if (extra.length) ctx.fail('开头只应该有一段说明和一个列表')
  return {
    intro: paragraph(intro, ctx, '开头的说明'),
    notes: listItems(notes, ctx, '开头的约定'),
    stages: doc.sections.map((sec) => parseStage(sec, ctx)),
  }
}

function parseTime(src: string, opts: ParseOptions): TimeEstimate {
  const ctx: Ctx = makeCtx('time', opts)
  const doc = parseDoc(src, ctx)
  const milestonesSec = section(doc, '里程碑', ctx)
  const [mIntro, mTable, convNote, convTable, weeklyHint, ...mExtra] = milestonesSec.nodes
  if (mExtra.length) ctx.fail('「里程碑」一节的内容多于预期')

  const milestoneTable = table(mTable, ctx, ['里程碑', '包含', '累计投入'], '里程碑表')
  const milestones: Milestone[] = milestoneTable.rows.map(([name, includes, total]) => ({
    name: plain(name),
    includes,
    hours: hours(plain(total), ctx, '里程碑表'),
  }))

  const conversion = table(convTable, ctx, ['每周投入', ...milestones.map((m) => m.name)], '换算表')
  const conversionTable = conversion.rows.map(([weekly, ...months]) => {
    const m = /^(\d+) 小时$/.exec(plain(weekly))
    if (!m) ctx.fail(`换算表第一列应该是“N 小时”：${plain(weekly)}`)
    return { weeklyHours: Number(m[1]), months: months.map(plain) }
  })

  const effortTable = table(section(doc, '各阶段的投入', ctx).nodes[0], ctx, ['阶段', '预计投入', '主要花在哪'], '各阶段投入表')
  const stageEfforts: StageEffort[] = effortTable.rows.map(([name, total, breakdown]) => ({
    name: plain(name),
    hours: hours(plain(total), ctx, '各阶段投入表'),
    breakdown,
  }))

  const assumptionsSec = section(doc, '估算的前提', ctx)
  return {
    intro: paragraph(doc.preamble[0], ctx, '开头的说明'),
    milestonesIntro: paragraph(mIntro, ctx, '「里程碑」的说明'),
    milestones,
    conversionNote: paragraph(convNote, ctx, '换算说明'),
    conversionTable,
    weeklyHint: paragraph(weeklyHint, ctx, '每周投入的提示'),
    stageEfforts,
    assumptionsIntro: paragraph(assumptionsSec.nodes[0], ctx, '「估算的前提」的说明'),
    assumptions: listItems(assumptionsSec.nodes[1], ctx, '「估算的前提」'),
    compress: listItems(section(doc, '怎么压缩', ctx).nodes[0], ctx, '「怎么压缩」'),
  }
}

const PRIORITY_KINDS: [string, PriorityKind][] = [
  ['必须', 'must'],
  ['加分', 'plus'],
  ['差异化', 'edge'],
  ['你的长处', 'strength'],
]

function parseKnowledge(src: string, opts: ParseOptions): KnowledgeMap {
  const ctx: Ctx = makeCtx('knowledge', opts)
  const doc = parseDoc(src, ctx)
  const areas = doc.sections.map((sec): KnowledgeArea => {
    const m = /^(\d+)\. (.+)$/.exec(sec.title)
    if (!m) ctx.fail(`知识领域的标题应该是“N. 名称”：${sec.title}`)
    const [priorityNode, listNode, caption, tableNode, ...extra] = sec.nodes
    if (extra.length) ctx.fail(`「${sec.title}」的内容多于预期`)
    const priority = labeled(priorityNode, ctx)
    if (priority?.label !== '优先级') ctx.fail(`「${sec.title}」应该以“**优先级**：”开头`)
    const kind = PRIORITY_KINDS.find(([prefix]) => plain(priority.text).startsWith(prefix))
    if (!kind) ctx.fail(`「${sec.title}」的优先级无法归类：${plain(priority.text)}`)
    const fields = new Map(labeledList(listNode, ctx, `「${sec.title}」`).map((f) => [f.label, f.text]))
    const field = (name: string) => fields.get(name) ?? ctx.fail(`「${sec.title}」缺少“**${name}**：”`)
    let extraTable: SimpleTable | undefined
    if (caption || tableNode) {
      const t = table(tableNode, ctx, null, `「${sec.title}」的附表`)
      extraTable = { caption: paragraph(caption, ctx, `「${sec.title}」附表的说明`), ...t }
    }
    return {
      id: `k${m[1]}`,
      index: Number(m[1]),
      title: m[2],
      priority: priority.text,
      priorityKind: kind[1],
      depth: field('学到什么程度'),
      practice: field('在 ForgeMesh 里怎么练'),
      resources: field('资料'),
      table: extraTable,
    }
  })
  return { intro: paragraph(doc.preamble[0], ctx, '开头的说明'), areas }
}

function parseFeatures(src: string, opts: ParseOptions): Features {
  const ctx: Ctx = makeCtx('features', opts)
  const doc = parseDoc(src, ctx)
  const [intro, statusNode] = doc.preamble
  const status = paragraph(statusNode, ctx, '现状说明')
  const first = status[0]
  if (first?.type !== 'text' || !first.value.startsWith('现状：')) ctx.fail('第二段应该以“现状：”开头')
  status[0] = { type: 'text', value: first.value.slice('现状：'.length) }
  const header = ['功能', '路线图编号', '为什么值得做', '验收标准']
  const rows = (title: string, tier: Feature['tier']): Feature[] =>
    table(section(doc, title, ctx).nodes[0], ctx, header, `「${title}」表`).rows.map(([name, roadmap, why, acceptance]) => ({
      id: hashId(plain(name)),
      name,
      roadmap,
      why,
      acceptance,
      tier,
    }))
  const features = [...rows('必做', 'must'), ...rows('选做', 'optional')]
  assertUniqueIds(features.map((f) => f.id), ctx, '功能清单')
  return {
    intro: paragraph(intro, ctx, '开头的说明'),
    status,
    features,
    deferred: paragraph(section(doc, '暂缓', ctx).nodes[0], ctx, '「暂缓」'),
  }
}

function parseQuestions(src: string, opts: ParseOptions): Questions {
  const ctx: Ctx = makeCtx('questions', opts)
  const doc = parseDoc(src, ctx)
  const groups = doc.sections.map((sec, i): QuestionGroup => {
    const [listNode, ...extra] = sec.nodes
    if (listNode?.type !== 'list' || extra.length) ctx.fail(`「${sec.title}」应该只包含一个题目列表`)
    const questions = taskList(listNode, sec.title, ctx).map((task) => {
      const [hint, ...more] = task.details
      const first = hint?.[0]
      if (more.length || first?.type !== 'text' || !first.value.startsWith('线索：')) {
        ctx.fail(`「${sec.title}」的每道题下面应该正好有一条“线索：”`)
      }
      const rest = first.value.slice('线索：'.length)
      return {
        id: task.id,
        text: task.text,
        hint: rest ? [{ type: 'text' as const, value: rest }, ...hint.slice(1)] : hint.slice(1),
        checked: task.checked,
      }
    })
    return { id: `g${i + 1}`, title: sec.title, questions }
  })
  return { intro: paragraph(doc.preamble[0], ctx, '开头的说明'), groups }
}

function parseOverview(src: string, opts: ParseOptions): Overview {
  const ctx: Ctx = makeCtx('overview', opts)
  const doc = parseDoc(src, ctx)
  const [intro, facts] = doc.preamble
  return {
    title: doc.title,
    intro: paragraph(intro, ctx, '开头的说明'),
    facts: labeledList(facts, ctx, '开头的要点'),
    reminders: labeledList(section(doc, '两点提醒', ctx).nodes[0], ctx, '「两点提醒」'),
  }
}

export function parsePlan(sources: Record<DocKey, string>, opts: ParseOptions): Plan {
  const base = `${opts.repo}/%s/${opts.branch}/${opts.planDir}`
  const docs = Object.fromEntries(
    (Object.keys(DOC_FILES) as DocKey[]).map((key) => [
      key,
      {
        view: `${base.replace('%s', 'blob')}/${DOC_FILES[key]}`,
        edit: `${base.replace('%s', 'edit')}/${DOC_FILES[key]}`,
      },
    ]),
  ) as Plan['links']['docs']
  return {
    overview: parseOverview(sources.overview, opts),
    roadmap: parseRoadmap(sources.roadmap, opts),
    time: parseTime(sources.time, opts),
    knowledge: parseKnowledge(sources.knowledge, opts),
    features: parseFeatures(sources.features, opts),
    questions: parseQuestions(sources.questions, opts),
    links: { repo: opts.repo, home: base.replace('%s', 'tree'), docs },
  }
}
