import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { LogoIcon } from './logo-icon'
import { usePractitionerStore } from '../../stores/practitioner.store'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FolderOpen,
  Search,
  Maximize2,
  User,
  Settings,
  ChevronDown,
  Check
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/register', label: 'Register', icon: UserPlus },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/portfolio', label: 'Portfolio', icon: FolderOpen },
  { to: '/search', label: 'Search', icon: Search }
]

export function Navbar(): React.JSX.Element {
  const { practitioners, activePractitioner, loadPractitioners, setActivePractitioner } =
    usePractitionerStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPractitioners()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showDropdown])

  return (
    <header className="relative z-10 border-b border-border/60 bg-gradient-to-b from-surface-1/90 to-surface-1/80 backdrop-blur-xl">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.01] pointer-events-none" />

      {/* Drag region for macOS */}
      <div className="drag-region h-8 flex items-center px-4">
        <div className="pl-16" />
      </div>

      <div className="relative flex items-center justify-between px-6 pb-3">
        {/* Logo */}
        <div className="no-drag flex items-center gap-1.5">
          <div className="flex items-center gap-2.5">
            <LogoIcon className="h-7 w-7 text-foreground" />
            <span className="text-lg font-extralight tracking-[0.25em] text-primary">APEX</span>
            <span className="text-lg font-semibold tracking-[0.25em] text-foreground">REC</span>
          </div>
          <div className="ml-3 h-5 w-px bg-border/60" />
        </div>

        {/* Navigation */}
        <nav className="no-drag flex items-center gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2 px-3.5 py-2 text-[13px] rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-primary font-medium bg-primary/[0.08]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-3 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="no-drag flex items-center gap-1.5">
          <button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200"
            title="Fullscreen"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen()
              } else {
                document.documentElement.requestFullscreen()
              }
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'p-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-primary bg-primary/[0.08]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )
            }
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </NavLink>

          <ThemeToggle />

          <div className="ml-1 h-5 w-px bg-border/60" />

          {/* Practitioner switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 ml-1 px-3 py-1.5 rounded-lg text-[13px] hover:bg-accent/60 transition-all duration-200 group"
            >
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-foreground font-medium max-w-[120px] truncate">
                {activePractitioner?.name || 'Practitioner'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                  showDropdown && 'rotate-180'
                )}
              />
            </button>

            {showDropdown && practitioners.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl p-1.5 shadow-premium-lg z-50 border border-border/50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pt-1.5 pb-2">
                  Switch practitioner
                </p>
                {practitioners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePractitioner(p.id)
                      setShowDropdown(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150',
                      activePractitioner?.id === p.id
                        ? 'text-primary bg-primary/[0.08]'
                        : 'text-foreground hover:bg-accent/60'
                    )}
                  >
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0',
                        activePractitioner?.id === p.id
                          ? 'bg-primary/20 text-primary'
                          : 'bg-accent/80 text-muted-foreground'
                      )}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-left truncate">{p.name}</span>
                    {activePractitioner?.id === p.id && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
