import { Check, ChevronDown, Clock, Flag, Info, MessageSquareQuote, Package, ShieldAlert } from 'lucide-react'
import { BulletList } from '@/components/bullet-list'
import { LabeledBlock } from '@/components/labeled-block'
import { ResetProgressButton } from '@/components/reset-progress-button'
import { RichText } from '@/components/rich-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { usePlanState } from '@/lib/plan-state'
import { formatRange } from '@/lib/time'
import { toneFor } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { richPlain } from '@/plan/rich'
import type { Labeled, Roadmap, Stage, Task } from '@/plan/types'

export function RoadmapView({ roadmap, reminders }: { roadmap: Roadmap; reminders: Labeled[] }) {
  const [requiredOnly, setRequiredOnly] = usePersistentState('fm-plan:v1:required-only', false)
  const [collapsed, setCollapsed] = usePersistentState<string[]>('fm-plan:v1:collapsed', [])
  const { isDone } = usePlanState()

  const visibleTasks = (stage: Stage) => stage.tasks.filter((t) => !requiredOnly || !t.optional)
  const shown = roadmap.stages.flatMap(visibleTasks)
  const shownDone = shown.filter((t) => isDone('task', t.id, t.checked)).length
  const toggleStage = (id: string) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Info aria-hidden className="size-4 text-primary" />
              怎么用这份路线
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3 text-muted-foreground">
            <p className="leading-relaxed">
              <RichText nodes={roadmap.intro} />
            </p>
            <BulletList items={roadmap.notes} />
          </CardContent>
        </Card>
        <Card id="reminders" size="sm" className="bg-amber-50/80 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <ShieldAlert aria-hidden className="size-4" />
              两点提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {reminders.map((r) => (
              <div key={r.label} className="space-y-1">
                <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">{r.label}</div>
                <p className="leading-relaxed text-amber-950/80 dark:text-amber-100/80">
                  <RichText nodes={r.text} />
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          已完成 <span className="font-semibold text-foreground tabular-nums">{shownDone}</span> / {shown.length} 项
          {requiredOnly ? '必做' : ''}任务
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="mr-2 flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={requiredOnly} onCheckedChange={setRequiredOnly} />
            只看必做
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(collapsed.length ? [] : roadmap.stages.map((s) => s.id))}
          >
            {collapsed.length ? '全部展开' : '全部折叠'}
          </Button>
          <ResetProgressButton />
        </div>
      </div>

      <ol>
        {roadmap.stages.map((stage, i) => (
          <StageItem
            key={stage.id}
            stage={stage}
            tasks={visibleTasks(stage)}
            last={i === roadmap.stages.length - 1}
            collapsed={collapsed.includes(stage.id)}
            onToggle={() => toggleStage(stage.id)}
          />
        ))}
      </ol>
    </div>
  )
}

function StageItem({
  stage,
  tasks,
  last,
  collapsed,
  onToggle,
}: {
  stage: Stage
  tasks: Task[]
  last: boolean
  collapsed: boolean
  onToggle: () => void
}) {
  const { isDone } = usePlanState()
  const tone = toneFor(stage.id)
  const done = tasks.filter((t) => isDone('task', t.id, t.checked)).length
  const complete = tasks.length > 0 && done === tasks.length
  const range = formatRange(stage.effortHours, '小时')
  const effortNote = richPlain(stage.effort).replace(range, '').trim()
  const contentId = `stage-${stage.id}`

  return (
    <li className="relative pb-5 pl-9 last:pb-0 sm:pl-12">
      {!last && <span aria-hidden className="absolute top-9 bottom-0 left-[11px] w-px bg-border sm:left-[15px]" />}
      <span
        aria-hidden
        className={cn(
          'absolute top-6 left-0 flex size-6 items-center justify-center rounded-full ring-4 ring-background sm:left-1',
          complete ? 'bg-emerald-500' : tone.dot,
        )}
      >
        {complete ? <Check className="size-3.5 text-white" strokeWidth={3} /> : <span className="size-2 rounded-full bg-white/90" />}
      </span>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', tone.chip)}>{stage.label}</span>
            <Badge variant="outline">
              <Clock data-icon="inline-start" />
              {range}
            </Badge>
            {stage.note && <Badge variant="secondary">{stage.note}</Badge>}
          </div>
          <CardTitle className="mt-1 text-lg font-semibold">{stage.title}</CardTitle>
          {stage.goal && (
            <CardDescription className="col-start-1 leading-relaxed">
              <RichText nodes={stage.goal} />
            </CardDescription>
          )}
          {effortNote && <p className="col-start-1 text-xs text-muted-foreground">{effortNote}</p>}
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-expanded={!collapsed}
              aria-controls={contentId}
              aria-label={collapsed ? `展开${stage.label}` : `折叠${stage.label}`}
            >
              <ChevronDown className={cn('transition-transform', collapsed && '-rotate-90')} />
            </Button>
          </CardAction>
          <div className="col-span-full mt-2 flex items-center gap-3">
            <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} className="flex-1" aria-label={`${stage.label}的进度`} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {done}/{tasks.length}
            </span>
          </div>
        </CardHeader>
        {!collapsed && (
          <CardContent id={contentId} className="gap-5">
            <ul className="divide-y divide-border/70">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
            {stage.exit && (
              <div className="grid gap-4 rounded-lg bg-muted/60 p-4 md:grid-cols-3">
                <LabeledBlock icon={Flag} label="出关标准" text={stage.exit} />
                {stage.outputs && <LabeledBlock icon={Package} label="产出" text={stage.outputs} />}
                {stage.talkingPoints && <LabeledBlock icon={MessageSquareQuote} label="面试时能讲" text={stage.talkingPoints} />}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </li>
  )
}

function TaskItem({ task }: { task: Task }) {
  const { isDone, toggle } = usePlanState()
  const done = isDone('task', task.id, task.checked)
  const id = `task-${task.id}`

  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <Checkbox id={id} checked={done} onCheckedChange={() => toggle('task', task.id, task.checked)} className="mt-[3px]" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <label
          htmlFor={id}
          className={cn('block cursor-pointer leading-relaxed', done && 'text-muted-foreground line-through decoration-muted-foreground/40')}
        >
          <RichText nodes={task.text} />
          {task.optional && (
            <Badge variant="outline" className="ml-2 align-text-bottom">
              选做
            </Badge>
          )}
          {task.hours && (
            <Badge variant="secondary" className="ml-2 align-text-bottom">
              {task.hours}
            </Badge>
          )}
        </label>
        {task.details.length > 0 && (
          <ul className="space-y-1">
            {task.details.map((detail, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-muted-foreground">
                <RichText nodes={detail} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
