import { useState, useEffect } from 'react'
import { Download, Trash2, Eye } from 'lucide-react'

interface Photo {
  id: string
  visitId: string
  patientId: string
  originalPath: string
  thumbnailPath: string | null
  photoPosition: string | null
  photoState: string | null
  width: number | null
  height: number | null
  sortOrder: number | null
}

export type VisitContext = 'facial' | 'dental' | 'mixed'

interface PhotoGridProps {
  photos: Photo[]
  visitContext?: VisitContext
  onPhotoClick: (photo: Photo) => void
  onDeletePhoto: (id: string) => void
  onExportAll: () => void
  onUpdatePhoto: (id: string, data: Record<string, unknown>) => void
}

// ── Photo Position Groups ───────────────────────────────────────────
const POSITION_GROUPS = {
  facial: {
    label: 'Facial',
    positions: [
      'Full Face Frontal',
      'Sagittal Right',
      'Sagittal Left',
      '45° Right',
      '45° Left'
    ]
  },
  dental_extraoral: {
    label: 'Dental Extra-oral',
    positions: [
      'Front Smiling',
      'Front Lip at Rest',
      'Sagittal Right Smiling',
      'Sagittal Left Smiling',
      '45° Right Smiling',
      '45° Left Smiling',
      'Sagittal Right Lip at Rest',
      'Sagittal Left Lip at Rest',
      '45° Right Lip at Rest',
      '45° Left Lip at Rest'
    ]
  },
  dental_intraoral: {
    label: 'Dental Intra-oral',
    positions: [
      'Occlusal Upper Arch',
      'Occlusal Lower Arch',
      'Buccal Frontal',
      'Buccal Sagittal Left',
      'Buccal Sagittal Right'
    ]
  }
}

// ── Photo States by Context ─────────────────────────────────────────
const STATES_BY_CONTEXT: Record<VisitContext, { value: string; label: string }[]> = {
  facial: [
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'active', label: 'Active' }
  ],
  dental: [
    { value: 'smiling', label: 'Smiling' },
    { value: 'lip_at_rest', label: 'Lip at Rest' },
    { value: 'pre_op', label: 'Pre-op' },
    { value: 'post_op', label: 'Post-op' }
  ],
  mixed: [
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'active', label: 'Active' },
    { value: 'smiling', label: 'Smiling' },
    { value: 'lip_at_rest', label: 'Lip at Rest' },
    { value: 'pre_op', label: 'Pre-op' },
    { value: 'post_op', label: 'Post-op' }
  ]
}

function getAllPositions(context: VisitContext): string[] {
  if (context === 'facial') return POSITION_GROUPS.facial.positions
  if (context === 'dental')
    return [
      ...POSITION_GROUPS.dental_extraoral.positions,
      ...POSITION_GROUPS.dental_intraoral.positions
    ]
  // mixed
  return [
    ...POSITION_GROUPS.facial.positions,
    ...POSITION_GROUPS.dental_extraoral.positions,
    ...POSITION_GROUPS.dental_intraoral.positions
  ]
}

export function PhotoGrid({
  photos,
  visitContext = 'facial',
  onPhotoClick,
  onDeletePhoto,
  onExportAll,
  onUpdatePhoto
}: PhotoGridProps): React.JSX.Element {
  const states = STATES_BY_CONTEXT[visitContext]
  const stateValues = states.map((s) => s.value)

  if (photos.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground/60">
        No photos uploaded yet
      </div>
    )
  }

  // Group photos by state
  const groupedByState = states.map((s) => ({
    ...s,
    photos: photos.filter((p) => p.photoState === s.value)
  }))

  const unassigned = photos.filter(
    (p) => !p.photoState || !stateValues.includes(p.photoState)
  )

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Patient Images ({photos.length})</h4>
        {photos.length > 0 && (
          <button
            type="button"
            onClick={onExportAll}
            className="btn-secondary text-[12px] flex items-center gap-1.5 px-3 py-1"
          >
            <Download className="h-3 w-3" />
            Download All
          </button>
        )}
      </div>

      {/* State-grouped rows */}
      {groupedByState.map(
        (group) =>
          group.photos.length > 0 && (
            <PhotoRow
              key={group.value}
              label={group.label}
              photos={group.photos}
              visitContext={visitContext}
              states={states}
              onPhotoClick={onPhotoClick}
              onDeletePhoto={onDeletePhoto}
              onUpdatePhoto={onUpdatePhoto}
            />
          )
      )}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <PhotoRow
          label="Unassigned"
          photos={unassigned}
          visitContext={visitContext}
          states={states}
          onPhotoClick={onPhotoClick}
          onDeletePhoto={onDeletePhoto}
          onUpdatePhoto={onUpdatePhoto}
          showStateSelector
        />
      )}
    </div>
  )
}

function PhotoRow({
  label,
  photos,
  visitContext,
  states,
  onPhotoClick,
  onDeletePhoto,
  onUpdatePhoto,
  showStateSelector
}: {
  label: string
  photos: Photo[]
  visitContext: VisitContext
  states: { value: string; label: string }[]
  onPhotoClick: (photo: Photo) => void
  onDeletePhoto: (id: string) => void
  onUpdatePhoto: (id: string, data: Record<string, unknown>) => void
  showStateSelector?: boolean
}): React.JSX.Element {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-2">
        {label}
      </p>
      <div className="grid grid-cols-5 gap-3">
        {photos.map((photo) => (
          <PhotoCell
            key={photo.id}
            photo={photo}
            visitContext={visitContext}
            states={states}
            onClick={() => onPhotoClick(photo)}
            onDelete={() => onDeletePhoto(photo.id)}
            onUpdatePhoto={onUpdatePhoto}
            showStateSelector={showStateSelector}
          />
        ))}
      </div>
    </div>
  )
}

function PhotoCell({
  photo,
  visitContext,
  states,
  onClick,
  onDelete,
  onUpdatePhoto,
  showStateSelector
}: {
  photo: Photo
  visitContext: VisitContext
  states: { value: string; label: string }[]
  onClick: () => void
  onDelete: () => void
  onUpdatePhoto: (id: string, data: Record<string, unknown>) => void
  showStateSelector?: boolean
}): React.JSX.Element {
  const [thumbUrl, setThumbUrl] = useState<string>('')

  useEffect(() => {
    if (photo.thumbnailPath) {
      window.api.photos.getFilePath(photo.thumbnailPath).then(setThumbUrl)
    } else if (photo.originalPath) {
      window.api.photos.getFilePath(photo.originalPath).then(setThumbUrl)
    }
  }, [photo.thumbnailPath, photo.originalPath])

  // Build position groups relevant to context
  const positionGroups = getPositionGroupsForContext(visitContext)

  return (
    <div className="group relative rounded-lg overflow-hidden bg-surface-1 border border-border/30">
      {/* Thumbnail */}
      <div className="aspect-[4/3] cursor-pointer" onClick={onClick}>
        {thumbUrl ? (
          <img
            src={`file://${thumbUrl}`}
            alt={photo.photoPosition || 'Photo'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Overlay actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onClick}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-2 rounded-full bg-red-500/40 hover:bg-red-500/60 text-white"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Label */}
      <div className="px-2 py-1.5">
        <select
          value={photo.photoPosition || ''}
          onChange={(e) => onUpdatePhoto(photo.id, { photoPosition: e.target.value })}
          className="w-full text-[11px] bg-transparent border-none text-muted-foreground focus:text-foreground focus:outline-none cursor-pointer"
        >
          <option value="">Set position...</option>
          {positionGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {showStateSelector && (
          <select
            value={photo.photoState || ''}
            onChange={(e) => onUpdatePhoto(photo.id, { photoState: e.target.value })}
            className="w-full text-[11px] bg-transparent border-none text-muted-foreground/60 focus:text-foreground focus:outline-none cursor-pointer mt-0.5"
          >
            <option value="">Set state...</option>
            {states.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

function getPositionGroupsForContext(
  context: VisitContext
): { label: string; positions: string[] }[] {
  if (context === 'facial') {
    return [{ label: POSITION_GROUPS.facial.label, positions: POSITION_GROUPS.facial.positions }]
  }
  if (context === 'dental') {
    return [
      {
        label: POSITION_GROUPS.dental_extraoral.label,
        positions: POSITION_GROUPS.dental_extraoral.positions
      },
      {
        label: POSITION_GROUPS.dental_intraoral.label,
        positions: POSITION_GROUPS.dental_intraoral.positions
      }
    ]
  }
  // mixed
  return [
    { label: POSITION_GROUPS.facial.label, positions: POSITION_GROUPS.facial.positions },
    {
      label: POSITION_GROUPS.dental_extraoral.label,
      positions: POSITION_GROUPS.dental_extraoral.positions
    },
    {
      label: POSITION_GROUPS.dental_intraoral.label,
      positions: POSITION_GROUPS.dental_intraoral.positions
    }
  ]
}
