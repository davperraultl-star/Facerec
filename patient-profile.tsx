import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Mail, Phone, Pencil, Plus, Search, Calendar, Image, Syringe, GitCompareArrows, FileText } from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  sex: string | null
  birthday: string | null
  ethnicity: string | null
  email: string | null
  homePhone: string | null
  cellPhone: string | null
  workPhone: string | null
  city: string | null
  province: string | null
  avatarPath: string | null
  createdAt: string
}

interface ConsentRecord {
  id: string
  patientId: string
  visitId: string | null
  type: string
  signedAt: string | null
}

interface VisitListItem {
  id: string
  patientId: string
  date: string
  time: string | null
  photoCount: number
  hasTreatments: boolean
}

export function PatientProfile(): React.JSX.Element {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<VisitListItem[]>([])
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [visitSearch, setVisitSearch] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      window.api.patients.get(id),
      window.api.visits.list(id),
      window.api.consents.listForPatient(id)
    ]).then(([p, v, cons]) => {
      setPatient(p as Patient | null)
      setVisits(v)
      setConsents(cons)
      setLoading(false)
    })
  }, [id])

  const handleCreateVisit = async (): Promise<void> => {
    if (!id) return
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)
    const visit = await window.api.visits.create({ patientId: id, date: today, time: now })
    navigate(`/patients/${id}/visits/${visit.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading patient...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Patient not found</p>
          <button onClick={() => navigate('/patients')} className="btn-primary">
            Back to Patients
          </button>
        </div>
      </div>
    )
  }

  const location = [patient.city, patient.province].filter(Boolean).join(', ')
  const initials = `${patient.firstName[0] || ''}${patient.lastName[0] || ''}`.toUpperCase()

  const filteredVisits = visits.filter((v) => {
    if (!visitSearch) return true
    return v.date.includes(visitSearch)
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="px-8 pt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
          Patients /{' '}
          <span className="text-foreground">
            {patient.firstName} {patient.lastName}
          </span>
        </p>
      </div>

      {/* Header Banner — atmospheric gradient */}
      <div className="mt-4 mx-8 rounded-2xl overflow-hidden relative">
        <div className="h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="absolute -bottom-10 left-8">
          <div className="h-20 w-20 rounded-2xl bg-surface-1 border-2 border-background flex items-center justify-center shadow-lg">
            <span className="text-xl font-semibold text-primary">{initials}</span>
          </div>
        </div>
      </div>

      <div className="px-8 pt-14 pb-8">
        <div className="flex gap-8">
          {/* Left sidebar — Patient identity */}
          <div className="w-60 flex-shrink-0">
            <h2 className="text-xl font-semibold tracking-tight">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">Patient</p>

            {location && (
              <div className="flex items-center gap-2 mt-4 text-[13px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span>{location}</span>
              </div>
            )}

            {patient.email && (
              <div className="flex items-center gap-2 mt-1.5 text-[13px] text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span>{patient.email}</span>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <button className="btn-primary w-full flex items-center justify-center gap-2 text-[13px]">
                <Pencil className="h-3.5 w-3.5" />
                Edit Details
              </button>
              <button
                onClick={() => navigate('/patients')}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-[13px]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Patients
              </button>
            </div>
          </div>

          {/* Center — Visits table */}
          <div className="flex-1">
            <div className="surface-elevated rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Visits{' '}
                  {visits.length > 0 && (
                    <span className="text-muted-foreground font-normal">({visits.length})</span>
                  )}
                </h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    className="field-input pl-8 w-48 py-1.5 text-[13px]"
                    placeholder="Search visits..."
                    value={visitSearch}
                    onChange={(e) => setVisitSearch(e.target.value)}
                  />
                </div>
              </div>

              <table className="w-full data-table">
                <thead>
                  <tr className="border-b border-border/40">
                    <th>Date</th>
                    <th>Treatment</th>
                    <th>Images</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-14 text-center text-sm text-muted-foreground/60">
                        {visits.length === 0 ? 'No visits yet' : 'No matching visits'}
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((visit) => (
                      <tr
                        key={visit.id}
                        className="cursor-pointer hover:bg-surface-1/50"
                        onClick={() => navigate(`/patients/${id}/visits/${visit.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-2 text-[13px]">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                            {new Date(visit.date).toLocaleDateString('en-CA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td>
                          {visit.hasTreatments ? (
                            <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              <Syringe className="h-3 w-3" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-[12px] text-muted-foreground/50">No</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                            <Image className="h-3.5 w-3.5 text-muted-foreground/50" />
                            {visit.photoCount}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-2">
                {visits.length >= 2 && (
                  <button
                    onClick={() => navigate(`/patients/${id}/compare`)}
                    className="btn-secondary flex items-center gap-2 text-[13px]"
                  >
                    <GitCompareArrows className="h-3.5 w-3.5" />
                    Compare Visits
                  </button>
                )}
                <button
                  onClick={handleCreateVisit}
                  className="btn-primary flex items-center gap-2 text-[13px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Visit
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar — Details cards */}
          <div className="w-52 flex-shrink-0 space-y-4">
            <div className="surface-elevated rounded-xl p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Personal
              </h4>
              <div className="space-y-2.5">
                <DetailRow label="Name" value={`${patient.lastName}, ${patient.firstName}`} />
                <DetailRow label="Ethnicity" value={patient.ethnicity} />
                <DetailRow label="Sex" value={patient.sex} />
                <DetailRow
                  label="Birthday"
                  value={
                    patient.birthday
                      ? new Date(patient.birthday).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : null
                  }
                />
              </div>
            </div>

            <div className="surface-elevated rounded-xl p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Contact
              </h4>
              <div className="space-y-2.5">
                {patient.email && <ContactRow icon={Mail} label="Email" value={patient.email} />}
                {patient.homePhone && (
                  <ContactRow icon={Phone} label="Home" value={patient.homePhone} />
                )}
                {patient.workPhone && (
                  <ContactRow icon={Phone} label="Work" value={patient.workPhone} />
                )}
                {patient.cellPhone && (
                  <ContactRow icon={Phone} label="Cell" value={patient.cellPhone} />
                )}
                {!patient.email &&
                  !patient.homePhone &&
                  !patient.workPhone &&
                  !patient.cellPhone && (
                    <p className="text-[13px] text-muted-foreground/60">No contact info</p>
                  )}
              </div>
            </div>

            {/* Consents */}
            <div className="surface-elevated rounded-xl p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Consents
              </h4>
              {consents.length > 0 ? (
                <div className="space-y-2">
                  {consents.map((consent) => (
                    <div key={consent.id} className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium capitalize truncate">
                          {consent.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">
                          {consent.signedAt
                            ? new Date(consent.signedAt).toLocaleDateString('en-CA', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'Signed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground/60">No consents signed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value
}: {
  label: string
  value: string | null | undefined
}): React.JSX.Element {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || '\u2014'}</span>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value
}: {
  icon: React.ElementType
  label: string
  value: string
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2 text-[13px]">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">{label}</p>
        <p className="text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}
