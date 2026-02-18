import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle(): React.JSX.Element {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('apexrec-theme')
    if (saved === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = (): void => {
    const newValue = !isDark
    setIsDark(newValue)
    const themeValue = newValue ? 'dark' : 'light'
    if (newValue) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('apexrec-theme', themeValue)
    window.api.settings.set('theme', themeValue)
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
