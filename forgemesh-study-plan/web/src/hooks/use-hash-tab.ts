import { useCallback, useEffect, useState } from 'react'
import { isTab, type TabKey } from '@/lib/navigation'

function readHash(): TabKey {
  const hash = window.location.hash.slice(1)
  return isTab(hash) ? hash : 'roadmap'
}

export function useHashTab() {
  const [tab, setTab] = useState<TabKey>(readHash)

  useEffect(() => {
    const onHashChange = () => setTab(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectTab = useCallback((next: TabKey) => {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
  }, [])

  return [tab, selectTab] as const
}
