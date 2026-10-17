import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { DOC_FILES, parsePlan, type ParseOptions } from './src/plan/parse.ts'
import type { DocKey } from './src/plan/types.ts'

const VIRTUAL_ID = 'virtual:plan'
const RESOLVED_ID = `\0${VIRTUAL_ID}`

export function loadPlan(planRoot: string, opts: ParseOptions) {
  const sources = Object.fromEntries(
    (Object.keys(DOC_FILES) as DocKey[]).map((key) => [key, readFileSync(resolve(planRoot, DOC_FILES[key]), 'utf8')]),
  ) as Record<DocKey, string>
  return parsePlan(sources, opts)
}

export function planData(planRoot: string, opts: ParseOptions): Plugin {
  const files = Object.values(DOC_FILES).map((file) => resolve(planRoot, file))
  return {
    name: 'forgemesh-plan-data',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      for (const file of files) this.addWatchFile(file)
      return `export default ${JSON.stringify(loadPlan(planRoot, opts))}`
    },
    configureServer(server) {
      server.watcher.add(files)
      server.watcher.on('change', (changed) => {
        if (!files.includes(resolve(changed))) return
        const mod = server.environments.client.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.environments.client.moduleGraph.invalidateModule(mod)
        server.environments.client.hot.send({ type: 'full-reload' })
      })
    },
  }
}
