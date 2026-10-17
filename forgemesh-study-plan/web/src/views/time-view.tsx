import { BulletList } from '@/components/bullet-list'
import { RangeChart } from '@/components/range-chart'
import { RichText } from '@/components/rich-text'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePlanState } from '@/lib/plan-state'
import { formatRange, formatSpan, monthRange, WEEKLY_OPTIONS, weekRange } from '@/lib/time'
import { MILESTONE_TONES, toneFor } from '@/lib/tones'
import { cn } from '@/lib/utils'
import type { Stage, TimeEstimate } from '@/plan/types'

export function TimeView({ time, stages }: { time: TimeEstimate; stages: Stage[] }) {
  const { weekly, setWeekly } = usePlanState()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">每周能投入多少小时？</CardTitle>
          <CardDescription className="leading-relaxed">
            <RichText nodes={time.intro} /> <RichText nodes={time.weeklyHint} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={String(weekly)}
            onValueChange={(value) => value && setWeekly(Number(value))}
            aria-label="每周投入"
            className="max-w-full flex-wrap"
          >
            {WEEKLY_OPTIONS.map((hours) => (
              <ToggleGroupItem
                key={hours}
                value={String(hours)}
                className="px-3 tabular-nums data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {hours} 小时
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {time.milestones.map((m, i) => (
          <Card key={m.name} className="relative">
            <div aria-hidden className={cn('absolute inset-x-0 top-0 h-1', MILESTONE_TONES[i])} />
            <CardHeader>
              <div className="text-xs font-medium text-muted-foreground">里程碑 {i + 1}</div>
              <CardTitle className="text-base font-semibold">{m.name}</CardTitle>
              <CardDescription className="leading-relaxed">
                <RichText nodes={m.includes} />
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatSpan(monthRange(m.hours, weekly))}</span>
                <span className="text-sm text-muted-foreground">个月</span>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {formatRange(weekRange(m.hours, weekly), '周')} · 累计 {formatRange(m.hours, '小时')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-semibold">按每周 {weekly} 小时，三个里程碑大约落在</CardTitle>
          <CardDescription className="leading-relaxed">
            <RichText nodes={time.milestonesIntro} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RangeChart
            unit="个月"
            rows={time.milestones.map((m, i) => {
              const months = monthRange(m.hours, weekly)
              return { key: m.name, label: m.name, ...months, valueLabel: formatRange(months, '个月'), tone: MILESTONE_TONES[i] }
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-semibold">各阶段的投入</CardTitle>
          <CardDescription>条形的两端是预计投入的下限和上限。</CardDescription>
        </CardHeader>
        <CardContent>
          <RangeChart
            unit="小时"
            rows={time.stageEfforts.map((s, i) => ({
              key: s.name,
              label: s.name,
              ...s.hours,
              valueLabel: formatRange(s.hours, '小时'),
              tone: toneFor(stages[i]?.id ?? '').bar,
              detail: (
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  <RichText nodes={s.breakdown} />
                </p>
              ),
            }))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="font-semibold">估算的前提</CardTitle>
            <CardDescription className="leading-relaxed">
              <RichText nodes={time.assumptionsIntro} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulletList items={time.assumptions} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="font-semibold">怎么压缩</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={time.compress} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
