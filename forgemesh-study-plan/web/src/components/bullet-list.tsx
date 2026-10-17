import { RichText } from '@/components/rich-text'
import { cn } from '@/lib/utils'
import type { Rich } from '@/plan/types'

export function BulletList({ items, className }: { items: Rich[]; className?: string }) {
  return (
    <ul className={cn('space-y-2 leading-relaxed', className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span className="min-w-0">
            <RichText nodes={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}
