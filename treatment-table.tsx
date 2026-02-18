import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { AreaTag } from './area-tag'
import { CostSummary } from './cost-summary'
import { TreatmentForm } from './treatment-form'

interface TreatmentWithProduct {
  id: string
  visitId: string
  treatmentType: string | null
  productId: string | null
  lotNumber: string | null
  expiryDate: string | null
  totalUnits: number | null
  totalCost: number | null
  productName: string | null
  productBrand: string | null
  productColor: string | null
  productCategory: string | null
  productUnitType: string | null
}

interface TreatmentAreaItem {
  id: string
  treatmentId: string
  treatedAreaId: string
  units: number | null
  cost: number | null
  areaName: string
  areaColor: string | null
}

interface TreatmentTableProps {
  visitId: string
  onPreview?: (treatmentId: string) => void
}

export function TreatmentTable({ visitId, onPreview }: TreatmentTableProps): React.JSX.Element {
  const [treatments, setTreatments] = useState<TreatmentWithProduct[]>([])
  const [treatmentAreas, setTreatmentAreas] = useState<Record<string, TreatmentAreaItem[]>>({})
  const [showForm, setShowForm] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<string | null>(null)

  const loadTreatments = useCallback(async () => {
    const list = await window.api.treatments.list(visitId)
    setTreatments(list)

    // Load areas for each treatment
    const areasMap: Record<string, TreatmentAreaItem[]> = {}
    for (const t of list) {
      areasMap[t.id] = await window.api.treatmentAreas.list(t.id)
    }
    setTreatmentAreas(areasMap)
  }, [visitId])

  useEffect(() => {
    loadTreatments()
  }, [loadTreatments])

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.treatments.delete(id)
    loadTreatments()
  }

  const handleEdit = (treatment: TreatmentWithProduct): void => {
    setEditingTreatment(treatment.id)
    setShowForm(true)
  }

  const subtotal = treatments.reduce((sum, t) => sum + (t.totalCost || 0), 0)

  const getEditData = () => {
    if (!editingTreatment) return null
    const t = treatments.find((tr) => tr.id === editingTreatment)
    if (!t) return null
    const areas = (treatmentAreas[t.id] || []).map((a) => ({
      treatedAreaId: a.treatedAreaId,
      name: a.areaName,
      color: a.areaColor,
      units: a.units || 0,
      cost: a.cost || 0
    }))
    return {
      id: t.id,
      treatmentType: t.treatmentType,
      productId: t.productId,
      lotNumber: t.lotNumber,
      expiryDate: t.expiryDate,
      areas
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Treatment Records</h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingTreatment(null)
              setShowForm(true)
            }}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Treatment
          </button>
        </div>
      </div>

      {treatments.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground/60">
          No treatments recorded yet
        </div>
      ) : (
        <>
          <div className="surface-elevated rounded-xl overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border/40">
                  <th>Type</th>
                  <th>Product</th>
                  <th>Lot #</th>
                  <th>Expiry</th>
                  <th>Areas</th>
                  <th className="text-right">Units</th>
                  <th className="text-right">Cost</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((t) => (
                  <tr key={t.id} className="border-b border-border/20">
                    <td className="capitalize text-[13px]">{t.treatmentType || '—'}</td>
                    <td>
                      <span className="text-[13px] font-medium">{t.productName || '—'}</span>
                      {t.productBrand && (
                        <span className="text-[11px] text-muted-foreground/60 ml-1">
                          ({t.productBrand})
                        </span>
                      )}
                    </td>
                    <td className="text-[13px]">{t.lotNumber || '—'}</td>
                    <td className="text-[13px]">{t.expiryDate || '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(treatmentAreas[t.id] || []).map((a) => (
                          <AreaTag
                            key={a.id}
                            name={a.areaName}
                            color={a.areaColor}
                            units={a.units}
                            cost={a.cost}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="text-right text-[13px] font-medium">
                      {t.totalUnits || 0} {t.productUnitType || 'u'}
                    </td>
                    <td className="text-right text-[13px] font-medium">
                      ${(t.totalCost || 0).toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {onPreview && (
                          <button
                            type="button"
                            onClick={() => onPreview(t.id)}
                            className="p-1.5 rounded text-muted-foreground/60 hover:text-primary"
                            title="Preview injection sites"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(t)}
                          className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded text-muted-foreground/60 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost summary */}
          <div className="flex justify-end">
            <CostSummary subtotal={subtotal} />
          </div>
        </>
      )}

      {/* Treatment Form Modal */}
      {showForm && (
        <TreatmentForm
          visitId={visitId}
          editData={getEditData()}
          onSave={() => {
            setShowForm(false)
            setEditingTreatment(null)
            loadTreatments()
          }}
          onClose={() => {
            setShowForm(false)
            setEditingTreatment(null)
          }}
        />
      )}
    </div>
  )
}
