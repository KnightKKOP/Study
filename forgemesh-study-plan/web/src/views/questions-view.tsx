import { Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { RichText } from '@/components/rich-text'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { usePlanState } from '@/lib/plan-state'
import { cn } from '@/lib/utils'
import type { Question, QuestionGroup, Questions } from '@/plan/types'

export function QuestionsView({ questions }: { questions: Questions }) {
  const [showHints, setShowHints] = usePersistentState('fm-plan:v1:show-hints', false)
  const { isDone } = usePlanState()
  const all = questions.groups.flatMap((g) => g.questions)
  const done = all.filter((q) => isDone('question', q.id, q.checked)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl leading-relaxed text-muted-foreground">
          <RichText nodes={questions.intro} />
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            能讲清 <span className="font-semibold text-foreground tabular-nums">{done}</span> / {all.length}
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={showHints} onCheckedChange={setShowHints} />
            显示全部线索
          </label>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        {questions.groups.map((group) => (
          <GroupCard key={group.id} group={group} showHints={showHints} />
        ))}
      </div>
    </div>
  )
}

function GroupCard({ group, showHints }: { group: QuestionGroup; showHints: boolean }) {
  const { isDone } = usePlanState()
  const done = group.questions.filter((q) => isDone('question', q.id, q.checked)).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{group.title}</CardTitle>
        <CardAction>
          <span className="text-xs text-muted-foreground tabular-nums">
            {done}/{group.questions.length}
          </span>
        </CardAction>
        <Progress value={(done / group.questions.length) * 100} className="mt-2" aria-label={`${group.title}的进度`} />
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/70">
          {group.questions.map((q) => (
            <QuestionItem key={q.id} question={q} showHint={showHints} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function QuestionItem({ question, showHint }: { question: Question; showHint: boolean }) {
  const { isDone, toggle } = usePlanState()
  const [open, setOpen] = useState(false)
  const done = isDone('question', question.id, question.checked)
  const id = `question-${question.id}`

  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={done}
          onCheckedChange={() => toggle('question', question.id, question.checked)}
          className="mt-[3px]"
        />
        <label htmlFor={id} className={cn('flex-1 cursor-pointer leading-relaxed', done && 'text-muted-foreground')}>
          <RichText nodes={question.text} />
        </label>
        {!showHint && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="shrink-0 text-muted-foreground"
          >
            <Lightbulb data-icon="inline-start" />
            线索
          </Button>
        )}
      </div>
      {(showHint || open) && (
        <div className="ml-7 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <Lightbulb aria-hidden className="mt-[3px] size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="min-w-0">
            <RichText nodes={question.hint} />
          </span>
        </div>
      )}
    </li>
  )
}
