import { BookOpen, Gauge, Hammer } from 'lucide-react'
import { LabeledBlock } from '@/components/labeled-block'
import { RichText } from '@/components/rich-text'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { PRIORITY } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { richPlain } from '@/plan/rich'
import type { KnowledgeMap, PriorityKind, SimpleTable } from '@/plan/types'

type Filter = 'all' | PriorityKind

export function KnowledgeView({ knowledge }: { knowledge: KnowledgeMap }) {
  const [filter, setFilter] = usePersistentState<Filter>('fm-plan:v1:knowledge-filter', 'all')
  const kinds = (Object.keys(PRIORITY) as PriorityKind[]).filter((k) => knowledge.areas.some((a) => a.priorityKind === k))
  const areas = knowledge.areas.filter((a) => filter === 'all' || a.priorityKind === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          <RichText nodes={knowledge.intro} />
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={filter}
          onValueChange={(value) => value && setFilter(value as Filter)}
          aria-label="按优先级筛选"
        >
          <ToggleGroupItem value="all" className="px-3">
            全部
          </ToggleGroupItem>
          {kinds.map((kind) => (
            <ToggleGroupItem key={kind} value={kind} className="px-3">
              {PRIORITY[kind].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        {areas.map((area) => (
          <Card key={area.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary tabular-nums">
                  {area.index}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <CardTitle className="text-base leading-snug font-semibold">{area.title}</CardTitle>
                  <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', PRIORITY[area.priorityKind].className)}>
                    {richPlain(area.priority).replace(/。$/, '')}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="gap-4">
              <LabeledBlock icon={Gauge} label="学到什么程度" text={area.depth} />
              <LabeledBlock icon={Hammer} label="在 ForgeMesh 里怎么练" text={area.practice} />
              <LabeledBlock icon={BookOpen} label="资料" text={area.resources} />
              {area.table && <MiniTable table={area.table} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MiniTable({ table }: { table: SimpleTable }) {
  return (
    <div className="space-y-2 rounded-lg bg-muted/60 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        <RichText nodes={table.caption} />
      </p>
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {table.header.map((h) => (
              <th key={h} className="pb-1.5 text-left font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={cn('py-1.5 align-top leading-relaxed', j === 0 && 'pr-3')}>
                  <RichText nodes={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
