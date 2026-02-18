import { eq, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { treatmentAreas, treatedAreas } from '../schema'

export interface CreateTreatmentAreaData {
  treatmentId: string
  treatedAreaId: string
  units?: number
  cost?: number
}

export interface TreatmentAreaRow {
  id: string
  treatmentId: string
  treatedAreaId: string
  units: number | null
  cost: number | null
  createdAt: string
}

export interface TreatmentAreaWithInfo extends TreatmentAreaRow {
  areaName: string
  areaColor: string | null
}

export function createTreatmentArea(data: CreateTreatmentAreaData): TreatmentAreaRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(treatmentAreas)
    .values({
      id,
      treatmentId: data.treatmentId,
      treatedAreaId: data.treatedAreaId,
      units: data.units,
      cost: data.cost
    })
    .run()

  return db.select().from(treatmentAreas).where(eq(treatmentAreas.id, id)).get()!
}

export function listAreasForTreatment(treatmentId: string): TreatmentAreaWithInfo[] {
  const db = getDatabase()

  return db
    .select({
      id: treatmentAreas.id,
      treatmentId: treatmentAreas.treatmentId,
      treatedAreaId: treatmentAreas.treatedAreaId,
      units: treatmentAreas.units,
      cost: treatmentAreas.cost,
      createdAt: treatmentAreas.createdAt,
      areaName: treatedAreas.name,
      areaColor: treatedAreas.color
    })
    .from(treatmentAreas)
    .leftJoin(treatedAreas, eq(treatmentAreas.treatedAreaId, treatedAreas.id))
    .where(eq(treatmentAreas.treatmentId, treatmentId))
    .all()
}

export function updateTreatmentArea(
  id: string,
  data: Partial<{ units: number; cost: number }>
): TreatmentAreaRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {}

  if (data.units !== undefined) updateValues.units = data.units
  if (data.cost !== undefined) updateValues.cost = data.cost

  if (Object.keys(updateValues).length === 0) return null

  db.update(treatmentAreas).set(updateValues).where(eq(treatmentAreas.id, id)).run()

  return db.select().from(treatmentAreas).where(eq(treatmentAreas.id, id)).get() || null
}

export function deleteTreatmentArea(id: string): void {
  const db = getDatabase()
  db.delete(treatmentAreas).where(eq(treatmentAreas.id, id)).run()
}

export function deleteAreasForTreatment(treatmentId: string): void {
  const db = getDatabase()
  db.delete(treatmentAreas).where(eq(treatmentAreas.treatmentId, treatmentId)).run()
}
