'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Theme = 'dark' | 'light'

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7" y1="0.5" x2="7" y2="2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7" y1="11.8" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0.5" y1="7" x2="2.2" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11.8" y1="7" x2="13.5" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2.4" y1="2.4" x2="3.6" y2="3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10.4" y1="10.4" x2="11.6" y2="11.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11.6" y1="2.4" x2="10.4" y2="3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3.6" y1="10.4" x2="2.4" y2="11.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.5 9.5A6 6 0 0 1 4.5 1.5a5.5 5.5 0 1 0 8 8z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const initial = stored ?? 'dark'
    setTheme(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  function applyTheme(t: Theme) {
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    localStorage.setItem('theme', next)
  }

  if (!mounted) return <div className="w-7 h-7" />

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'w-7 h-7 flex items-center justify-center',
        'text-offwhite/55 hover:text-offwhite/75',
        'transition-colors duration-250',
        'animate-theme-in'
      )}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
