import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Eye, FolderOpen, Pencil, Image, FileDown, Play } from 'lucide-react'
import { useToastStore } from '../stores/toast.store'
import { useTranslation } from 'react-i18next'

interface PortfolioWithCount {
  id: string
  title: string
  category: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

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

function formatItemLabel(
  position: string | null,
  photoState: string | null,
  t: (key: string) => string
): string {
  if (!position) return ''
  const posKey = POSITION_KEY_MAP[position]
  const posLabel = posKey ? t(`photos.positions.${posKey}`) : position

  if (photoState && STATE_LABEL_MAP[photoState]) {
    return `${posLabel} · ${t(STATE_LABEL_MAP[photoState])}`
  }
  return posLabel
}

export function Portfolio(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [portfolios, setPortfolios] = useState<PortfolioWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('')

  // Expanded portfolio (to show items)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [items, setItems] = useState<PortfolioItemWithDetails[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const loadPortfolios = async (): Promise<void> => {
    const list = await window.api.portfolios.list()
    setPortfolios(list)
    setLoading(false)
  }

  useEffect(() => {
    loadPortfolios()
  }, [])

  const handleCreate = async (): Promise<void> => {
    if (!newTitle.trim()) return
    await window.api.portfolios.create({
      title: newTitle.trim(),
      category: newCategory.trim() || undefined
    })
    setNewTitle('')
    setNewCategory('')
    setShowCreate(false)
    loadPortfolios()
  }

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.portfolios.delete(id)
    if (expandedId === id) {
      setExpandedId(null)
      setItems([])
    }
    loadPortfolios()
  }

  const handleExpand = async (id: string): Promise<void> => {
    if (expandedId === id) {
      setExpandedId(null)
      setItems([])
      return
    }
    setExpandedId(id)
    setLoadingItems(true)
    const list = await window.api.portfolioItems.list(id)
    setItems(list)
    setLoadingItems(false)
  }

  const handleDeleteItem = async (itemId: string): Promise<void> => {
    await window.api.portfolioItems.delete(itemId)
    if (expandedId) {
      const list = await window.api.portfolioItems.list(expandedId)
      setItems(list)
    }
    loadPortfolios()
  }

  const handleStartEdit = (portfolio: PortfolioWithCount): void => {
    setEditingId(portfolio.id)
    setEditTitle(portfolio.title)
    setEditCategory(portfolio.category || '')
  }

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingId || !editTitle.trim()) return
    await window.api.portfolios.update(editingId, {
      title: editTitle.trim(),
      category: editCategory.trim() || null
    })
    setEditingId(null)
    loadPortfolios()
  }

  const { addToast } = useToastStore()

  const handleExportPDF = async (portfolioId: string): Promise<void> => {
    try {
      const result = await window.api.exports.portfolioReport(portfolioId)
      addToast({ type: 'success', message: `PDF exported: ${result.filename}` })
      await window.api.exports.openFile(result.path)
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to export PDF' })
      console.error(err)
    }
  }

  const handleViewItem = (item: PortfolioItemWithDetails): void => {
    if (item.beforeDate && item.afterDate) {
      // Navigate to compare page with pre-selected visits
      navigate(
        `/patients/${item.patientId}/compare?before=${encodeURIComponent(
          getVisitIdForItem(item, 'before')
        )}&after=${encodeURIComponent(getVisitIdForItem(item, 'after'))}`
      )
    }
  }

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

  return (
    <div className="max-w-5xl mx-auto px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('portfolio.title')}</h1>
          <p className="text-[13px] text-muted-foreground/60 mt-0.5">
            {t('portfolio.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-[13px]"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('portfolio.create')}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="surface-elevated rounded-xl px-6 py-4 mb-4 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 block mb-1">
              {t('portfolio.collectionName')}
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('portfolio.namePlaceholder')}
              className="field-input text-[13px] w-full"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="w-48">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 block mb-1">
              {t('portfolio.category')}
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t('portfolio.categoryPlaceholder')}
              className="field-input text-[13px] w-full"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-[13px] px-3 py-2">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="btn-primary text-[13px] px-3 py-2"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Portfolio list */}
      {portfolios.length === 0 ? (
        <div className="py-20 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground/60">{t('portfolio.empty')}</p>
          <p className="text-[12px] text-muted-foreground/40 mt-1">{t('portfolio.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="surface-elevated rounded-xl overflow-hidden">
              {/* Portfolio header row */}
              <div className="px-6 py-4 flex items-center gap-4">
                {/* Icon */}
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Image className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editingId === portfolio.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="field-input text-[13px] flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder={t('portfolio.category')}
                        className="field-input text-[13px] w-40"
                      />
                      <button onClick={handleSaveEdit} className="btn-primary text-[12px] px-2 py-1">
                        {t('common.save')}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-secondary text-[12px] px-2 py-1"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-[14px] font-semibold truncate">{portfolio.title}</h3>
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground/60 mt-0.5">
                        {portfolio.category && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-1 text-[11px]">
                            {portfolio.category}
                          </span>
                        )}
                        <span>
                          {portfolio.itemCount} {portfolio.itemCount === 1 ? t('portfolio.pair') : t('portfolio.pairs')}
                        </span>
                        <span>
                          {t('portfolio.created')}{' '}
                          {new Date(portfolio.createdAt).toLocaleDateString('en-CA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {editingId !== portfolio.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/presentation/${portfolio.id}`)}
                      className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground hover:text-foreground"
                      title="Present"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleExportPDF(portfolio.id)}
                      className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground hover:text-foreground"
                      title="Export PDF"
                    >
                      <FileDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleExpand(portfolio.id)}
                      className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground hover:text-foreground"
                      title={expandedId === portfolio.id ? t('common.close') : t('portfolio.view')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(portfolio)}
                      className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(portfolio.id)}
                      className="p-2 rounded-lg hover:bg-surface-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded items */}
              {expandedId === portfolio.id && (
                <div className="border-t border-border/30 px-6 py-4">
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground/40 text-center py-6">
                      {t('portfolio.noItems')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <PortfolioItemCard
                          key={item.id}
                          item={item}
                          onView={() => handleViewItem(item)}
                          onDelete={() => handleDeleteItem(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Helper to extract visit ID from a portfolio item
function getVisitIdForItem(
  item: PortfolioItemWithDetails,
  type: 'before' | 'after'
): string {
  return type === 'before' ? item.beforeVisitId || '' : item.afterVisitId || ''
}

function PortfolioItemCard({
  item,
  onView,
  onDelete
}: {
  item: PortfolioItemWithDetails
  onView: () => void
  onDelete: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [beforeThumb, setBeforeThumb] = useState<string>('')
  const [afterThumb, setAfterThumb] = useState<string>('')

  useEffect(() => {
    if (item.beforeThumbnailPath) {
      window.api.photos.getFilePath(item.beforeThumbnailPath).then(setBeforeThumb)
    } else if (item.beforePhotoPath) {
      window.api.photos.getFilePath(item.beforePhotoPath).then(setBeforeThumb)
    }

    if (item.afterThumbnailPath) {
      window.api.photos.getFilePath(item.afterThumbnailPath).then(setAfterThumb)
    } else if (item.afterPhotoPath) {
      window.api.photos.getFilePath(item.afterPhotoPath).then(setAfterThumb)
    }
  }, [item])

  return (
    <div className="group rounded-xl border border-border/30 overflow-hidden bg-surface-0/50">
      {/* Photo pair thumbnails */}
      <div className="flex">
        <div className="flex-1 aspect-[4/3] bg-surface-1">
          {beforeThumb ? (
            <img src={`file://${beforeThumb}`} alt="Before" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/30">
              {t('compare.before')}
            </div>
          )}
        </div>
        <div className="w-px bg-border/30" />
        <div className="flex-1 aspect-[4/3] bg-surface-1">
          {afterThumb ? (
            <img src={`file://${afterThumb}`} alt="After" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/30">
              {t('compare.after')}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2">
        <p className="text-[12px] font-medium truncate">
          {item.patientFirstName} {item.patientLastName}
        </p>
        {item.photoPosition && (
          <p className="text-[11px] text-muted-foreground/60 truncate">
            {formatItemLabel(item.photoPosition, item.photoState, t)}
          </p>
        )}
        <div className="text-[10px] text-muted-foreground/40 mt-0.5">
          {item.beforeDate || '—'} → {item.afterDate || '—'}
        </div>
      </div>

      {/* Hover actions */}
      <div className="px-3 pb-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onView}
          className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Eye className="h-3 w-3" />
          {t('portfolio.view')}
        </button>
        <span className="text-muted-foreground/20 mx-1">·</span>
        <button
          onClick={onDelete}
          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          {t('common.delete')}
        </button>
      </div>
    </div>
  )
}
