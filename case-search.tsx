import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RotateCcw, User, Calendar, Syringe, MapPin } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  brand: string | null
  category: string
  isActive: boolean
}

interface TreatedArea {
  id: string
  name: string
  color: string | null
  isActive: boolean
}

interface TreatmentCategory {
  id: string
  name: string
  slug: string
  type: string
  color: string | null
}

interface CaseSearchResult {
  patientId: string
  firstName: string
  lastName: string
  sex: string | null
  birthday: string | null
  ethnicity: string | null
  visitCount: number
  lastVisitDate: string | null
  matchingTreatments: string | null
  matchingAreas: string | null
}

interface Filters {
  ethnicity: string
  sex: string
  ageMin: string
  ageMax: string
  hasBotulinumConsent: boolean
  hasFillerConsent: boolean
  hasPhotoConsent: boolean
  visitDateFrom: string
  visitDateTo: string
  lotNumber: string
  productIds: string[]
  treatedAreaIds: string[]
}

const DEFAULT_FILTERS: Filters = {
  ethnicity: '',
  sex: '',
  ageMin: '',
  ageMax: '',
  hasBotulinumConsent: false,
  hasFillerConsent: false,
  hasPhotoConsent: false,
  visitDateFrom: '',
  visitDateTo: '',
  lotNumber: '',
  productIds: [],
  treatedAreaIds: []
}

// ── Main Component ───────────────────────────────────────────────────

export function CaseSearch(): React.JSX.Element {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [results, setResults] = useState<CaseSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  // Catalog data for filter checkboxes
  const [products, setProducts] = useState<Product[]>([])
  const [treatedAreas, setTreatedAreas] = useState<TreatedArea[]>([])
  const [categories, setCategories] = useState<TreatmentCategory[]>([])

  // Load catalogs on mount
  useEffect(() => {
    Promise.all([
      window.api.products.list(),
      window.api.treatedAreas.list(),
      window.api.treatmentCategories.list()
    ]).then(([prods, areas, cats]) => {
      setProducts(prods)
      setTreatedAreas(areas)
      setCategories(cats)
    })
  }, [])

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const apiFilters: Record<string, unknown> = {}

      if (filters.ethnicity) apiFilters.ethnicity = filters.ethnicity
      if (filters.sex) apiFilters.sex = filters.sex
      if (filters.ageMin) apiFilters.ageMin = parseInt(filters.ageMin, 10)
      if (filters.ageMax) apiFilters.ageMax = parseInt(filters.ageMax, 10)
      if (filters.hasBotulinumConsent) apiFilters.hasBotulinumConsent = true
      if (filters.hasFillerConsent) apiFilters.hasFillerConsent = true
      if (filters.hasPhotoConsent) apiFilters.hasPhotoConsent = true
      if (filters.visitDateFrom) apiFilters.visitDateFrom = filters.visitDateFrom
      if (filters.visitDateTo) apiFilters.visitDateTo = filters.visitDateTo
      if (filters.lotNumber) apiFilters.lotNumber = filters.lotNumber
      if (filters.productIds.length > 0) apiFilters.productIds = filters.productIds
      if (filters.treatedAreaIds.length > 0) apiFilters.treatedAreaIds = filters.treatedAreaIds

      const res = await window.api.search.cases(apiFilters)
      setResults(res)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleReset = (): void => {
    setFilters(DEFAULT_FILTERS)
    setResults([])
    setSearched(false)
  }

  const toggleProductId = (id: string): void => {
    setFilters((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((pid) => pid !== id)
        : [...f.productIds, id]
    }))
  }

  const toggleAreaId = (id: string): void => {
    setFilters((f) => ({
      ...f,
      treatedAreaIds: f.treatedAreaIds.includes(id)
        ? f.treatedAreaIds.filter((aid) => aid !== id)
        : [...f.treatedAreaIds, id]
    }))
  }

  // Group products by category
  const productsByCategory = categories.map((cat) => ({
    category: cat,
    products: products.filter((p) => p.category === cat.slug)
  })).filter((g) => g.products.length > 0)

  const calculateAge = (birthday: string | null): string => {
    if (!birthday) return '—'
    const today = new Date()
    const dob = new Date(birthday)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return String(age)
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
        Advanced
      </p>
      <h1 className="text-xl font-semibold tracking-tight mt-2 mb-6">Case Search</h1>

      <div className="flex gap-6">
        {/* ── Filter Panel (Left) ──────────────────────────────── */}
        <div className="w-72 flex-shrink-0">
          <div className="surface-elevated rounded-xl p-5 space-y-5 sticky top-6">
            {/* Demographics */}
            <FilterSection icon={User} title="Patient Demographics">
              <div>
                <label className="field-label">Ethnicity</label>
                <select
                  value={filters.ethnicity}
                  onChange={(e) => setFilters((f) => ({ ...f, ethnicity: e.target.value }))}
                  className="field-input text-[12px] w-full"
                >
                  <option value="">Any</option>
                  <option value="Caucasian">Caucasian</option>
                  <option value="African">African</option>
                  <option value="Asian">Asian</option>
                  <option value="Hispanic">Hispanic</option>
                  <option value="Middle Eastern">Middle Eastern</option>
                  <option value="Indigenous">Indigenous</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="field-label">Sex</label>
                <select
                  value={filters.sex}
                  onChange={(e) => setFilters((f) => ({ ...f, sex: e.target.value }))}
                  className="field-input text-[12px] w-full"
                >
                  <option value="">Any</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">Min Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={filters.ageMin}
                    onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value }))}
                    className="field-input text-[12px] w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="field-label">Max Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={filters.ageMax}
                    onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value }))}
                    className="field-input text-[12px] w-full"
                    placeholder="120"
                  />
                </div>
              </div>
            </FilterSection>

            {/* Consents */}
            <FilterSection icon={Search} title="Consents">
              <CheckboxItem
                label="Botulinum Toxin"
                checked={filters.hasBotulinumConsent}
                onChange={(v) => setFilters((f) => ({ ...f, hasBotulinumConsent: v }))}
              />
              <CheckboxItem
                label="Dermal Filler"
                checked={filters.hasFillerConsent}
                onChange={(v) => setFilters((f) => ({ ...f, hasFillerConsent: v }))}
              />
              <CheckboxItem
                label="Photography"
                checked={filters.hasPhotoConsent}
                onChange={(v) => setFilters((f) => ({ ...f, hasPhotoConsent: v }))}
              />
            </FilterSection>

            {/* Visit Filters */}
            <FilterSection icon={Calendar} title="Visit Filters">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="field-label">From</label>
                  <input
                    type="date"
                    value={filters.visitDateFrom}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, visitDateFrom: e.target.value }))
                    }
                    className="field-input text-[12px] w-full"
                  />
                </div>
                <div>
                  <label className="field-label">To</label>
                  <input
                    type="date"
                    value={filters.visitDateTo}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, visitDateTo: e.target.value }))
                    }
                    className="field-input text-[12px] w-full"
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Lot Number</label>
                <input
                  type="text"
                  value={filters.lotNumber}
                  onChange={(e) => setFilters((f) => ({ ...f, lotNumber: e.target.value }))}
                  className="field-input text-[12px] w-full"
                  placeholder="e.g. C1234"
                />
              </div>
            </FilterSection>

            {/* Treatment Products */}
            <FilterSection icon={Syringe} title="Products">
              <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                {productsByCategory.map((group) => (
                  <div key={group.category.id}>
                    <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">
                      {group.category.name}
                    </p>
                    <div className="space-y-0.5">
                      {group.products.map((p) => (
                        <CheckboxItem
                          key={p.id}
                          label={p.name}
                          checked={filters.productIds.includes(p.id)}
                          onChange={() => toggleProductId(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FilterSection>

            {/* Treated Areas */}
            <FilterSection icon={MapPin} title="Treated Areas">
              <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                {treatedAreas.map((a) => (
                  <CheckboxItem
                    key={a.id}
                    label={a.name}
                    checked={filters.treatedAreaIds.includes(a.id)}
                    onChange={() => toggleAreaId(a.id)}
                    color={a.color || undefined}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Search / Reset Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="btn-primary flex-1 text-[13px] flex items-center justify-center gap-1.5 py-2"
              >
                <Search className="h-3.5 w-3.5" />
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary text-[13px] flex items-center gap-1.5 px-3 py-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Results Panel (Right) ────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {searched && (
            <div className="mb-4">
              <p className="text-[13px] text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.patientId}
                  onClick={() => navigate(`/patients/${r.patientId}`)}
                  className="surface-elevated rounded-xl p-5 cursor-pointer hover:border-primary/30 border border-transparent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[14px] font-semibold">
                        {r.firstName} {r.lastName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
                        {r.ethnicity && <span>{r.ethnicity}</span>}
                        {r.sex && <span>{r.sex}</span>}
                        {r.birthday && <span>Age {calculateAge(r.birthday)}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium text-primary">
                        {r.visitCount} visit{r.visitCount !== 1 ? 's' : ''}
                      </p>
                      {r.lastVisitDate && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Last:{' '}
                          {new Date(r.lastVisitDate).toLocaleDateString('en-CA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {(r.matchingTreatments || r.matchingAreas) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.matchingTreatments
                        ?.split(',')
                        .filter(Boolean)
                        .map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      {r.matchingAreas
                        ?.split(',')
                        .filter(Boolean)
                        .map((a, i) => (
                          <span
                            key={`a-${i}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400"
                          >
                            {a.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searched ? (
            <div className="text-center py-20">
              <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground">No matching cases found</p>
              <p className="text-[12px] text-muted-foreground/50 mt-1">
                Try adjusting your search filters
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground">
                Configure filters and click Search
              </p>
              <p className="text-[12px] text-muted-foreground/50 mt-1">
                Search across patients, visits, treatments, and consents
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helper Components ────────────────────────────────────────────────

function FilterSection({
  icon: Icon,
  title,
  children
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-primary/60" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CheckboxItem({
  label,
  checked,
  onChange,
  color
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  color?: string
}): React.JSX.Element {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-0.5 group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border/50 text-primary focus:ring-primary/30 h-3.5 w-3.5"
      />
      {color && (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  )
}
