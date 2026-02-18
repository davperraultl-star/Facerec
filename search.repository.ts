import { getSqlite } from '../connection'

// ── Search Types ──────────────────────────────────────────────────

export interface CaseSearchFilters {
  // Patient demographics
  ethnicity?: string
  sex?: string
  ageMin?: number
  ageMax?: number
  minVisits?: number
  // Consent status
  hasBotulinumConsent?: boolean
  hasFillerConsent?: boolean
  hasPhotoConsent?: boolean
  // Visit filters
  visitDateFrom?: string
  visitDateTo?: string
  lotNumber?: string
  practitionerId?: string
  // Treatment filters
  productIds?: string[]
  treatmentCategorySlugs?: string[]
  treatedAreaIds?: string[]
}

export interface CaseSearchResult {
  patientId: string
  firstName: string
  lastName: string
  sex: string | null
  birthday: string | null
  ethnicity: string | null
  city: string | null
  province: string | null
  visitCount: number
  treatmentCount: number
}

// ── Search Implementation ─────────────────────────────────────────

export function searchCases(filters: CaseSearchFilters): CaseSearchResult[] {
  const sqlite = getSqlite()

  const conditions: string[] = []
  const params: unknown[] = []

  // Base: non-deleted patients
  conditions.push('p.deleted_at IS NULL')

  // Patient demographics
  if (filters.ethnicity) {
    conditions.push('p.ethnicity = ?')
    params.push(filters.ethnicity)
  }

  if (filters.sex) {
    conditions.push('p.sex = ?')
    params.push(filters.sex)
  }

  if (filters.ageMin != null) {
    // age >= ageMin means birthday <= today - ageMin years
    conditions.push("p.birthday <= date('now', '-' || ? || ' years')")
    params.push(filters.ageMin)
  }

  if (filters.ageMax != null) {
    // age <= ageMax means birthday >= today - (ageMax+1) years
    conditions.push("p.birthday > date('now', '-' || ? || ' years')")
    params.push(filters.ageMax + 1)
  }

  if (filters.minVisits != null) {
    conditions.push(`(SELECT COUNT(*) FROM visits WHERE patient_id = p.id AND deleted_at IS NULL) >= ?`)
    params.push(filters.minVisits)
  }

  // Consent filters (subquery check)
  if (filters.hasBotulinumConsent) {
    conditions.push(
      "EXISTS (SELECT 1 FROM consents c WHERE c.patient_id = p.id AND c.type = 'botulinum')"
    )
  }

  if (filters.hasFillerConsent) {
    conditions.push(
      "EXISTS (SELECT 1 FROM consents c WHERE c.patient_id = p.id AND c.type = 'filler')"
    )
  }

  if (filters.hasPhotoConsent) {
    conditions.push(
      "EXISTS (SELECT 1 FROM consents c WHERE c.patient_id = p.id AND c.type = 'photo')"
    )
  }

  // Visit-level filters require JOIN through visits
  const needsVisitJoin =
    filters.visitDateFrom ||
    filters.visitDateTo ||
    filters.lotNumber ||
    filters.practitionerId ||
    (filters.productIds && filters.productIds.length > 0) ||
    (filters.treatmentCategorySlugs && filters.treatmentCategorySlugs.length > 0) ||
    (filters.treatedAreaIds && filters.treatedAreaIds.length > 0)

  if (filters.visitDateFrom) {
    conditions.push(
      'EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND v.date >= ?)'
    )
    params.push(filters.visitDateFrom)
  }

  if (filters.visitDateTo) {
    conditions.push(
      'EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND v.date <= ?)'
    )
    params.push(filters.visitDateTo)
  }

  if (filters.practitionerId) {
    conditions.push(
      'EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND v.practitioner_id = ?)'
    )
    params.push(filters.practitionerId)
  }

  if (filters.lotNumber) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND t.lot_number LIKE ?
      )`
    )
    params.push(`%${filters.lotNumber}%`)
  }

  // Product filter
  if (filters.productIds && filters.productIds.length > 0) {
    const placeholders = filters.productIds.map(() => '?').join(',')
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL
        AND t.product_id IN (${placeholders})
      )`
    )
    params.push(...filters.productIds)
  }

  // Treatment category filter (by slug in treatment_type field)
  if (filters.treatmentCategorySlugs && filters.treatmentCategorySlugs.length > 0) {
    const placeholders = filters.treatmentCategorySlugs.map(() => '?').join(',')
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL
        AND t.treatment_type IN (${placeholders})
      )`
    )
    params.push(...filters.treatmentCategorySlugs)
  }

  // Treated area filter
  if (filters.treatedAreaIds && filters.treatedAreaIds.length > 0) {
    const placeholders = filters.treatedAreaIds.map(() => '?').join(',')
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        JOIN treatment_areas ta ON ta.treatment_id = t.id
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL
        AND ta.treated_area_id IN (${placeholders})
      )`
    )
    params.push(...filters.treatedAreaIds)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `
    SELECT
      p.id AS patientId,
      p.first_name AS firstName,
      p.last_name AS lastName,
      p.sex,
      p.birthday,
      p.ethnicity,
      p.city,
      p.province,
      COALESCE((SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL), 0) AS visitCount,
      COALESCE((
        SELECT COUNT(*) FROM treatments t
        JOIN visits v ON v.id = t.visit_id
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND t.deleted_at IS NULL
      ), 0) AS treatmentCount
    FROM patients p
    ${whereClause}
    ORDER BY p.last_name, p.first_name
    LIMIT 200
  `

  const stmt = sqlite.prepare(sql)
  const rows = stmt.all(...params) as CaseSearchResult[]

  return rows
}
