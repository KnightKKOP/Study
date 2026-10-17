import { ArrowUpRight } from 'lucide-react'
import { resolveTarget } from '@/lib/navigation'
import { usePlanState } from '@/lib/plan-state'
import type { Inline, Rich } from '@/plan/types'

const linkClass = 'font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary'

export function RichText({ nodes, className }: { nodes: Rich; className?: string }) {
  return (
    <span className={className}>
      {nodes.map((node, i) => (
        <InlineNode key={i} node={node} />
      ))}
    </span>
  )
}

function InlineNode({ node }: { node: Inline }) {
  const { navigate } = usePlanState()
  switch (node.type) {
    case 'text':
      return node.value
    case 'code':
      return (
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground/90 [overflow-wrap:anywhere]">
          {node.value}
        </code>
      )
    case 'strong':
      return (
        <strong className="font-semibold text-foreground">
          <RichText nodes={node.children} />
        </strong>
      )
    case 'em':
      return (
        <em>
          <RichText nodes={node.children} />
        </em>
      )
    case 'link': {
      const { target } = node
      if (target) {
        return (
          <a
            href={`#${resolveTarget(target).tab}`}
            className={linkClass}
            onClick={(event) => {
              event.preventDefault()
              navigate(target)
            }}
          >
            <RichText nodes={node.children} />
          </a>
        )
      }
      return (
        <a href={node.url} target="_blank" rel="noreferrer" className={linkClass}>
          <RichText nodes={node.children} />
          <ArrowUpRight aria-hidden className="ml-0.5 inline size-3 align-baseline" />
        </a>
      )
    }
  }
}
