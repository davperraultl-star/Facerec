import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  CalendarCheck,
  Activity,
  Clock,
  UserPlus,
  Search,
  Settings,
  ChevronRight,
  TrendingUp
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePractitionerStore } from '../stores/practitioner.store'

interface Patient {
  id: string
  firstName: string
  lastName: string
  createdAt: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric'
  })
}

export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { activePractitioner } = usePractitionerStore()
  const [stats, setStats] = useState({ totalPatients: 0, totalVisits: 0 })
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])

  useEffect(() => {
    window.api.patients.getStats().then(setStats)
    window.api.patients.getRecent(10).then(setRecentPatients)
  }, [])

  const quickActions = [
    {
      icon: UserPlus,
      title: t('nav.register'),
      subtitle: 'New patient',
      to: '/register'
    },
    {
      icon: Users,
      title: t('nav.patients'),
      subtitle: 'Browse all',
      to: '/patients'
    },
    {
      icon: Search,
      title: t('nav.search'),
      subtitle: 'Case search',
      to: '/search'
    },
    {
      icon: Settings,
      title: t('nav.settings'),
      subtitle: 'Configure',
      to: '/settings'
    }
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ── Header with greeting ───────────────────────────────── */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {activePractitioner?.name || t('dashboard.title')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-CA', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {quickActions.map((action) => (
          <button
            key={action.to}
            onClick={() => navigate(action.to)}
            className="glass-card p-4 flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{action.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{action.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Total Patients */}
        <div className="stat-card group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                {stats.totalPatients}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('dashboard.totalPatients')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Decorative sparkline */}
          <svg
            viewBox="0 0 200 32"
            className="w-full h-8 mt-2"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 24 Q 25 20, 50 22 T 100 16 T 150 18 T 200 10"
              className="sparkline"
            />
            <path
              d="M 0 32 L 0 24 Q 25 20, 50 22 T 100 16 T 150 18 T 200 10 L 200 32 Z"
              className="sparkline-area"
            />
          </svg>
        </div>

        {/* Total Visits */}
        <div className="stat-card group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                {stats.totalVisits}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('dashboard.totalVisits')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
              <CalendarCheck className="h-6 w-6 text-primary" />
            </div>
          </div>

          <svg
            viewBox="0 0 200 32"
            className="w-full h-8 mt-2"
            preserveAspectRatio="none"
          >
            <path
              d="M 0 20 Q 30 28, 60 18 T 120 22 T 180 12 L 200 14"
              className="sparkline"
            />
            <path
              d="M 0 32 L 0 20 Q 30 28, 60 18 T 120 22 T 180 12 L 200 14 L 200 32 Z"
              className="sparkline-area"
            />
          </svg>
        </div>

        {/* Recent Activity */}
        <div className="stat-card group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                {recentPatients.length > 0 ? `+${recentPatients.length}` : '0'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('dashboard.recentActivity')}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs mt-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-medium">Active</span>
            <span className="text-muted-foreground/60">this week</span>
          </div>
        </div>
      </div>

      {/* ── Bottom: Activity Timeline + Quick Stats ─────────── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <div className="col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                {t('dashboard.recentlyRegistered')}
              </h2>
            </div>
            {recentPatients.length > 0 && (
              <button
                onClick={() => navigate('/patients')}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="p-6">
            {recentPatients.length === 0 ? (
              /* Empty state */
              <div className="py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary/50" />
                </div>
                <h3 className="text-sm font-medium mb-1.5">No patients yet</h3>
                <p className="text-xs text-muted-foreground mb-5">
                  {t('dashboard.noPatients')}
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary text-sm px-6"
                >
                  <span className="relative z-10">{t('nav.register')}</span>
                </button>
              </div>
            ) : (
              /* Activity timeline */
              <div className="space-y-1">
                {recentPatients.map((patient, idx) => (
                  <div
                    key={patient.id}
                    className="flex items-start gap-3 group cursor-pointer rounded-lg px-2 py-2 -mx-2 hover:bg-accent/40 transition-colors"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center pt-0.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                      {idx !== recentPatients.length - 1 && (
                        <div className="w-px h-6 bg-border/40 mt-1.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Registered · {formatRelativeTime(patient.createdAt)}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors mt-1.5 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          {/* Today's Stats */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-4">
              Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[13px] text-muted-foreground">Patients</span>
                </div>
                <span className="text-lg font-semibold tabular-nums">
                  {stats.totalPatients}
                </span>
              </div>
              <div className="h-px bg-border/40" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[13px] text-muted-foreground">Visits</span>
                </div>
                <span className="text-lg font-semibold tabular-nums">
                  {stats.totalVisits}
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-4">
              System
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 pulse-glow" />
                <span className="text-[13px] text-muted-foreground">
                  All systems operational
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
                <span className="text-[13px] text-muted-foreground/60">
                  Database healthy
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
              Quick Start
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/register')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register Patient
              </button>
              <button
                onClick={() => navigate('/search')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
              >
                <Search className="h-3.5 w-3.5" />
                Search Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
