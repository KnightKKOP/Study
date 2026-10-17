import type { Rich } from './types.ts'

export function richPlain(nodes: Rich): string {
  return nodes.map((n) => (n.type === 'text' || n.type === 'code' ? n.value : richPlain(n.children))).join('')
}
