import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { visits, photos, treatments } from '../schema'

export interface CreateVisitData {
  patientId: string
  practitionerId?: string
  date: string
  time?: string
  clinicalNotes?: string
}

export interface VisitRow {
  id: string
  patientId: string
  practitionerId: string | null
  date: string
  time: string | null
  clinicalNotes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface VisitListItem extends VisitRow {
  photoCount: number
  hasTreatments: boolean
}

export function createVisit(data: CreateVisitData): VisitRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(visits)
    .values({
      id,
      patientId: data.patientId,
      practitionerId: data.practitionerId,
      date: data.date,
      time: data.time,
      clinicalNotes: data.clinicalNotes
    })
    .run()

  return getVisit(id)!
}

export function getVisit(id: string): VisitRow | null {
  const db = getDatabase()
  const result = db
    .select()
    .from(visits)
    .where(and(eq(visits.id, id), isNull(visits.deletedAt)))
    .get()

  return result || null
}

export function listVisitsForPatient(patientId: string): VisitListItem[] {
  const db = getDatabase()

  const visitRows = db
    .select()
    .from(visits)
    .where(and(eq(visits.patientId, patientId), isNull(visits.deletedAt)))
    .orderBy(desc(visits.date))
    .all()

  return visitRows.map((v) => {
    const photoCount = db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(and(eq(photos.visitId, v.id), isNull(photos.deletedAt)))
      .get()

    const treatmentCount = db
      .select({ count: sql<number>`count(*)` })
      .from(treatments)
      .where(and(eq(treatments.visitId, v.id), isNull(treatments.deletedAt)))
      .get()

    return {
      ...v,
      photoCount: photoCount?.count || 0,
      hasTreatments: (treatmentCount?.count || 0) > 0
    }
  })
}

export function updateVisit(id: string, data: Partial<CreateVisitData>): VisitRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.date !== undefined) updateValues.date = data.date
  if (data.time !== undefined) updateValues.time = data.time
  if (data.clinicalNotes !== undefined) updateValues.clinicalNotes = data.clinicalNotes
  if (data.practitionerId !== undefined) updateValues.practitionerId = data.practitionerId

  db.update(visits).set(updateValues).where(eq(visits.id, id)).run()

  return getVisit(id)
}

export function deleteVisit(id: string): void {
  const db = getDatabase()
  db.update(visits)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(visits.id, id))
    .run()
}
