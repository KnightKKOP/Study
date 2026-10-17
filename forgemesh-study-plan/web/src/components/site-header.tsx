import { CalendarClock, Compass, FileText, Flag, Hourglass, ListChecks, Moon, Route, Sun, Target, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { RichText } from '@/components/rich-text'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePlanState } from '@/lib/plan-state'
import { formatRange, monthRange } from '@/lib/time'
import type { Plan } from '@/plan/types'

const FACT_ICONS: LucideIcon[] = [Target, Route, CalendarClock]

function StatCard({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-xl bg-card/90 p-3 shadow-xs ring-1 ring-foreground/10 backdrop-blur sm:p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </div>
      <div className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</div>
      <div className="mt-2 text-xs text-muted-foreground">{children}</div>
    </div>
  )
}

export function SiteHeader({
  plan,
  theme,
  onToggleTheme,
  onOpenTime,
}: {
  plan: Plan
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenTime: () => void
}) {
  const { isDone, weekly } = usePlanState()
  const required = plan.roadmap.stages.flatMap((s) => s.tasks).filter((t) => !t.optional)
  const requiredDone = required.filter((t) => isDone('task', t.id, t.checked)).length
  const questions = plan.questions.groups.flatMap((g) => g.questions)
  const questionsDone = questions.filter((q) => isDone('question', q.id, q.checked)).length
  const [ready, , full] = plan.time.milestones
  const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0)

  return (
    <header id="top" className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-linear-to-b from-indigo-100/80 via-indigo-50/40 to-transparent dark:from-indigo-950/60 dark:via-indigo-950/20" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Compass aria-hidden className="size-4.5" />
            </span>
            <span className="text-sm font-semibold">ForgeMesh 学习计划</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <a href={plan.links.home} target="_blank" rel="noreferrer">
                <FileText data-icon="inline-start" />
                Markdown 版
              </a>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onToggleTheme} aria-label={theme === 'dark' ? '切换到浅色' : '切换到深色'}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
          </div>
        </nav>

        <div className="pt-4 pb-6 sm:pt-10 sm:pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{plan.overview.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
            <RichText nodes={plan.overview.intro} />
          </p>

          {/* Swipeable on phones so the tab bar still lands on the first screen. */}
          <dl className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {plan.overview.facts.map((fact, i) => {
              const Icon = FACT_ICONS[i] ?? Target
              return (
                <div
                  key={fact.label}
                  className="w-[82%] shrink-0 snap-start rounded-xl bg-card/70 p-4 ring-1 ring-foreground/10 backdrop-blur ring-inset sm:w-[60%] md:w-auto"
                >
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Icon aria-hidden className="size-3.5" />
                    {fact.label}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed">
                    <RichText nodes={fact.text} />
                  </dd>
                </div>
              )
            })}
          </dl>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={ListChecks} label="必做任务" value={`${requiredDone} / ${required.length}`}>
              <Progress value={pct(requiredDone, required.length)} aria-label="必做任务进度" />
            </StatCard>
            <StatCard icon={Flag} label="深挖题能讲清" value={`${questionsDone} / ${questions.length}`}>
              <Progress value={pct(questionsDone, questions.length)} aria-label="深挖题进度" />
            </StatCard>
            <StatCard icon={CalendarClock} label={ready.name} value={formatRange(monthRange(ready.hours, weekly), '个月')}>
              按每周 {weekly} 小时 ·{' '}
              <button type="button" onClick={onOpenTime} className="font-medium text-primary hover:underline">
                调整
              </button>
            </StatCard>
            <StatCard icon={Hourglass} label={full.name} value={formatRange(monthRange(full.hours, weekly), '个月')}>
              共 {formatRange(full.hours, '小时')}
            </StatCard>
          </div>
        </div>
      </div>
    </header>
  )
}
