import { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Receipt,
  Syringe,
  MapPin,
  Building2,
  Layers,
  FileText,
  Users,
  Database,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react'
import { useToastStore } from '../stores/toast.store'

// ── Types ────────────────────────────────────────────────────────────
interface User {
  id: string
  name: string
  email: string | null
  role: string
  isActive: boolean
}

interface BackupInfo {
  filename: string
  path: string
  size: number
  createdAt: string
}

interface Product {
  id: string
  name: string
  brand: string | null
  category: string
  unitType: string | null
  defaultCost: number | null
  color: string | null
  isActive: boolean
}

interface TreatedArea {
  id: string
  name: string
  color: string | null
  isActive: boolean
}

interface TreatmentCategory {
  id: string
  name: string
  slug: string
  type: string
  color: string | null
  icon: string | null
  sortOrder: number | null
  isActive: boolean
}

interface ConsentTemplate {
  id: string
  name: string
  type: string
  contentJson: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// ── Main Settings Page ───────────────────────────────────────────────
export function Settings(): React.JSX.Element {
  return (
    <div className="max-w-4xl mx-auto px-8 py-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
        Configuration
      </p>
      <h1 className="text-xl font-semibold tracking-tight mt-2 mb-8">Settings</h1>

      <div className="space-y-10">
        <PractitionersSection />
        <ClinicSection />
        <TaxSection />
        <TreatmentCategoriesSection />
        <ConsentTemplatesSection />
        <ProductCatalogSection />
        <TreatedAreasSection />
        <BackupRestoreSection />
      </div>
    </div>
  )
}

// ── Practitioners Section ─────────────────────────────────────────────
function PractitionersSection(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const { addToast } = useToastStore()

  const load = useCallback(async () => {
    const list = await window.api.users.listAll()
    setUsers(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = async (): Promise<void> => {
    if (!newName.trim()) return
    await window.api.users.create({ name: newName.trim(), email: newEmail.trim() || undefined })
    setNewName('')
    setNewEmail('')
    setShowAdd(false)
    addToast({ type: 'success', message: 'Practitioner added' })
    load()
  }

  const handleSaveEdit = async (id: string): Promise<void> => {
    if (!editName.trim()) return
    await window.api.users.update(id, { name: editName.trim(), email: editEmail.trim() || null })
    setEditingId(null)
    addToast({ type: 'success', message: 'Practitioner updated' })
    load()
  }

  const handleToggleActive = async (user: User): Promise<void> => {
    await window.api.users.update(user.id, { isActive: !user.isActive })
    load()
  }

  const activeUsers = users.filter((u) => u.isActive)
  const inactiveUsers = users.filter((u) => !u.isActive)

  return (
    <section>
      <SectionHeader icon={Users} title="Practitioners" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/60">
            {activeUsers.length} active practitioner{activeUsers.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setEditingId(null)
            }}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Practitioner
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-border/40">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u) =>
                editingId === u.id ? (
                  <tr key={u.id} className="border-b border-border/20 bg-primary/5">
                    <td>
                      <input
                        className="field-input text-[13px] py-1.5"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(u.id)}
                      />
                    </td>
                    <td>
                      <input
                        className="field-input text-[13px] py-1.5"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(u.id)}
                          className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-muted-foreground hover:bg-accent rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="border-b border-border/20">
                    <td className="text-sm font-medium">{u.name}</td>
                    <td className="text-sm text-muted-foreground">{u.email || '—'}</td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(u.id)
                            setEditName(u.name)
                            setEditEmail(u.email || '')
                            setShowAdd(false)
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}

              {showAdd && (
                <tr className="border-b border-border/20 bg-primary/5">
                  <td>
                    <input
                      className="field-input text-[13px] py-1.5"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Practitioner name"
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      autoFocus
                    />
                  </td>
                  <td>
                    <input
                      className="field-input text-[13px] py-1.5"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </td>
                  <td>
                    <span className="text-xs text-muted-foreground">practitioner</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAdd}
                        className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setShowAdd(false)}
                        className="p-1 text-muted-foreground hover:bg-accent rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {inactiveUsers.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] text-muted-foreground/50 mb-2">Inactive</p>
            <div className="space-y-1">
              {inactiveUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-accent/30"
                >
                  <span className="text-[13px] text-muted-foreground">{u.name}</span>
                  <button
                    onClick={() => handleToggleActive(u)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Clinic Info Section ──────────────────────────────────────────────
function ClinicSection(): React.JSX.Element {
  const [clinicName, setClinicName] = useState('')
  const [currency, setCurrency] = useState('CAD')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings.getMultiple(['clinic_name', 'currency']).then((s) => {
      setClinicName(s['clinic_name'] || '')
      setCurrency(s['currency'] || 'CAD')
    })
  }, [])

  const handleSave = async (): Promise<void> => {
    await window.api.settings.setMultiple({
      clinic_name: clinicName,
      currency
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section>
      <SectionHeader icon={Building2} title="Clinic" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="field-input text-[13px] w-full"
              placeholder="My Clinic"
            />
          </div>
          <div>
            <label className="field-label">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="field-input text-[13px] w-full"
            >
              <option value="CAD">CAD ($)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </div>
    </section>
  )
}

// ── Tax Configuration Section ────────────────────────────────────────
function TaxSection(): React.JSX.Element {
  const [provincialRate, setProvincialRate] = useState('')
  const [provincialLabel, setProvincialLabel] = useState('')
  const [federalRate, setFederalRate] = useState('')
  const [federalLabel, setFederalLabel] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings
      .getMultiple([
        'tax_provincial_rate',
        'tax_provincial_label',
        'tax_federal_rate',
        'tax_federal_label'
      ])
      .then((s) => {
        setProvincialRate(s['tax_provincial_rate'] || '0')
        setProvincialLabel(s['tax_provincial_label'] || '')
        setFederalRate(s['tax_federal_rate'] || '0')
        setFederalLabel(s['tax_federal_label'] || '')
      })
  }, [])

  const handleSave = async (): Promise<void> => {
    await window.api.settings.setMultiple({
      tax_provincial_rate: provincialRate,
      tax_provincial_label: provincialLabel,
      tax_federal_rate: federalRate,
      tax_federal_label: federalLabel
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Live preview calculation
  const provRate = parseFloat(provincialRate) || 0
  const fedRate = parseFloat(federalRate) || 0
  const sampleSubtotal = 100
  const provTax = sampleSubtotal * (provRate / 100)
  const fedTax = sampleSubtotal * (fedRate / 100)
  const sampleTotal = sampleSubtotal + provTax + fedTax

  return (
    <section>
      <SectionHeader icon={Receipt} title="Taxes" />
      <div className="surface-elevated rounded-xl p-6 space-y-5">
        {/* Provincial Tax */}
        <div>
          <p className="text-[12px] font-medium text-muted-foreground/80 mb-3">Provincial / State Tax</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Label</label>
              <input
                type="text"
                value={provincialLabel}
                onChange={(e) => setProvincialLabel(e.target.value)}
                className="field-input text-[13px] w-full"
                placeholder="e.g. QST, PST, HST"
              />
            </div>
            <div>
              <label className="field-label">Rate (%)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="100"
                value={provincialRate}
                onChange={(e) => setProvincialRate(e.target.value)}
                className="field-input text-[13px] w-full"
                placeholder="9.975"
              />
            </div>
          </div>
        </div>

        {/* Federal Tax */}
        <div>
          <p className="text-[12px] font-medium text-muted-foreground/80 mb-3">Federal Tax</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Label</label>
              <input
                type="text"
                value={federalLabel}
                onChange={(e) => setFederalLabel(e.target.value)}
                className="field-input text-[13px] w-full"
                placeholder="e.g. GST"
              />
            </div>
            <div>
              <label className="field-label">Rate (%)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="100"
                value={federalRate}
                onChange={(e) => setFederalRate(e.target.value)}
                className="field-input text-[13px] w-full"
                placeholder="5"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface-1/50 rounded-lg p-4 border border-border/30">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
            Preview (on $100.00)
          </p>
          <div className="flex flex-col items-end gap-0.5 text-[13px]">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="w-20 text-right font-medium">${sampleSubtotal.toFixed(2)}</span>
            </div>
            {provRate > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {provincialLabel || 'Prov.'} ({provRate}%)
                </span>
                <span className="w-20 text-right">${provTax.toFixed(2)}</span>
              </div>
            )}
            {fedRate > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {federalLabel || 'Fed.'} ({fedRate}%)
                </span>
                <span className="w-20 text-right">${fedTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-1 border-t border-border/40 mt-1">
              <span className="font-semibold">Total</span>
              <span className="w-20 text-right font-semibold text-primary">
                ${sampleTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
      </div>
    </section>
  )
}

// ── Treatment Categories Section ─────────────────────────────────────
function TreatmentCategoriesSection(): React.JSX.Element {
  const [categories, setCategories] = useState<TreatmentCategory[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const list = await window.api.treatmentCategories.listAll()
    setCategories(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.treatmentCategories.delete(id)
    load()
  }

  const handleReactivate = async (id: string): Promise<void> => {
    await window.api.treatmentCategories.update(id, { isActive: true })
    load()
  }

  const activeCategories = categories.filter((c) => c.isActive)
  const inactiveCategories = categories.filter((c) => !c.isActive)

  return (
    <section>
      <SectionHeader icon={Layers} title="Treatment Categories" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/60">
            {activeCategories.length} active categor{activeCategories.length !== 1 ? 'ies' : 'y'}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setEditingId(null)
            }}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Category
          </button>
        </div>

        {/* Category Table */}
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-border/40">
                <th className="w-8"></th>
                <th>Name</th>
                <th>Slug</th>
                <th>Type</th>
                <th className="text-center">Sort</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {activeCategories.map((c) =>
                editingId === c.id ? (
                  <CategoryEditRow
                    key={c.id}
                    category={c}
                    onSave={() => {
                      setEditingId(null)
                      load()
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={c.id} className="border-b border-border/20">
                    <td>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.color || '#3B82F6' }}
                      />
                    </td>
                    <td className="text-[13px] font-medium">{c.name}</td>
                    <td className="text-[13px] text-muted-foreground font-mono">{c.slug}</td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          c.type === 'dental'
                            ? 'bg-cyan-500/15 text-cyan-400'
                            : 'bg-violet-500/15 text-violet-400'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="text-[13px] text-center text-muted-foreground">
                      {c.sortOrder ?? '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(c.id)}
                          className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded text-muted-foreground/60 hover:text-red-400"
                          title="Deactivate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {showAdd && (
                <CategoryEditRow
                  key="new"
                  category={null}
                  onSave={() => {
                    setShowAdd(false)
                    load()
                  }}
                  onCancel={() => setShowAdd(false)}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Inactive categories */}
        {inactiveCategories.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">
              Inactive ({inactiveCategories.length})
            </p>
            <div className="space-y-1">
              {inactiveCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-1/30 text-muted-foreground/50"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full opacity-40"
                      style={{ backgroundColor: c.color || '#3B82F6' }}
                    />
                    <span>{c.name}</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-medium uppercase tracking-wider opacity-50 ${
                        c.type === 'dental'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-violet-500/10 text-violet-400'
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReactivate(c.id)}
                    className="text-[11px] text-primary/70 hover:text-primary"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Category Edit Row ────────────────────────────────────────────────
function CategoryEditRow({
  category,
  onSave,
  onCancel
}: {
  category: TreatmentCategory | null
  onSave: () => void
  onCancel: () => void
}): React.JSX.Element {
  const [name, setName] = useState(category?.name || '')
  const [slug, setSlug] = useState(category?.slug || '')
  const [type, setType] = useState(category?.type || 'facial')
  const [color, setColor] = useState(category?.color || '#3B82F6')
  const [sortOrder, setSortOrder] = useState(
    category?.sortOrder != null ? String(category.sortOrder) : ''
  )
  const [autoSlug, setAutoSlug] = useState(!category)

  // Auto-generate slug from name when creating
  useEffect(() => {
    if (autoSlug && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      )
    }
  }, [name, autoSlug])

  const handleSave = async (): Promise<void> => {
    if (!name.trim() || !slug.trim()) return
    const data = {
      name: name.trim(),
      slug: slug.trim(),
      type,
      color,
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : undefined
    }

    if (category) {
      await window.api.treatmentCategories.update(category.id, data)
    } else {
      await window.api.treatmentCategories.create(data)
    }
    onSave()
  }

  return (
    <tr className="border-b border-border/20 bg-primary/[0.03]">
      <td>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
      </td>
      <td>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-input text-[12px] w-full"
          placeholder="Category name"
          autoFocus
        />
      </td>
      <td>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setAutoSlug(false)
          }}
          className="field-input text-[12px] w-full font-mono"
          placeholder="slug"
        />
      </td>
      <td>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="field-input text-[12px] w-full"
        >
          <option value="facial">Facial</option>
          <option value="dental">Dental</option>
        </select>
      </td>
      <td>
        <input
          type="number"
          min="0"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="field-input text-[12px] w-16 text-center"
          placeholder="0"
        />
      </td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={handleSave}
            className="p-1.5 rounded text-green-500 hover:text-green-400"
            title="Save"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Consent Templates Section ────────────────────────────────────────
const CONSENT_TYPES = [
  { value: 'botulinum', label: 'Botulinum Toxin', className: 'bg-blue-500/15 text-blue-400' },
  { value: 'filler', label: 'Dermal Filler', className: 'bg-pink-500/15 text-pink-400' },
  { value: 'photo', label: 'Photography', className: 'bg-amber-500/15 text-amber-400' },
  { value: 'dental_general', label: 'General Dental', className: 'bg-cyan-500/15 text-cyan-400' }
]

function getConsentTypeBadge(type: string): { label: string; className: string } {
  return CONSENT_TYPES.find((t) => t.value === type) || { label: type, className: 'bg-gray-500/15 text-gray-400' }
}

function ConsentTemplatesSection(): React.JSX.Element {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const list = await window.api.consentTemplates.list()
    setTemplates(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.consentTemplates.delete(id)
    load()
  }

  return (
    <section>
      <SectionHeader icon={FileText} title="Consent Templates" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/60">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setEditingId(null)
            }}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Template
          </button>
        </div>

        {/* Template Table */}
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-border/40">
                <th>Name</th>
                <th>Type</th>
                <th className="text-center">Default</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) =>
                editingId === t.id ? (
                  <ConsentTemplateEditRow
                    key={t.id}
                    template={t}
                    onSave={() => {
                      setEditingId(null)
                      load()
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={t.id} className="border-b border-border/20">
                    <td className="text-[13px] font-medium">{t.name}</td>
                    <td>
                      {(() => {
                        const badge = getConsentTypeBadge(t.type)
                        return (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="text-center">
                      {t.isDefault ? (
                        <span className="text-green-400 text-[12px]">✓</span>
                      ) : (
                        <span className="text-muted-foreground/30 text-[12px]">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(t.id)}
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
                )
              )}
              {showAdd && (
                <ConsentTemplateEditRow
                  key="new"
                  template={null}
                  onSave={() => {
                    setShowAdd(false)
                    load()
                  }}
                  onCancel={() => setShowAdd(false)}
                />
              )}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && !showAdd && (
          <p className="text-[13px] text-muted-foreground/50 text-center py-4">
            No consent templates yet. Add one to get started.
          </p>
        )}
      </div>
    </section>
  )
}

// ── Consent Template Edit Row ────────────────────────────────────────
function ConsentTemplateEditRow({
  template,
  onSave,
  onCancel
}: {
  template: ConsentTemplate | null
  onSave: () => void
  onCancel: () => void
}): React.JSX.Element {
  const [name, setName] = useState(template?.name || '')
  const [type, setType] = useState(template?.type || 'botulinum')
  const [isDefault, setIsDefault] = useState(template?.isDefault || false)
  const [contentJson, setContentJson] = useState(template?.contentJson || '')
  const [showContent, setShowContent] = useState(false)

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return
    const data = {
      name: name.trim(),
      type,
      isDefault,
      contentJson: contentJson || undefined
    }

    if (template) {
      await window.api.consentTemplates.update(template.id, data)
    } else {
      await window.api.consentTemplates.create(data)
    }
    onSave()
  }

  return (
    <>
      <tr className="border-b border-border/20 bg-primary/[0.03]">
        <td>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input text-[12px] w-full"
            placeholder="Template name"
            autoFocus
          />
        </td>
        <td>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="field-input text-[12px] w-full"
          >
            {CONSENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </td>
        <td className="text-center">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-border/50"
          />
        </td>
        <td>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setShowContent(!showContent)}
              className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
              title="Edit Content"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 rounded text-green-500 hover:text-green-400"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {showContent && (
        <tr className="border-b border-border/20 bg-primary/[0.03]">
          <td colSpan={4} className="p-3">
            <label className="field-label mb-1">Content (JSON)</label>
            <textarea
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              className="field-input text-[11px] font-mono w-full h-40 resize-y"
              placeholder='{"title": "...", "sections": [{"heading": "...", "body": "..."}], "acknowledgment": "..."}'
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Product Catalog Section ──────────────────────────────────────────
function ProductCatalogSection(): React.JSX.Element {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<TreatmentCategory[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const [list, cats] = await Promise.all([
      window.api.products.listAll(),
      window.api.treatmentCategories.list()
    ])
    setProducts(list)
    setCategories(cats)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.products.delete(id)
    load()
  }

  const handleReactivate = async (id: string): Promise<void> => {
    await window.api.products.update(id, { isActive: true })
    load()
  }

  const activeProducts = products.filter((p) => p.isActive)
  const inactiveProducts = products.filter((p) => !p.isActive)

  return (
    <section>
      <SectionHeader icon={Syringe} title="Product Catalog" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/60">
            {activeProducts.length} active product{activeProducts.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setEditingId(null)
            }}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Product
          </button>
        </div>

        {/* Product Table */}
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full data-table">
            <thead>
              <tr className="border-b border-border/40">
                <th className="w-8"></th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Unit</th>
                <th className="text-right">Default Cost</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {activeProducts.map((p) => {
                const cat = categories.find((c) => c.slug === p.category)
                return editingId === p.id ? (
                  <ProductEditRow
                    key={p.id}
                    product={p}
                    categories={categories}
                    onSave={() => {
                      setEditingId(null)
                      load()
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={p.id} className="border-b border-border/20">
                    <td>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color || '#3B82F6' }}
                      />
                    </td>
                    <td className="text-[13px] font-medium">{p.name}</td>
                    <td className="text-[13px] text-muted-foreground">{p.brand || '—'}</td>
                    <td>
                      {cat ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px]">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || '#3B82F6' }}
                          />
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-[13px] capitalize text-muted-foreground">
                          {p.category}
                        </span>
                      )}
                    </td>
                    <td className="text-[13px]">{p.unitType || '—'}</td>
                    <td className="text-[13px] text-right">
                      {p.defaultCost != null ? `$${p.defaultCost.toFixed(2)}` : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(p.id)}
                          className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded text-muted-foreground/60 hover:text-red-400"
                          title="Deactivate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {showAdd && (
                <ProductEditRow
                  key="new"
                  product={null}
                  categories={categories}
                  onSave={() => {
                    setShowAdd(false)
                    load()
                  }}
                  onCancel={() => setShowAdd(false)}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Inactive products */}
        {inactiveProducts.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">
              Inactive ({inactiveProducts.length})
            </p>
            <div className="space-y-1">
              {inactiveProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-1/30 text-muted-foreground/50"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full opacity-40"
                      style={{ backgroundColor: p.color || '#3B82F6' }}
                    />
                    <span>{p.name}</span>
                    {p.brand && <span className="text-muted-foreground/30">({p.brand})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReactivate(p.id)}
                    className="text-[11px] text-primary/70 hover:text-primary"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Product Edit Row ─────────────────────────────────────────────────
function ProductEditRow({
  product,
  categories,
  onSave,
  onCancel
}: {
  product: Product | null
  categories: TreatmentCategory[]
  onSave: () => void
  onCancel: () => void
}): React.JSX.Element {
  const [name, setName] = useState(product?.name || '')
  const [brand, setBrand] = useState(product?.brand || '')
  const [category, setCategory] = useState(product?.category || (categories[0]?.slug ?? 'neurotoxin'))
  const [unitType, setUnitType] = useState(product?.unitType || 'units')
  const [defaultCost, setDefaultCost] = useState(
    product?.defaultCost != null ? String(product.defaultCost) : ''
  )
  const [color, setColor] = useState(product?.color || '#3B82F6')

  const facialCats = categories.filter((c) => c.type === 'facial')
  const dentalCats = categories.filter((c) => c.type === 'dental')

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return
    const data = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      unitType,
      defaultCost: defaultCost ? parseFloat(defaultCost) : undefined,
      color
    }

    if (product) {
      await window.api.products.update(product.id, data)
    } else {
      await window.api.products.create(data)
    }
    onSave()
  }

  return (
    <tr className="border-b border-border/20 bg-primary/[0.03]">
      <td>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
      </td>
      <td>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-input text-[12px] w-full"
          placeholder="Product name"
          autoFocus
        />
      </td>
      <td>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="field-input text-[12px] w-full"
          placeholder="Brand"
        />
      </td>
      <td>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field-input text-[12px] w-full"
        >
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
        </select>
      </td>
      <td>
        <select
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
          className="field-input text-[12px] w-full"
        >
          <option value="units">Units</option>
          <option value="ml">mL</option>
          <option value="vial">Vial</option>
          <option value="unit">Unit</option>
          <option value="tray">Tray</option>
          <option value="session">Session</option>
          <option value="syringe">Syringe</option>
          <option value="application">Application</option>
        </select>
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          min="0"
          value={defaultCost}
          onChange={(e) => setDefaultCost(e.target.value)}
          className="field-input text-[12px] w-full text-right"
          placeholder="0.00"
        />
      </td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={handleSave}
            className="p-1.5 rounded text-green-500 hover:text-green-400"
            title="Save"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Treated Areas Section ────────────────────────────────────────────
function TreatedAreasSection(): React.JSX.Element {
  const [areas, setAreas] = useState<TreatedArea[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const list = await window.api.treatedAreas.listAll()
    setAreas(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.treatedAreas.delete(id)
    load()
  }

  const handleReactivate = async (id: string): Promise<void> => {
    await window.api.treatedAreas.update(id, { isActive: true })
    load()
  }

  const activeAreas = areas.filter((a) => a.isActive)
  const inactiveAreas = areas.filter((a) => !a.isActive)

  return (
    <section>
      <SectionHeader icon={MapPin} title="Treated Areas" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground/60">
            {activeAreas.length} active area{activeAreas.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setEditingId(null)
            }}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="h-3 w-3" />
            Add Area
          </button>
        </div>

        {/* Area List */}
        <div className="grid grid-cols-1 gap-2">
          {activeAreas.map((a) =>
            editingId === a.id ? (
              <AreaEditRow
                key={a.id}
                area={a}
                onSave={() => {
                  setEditingId(null)
                  load()
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={a.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/20 bg-surface-1/20"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: a.color || '#3B82F6' }}
                  />
                  <span className="text-[13px] font-medium">{a.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(a.id)}
                    className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded text-muted-foreground/60 hover:text-red-400"
                    title="Deactivate"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}
          {showAdd && (
            <AreaEditRow
              area={null}
              onSave={() => {
                setShowAdd(false)
                load()
              }}
              onCancel={() => setShowAdd(false)}
            />
          )}
        </div>

        {/* Inactive areas */}
        {inactiveAreas.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">
              Inactive ({inactiveAreas.length})
            </p>
            <div className="space-y-1">
              {inactiveAreas.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-1/30 text-muted-foreground/50"
                >
                  <div className="flex items-center gap-2 text-[12px]">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full opacity-40"
                      style={{ backgroundColor: a.color || '#3B82F6' }}
                    />
                    <span>{a.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReactivate(a.id)}
                    className="text-[11px] text-primary/70 hover:text-primary"
                  >
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Area Edit Row ────────────────────────────────────────────────────
function AreaEditRow({
  area,
  onSave,
  onCancel
}: {
  area: TreatedArea | null
  onSave: () => void
  onCancel: () => void
}): React.JSX.Element {
  const [name, setName] = useState(area?.name || '')
  const [color, setColor] = useState(area?.color || '#3B82F6')

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return
    if (area) {
      await window.api.treatedAreas.update(area.id, { name: name.trim(), color })
    } else {
      await window.api.treatedAreas.create({ name: name.trim(), color })
    }
    onSave()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/[0.03]">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="field-input text-[13px] flex-1"
        placeholder="Area name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') onCancel()
        }}
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleSave}
          className="p-1.5 rounded text-green-500 hover:text-green-400"
          title="Save"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded text-muted-foreground/60 hover:text-foreground"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Backup & Restore Section ──────────────────────────────────────────
function BackupRestoreSection(): React.JSX.Element {
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null)
  const { addToast } = useToastStore()

  const load = useCallback(async () => {
    const list = await window.api.backup.list()
    setBackups(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (): Promise<void> => {
    setCreating(true)
    try {
      const result = await window.api.backup.create()
      addToast({ type: 'success', message: `Backup created: ${result.filename}` })
      load()
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to create backup' })
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (filename: string): Promise<void> => {
    setRestoring(filename)
    try {
      const result = await window.api.backup.restore(filename)
      if (result.success) {
        addToast({ type: 'success', message: 'Backup restored. Reloading...' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        addToast({ type: 'error', message: result.error || 'Restore failed' })
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to restore backup' })
      console.error(err)
    } finally {
      setRestoring(null)
      setConfirmRestore(null)
    }
  }

  const handleDelete = async (filename: string): Promise<void> => {
    await window.api.backup.delete(filename)
    addToast({ type: 'info', message: 'Backup deleted' })
    load()
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <section>
      <SectionHeader icon={Database} title="Backup & Restore" />
      <div className="surface-elevated rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] text-muted-foreground/60">
              {backups.length} backup{backups.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary text-[12px] flex items-center gap-1.5 px-4 py-1.5 disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>

        {backups.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border/30">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border/40">
                  <th>Filename</th>
                  <th>Date</th>
                  <th>Size</th>
                  <th className="w-28"></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename} className="border-b border-border/20">
                    <td className="text-[13px] font-mono">{b.filename}</td>
                    <td className="text-[13px] text-muted-foreground">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="text-[13px] text-muted-foreground">{formatSize(b.size)}</td>
                    <td>
                      {confirmRestore === b.filename ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRestore(b.filename)}
                            disabled={restoring === b.filename}
                            className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                          >
                            {restoring === b.filename ? 'Restoring...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmRestore(null)}
                            className="p-1 text-muted-foreground hover:bg-accent rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmRestore(b.filename)}
                            className="p-1 text-primary hover:bg-primary/10 rounded"
                            title="Restore"
                          >
                            <Upload className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.filename)}
                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground/50 text-center py-4">
            No backups yet. Create your first backup to protect your data.
          </p>
        )}

        <div className="flex items-start gap-2 pt-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
            Restoring a backup will replace all current data. A safety backup of your current data is
            created automatically before any restore.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Shared Components ────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary/70" />
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  )
}

function SaveButton({
  onClick,
  saved
}: {
  onClick: () => void
  saved: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary text-[12px] flex items-center gap-1.5 px-4 py-1.5"
    >
      {saved ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Saved
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          Save
        </>
      )}
    </button>
  )
}
