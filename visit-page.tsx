import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Calendar, Clock, FileText, ChevronDown, Eye, FileDown } from 'lucide-react'
import { useToastStore } from '../stores/toast.store'
import { NotesEditor } from '../components/visit/notes-editor'
import { PhotoUpload } from '../components/visit/photo-upload'
import { PhotoGrid, VisitContext } from '../components/visit/photo-grid'
import { PhotoViewerModal } from '../components/visit/photo-viewer-modal'
import { TreatmentTable } from '../components/treatment/treatment-table'
import { TreatmentPreviewModal } from '../components/annotation/treatment-preview-modal'
import { ConsentSigningModal } from '../components/consent/consent-signing-modal'

interface TreatmentWithProduct {
  id: string
  treatmentType: string | null
  productName: string | null
  productCategory: string | null
}

interface TreatmentAreaItem {
  areaName: string
  areaColor: string | null
  units: number | null
}

interface ConsentRecord {
  id: string
  patientId: string
  visitId: string | null
  type: string
  consentText: string | null
  signatureData: string | null
  signedAt: string | null
  createdAt: string
}

interface ConsentTemplate {
  id: string
  name: string
  type: string
  contentJson: string | null
  isDefault: boolean
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface Visit {
  id: string
  patientId: string
  date: string
  time: string | null
  clinicalNotes: string | null
  practitionerId: string | null
}

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

export function VisitPage(): React.JSX.Element {
  const { patientId, visitId } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewerPhoto, setViewerPhoto] = useState<Photo | null>(null)
  const [previewTreatmentId, setPreviewTreatmentId] = useState<string | null>(null)
  const [previewProduct, setPreviewProduct] = useState<string | null>(null)
  const [previewProductCategory, setPreviewProductCategory] = useState<string | null>(null)
  const [previewAreas, setPreviewAreas] = useState<TreatmentAreaItem[]>([])
  const [visitContext, setVisitContext] = useState<VisitContext>('facial')
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [consentTemplates, setConsentTemplates] = useState<ConsentTemplate[]>([])
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null)
  const [showConsentDropdown, setShowConsentDropdown] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { addToast } = useToastStore()

  // Form state
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')

  // Derive visitContext from treatments' category types
  const deriveVisitContext = useCallback(async () => {
    if (!visitId) return
    try {
      const [treatments, categories] = await Promise.all([
        window.api.treatments.list(visitId),
        window.api.treatmentCategories.list()
      ])
      const categoryMap = new Map(categories.map((c: { slug: string; type: string }) => [c.slug, c.type]))
      let hasFacial = false
      let hasDental = false
      for (const t of treatments) {
        const type = categoryMap.get(t.treatmentType || '') || 'facial'
        if (type === 'facial') hasFacial = true
        if (type === 'dental') hasDental = true
      }
      if (hasFacial && hasDental) setVisitContext('mixed')
      else if (hasDental) setVisitContext('dental')
      else setVisitContext('facial')
    } catch {
      setVisitContext('facial')
    }
  }, [visitId])

  useEffect(() => {
    if (!patientId || !visitId) return

    Promise.all([
      window.api.patients.get(patientId),
      window.api.visits.get(visitId),
      window.api.photos.list(visitId),
      window.api.consents.listForVisit(visitId),
      window.api.consentTemplates.list()
    ]).then(([p, v, ph, cons, tmpls]) => {
      setPatient(p as Patient | null)
      setVisit(v as Visit | null)
      setPhotos(ph)
      setConsents(cons)
      setConsentTemplates(tmpls)
      if (v) {
        setDate(v.date)
        setTime(v.time || '')
        setClinicalNotes(v.clinicalNotes || '')
      }
      setLoading(false)
    })

    deriveVisitContext()
  }, [patientId, visitId, deriveVisitContext])

  const loadConsents = useCallback(async () => {
    if (!visitId) return
    const cons = await window.api.consents.listForVisit(visitId)
    setConsents(cons)
  }, [visitId])

  const loadPhotos = useCallback(async () => {
    if (!visitId) return
    const ph = await window.api.photos.list(visitId)
    setPhotos(ph)
  }, [visitId])

  const handleSave = async (): Promise<void> => {
    if (!visitId) return
    setSaving(true)
    await window.api.visits.update(visitId, { date, time, clinicalNotes })
    setSaving(false)
  }

  const handleDelete = async (): Promise<void> => {
    if (!visitId || !patientId) return
    await window.api.visits.delete(visitId)
    navigate(`/patients/${patientId}`)
  }

  const handleExportPDF = async (): Promise<void> => {
    if (!visitId) return
    setExporting(true)
    try {
      const result = await window.api.exports.visitReport(visitId)
      addToast({ type: 'success', message: `PDF exported: ${result.filename}` })
      await window.api.exports.openFile(result.path)
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to export PDF' })
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleDeletePhoto = async (photoId: string): Promise<void> => {
    await window.api.photos.delete(photoId)
    loadPhotos()
  }

  const handleUpdatePhoto = async (photoId: string, data: Record<string, unknown>): Promise<void> => {
    await window.api.photos.update(photoId, data)
    loadPhotos()
  }

  const handleExportAll = async (): Promise<void> => {
    if (!visitId) return
    await window.api.photos.exportAll(visitId)
  }

  const handlePreview = async (treatmentId: string): Promise<void> => {
    const treatments = await window.api.treatments.list(visit!.id)
    const t = treatments.find((tr: TreatmentWithProduct) => tr.id === treatmentId)
    const areas = await window.api.treatmentAreas.list(treatmentId)
    setPreviewProduct(t?.productName || null)
    setPreviewProductCategory(t?.productCategory || t?.treatmentType || null)
    setPreviewAreas(areas.map((a: TreatmentAreaItem & { treatedAreaId: string; id: string; treatmentId: string; cost: number | null; createdAt: string }) => ({
      areaName: a.areaName,
      areaColor: a.areaColor,
      units: a.units
    })))
    setPreviewTreatmentId(treatmentId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading visit...</p>
        </div>
      </div>
    )
  }

  if (!visit || !patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Visit not found</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      {/* Breadcrumb */}
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
        Patients /{' '}
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="hover:text-foreground transition-colors"
        >
          {patient.firstName} {patient.lastName}
        </button>{' '}
        / <span className="text-foreground">Visit {date}</span>
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
          <h1 className="text-xl font-semibold tracking-tight">Visit Record</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="btn-secondary text-[13px] text-red-400 hover:text-red-300 flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Visit
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-secondary text-[13px] flex items-center gap-1.5"
          >
            <FileDown className="h-3.5 w-3.5" />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-[13px] flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Visit Info Bar */}
      <div className="surface-elevated rounded-xl px-6 py-4 flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground/60" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field-input text-[13px] w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground/60" />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="field-input text-[13px] w-32"
          />
        </div>
        <div className="text-[13px] text-muted-foreground ml-auto">
          Practitioner: <span className="text-foreground font-medium">Dr. Warren</span>
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-3">Clinical Notes</h3>
        <NotesEditor content={clinicalNotes} onChange={setClinicalNotes} />
      </div>

      {/* Consent Forms */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary/70" />
            Consent Forms
          </h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowConsentDropdown(!showConsentDropdown)}
              className="btn-secondary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
            >
              Add Consent
              <ChevronDown className="h-3 w-3" />
            </button>
            {showConsentDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-background border border-border/50 rounded-lg shadow-xl z-20 min-w-[200px] py-1">
                {consentTemplates.map((tmpl) => {
                  const alreadySigned = consents.some((c) => c.type === tmpl.type)
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      disabled={alreadySigned}
                      onClick={() => {
                        setSelectedTemplate(tmpl)
                        setShowConsentModal(true)
                        setShowConsentDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-1 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between gap-2"
                    >
                      <span>{tmpl.name}</span>
                      {alreadySigned && (
                        <span className="text-[10px] text-green-400 font-medium">Signed</span>
                      )}
                    </button>
                  )
                })}
                {consentTemplates.length === 0 && (
                  <p className="px-3 py-2 text-[12px] text-muted-foreground/60">
                    No templates available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {consents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {consents.map((consent) => (
              <div
                key={consent.id}
                className="surface-elevated rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium capitalize">
                      {consent.type.replace(/_/g, ' ')} Consent
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Signed{' '}
                      {consent.signedAt
                        ? new Date(consent.signedAt).toLocaleDateString('en-CA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-surface-1"
                  title="View consent"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="surface-elevated rounded-xl py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[13px] text-muted-foreground/50">No consents signed yet</p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">
              Use the button above to add a consent form
            </p>
          </div>
        )}
      </div>

      {/* Photos Section */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold mb-3">Photos</h3>
        <PhotoUpload
          patientId={patient.id}
          visitId={visit.id}
          onPhotosImported={loadPhotos}
        />
        <div className="mt-4">
          <PhotoGrid
            photos={photos}
            visitContext={visitContext}
            onPhotoClick={(p) => setViewerPhoto(p)}
            onDeletePhoto={handleDeletePhoto}
            onExportAll={handleExportAll}
            onUpdatePhoto={handleUpdatePhoto}
          />
        </div>
      </div>

      {/* Treatment Records */}
      <div className="mb-8">
        <TreatmentTable visitId={visit.id} onPreview={handlePreview} />
      </div>

      {/* Photo Viewer Modal */}
      {viewerPhoto && (
        <PhotoViewerModal
          photo={viewerPhoto}
          photos={photos}
          onClose={() => setViewerPhoto(null)}
          onNavigate={(p) => setViewerPhoto(p)}
          onPhotoUpdated={loadPhotos}
        />
      )}

      {/* Consent Signing Modal */}
      {showConsentModal && selectedTemplate && patient && (
        <ConsentSigningModal
          template={selectedTemplate}
          patientId={patient.id}
          visitId={visitId}
          onSigned={() => {
            setShowConsentModal(false)
            setSelectedTemplate(null)
            loadConsents()
          }}
          onClose={() => {
            setShowConsentModal(false)
            setSelectedTemplate(null)
          }}
        />
      )}

      {/* Injection Site Preview Modal */}
      {previewTreatmentId && (
        <TreatmentPreviewModal
          treatmentId={previewTreatmentId}
          productName={previewProduct}
          productCategory={previewProductCategory}
          areas={previewAreas}
          onClose={() => setPreviewTreatmentId(null)}
        />
      )}
    </div>
  )
}
