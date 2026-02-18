import { eq, like, or, isNull, desc, sql, and } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { patients, visits, photos } from '../schema'

export interface CreatePatientData {
  firstName: string
  lastName: string
  sex?: string
  birthday?: string
  ethnicity?: string
  email?: string
  homePhone?: string
  cellPhone?: string
  workPhone?: string
  address?: string
  city?: string
  postalCode?: string
  province?: string
  medicalConditions?: string[]
  familyPhysician?: string
  weight?: string
  height?: string
  pastIllnesses?: string
  currentMedications?: string
  conditionsBeingTreated?: string
  previousSpecialistTreatment?: boolean
  pregnantOrBreastfeeding?: boolean
  smoker?: boolean
  referralSources?: string[]
  treatmentInterests?: string[]
  botulinumToxinConsent?: string
  photoConsent?: string
  quickRegister?: boolean
}

export interface PatientRow {
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
  address: string | null
  city: string | null
  postalCode: string | null
  province: string | null
  medicalConditions: string | null
  familyPhysician: string | null
  weight: string | null
  height: string | null
  pastIllnesses: string | null
  currentMedications: string | null
  conditionsBeingTreated: string | null
  previousSpecialistTreatment: boolean | null
  pregnantOrBreastfeeding: boolean | null
  smoker: boolean | null
  referralSources: string | null
  treatmentInterests: string | null
  botulinumToxinConsent: string | null
  photoConsent: string | null
  quickRegister: boolean | null
  avatarPath: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

function serializeArrayField(arr?: string[]): string | undefined {
  return arr ? JSON.stringify(arr) : undefined
}

function parseArrayField(json: string | null): string[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

export function createPatient(data: CreatePatientData): PatientRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(patients)
    .values({
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      sex: data.sex,
      birthday: data.birthday,
      ethnicity: data.ethnicity,
      email: data.email,
      homePhone: data.homePhone,
      cellPhone: data.cellPhone,
      workPhone: data.workPhone,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      province: data.province,
      medicalConditions: serializeArrayField(data.medicalConditions),
      familyPhysician: data.familyPhysician,
      weight: data.weight,
      height: data.height,
      pastIllnesses: data.pastIllnesses,
      currentMedications: data.currentMedications,
      conditionsBeingTreated: data.conditionsBeingTreated,
      previousSpecialistTreatment: data.previousSpecialistTreatment,
      pregnantOrBreastfeeding: data.pregnantOrBreastfeeding,
      smoker: data.smoker,
      referralSources: serializeArrayField(data.referralSources),
      treatmentInterests: serializeArrayField(data.treatmentInterests),
      botulinumToxinConsent: data.botulinumToxinConsent,
      photoConsent: data.photoConsent,
      quickRegister: data.quickRegister
    })
    .run()

  return getPatient(id)!
}

export function getPatient(id: string): PatientRow | null {
  const db = getDatabase()
  const result = db
    .select()
    .from(patients)
    .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
    .get()

  return result || null
}

export function listPatients(filters?: {
  search?: string
  limit?: number
  offset?: number
}): { data: PatientRow[]; total: number } {
  const db = getDatabase()
  const limit = filters?.limit || 25
  const offset = filters?.offset || 0

  let whereClause = isNull(patients.deletedAt)

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    whereClause = and(
      isNull(patients.deletedAt),
      or(
        like(patients.firstName, searchTerm),
        like(patients.lastName, searchTerm),
        like(patients.email, searchTerm),
        like(patients.cellPhone, searchTerm),
        like(patients.city, searchTerm)
      )
    )!
  }

  const data = db
    .select()
    .from(patients)
    .where(whereClause)
    .orderBy(desc(patients.createdAt))
    .limit(limit)
    .offset(offset)
    .all()

  const totalResult = db
    .select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(whereClause)
    .get()

  return { data, total: totalResult?.count || 0 }
}

export function updatePatient(id: string, data: Partial<CreatePatientData>): PatientRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  // Map each field from camelCase input to the column
  if (data.firstName !== undefined) updateValues.firstName = data.firstName
  if (data.lastName !== undefined) updateValues.lastName = data.lastName
  if (data.sex !== undefined) updateValues.sex = data.sex
  if (data.birthday !== undefined) updateValues.birthday = data.birthday
  if (data.ethnicity !== undefined) updateValues.ethnicity = data.ethnicity
  if (data.email !== undefined) updateValues.email = data.email
  if (data.homePhone !== undefined) updateValues.homePhone = data.homePhone
  if (data.cellPhone !== undefined) updateValues.cellPhone = data.cellPhone
  if (data.workPhone !== undefined) updateValues.workPhone = data.workPhone
  if (data.address !== undefined) updateValues.address = data.address
  if (data.city !== undefined) updateValues.city = data.city
  if (data.postalCode !== undefined) updateValues.postalCode = data.postalCode
  if (data.province !== undefined) updateValues.province = data.province
  if (data.medicalConditions !== undefined)
    updateValues.medicalConditions = serializeArrayField(data.medicalConditions)
  if (data.familyPhysician !== undefined) updateValues.familyPhysician = data.familyPhysician
  if (data.weight !== undefined) updateValues.weight = data.weight
  if (data.height !== undefined) updateValues.height = data.height
  if (data.pastIllnesses !== undefined) updateValues.pastIllnesses = data.pastIllnesses
  if (data.currentMedications !== undefined)
    updateValues.currentMedications = data.currentMedications
  if (data.conditionsBeingTreated !== undefined)
    updateValues.conditionsBeingTreated = data.conditionsBeingTreated
  if (data.previousSpecialistTreatment !== undefined)
    updateValues.previousSpecialistTreatment = data.previousSpecialistTreatment
  if (data.pregnantOrBreastfeeding !== undefined)
    updateValues.pregnantOrBreastfeeding = data.pregnantOrBreastfeeding
  if (data.smoker !== undefined) updateValues.smoker = data.smoker
  if (data.referralSources !== undefined)
    updateValues.referralSources = serializeArrayField(data.referralSources)
  if (data.treatmentInterests !== undefined)
    updateValues.treatmentInterests = serializeArrayField(data.treatmentInterests)
  if (data.botulinumToxinConsent !== undefined)
    updateValues.botulinumToxinConsent = data.botulinumToxinConsent
  if (data.photoConsent !== undefined) updateValues.photoConsent = data.photoConsent
  if (data.quickRegister !== undefined) updateValues.quickRegister = data.quickRegister

  db.update(patients).set(updateValues).where(eq(patients.id, id)).run()

  return getPatient(id)
}

export function deletePatient(id: string): void {
  const db = getDatabase()
  db.update(patients)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(patients.id, id))
    .run()
}

export function searchPatients(query: string): PatientRow[] {
  const db = getDatabase()
  const searchTerm = `%${query}%`

  return db
    .select()
    .from(patients)
    .where(
      and(
        isNull(patients.deletedAt),
        or(
          like(patients.firstName, searchTerm),
          like(patients.lastName, searchTerm),
          like(patients.email, searchTerm),
          like(patients.cellPhone, searchTerm)
        )
      )
    )
    .orderBy(patients.lastName, patients.firstName)
    .limit(50)
    .all()
}

export function getPatientStats(): { totalPatients: number; totalVisits: number } {
  const db = getDatabase()

  const patientCount = db
    .select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(isNull(patients.deletedAt))
    .get()

  const visitCount = db
    .select({ count: sql<number>`count(*)` })
    .from(visits)
    .where(isNull(visits.deletedAt))
    .get()

  return {
    totalPatients: patientCount?.count || 0,
    totalVisits: visitCount?.count || 0
  }
}

export function getRecentPatients(limit: number = 5): PatientRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(patients)
    .where(isNull(patients.deletedAt))
    .orderBy(desc(patients.createdAt))
    .limit(limit)
    .all()
}
