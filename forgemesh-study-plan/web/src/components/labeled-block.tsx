import type { LucideIcon } from 'lucide-react'
import { RichText } from '@/components/rich-text'
import { cn } from '@/lib/utils'
import type { Rich } from '@/plan/types'

export function LabeledBlock({
  icon: Icon,
  label,
  text,
  className,
}: {
  icon: LucideIcon
  label: string
  text: Rich
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </div>
      <p className="leading-relaxed">
        <RichText nodes={text} />
      </p>
    </div>
  )
}
