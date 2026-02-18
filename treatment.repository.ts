import { eq, and, isNull, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { treatments, products } from '../schema'

export interface CreateTreatmentData {
  visitId: string
  treatmentType?: string
  productId?: string
  lotNumber?: string
  expiryDate?: string
  totalUnits?: number
  totalCost?: number
}

export interface TreatmentRow {
  id: string
  visitId: string
  treatmentType: string | null
  productId: string | null
  lotNumber: string | null
  expiryDate: string | null
  totalUnits: number | null
  totalCost: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface TreatmentWithProduct extends TreatmentRow {
  productName: string | null
  productBrand: string | null
  productColor: string | null
  productCategory: string | null
  productUnitType: string | null
}

export function createTreatment(data: CreateTreatmentData): TreatmentRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(treatments)
    .values({
      id,
      visitId: data.visitId,
      treatmentType: data.treatmentType,
      productId: data.productId,
      lotNumber: data.lotNumber,
      expiryDate: data.expiryDate,
      totalUnits: data.totalUnits,
      totalCost: data.totalCost
    })
    .run()

  return getTreatment(id)!
}

export function getTreatment(id: string): TreatmentRow | null {
  const db = getDatabase()
  const result = db
    .select()
    .from(treatments)
    .where(and(eq(treatments.id, id), isNull(treatments.deletedAt)))
    .get()

  return result || null
}

export function listTreatmentsForVisit(visitId: string): TreatmentWithProduct[] {
  const db = getDatabase()

  const rows = db
    .select({
      id: treatments.id,
      visitId: treatments.visitId,
      treatmentType: treatments.treatmentType,
      productId: treatments.productId,
      lotNumber: treatments.lotNumber,
      expiryDate: treatments.expiryDate,
      totalUnits: treatments.totalUnits,
      totalCost: treatments.totalCost,
      createdAt: treatments.createdAt,
      updatedAt: treatments.updatedAt,
      deletedAt: treatments.deletedAt,
      productName: products.name,
      productBrand: products.brand,
      productColor: products.color,
      productCategory: products.category,
      productUnitType: products.unitType
    })
    .from(treatments)
    .leftJoin(products, eq(treatments.productId, products.id))
    .where(and(eq(treatments.visitId, visitId), isNull(treatments.deletedAt)))
    .orderBy(treatments.createdAt)
    .all()

  return rows
}

export function updateTreatment(
  id: string,
  data: Partial<CreateTreatmentData>
): TreatmentRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.treatmentType !== undefined) updateValues.treatmentType = data.treatmentType
  if (data.productId !== undefined) updateValues.productId = data.productId
  if (data.lotNumber !== undefined) updateValues.lotNumber = data.lotNumber
  if (data.expiryDate !== undefined) updateValues.expiryDate = data.expiryDate
  if (data.totalUnits !== undefined) updateValues.totalUnits = data.totalUnits
  if (data.totalCost !== undefined) updateValues.totalCost = data.totalCost

  db.update(treatments).set(updateValues).where(eq(treatments.id, id)).run()

  return getTreatment(id)
}

export function deleteTreatment(id: string): void {
  const db = getDatabase()
  db.update(treatments)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(treatments.id, id))
    .run()
}
