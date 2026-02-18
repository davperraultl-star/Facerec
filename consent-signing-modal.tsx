import { useState, useRef, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { X, Eraser, PenTool } from 'lucide-react'

interface ConsentTemplate {
  id: string
  name: string
  type: string
  contentJson: string | null
  isDefault: boolean
}

interface ConsentContentJson {
  title: string
  sections: { heading: string; body: string }[]
  acknowledgment: string
}

interface ConsentSigningModalProps {
  template: ConsentTemplate
  patientId: string
  visitId?: string
  onSigned: (consent: Record<string, unknown>) => void
  onClose: () => void
}

export function ConsentSigningModal({
  template,
  patientId,
  visitId,
  onSigned,
  onClose
}: ConsentSigningModalProps): React.JSX.Element {
  const sigCanvasRef = useRef<SignatureCanvas | null>(null)
  const [hasSigned, setHasSigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Parse template content
  let content: ConsentContentJson | null = null
  try {
    if (template.contentJson) {
      content = JSON.parse(template.contentJson)
    }
  } catch {
    content = null
  }

  const handleClear = useCallback(() => {
    sigCanvasRef.current?.clear()
    setHasSigned(false)
  }, [])

  const handleEnd = useCallback(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setHasSigned(true)
    }
  }, [])

  const handleSign = async (): Promise<void> => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) return

    setSubmitting(true)
    try {
      const signatureData = sigCanvasRef.current.toDataURL('image/png')
      const result = await window.api.consents.create({
        patientId,
        visitId: visitId || null,
        type: template.type,
        consentText: template.contentJson || '',
        signatureData,
        signedAt: new Date().toISOString()
      })
      onSigned(result)
    } catch (err) {
      console.error('Failed to save consent:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-base font-semibold">
              {content?.title || template.name}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Please read carefully and sign below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {content ? (
            <>
              {content.sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[13px] font-semibold mb-1.5">{section.heading}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}

              {/* Acknowledgment */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-[13px] font-medium text-foreground leading-relaxed">
                  {content.acknowledgment}
                </p>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              No content available for this template. The consent text will be recorded with your
              signature.
            </p>
          )}
        </div>

        {/* Signature Area */}
        <div className="border-t border-border/50 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-[12px] font-medium">Signature</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Eraser className="h-3 w-3" />
              Clear
            </button>
          </div>

          {/* Canvas */}
          <div className="border border-border/50 rounded-lg bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="#1a1a1a"
              canvasProps={{
                width: 652,
                height: 150,
                className: 'w-full cursor-crosshair'
              }}
              onEnd={handleEnd}
            />
          </div>

          {!hasSigned && (
            <p className="text-[11px] text-muted-foreground/60 text-center">
              Sign above using your mouse or trackpad
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-[13px] px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={!hasSigned || submitting}
              className="btn-primary text-[13px] px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'I Agree & Sign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
