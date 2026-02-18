import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { AreaTag } from './area-tag'

interface Product {
  id: string
  name: string
  brand: string | null
  category: string
  unitType: string | null
  defaultCost: number | null
  color: string | null
}

interface TreatedArea {
  id: string
  name: string
  color: string | null
}

interface TreatmentCategory {
  id: string
  name: string
  slug: string
  type: string
  color: string | null
}

interface AreaEntry {
  treatedAreaId: string
  name: string
  color: string | null
  units: number
  cost: number
}

interface TreatmentFormProps {
  visitId: string
  editData?: {
    id: string
    treatmentType: string | null
    productId: string | null
    lotNumber: string | null
    expiryDate: string | null
    areas: AreaEntry[]
  } | null
  onSave: () => void
  onClose: () => void
}

export function TreatmentForm({
  visitId,
  editData,
  onSave,
  onClose
}: TreatmentFormProps): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [treatedAreas, setTreatedAreas] = useState<TreatedArea[]>([])
  const [categories, setCategories] = useState<TreatmentCategory[]>([])
  const [treatmentType, setTreatmentType] = useState(editData?.treatmentType || '')
  const [productId, setProductId] = useState(editData?.productId || '')
  const [lotNumber, setLotNumber] = useState(editData?.lotNumber || '')
  const [expiryDate, setExpiryDate] = useState(editData?.expiryDate || '')
  const [areas, setAreas] = useState<AreaEntry[]>(editData?.areas || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      window.api.products.list(),
      window.api.treatedAreas.list(),
      window.api.treatmentCategories.list()
    ]).then(([prods, areas, cats]) => {
      setProducts(prods)
      setTreatedAreas(areas)
      setCategories(cats)
      // Set default treatment type if not editing
      if (!editData?.treatmentType && cats.length > 0) {
        setTreatmentType(cats[0].slug)
      }
    })
  }, [editData])

  const filteredProducts = products.filter((p) => p.category === treatmentType)
  const selectedProduct = products.find((p) => p.id === productId)
  const availableAreas = treatedAreas.filter(
    (a) => !areas.some((ae) => ae.treatedAreaId === a.id)
  )

  const addArea = (area: TreatedArea): void => {
    setAreas([
      ...areas,
      {
        treatedAreaId: area.id,
        name: area.name,
        color: area.color,
        units: 0,
        cost: 0
      }
    ])
  }

  const updateArea = (index: number, field: 'units' | 'cost', value: number): void => {
    const updated = [...areas]
    updated[index] = { ...updated[index], [field]: value }
    setAreas(updated)
  }

  const removeArea = (index: number): void => {
    setAreas(areas.filter((_, i) => i !== index))
  }

  const totalUnits = areas.reduce((sum, a) => sum + a.units, 0)
  const totalCost = areas.reduce((sum, a) => sum + a.cost, 0)

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      if (editData?.id) {
        // Update existing treatment
        await window.api.treatments.update(editData.id, {
          treatmentType,
          productId: productId || null,
          lotNumber: lotNumber || null,
          expiryDate: expiryDate || null,
          totalUnits,
          totalCost
        })
        // Delete old areas and recreate
        const oldAreas = await window.api.treatmentAreas.list(editData.id)
        for (const oa of oldAreas) {
          await window.api.treatmentAreas.delete(oa.id)
        }
        for (const area of areas) {
          await window.api.treatmentAreas.create({
            treatmentId: editData.id,
            treatedAreaId: area.treatedAreaId,
            units: area.units,
            cost: area.cost
          })
        }
      } else {
        // Create new treatment
        const treatment = await window.api.treatments.create({
          visitId,
          treatmentType,
          productId: productId || null,
          lotNumber: lotNumber || null,
          expiryDate: expiryDate || null,
          totalUnits,
          totalCost
        })
        // Create treatment areas
        for (const area of areas) {
          await window.api.treatmentAreas.create({
            treatmentId: treatment.id,
            treatedAreaId: area.treatedAreaId,
            units: area.units,
            cost: area.cost
          })
        }
      }
      onSave()
    } catch (err) {
      console.error('Failed to save treatment:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-8">
      <div className="bg-background rounded-2xl border border-border/50 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold">
            {editData ? 'Edit Treatment' : 'Add Treatment'}
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Treatment Type + Product */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Treatment Type
              </label>
              <select
                value={treatmentType}
                onChange={(e) => {
                  setTreatmentType(e.target.value)
                  setProductId('')
                }}
                className="field-input w-full text-[13px]"
              >
                {(() => {
                  const facialCats = categories.filter((c) => c.type === 'facial')
                  const dentalCats = categories.filter((c) => c.type === 'dental')
                  return (
                    <>
                      {facialCats.length > 0 && (
                        <optgroup label="Facial">
                          {facialCats.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {dentalCats.length > 0 && (
                        <optgroup label="Dental">
                          {dentalCats.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )
                })()}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Product
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="field-input w-full text-[13px]"
              >
                <option value="">Select product...</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lot # + Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Lot Number
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="field-input w-full text-[13px]"
                placeholder="Enter lot #"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="field-input w-full text-[13px]"
              />
            </div>
          </div>

          {/* Areas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Treatment Areas
              </label>
              {availableAreas.length > 0 && (
                <div className="relative group">
                  <button
                    type="button"
                    className="text-[12px] text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Area
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-surface-1 border border-border/50 rounded-lg shadow-xl z-10 hidden group-hover:block min-w-[180px]">
                    {availableAreas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => addArea(area)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-surface-2 text-left"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: area.color || '#888' }}
                        />
                        {area.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {areas.length === 0 ? (
              <p className="text-[13px] text-muted-foreground/60 py-4 text-center">
                No areas added yet
              </p>
            ) : (
              <div className="space-y-2">
                {areas.map((area, index) => (
                  <div
                    key={area.treatedAreaId}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-1/50 border border-border/30"
                  >
                    <AreaTag name={area.name} color={area.color} />
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="number"
                        value={area.units || ''}
                        onChange={(e) => updateArea(index, 'units', parseFloat(e.target.value) || 0)}
                        className="field-input w-20 text-[13px] text-center"
                        placeholder={selectedProduct?.unitType || 'units'}
                      />
                      <span className="text-[11px] text-muted-foreground/60">
                        {selectedProduct?.unitType || 'units'}
                      </span>
                      <input
                        type="number"
                        value={area.cost || ''}
                        onChange={(e) => updateArea(index, 'cost', parseFloat(e.target.value) || 0)}
                        className="field-input w-24 text-[13px] text-center"
                        placeholder="$0.00"
                        step="0.01"
                      />
                      <button
                        type="button"
                        onClick={() => removeArea(index)}
                        className="text-muted-foreground/40 hover:text-red-400 ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {areas.length > 0 && (
            <div className="flex justify-end gap-6 text-[13px] pt-2 border-t border-border/30">
              <span className="text-muted-foreground">
                Total: {totalUnits} {selectedProduct?.unitType || 'units'}
              </span>
              <span className="font-semibold text-primary">${totalCost.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="btn-secondary text-[13px]">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-[13px]"
          >
            {saving ? 'Saving...' : editData ? 'Update Treatment' : 'Add Treatment'}
          </button>
        </div>
      </div>
    </div>
  )
}
