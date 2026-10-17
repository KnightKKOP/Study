import { useEffect } from 'react'
import { usePersistentState } from './use-persistent-state'

type Theme = 'light' | 'dark'

const systemTheme = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

export function useTheme() {
  // The inline script in index.html reads the same key to avoid a flash on load.
  const [saved, setSaved] = usePersistentState<Theme | null>('fm-plan:v1:theme', null)
  const theme = saved ?? systemTheme()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return { theme, toggleTheme: () => setSaved(theme === 'dark' ? 'light' : 'dark') }
}
