import { eq } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { annotations } from '../schema'
import { sql } from 'drizzle-orm'

export interface CreateAnnotationData {
  treatmentId: string
  diagramView?: string
  pointsJson?: string
}

export interface AnnotationRow {
  id: string
  treatmentId: string
  diagramView: string | null
  pointsJson: string | null
  createdAt: string
  updatedAt: string
}

export function createAnnotation(data: CreateAnnotationData): AnnotationRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(annotations)
    .values({
      id,
      treatmentId: data.treatmentId,
      diagramView: data.diagramView,
      pointsJson: data.pointsJson
    })
    .run()

  return db.select().from(annotations).where(eq(annotations.id, id)).get()!
}

export function getAnnotationsForTreatment(treatmentId: string): AnnotationRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(annotations)
    .where(eq(annotations.treatmentId, treatmentId))
    .all()
}

export function updateAnnotation(
  id: string,
  data: Partial<{ diagramView: string; pointsJson: string }>
): AnnotationRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.diagramView !== undefined) updateValues.diagramView = data.diagramView
  if (data.pointsJson !== undefined) updateValues.pointsJson = data.pointsJson

  db.update(annotations).set(updateValues).where(eq(annotations.id, id)).run()

  return db.select().from(annotations).where(eq(annotations.id, id)).get() || null
}

export function deleteAnnotation(id: string): void {
  const db = getDatabase()
  db.delete(annotations).where(eq(annotations.id, id)).run()
}

export function deleteAnnotationsForTreatment(treatmentId: string): void {
  const db = getDatabase()
  db.delete(annotations).where(eq(annotations.treatmentId, treatmentId)).run()
}
