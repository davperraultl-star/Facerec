import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, ImagePlus, Loader2 } from 'lucide-react'

interface PhotoUploadProps {
  patientId: string
  visitId: string
  onPhotosImported: () => void
}

export function PhotoUpload({
  patientId,
  visitId,
  onPhotosImported
}: PhotoUploadProps): React.JSX.Element {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      setImporting(true)
      setProgress({ current: 0, total: acceptedFiles.length })

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setProgress({ current: i + 1, total: acceptedFiles.length })
        try {
          await window.api.photos.import(file.path, patientId, visitId)
        } catch (err) {
          console.error('Failed to import photo:', file.name, err)
        }
      }

      setImporting(false)
      onPhotosImported()
    },
    [patientId, visitId, onPhotosImported]
  )

  const handleBrowse = async (): Promise<void> => {
    const filePaths = await window.api.photos.selectFiles()
    if (filePaths.length === 0) return

    setImporting(true)
    setProgress({ current: 0, total: filePaths.length })

    for (let i = 0; i < filePaths.length; i++) {
      setProgress({ current: i + 1, total: filePaths.length })
      try {
        await window.api.photos.import(filePaths[i], patientId, visitId)
      } catch (err) {
        console.error('Failed to import photo:', err)
      }
    }

    setImporting(false)
    onPhotosImported()
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.tiff']
    },
    noClick: true
  })

  return (
    <div
      {...getRootProps()}
      className={`relative rounded-xl border-2 border-dashed transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border/50 hover:border-border'
      }`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center py-8 gap-3">
        {importing ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Importing {progress.current} of {progress.total}...
            </p>
          </>
        ) : isDragActive ? (
          <>
            <ImagePlus className="h-8 w-8 text-primary" />
            <p className="text-sm text-primary font-medium">Drop photos here</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Drag & drop photos here
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">or</p>
              <button
                type="button"
                onClick={handleBrowse}
                className="mt-2 btn-primary text-[13px] px-4 py-1.5"
              >
                Browse Files
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
