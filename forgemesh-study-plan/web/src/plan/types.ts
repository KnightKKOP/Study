export type DocKey = 'overview' | 'roadmap' | 'time' | 'knowledge' | 'features' | 'questions'

export interface LinkTarget {
  doc: DocKey
  anchor?: string
}

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'link'; url: string; target?: LinkTarget; children: Inline[] }

export type Rich = Inline[]

export interface HourRange {
  low: number
  high: number
}

export interface Labeled {
  label: string
  text: Rich
}

export interface Task {
  id: string
  text: Rich
  details: Rich[]
  optional: boolean
  hours?: string
  checked: boolean
}

export interface Stage {
  id: string
  label: string
  title: string
  note?: string
  goal?: Rich
  effort: Rich
  effortHours: HourRange
  tasks: Task[]
  exit?: Rich
  outputs?: Rich
  talkingPoints?: Rich
}

export interface Roadmap {
  intro: Rich
  notes: Rich[]
  stages: Stage[]
}

export interface Milestone {
  name: string
  includes: Rich
  hours: HourRange
}

export interface StageEffort {
  name: string
  hours: HourRange
  breakdown: Rich
}

export interface TimeEstimate {
  intro: Rich
  milestonesIntro: Rich
  milestones: Milestone[]
  conversionNote: Rich
  conversionTable: { weeklyHours: number; months: string[] }[]
  weeklyHint: Rich
  stageEfforts: StageEffort[]
  assumptionsIntro: Rich
  assumptions: Rich[]
  compress: Rich[]
}

export type PriorityKind = 'must' | 'plus' | 'edge' | 'strength'

export interface SimpleTable {
  caption: Rich
  header: string[]
  rows: Rich[][]
}

export interface KnowledgeArea {
  id: string
  index: number
  title: string
  priority: Rich
  priorityKind: PriorityKind
  depth: Rich
  practice: Rich
  resources: Rich
  table?: SimpleTable
}

export interface KnowledgeMap {
  intro: Rich
  areas: KnowledgeArea[]
}

export interface Feature {
  id: string
  name: Rich
  roadmap: Rich
  why: Rich
  acceptance: Rich
  tier: 'must' | 'optional'
}

export interface Features {
  intro: Rich
  status: Rich
  features: Feature[]
  deferred: Rich
}

export interface Question {
  id: string
  text: Rich
  hint: Rich
  checked: boolean
}

export interface QuestionGroup {
  id: string
  title: string
  questions: Question[]
}

export interface Questions {
  intro: Rich
  groups: QuestionGroup[]
}

export interface Overview {
  title: string
  intro: Rich
  facts: Labeled[]
  reminders: Labeled[]
}

export interface Plan {
  overview: Overview
  roadmap: Roadmap
  time: TimeEstimate
  knowledge: KnowledgeMap
  features: Features
  questions: Questions
  links: {
    repo: string
    home: string
    docs: Record<DocKey, { view: string; edit: string }>
  }
}
