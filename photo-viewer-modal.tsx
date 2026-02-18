import { useState, useEffect, useCallback } from 'react'
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Photo {
  id: string
  originalPath: string
  thumbnailPath: string | null
  photoPosition: string | null
  photoState: string | null
  width: number | null
  height: number | null
}

interface PhotoViewerModalProps {
  photo: Photo
  photos: Photo[]
  onClose: () => void
  onNavigate: (photo: Photo) => void
  onPhotoUpdated: () => void
}

export function PhotoViewerModal({
  photo,
  photos,
  onClose,
  onNavigate,
  onPhotoUpdated
}: PhotoViewerModalProps): React.JSX.Element {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  const currentIndex = photos.findIndex((p) => p.id === photo.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  useEffect(() => {
    window.api.photos.getFilePath(photo.originalPath).then((path) => {
      setImageUrl(`file://${path}?t=${Date.now()}`)
    })
  }, [photo.originalPath, photo.id])

  const handleRotate = async (degrees: number): Promise<void> => {
    setProcessing(true)
    await window.api.photos.rotate(photo.id, degrees)
    onPhotoUpdated()
    // Refresh image
    const path = await window.api.photos.getFilePath(photo.originalPath)
    setImageUrl(`file://${path}?t=${Date.now()}`)
    setProcessing(false)
  }

  const handleFlip = async (direction: 'horizontal' | 'vertical'): Promise<void> => {
    setProcessing(true)
    await window.api.photos.flip(photo.id, direction)
    onPhotoUpdated()
    const path = await window.api.photos.getFilePath(photo.originalPath)
    setImageUrl(`file://${path}?t=${Date.now()}`)
    setProcessing(false)
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(photos[currentIndex - 1])
      if (e.key === 'ArrowRight' && hasNext) onNavigate(photos[currentIndex + 1])
    },
    [onClose, hasPrev, hasNext, photos, currentIndex, onNavigate]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50">
        <div className="text-sm text-white/70">
          {photo.photoPosition || 'Photo'}{' '}
          {photo.photoState && (
            <span className="text-white/40">({photo.photoState})</span>
          )}
          <span className="ml-3 text-white/30">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          <ViewerButton onClick={() => handleRotate(-90)} disabled={processing} title="Rotate Left">
            <RotateCcw className="h-4 w-4" />
          </ViewerButton>
          <ViewerButton onClick={() => handleRotate(90)} disabled={processing} title="Rotate Right">
            <RotateCw className="h-4 w-4" />
          </ViewerButton>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <ViewerButton onClick={() => handleFlip('horizontal')} disabled={processing} title="Flip Horizontal">
            <FlipHorizontal className="h-4 w-4" />
          </ViewerButton>
          <ViewerButton onClick={() => handleFlip('vertical')} disabled={processing} title="Flip Vertical">
            <FlipVertical className="h-4 w-4" />
          </ViewerButton>
          <div className="w-px h-5 bg-white/20 mx-2" />
          <ViewerButton onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </ViewerButton>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center p-8">
        {/* Prev button */}
        {hasPrev && (
          <button
            type="button"
            onClick={() => onNavigate(photos[currentIndex - 1])}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={photo.photoPosition || 'Photo'}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ opacity: processing ? 0.5 : 1, transition: 'opacity 200ms' }}
          />
        )}

        {/* Next button */}
        {hasNext && (
          <button
            type="button"
            onClick={() => onNavigate(photos[currentIndex + 1])}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  )
}

function ViewerButton({
  onClick,
  disabled,
  title,
  children
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
    >
      {children}
    </button>
  )
}
