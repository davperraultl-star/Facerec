import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, FolderPlus, Maximize2, Minimize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Patient {
  id: string
  firstName: string
  lastName: string
  city: string | null
  province: string | null
  email: string | null
}

interface VisitListItem {
  id: string
  date: string
  photoCount: number
}

interface ComparePhotoPair {
  position: string
  photoState: string | null
  beforePhoto: {
    id: string
    originalPath: string
    thumbnailPath: string | null
    photoState: string | null
  } | null
  afterPhoto: {
    id: string
    originalPath: string
    thumbnailPath: string | null
    photoState: string | null
  } | null
}

// Map photo state values to i18n keys
const STATE_LABEL_MAP: Record<string, string> = {
  relaxed: 'photos.relaxed',
  active: 'photos.active',
  smiling: 'photos.smiling',
  lip_at_rest: 'photos.lipAtRest',
  pre_op: 'photos.preOp',
  post_op: 'photos.postOp'
}

// Map position display names to i18n keys
const POSITION_KEY_MAP: Record<string, string> = {
  'Full Face Frontal': 'full_face_frontal',
  'Sagittal Right': 'sagittal_right',
  'Sagittal Left': 'sagittal_left',
  '45° Right': '45_degrees_right',
  '45° Left': '45_degrees_left',
  'Front Smiling': 'front_smiling',
  'Front Lip at Rest': 'front_lip_at_rest',
  'Sagittal Right Smiling': 'sagittal_right_smiling',
  'Sagittal Left Smiling': 'sagittal_left_smiling',
  '45° Right Smiling': '45_right_smiling',
  '45° Left Smiling': '45_left_smiling',
  'Sagittal Right Lip at Rest': 'sagittal_right_lip_at_rest',
  'Sagittal Left Lip at Rest': 'sagittal_left_lip_at_rest',
  '45° Right Lip at Rest': '45_right_lip_at_rest',
  '45° Left Lip at Rest': '45_left_lip_at_rest',
  'Occlusal Upper Arch': 'occlusal_upper',
  'Occlusal Lower Arch': 'occlusal_lower',
  'Buccal Frontal': 'buccal_frontal',
  'Buccal Sagittal Left': 'buccal_sagittal_left',
  'Buccal Sagittal Right': 'buccal_sagittal_right'
}

function formatPairLabel(pair: ComparePhotoPair, t: (key: string) => string): string {
  const posKey = POSITION_KEY_MAP[pair.position]
  const posLabel = posKey ? t(`photos.positions.${posKey}`) : pair.position

  if (pair.photoState && STATE_LABEL_MAP[pair.photoState]) {
    return `${posLabel} · ${t(STATE_LABEL_MAP[pair.photoState])}`
  }
  return posLabel
}

export function CompareVisits(): React.JSX.Element {
  const { patientId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<VisitListItem[]>([])
  const [beforeVisitId, setBeforeVisitId] = useState<string>('')
  const [afterVisitId, setAfterVisitId] = useState<string>('')
  const [pairs, setPairs] = useState<ComparePhotoPair[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [beforeUrl, setBeforeUrl] = useState<string>('')
  const [afterUrl, setAfterUrl] = useState<string>('')

  // Show "Add to Portfolio" modal
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [portfolios, setPortfolios] = useState<{ id: string; title: string }[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('')

  // Load patient + visits
  useEffect(() => {
    if (!patientId) return

    Promise.all([
      window.api.patients.get(patientId),
      window.api.visits.list(patientId)
    ]).then(([p, v]) => {
      setPatient(p as Patient | null)
      setVisits(v as VisitListItem[])
      setLoading(false)

      // Pre-select from URL params
      const before = searchParams.get('before')
      const after = searchParams.get('after')
      if (before && after) {
        setBeforeVisitId(before)
        setAfterVisitId(after)
      } else if (v.length >= 2) {
        // Default: oldest as before, newest as after
        setBeforeVisitId(v[v.length - 1].id)
        setAfterVisitId(v[0].id)
      }
    })
  }, [patientId])

  // Load comparison photos when visits change
  useEffect(() => {
    if (!beforeVisitId || !afterVisitId) {
      setPairs([])
      return
    }
    setLoadingPhotos(true)
    window.api.compare.photos(beforeVisitId, afterVisitId).then((result) => {
      setPairs(result)
      setCurrentIndex(0)
      setLoadingPhotos(false)
    })
  }, [beforeVisitId, afterVisitId])

  // Load full-res photo URLs for current pair
  useEffect(() => {
    const pair = pairs[currentIndex]
    if (!pair) {
      setBeforeUrl('')
      setAfterUrl('')
      return
    }

    // Use original for full-screen, thumbnail for grid
    const beforePath = pair.beforePhoto?.originalPath
    const afterPath = pair.afterPhoto?.originalPath

    if (beforePath) {
      window.api.photos.getFilePath(beforePath).then(setBeforeUrl)
    } else {
      setBeforeUrl('')
    }

    if (afterPath) {
      window.api.photos.getFilePath(afterPath).then(setAfterUrl)
    } else {
      setAfterUrl('')
    }
  }, [pairs, currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') navigatePrev()
      else if (e.key === 'ArrowRight') navigateNext()
      else if (e.key === 'Escape' && fullscreen) setFullscreen(false)
      else if (e.key === 'f' || e.key === 'F') setFullscreen((f) => !f)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [pairs.length, currentIndex, fullscreen])

  const navigatePrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const navigateNext = useCallback(() => {
    setCurrentIndex((i) => (i < pairs.length - 1 ? i + 1 : i))
  }, [pairs.length])

  const handleAddToPortfolio = async (): Promise<void> => {
    const list = await window.api.portfolios.list()
    setPortfolios(list)
    setSelectedPortfolioId(list[0]?.id || '')
    setNewPortfolioTitle('')
    setShowPortfolioModal(true)
  }

  const handleSaveToPortfolio = async (): Promise<void> => {
    const pair = pairs[currentIndex]
    if (!pair || !patientId) return

    let portfolioId = selectedPortfolioId

    // Create new portfolio if needed
    if (!portfolioId && newPortfolioTitle.trim()) {
      const newPortfolio = await window.api.portfolios.create({ title: newPortfolioTitle.trim() })
      portfolioId = newPortfolio.id
    }

    if (!portfolioId) return

    await window.api.portfolioItems.create({
      portfolioId,
      patientId,
      beforeVisitId,
      afterVisitId,
      photoPosition: pair.position,
      photoState: pair.photoState || undefined
    })

    setShowPortfolioModal(false)
  }

  const currentPair = pairs[currentIndex]
  const beforeVisit = visits.find((v) => v.id === beforeVisitId)
  const afterVisit = visits.find((v) => v.id === afterVisitId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('compare.patientNotFound')}</p>
          <button onClick={() => navigate('/patients')} className="btn-primary">
            {t('patient.backToList')}
          </button>
        </div>
      </div>
    )
  }

  // Fullscreen mode
  if (fullscreen && currentPair) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/80">
          <div className="text-white text-sm font-medium">
            {patient.firstName} {patient.lastName} — {formatPairLabel(currentPair, t)}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-xs">
              {currentIndex + 1} / {pairs.length}
            </span>
            <button
              onClick={() => setFullscreen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Photos side by side */}
        <div className="flex-1 flex">
          {/* Before */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white/80 text-xs font-medium">
              {t('compare.before')} — {beforeVisit?.date}
            </div>
            {beforeUrl ? (
              <img
                src={`file://${beforeUrl}`}
                alt="Before"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-white/30 text-sm">{t('compare.noPhoto')}</div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-white/20" />

          {/* After */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white/80 text-xs font-medium">
              {t('compare.after')} — {afterVisit?.date}
            </div>
            {afterUrl ? (
              <img
                src={`file://${afterUrl}`}
                alt="After"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-white/30 text-sm">{t('compare.noPhoto')}</div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 py-3 bg-black/80">
          <button
            onClick={navigatePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg hover:bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <select
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm min-w-[200px]"
          >
            {pairs.map((pair, i) => (
              <option key={i} value={i} className="bg-neutral-900 text-white">
                {formatPairLabel(pair, t)}
              </option>
            ))}
          </select>
          <button
            onClick={navigateNext}
            disabled={currentIndex === pairs.length - 1}
            className="p-2 rounded-lg hover:bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // Normal mode
  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      {/* Breadcrumb */}
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
        {t('nav.patients')} /{' '}
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="hover:text-foreground transition-colors"
        >
          {patient.firstName} {patient.lastName}
        </button>{' '}
        / <span className="text-foreground">{t('compare.title')}</span>
      </p>

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">{t('compare.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {currentPair && (
            <button
              onClick={handleAddToPortfolio}
              className="btn-secondary text-[13px] flex items-center gap-1.5"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              {t('compare.addToPortfolio')}
            </button>
          )}
          {currentPair && (
            <button
              onClick={() => setFullscreen(true)}
              className="btn-primary text-[13px] flex items-center gap-1.5"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {t('compare.fullscreen')}
            </button>
          )}
        </div>
      </div>

      {/* Visit Selectors */}
      <div className="surface-elevated rounded-xl px-6 py-4 flex items-center gap-6 mb-6">
        <div className="flex-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 block mb-1">
            {t('compare.before')}
          </label>
          <select
            value={beforeVisitId}
            onChange={(e) => setBeforeVisitId(e.target.value)}
            className="field-input text-[13px] w-full"
          >
            <option value="">{t('compare.selectVisit')}</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.date} ({v.photoCount} {t('compare.photos')})
              </option>
            ))}
          </select>
        </div>

        <div className="text-muted-foreground/30 text-2xl font-light self-end pb-1">vs</div>

        <div className="flex-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 block mb-1">
            {t('compare.after')}
          </label>
          <select
            value={afterVisitId}
            onChange={(e) => setAfterVisitId(e.target.value)}
            className="field-input text-[13px] w-full"
          >
            <option value="">{t('compare.selectVisit')}</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.date} ({v.photoCount} {t('compare.photos')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Position selector + navigation */}
      {pairs.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg hover:bg-surface-1 text-muted-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value))}
              className="field-input text-[13px] min-w-[260px]"
            >
              {pairs.map((pair, i) => (
                <option key={i} value={i}>
                  {formatPairLabel(pair, t)}
                </option>
              ))}
            </select>
            <button
              onClick={navigateNext}
              disabled={currentIndex === pairs.length - 1}
              className="p-1.5 rounded-lg hover:bg-surface-1 text-muted-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[12px] text-muted-foreground/50">
            {currentIndex + 1} / {pairs.length} {t('compare.positions')}
          </span>
        </div>
      )}

      {/* Comparison area */}
      {loadingPhotos ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : pairs.length === 0 && beforeVisitId && afterVisitId ? (
        <div className="py-20 text-center text-sm text-muted-foreground/60">
          {t('compare.noMatchingPhotos')}
        </div>
      ) : !beforeVisitId || !afterVisitId ? (
        <div className="py-20 text-center text-sm text-muted-foreground/60">
          {t('compare.selectBothVisits')}
        </div>
      ) : currentPair ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div className="surface-elevated rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-border/30 flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">
                {t('compare.before')}
              </span>
              <span className="text-[11px] text-muted-foreground/50">{beforeVisit?.date}</span>
            </div>
            <div className="aspect-[4/3] bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {beforeUrl ? (
                <img
                  src={`file://${beforeUrl}`}
                  alt="Before"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-sm text-muted-foreground/40">{t('compare.noPhoto')}</span>
              )}
            </div>
          </div>

          {/* After */}
          <div className="surface-elevated rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-border/30 flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">
                {t('compare.after')}
              </span>
              <span className="text-[11px] text-muted-foreground/50">{afterVisit?.date}</span>
            </div>
            <div className="aspect-[4/3] bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {afterUrl ? (
                <img
                  src={`file://${afterUrl}`}
                  alt="After"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-sm text-muted-foreground/40">{t('compare.noPhoto')}</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Thumbnail strip */}
      {pairs.length > 1 && (
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {pairs.map((pair, i) => (
            <ThumbnailStrip
              key={i}
              pair={pair}
              index={i}
              isActive={i === currentIndex}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      )}

      {/* Add to Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPortfolioModal(false)} />
          <div className="relative bg-surface-0 border border-border/30 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-border/30">
              <h3 className="text-base font-semibold">{t('compare.addToPortfolio')}</h3>
              {currentPair && (
                <p className="text-[12px] text-muted-foreground/60 mt-0.5">{formatPairLabel(currentPair, t)}</p>
              )}
            </div>
            <div className="px-6 py-5 space-y-4">
              {portfolios.length > 0 && (
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                    {t('compare.existingPortfolio')}
                  </label>
                  <select
                    value={selectedPortfolioId}
                    onChange={(e) => {
                      setSelectedPortfolioId(e.target.value)
                      if (e.target.value) setNewPortfolioTitle('')
                    }}
                    className="field-input text-[13px] w-full"
                  >
                    <option value="">{t('compare.selectPortfolio')}</option>
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                  {portfolios.length > 0 ? t('compare.orCreateNew') : t('compare.newPortfolio')}
                </label>
                <input
                  type="text"
                  value={newPortfolioTitle}
                  onChange={(e) => {
                    setNewPortfolioTitle(e.target.value)
                    if (e.target.value) setSelectedPortfolioId('')
                  }}
                  placeholder={t('compare.portfolioNamePlaceholder')}
                  className="field-input text-[13px] w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30">
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="btn-secondary text-[13px] px-4 py-2"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveToPortfolio}
                disabled={!selectedPortfolioId && !newPortfolioTitle.trim()}
                className="btn-primary text-[13px] px-4 py-2"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ThumbnailStrip({
  pair,
  index,
  isActive,
  onClick
}: {
  pair: ComparePhotoPair
  index: number
  isActive: boolean
  onClick: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [thumbUrl, setThumbUrl] = useState<string>('')

  useEffect(() => {
    // Show the "before" thumbnail, or "after" if before is missing
    const path =
      pair.beforePhoto?.thumbnailPath ||
      pair.beforePhoto?.originalPath ||
      pair.afterPhoto?.thumbnailPath ||
      pair.afterPhoto?.originalPath

    if (path) {
      window.api.photos.getFilePath(path).then(setThumbUrl)
    }
  }, [pair])

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-20 rounded-lg overflow-hidden border-2 transition-all ${
        isActive
          ? 'border-primary shadow-md shadow-primary/20'
          : 'border-border/30 hover:border-border/60'
      }`}
    >
      <div className="aspect-square bg-surface-1">
        {thumbUrl ? (
          <img
            src={`file://${thumbUrl}`}
            alt={pair.position}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/40">
            {index + 1}
          </div>
        )}
      </div>
      <div className="px-1 py-0.5">
        <p className="text-[9px] text-muted-foreground/60 truncate text-center">
          {formatPairLabel(pair, t)}
        </p>
      </div>
    </button>
  )
}
