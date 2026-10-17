import { Blocks, CalendarClock, FileText, MessagesSquare, Milestone, Network, type LucideIcon } from 'lucide-react'
import { useCallback } from 'react'
import plan from 'virtual:plan'
import { PlanStateProvider } from '@/components/plan-state-provider'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHashTab } from '@/hooks/use-hash-tab'
import { useTheme } from '@/hooks/use-theme'
import { isTab, resolveTarget, TABS, type TabKey } from '@/lib/navigation'
import type { LinkTarget } from '@/plan/types'
import { FeaturesView } from '@/views/features-view'
import { KnowledgeView } from '@/views/knowledge-view'
import { QuestionsView } from '@/views/questions-view'
import { RoadmapView } from '@/views/roadmap-view'
import { TimeView } from '@/views/time-view'

const TAB_META: Record<TabKey, { label: string; short: string; icon: LucideIcon }> = {
  roadmap: { label: '学习路线', short: '路线', icon: Milestone },
  time: { label: '时间估算', short: '时间', icon: CalendarClock },
  knowledge: { label: '知识地图', short: '知识', icon: Network },
  features: { label: '功能清单', short: '功能', icon: Blocks },
  questions: { label: '项目深挖题', short: '深挖题', icon: MessagesSquare },
}

const repoName = new URL(plan.links.repo).pathname.slice(1)

// `link` follows an in-page link; `tab` is a tab click, which only jumps back up when the
// reader has already scrolled past the start of the content.
function scrollToAnchor(anchor: string, reason: 'link' | 'tab') {
  // Wait for React to commit the newly selected tab before measuring.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (anchor === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const el = document.getElementById(anchor)
      if (!el) return
      if (anchor === 'content') {
        const top = el.getBoundingClientRect().top + window.scrollY
        if (reason === 'tab' && window.scrollY <= top) return
        window.scrollTo({ top, behavior: reason === 'tab' ? 'instant' : 'smooth' })
        return
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }),
  )
}

export default function App() {
  const [tab, setTab] = useHashTab()
  const { theme, toggleTheme } = useTheme()

  const navigate = useCallback(
    (target: LinkTarget) => {
      const { tab: next, anchor } = resolveTarget(target)
      setTab(next)
      scrollToAnchor(anchor, 'link')
    },
    [setTab],
  )

  const selectTab = (value: string) => {
    if (!isTab(value)) return
    setTab(value)
    scrollToAnchor('content', 'tab')
  }

  const openTime = () => {
    setTab('time')
    scrollToAnchor('content', 'link')
  }

  return (
    <PlanStateProvider navigate={navigate}>
      <div className="flex min-h-svh flex-col">
        <SiteHeader plan={plan} theme={theme} onToggleTheme={toggleTheme} onOpenTime={openTime} />

        <main id="content" className="flex-1">
          <Tabs value={tab} onValueChange={selectTab} className="gap-0">
            <div className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-md">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
                <TabsList aria-label="计划内容" className="no-scrollbar w-full max-w-full justify-start overflow-x-auto sm:w-fit">
                  {TABS.map((key) => {
                    const { label, short, icon: Icon } = TAB_META[key]
                    return (
                      <TabsTrigger key={key} value={key} className="px-2.5">
                        <Icon aria-hidden className="hidden sm:block" />
                        <span className="sm:hidden">{short}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                <Button variant="ghost" size="sm" asChild className="hidden shrink-0 text-muted-foreground md:inline-flex">
                  <a href={plan.links.docs[tab].view} target="_blank" rel="noreferrer">
                    <FileText data-icon="inline-start" />
                    Markdown 原文
                  </a>
                </Button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">
              <TabsContent value="roadmap">
                <RoadmapView roadmap={plan.roadmap} reminders={plan.overview.reminders} />
              </TabsContent>
              <TabsContent value="time">
                <TimeView time={plan.time} stages={plan.roadmap.stages} />
              </TabsContent>
              <TabsContent value="knowledge">
                <KnowledgeView knowledge={plan.knowledge} />
              </TabsContent>
              <TabsContent value="features">
                <FeaturesView features={plan.features} />
              </TabsContent>
              <TabsContent value="questions">
                <QuestionsView questions={plan.questions} />
              </TabsContent>
            </div>
          </Tabs>
        </main>

        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
            <p className="max-w-3xl">
              内容由仓库里的 Markdown 文档生成。勾选进度只保存在当前浏览器；想长期保存，就在 Markdown 里把{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">- [ ]</code> 改成{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">- [x]</code>，网站重新发布后会显示为已完成。
            </p>
            <a
              href={plan.links.home}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
            >
              <FileText aria-hidden className="size-3.5" />
              {repoName}
            </a>
          </div>
        </footer>
      </div>
    </PlanStateProvider>
  )
}
