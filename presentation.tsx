import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PortfolioItemWithDetails {
  id: string
  portfolioId: string
  patientId: string
  beforeVisitId: string | null
  afterVisitId: string | null
  patientFirstName: string
  patientLastName: string
  beforeDate: string | null
  afterDate: string | null
  beforePhotoPath: string | null
  afterPhotoPath: string | null
  beforeThumbnailPath: string | null
  afterThumbnailPath: string | null
  photoPosition: string | null
  photoState: string | null
}

export function Presentation(): React.JSX.Element {
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [items, setItems] = useState<PortfolioItemWithDetails[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')

  // Resolved file paths for current slide
  const [beforePath, setBeforePath] = useState<string>('')
  const [afterPath, setAfterPath] = useState<string>('')

  // Load portfolio data
  useEffect(() => {
    if (!portfolioId) return
    const load = async (): Promise<void> => {
      try {
        const [portfolio, itemsList] = await Promise.all([
          window.api.portfolios.get(portfolioId),
          window.api.portfolioItems.list(portfolioId)
        ])
        setTitle(portfolio?.title || '')
        setItems(itemsList)
      } catch (err) {
        console.error('Failed to load portfolio:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [portfolioId])

  // Request fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async (): Promise<void> => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
      } catch {
        // Fullscreen may be denied — continue without it
      }
    }
    enterFullscreen()

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  // Resolve photo paths when current slide changes
  useEffect(() => {
    const item = items[currentIndex]
    if (!item) {
      setBeforePath('')
      setAfterPath('')
      return
    }

    const resolvePaths = async (): Promise<void> => {
      const bPath = item.beforePhotoPath
        ? await window.api.photos.getFilePath(item.beforePhotoPath)
        : ''
      const aPath = item.afterPhotoPath
        ? await window.api.photos.getFilePath(item.afterPhotoPath)
        : ''
      setBeforePath(bPath)
      setAfterPath(aPath)
    }
    resolvePaths()
  }, [items, currentIndex])

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    navigate(-1)
  }, [navigate])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, items.length - 1))
  }, [items.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          goNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          goPrev()
          break
        case 'Escape':
          e.preventDefault()
          exitPresentation()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, exitPresentation])

  // Listen for fullscreen exit (e.g. user presses Esc in browser)
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      if (!document.fullscreenElement) {
        navigate(-1)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [navigate])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[200]">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[200]">
        <div className="text-center">
          <p className="text-white/60 text-lg mb-4">{t('portfolio.noItems')}</p>
          <button
            onClick={exitPresentation}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            {t('presentation.exit')}
          </button>
        </div>
      </div>
    )
  }

  const currentItem = items[currentIndex]

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col select-none">
      {/* Top bar — patient info + close */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-white/90 text-sm font-medium">{title}</h2>
            <p className="text-white/50 text-xs">
              {currentItem.patientFirstName} {currentItem.patientLastName}
              {currentItem.photoPosition && (
                <span className="ml-2 text-white/30">· {currentItem.photoPosition}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Before / After date labels */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-white/40">
              {t('presentation.before')}: {currentItem.beforeDate || '—'}
            </span>
            <span className="text-white/40">
              {t('presentation.after')}: {currentItem.afterDate || '—'}
            </span>
          </div>

          <button
            onClick={exitPresentation}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={t('presentation.exit')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content — side by side photos */}
      <div className="flex-1 flex items-stretch relative overflow-hidden">
        {/* Left nav area — click to go prev */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="absolute left-0 top-0 bottom-0 w-20 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:invisible"
        >
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm">
            <ChevronLeft className="h-6 w-6 text-white" />
          </div>
        </button>

        {/* Before photo */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
            <span className="text-white/70 text-[11px] font-medium uppercase tracking-wider">
              {t('presentation.before')}
            </span>
          </div>
          {beforePath ? (
            <img
              src={`file://${beforePath}`}
              alt="Before"
              className="max-w-full max-h-full object-contain rounded-lg"
              draggable={false}
            />
          ) : (
            <div className="text-white/20 text-sm">{t('compare.noPhoto')}</div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-white/10" />

        {/* After photo */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
            <span className="text-white/70 text-[11px] font-medium uppercase tracking-wider">
              {t('presentation.after')}
            </span>
          </div>
          {afterPath ? (
            <img
              src={`file://${afterPath}`}
              alt="After"
              className="max-w-full max-h-full object-contain rounded-lg"
              draggable={false}
            />
          ) : (
            <div className="text-white/20 text-sm">{t('compare.noPhoto')}</div>
          )}
        </div>

        {/* Right nav area — click to go next */}
        <button
          onClick={goNext}
          disabled={currentIndex === items.length - 1}
          className="absolute right-0 top-0 bottom-0 w-20 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:invisible"
        >
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm">
            <ChevronRight className="h-6 w-6 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom bar — slide counter + dots */}
      <div className="flex items-center justify-center gap-4 px-6 py-3 bg-black/50 backdrop-blur-sm">
        {/* Slide counter */}
        <span className="text-white/50 text-xs tabular-nums">
          {currentIndex + 1} / {items.length}
        </span>

        {/* Dot indicators (max 20 shown) */}
        {items.length <= 20 && (
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-4 bg-white/80'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
