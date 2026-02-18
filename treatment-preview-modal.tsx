import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { FaceDiagram, DiagramViewTabs } from './face-diagram'
import { ToothChart } from './tooth-chart'
import { ArchZoneDiagram } from './arch-zone-diagram'

interface InjectionPoint {
  id: string
  x: number
  y: number
  label?: string
  color?: string
}

interface AnnotationData {
  id: string
  treatmentId: string
  diagramView: string | null
  pointsJson: string | null
}

interface TreatmentAreaItem {
  areaName: string
  areaColor: string | null
  units: number | null
}

type DiagramContext = 'facial' | 'dental'

interface TreatmentPreviewModalProps {
  treatmentId: string
  productName?: string | null
  productCategory?: string | null
  areas?: TreatmentAreaItem[]
  onClose: () => void
}

// Facial views
type FacialView = 'front' | 'left' | 'right' | 'three_quarter'
const FACIAL_VIEWS: FacialView[] = ['front', 'left', 'right', 'three_quarter']

// Dental views
type DentalView = 'tooth_chart' | 'arch_zones'
const DENTAL_VIEWS: DentalView[] = ['tooth_chart', 'arch_zones']

type AnyView = FacialView | DentalView
const ALL_VIEWS: AnyView[] = [...FACIAL_VIEWS, ...DENTAL_VIEWS]

// Determine if a product category slug is dental
const DENTAL_SLUGS = [
  'whitening', 'veneer', 'bonding', 'crowns-bridges',
  'orthodontics', 'implants', 'gum-contouring', 'resin-infiltration'
]

function getDiagramContext(productCategory?: string | null): DiagramContext {
  if (productCategory && DENTAL_SLUGS.includes(productCategory)) return 'dental'
  return 'facial'
}

export function TreatmentPreviewModal({
  treatmentId,
  productName,
  productCategory,
  areas,
  onClose
}: TreatmentPreviewModalProps): React.JSX.Element {
  const diagramContext = getDiagramContext(productCategory)
  const availableViews = diagramContext === 'dental' ? DENTAL_VIEWS : FACIAL_VIEWS

  const [activeView, setActiveView] = useState<AnyView>(availableViews[0])
  const [annotations, setAnnotations] = useState<Record<string, AnnotationData | null>>({})
  const [points, setPoints] = useState<Record<string, InjectionPoint[]>>({})
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([])
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Load existing annotations
  useEffect(() => {
    window.api.annotations.listForTreatment(treatmentId).then((list) => {
      const annMap: Record<string, AnnotationData | null> = {}
      const ptsMap: Record<string, InjectionPoint[]> = {}

      // Initialize all views
      for (const v of ALL_VIEWS) {
        annMap[v] = null
        ptsMap[v] = []
      }

      for (const ann of list) {
        const view = ann.diagramView as string
        if (ALL_VIEWS.includes(view as AnyView)) {
          annMap[view] = ann as AnnotationData
          try {
            const parsed = ann.pointsJson ? JSON.parse(ann.pointsJson) : []
            // For tooth_chart, the parsed data might include selectedTeeth
            if (view === 'tooth_chart' && parsed.selectedTeeth) {
              setSelectedTeeth(parsed.selectedTeeth)
              ptsMap[view] = parsed.points || []
            } else if (view === 'arch_zones' && parsed.selectedZones) {
              setSelectedZones(parsed.selectedZones)
              ptsMap[view] = []
            } else {
              ptsMap[view] = Array.isArray(parsed) ? parsed : []
            }
          } catch {
            ptsMap[view] = []
          }
        }
      }

      setAnnotations(annMap)
      setPoints(ptsMap)
    })
  }, [treatmentId])

  const primaryColor = areas?.[0]?.areaColor || '#3B82F6'

  const handleAddPoint = useCallback(
    (x: number, y: number) => {
      setPoints((prev) => {
        const viewPoints = [...(prev[activeView] || [])]
        const newPoint: InjectionPoint = {
          id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          x,
          y,
          color: primaryColor
        }
        viewPoints.push(newPoint)
        return { ...prev, [activeView]: viewPoints }
      })
    },
    [activeView, primaryColor]
  )

  const handleRemovePoint = useCallback(
    (pointId: string) => {
      setPoints((prev) => {
        const viewPoints = (prev[activeView] || []).filter((p) => p.id !== pointId)
        return { ...prev, [activeView]: viewPoints }
      })
    },
    [activeView]
  )

  const handleToggleTooth = useCallback((toothId: string) => {
    setSelectedTeeth((prev) =>
      prev.includes(toothId) ? prev.filter((t) => t !== toothId) : [...prev, toothId]
    )
  }, [])

  const handleToggleZone = useCallback((zoneId: string) => {
    setSelectedZones((prev) =>
      prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]
    )
  }, [])

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    for (const view of ALL_VIEWS) {
      const viewPoints = points[view] || []
      const existing = annotations[view]

      let json: string
      if (view === 'tooth_chart') {
        json = JSON.stringify({ selectedTeeth, points: viewPoints })
      } else if (view === 'arch_zones') {
        json = JSON.stringify({ selectedZones })
      } else {
        json = JSON.stringify(viewPoints)
      }

      const hasData =
        view === 'tooth_chart'
          ? selectedTeeth.length > 0 || viewPoints.length > 0
          : view === 'arch_zones'
            ? selectedZones.length > 0
            : viewPoints.length > 0

      if (existing) {
        await window.api.annotations.update(existing.id, { pointsJson: json })
      } else if (hasData) {
        await window.api.annotations.create({
          treatmentId,
          diagramView: view,
          pointsJson: json
        })
      }
    }
    setSaving(false)
    onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const totalPoints = availableViews.reduce(
    (sum, v) => sum + (points[v]?.length || 0),
    0
  )
  const totalSelections =
    diagramContext === 'dental' ? selectedTeeth.length + selectedZones.length : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-0 border border-border/30 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div>
            <h3 className="text-base font-semibold">
              {diagramContext === 'dental' ? 'Treatment Mapping' : 'Injection Site Mapping'}
            </h3>
            {productName && (
              <p className="text-[12px] text-muted-foreground/60 mt-0.5">{productName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {/* View Tabs */}
          <div className="flex items-center justify-between mb-4">
            <DiagramViewTabs
              activeView={activeView}
              onChangeView={setActiveView as (view: string) => void}
              context={diagramContext}
            />
            <span className="text-[11px] text-muted-foreground/50">
              {totalPoints > 0 && (
                <>
                  {totalPoints} point{totalPoints !== 1 ? 's' : ''} placed
                </>
              )}
              {totalSelections > 0 && (
                <>
                  {totalPoints > 0 ? ' · ' : ''}
                  {totalSelections} selected
                </>
              )}
            </span>
          </div>

          {/* Diagram */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Facial views */}
              {FACIAL_VIEWS.includes(activeView as FacialView) && (
                <FaceDiagram
                  view={activeView as FacialView}
                  points={points[activeView] || []}
                  onAddPoint={handleAddPoint}
                  onRemovePoint={handleRemovePoint}
                  color={primaryColor}
                  interactive={true}
                />
              )}

              {/* Tooth Chart */}
              {activeView === 'tooth_chart' && (
                <ToothChart
                  selectedTeeth={selectedTeeth}
                  onToggleTooth={handleToggleTooth}
                  points={points['tooth_chart'] || []}
                  onAddPoint={handleAddPoint}
                  onRemovePoint={handleRemovePoint}
                  color={primaryColor}
                  interactive={true}
                />
              )}

              {/* Arch Zone Diagram */}
              {activeView === 'arch_zones' && (
                <ArchZoneDiagram
                  selectedZones={selectedZones}
                  onToggleZone={handleToggleZone}
                  color={primaryColor}
                  interactive={true}
                />
              )}
            </div>
          </div>

          {/* Area Legend */}
          {areas && areas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {areas.map((area) => (
                <span
                  key={area.areaName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: `${area.areaColor || '#3B82F6'}15`,
                    color: area.areaColor || '#3B82F6',
                    border: `1px solid ${area.areaColor || '#3B82F6'}30`
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: area.areaColor || '#3B82F6' }}
                  />
                  {area.areaName}
                  {area.units != null && (
                    <span className="opacity-60">{area.units}u</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Selected teeth summary for dental */}
          {diagramContext === 'dental' && selectedTeeth.length > 0 && (
            <div className="mt-3 text-center">
              <p className="text-[11px] text-muted-foreground/60">
                Selected teeth: {selectedTeeth.sort().join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/30">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-[13px] px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-[13px] px-4 py-2"
          >
            {saving ? 'Saving...' : 'Save Map'}
          </button>
        </div>
      </div>
    </div>
  )
}
