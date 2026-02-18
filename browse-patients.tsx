import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Patient {
  id: string
  firstName: string
  lastName: string
  cellPhone: string | null
  city: string | null
  province: string | null
  birthday: string | null
}

export function BrowsePatients(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)

  const loadPatients = useCallback(async () => {
    const result = await window.api.patients.list({
      search: search || undefined,
      limit: pageSize,
      offset: page * pageSize
    })
    setPatients(result.data)
    setTotal(result.total)
  }, [search, pageSize, page])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  useEffect(() => {
    setPage(0)
  }, [search])

  const startEntry = total === 0 ? 0 : page * pageSize + 1
  const endEntry = Math.min((page + 1) * pageSize, total)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70 mb-1">
            Directory
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('nav.patients')}
          </h1>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="btn-primary text-sm px-5 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          <span className="relative z-10">{t('nav.register')}</span>
        </button>
      </div>

      {/* Table card */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Patient count badge */}
            <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg px-3 py-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[13px] font-semibold tabular-nums">{total}</span>
            </div>

            <div className="w-px h-5 bg-border/40" />

            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(0)
                }}
                className="rounded-lg border border-border bg-surface-0 px-2.5 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-9 w-64"
              placeholder={`${t('common.search')}...`}
            />
          </div>
        </div>

        {/* Table */}
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-border/40 bg-surface-2/30">
              <th>{t('dashboard.firstName')}</th>
              <th>{t('dashboard.lastName')}</th>
              <th>{t('patient.cellPhone')}</th>
              <th>{t('patient.city')}</th>
              <th>{t('patient.province')}</th>
              <th>{t('patient.birthday')}</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="!py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground/80">
                        {search
                          ? t('common.noResults')
                          : t('dashboard.noPatients')}
                      </p>
                    </div>
                    {!search && (
                      <button
                        onClick={() => navigate('/register')}
                        className="btn-primary text-sm px-5 mt-1"
                      >
                        <span className="relative z-10">{t('nav.register')}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="clickable group"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="font-medium text-foreground">{patient.firstName}</td>
                  <td className="text-foreground">{patient.lastName}</td>
                  <td className="text-muted-foreground font-mono text-[13px]">
                    {patient.cellPhone || '\u2014'}
                  </td>
                  <td className="text-muted-foreground">{patient.city || '\u2014'}</td>
                  <td>
                    {patient.province ? (
                      <span className="inline-flex items-center bg-accent/60 text-muted-foreground rounded-md px-2 py-0.5 text-[12px] font-medium">
                        {patient.province}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{'\u2014'}</span>
                    )}
                  </td>
                  <td className="text-muted-foreground tabular-nums">
                    {patient.birthday
                      ? new Date(patient.birthday).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '\u2014'}
                  </td>
                  <td>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors duration-200" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between text-[13px] text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{startEntry}</span> to{' '}
            <span className="font-medium text-foreground">{endEntry}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> entries
          </span>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-accent/60 hover:border-border/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            {/* Page numbers */}
            {totalPages > 0 && totalPages <= 10 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-8 min-w-[2rem] rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      i === page
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'hover:bg-accent/60 text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-accent/60 hover:border-border/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              disabled={page >= totalPages - 1 || total === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
