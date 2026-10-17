import { CircleCheck, CirclePause, Radar, Sparkles } from 'lucide-react'
import { LabeledBlock } from '@/components/labeled-block'
import { RichText } from '@/components/rich-text'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePersistentState } from '@/hooks/use-persistent-state'
import type { Feature, Features } from '@/plan/types'

type Filter = 'all' | Feature['tier']

const TIER_LABEL: Record<Feature['tier'], string> = { must: '必做', optional: '选做' }

export function FeaturesView({ features }: { features: Features }) {
  const [filter, setFilter] = usePersistentState<Filter>('fm-plan:v1:feature-filter', 'all')
  const count = (tier: Feature['tier']) => features.features.filter((f) => f.tier === tier).length
  const ranked = features.features.map((feature, i) => ({ feature, rank: i + 1 }))
  const shown = ranked.filter(({ feature }) => filter === 'all' || feature.tier === filter)

  return (
    <div className="space-y-6">
      <Card size="sm" className="bg-primary/5 ring-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-semibold">
            <Radar aria-hidden className="size-4 text-primary" />
            现状
          </CardTitle>
        </CardHeader>
        <CardContent className="leading-relaxed">
          <RichText nodes={features.status} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          <RichText nodes={features.intro} />
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={filter}
          onValueChange={(value) => value && setFilter(value as Filter)}
          aria-label="按必做和选做筛选"
        >
          <ToggleGroupItem value="all" className="px-3">
            全部 {features.features.length}
          </ToggleGroupItem>
          <ToggleGroupItem value="must" className="px-3">
            必做 {count('must')}
          </ToggleGroupItem>
          <ToggleGroupItem value="optional" className="px-3">
            选做 {count('optional')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ol className="space-y-3">
        {shown.map(({ feature, rank }) => (
          <li key={feature.id}>
            <Card size="sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                    {rank}
                  </span>
                  <CardTitle className="text-base font-semibold">
                    <RichText nodes={feature.name} />
                  </CardTitle>
                  <Badge variant={feature.tier === 'must' ? 'default' : 'outline'}>{TIER_LABEL[feature.tier]}</Badge>
                  <Badge variant="secondary" className="tabular-nums">
                    <RichText nodes={feature.roadmap} />
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <LabeledBlock icon={Sparkles} label="为什么值得做" text={feature.why} />
                <LabeledBlock icon={CircleCheck} label="验收标准" text={feature.acceptance} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <Card size="sm" className="bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-semibold">
            <CirclePause aria-hidden className="size-4 text-muted-foreground" />
            暂缓
          </CardTitle>
        </CardHeader>
        <CardContent className="leading-relaxed text-muted-foreground">
          <RichText nodes={features.deferred} />
        </CardContent>
      </Card>
    </div>
  )
}
