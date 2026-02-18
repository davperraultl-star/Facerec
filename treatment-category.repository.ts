import { eq, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { treatmentCategories } from '../schema'

export interface TreatmentCategoryRow {
  id: string
  name: string
  slug: string
  type: string
  color: string | null
  icon: string | null
  sortOrder: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTreatmentCategoryData {
  name: string
  slug: string
  type?: string
  color?: string
  icon?: string
  sortOrder?: number
}

export function listTreatmentCategories(): TreatmentCategoryRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(treatmentCategories)
    .where(eq(treatmentCategories.isActive, true))
    .orderBy(treatmentCategories.sortOrder, treatmentCategories.name)
    .all()
}

export function listAllTreatmentCategories(): TreatmentCategoryRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(treatmentCategories)
    .orderBy(treatmentCategories.sortOrder, treatmentCategories.name)
    .all()
}

export function getTreatmentCategory(id: string): TreatmentCategoryRow | null {
  const db = getDatabase()
  return (
    db
      .select()
      .from(treatmentCategories)
      .where(eq(treatmentCategories.id, id))
      .get() || null
  )
}

export function getTreatmentCategoryBySlug(slug: string): TreatmentCategoryRow | null {
  const db = getDatabase()
  return (
    db
      .select()
      .from(treatmentCategories)
      .where(eq(treatmentCategories.slug, slug))
      .get() || null
  )
}

export function createTreatmentCategory(
  data: CreateTreatmentCategoryData
): TreatmentCategoryRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(treatmentCategories)
    .values({
      id,
      name: data.name,
      slug: data.slug,
      type: data.type || 'facial',
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder
    })
    .run()

  return db
    .select()
    .from(treatmentCategories)
    .where(eq(treatmentCategories.id, id))
    .get()!
}

export function updateTreatmentCategory(
  id: string,
  data: Partial<CreateTreatmentCategoryData & { isActive: boolean }>
): TreatmentCategoryRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.name !== undefined) updateValues.name = data.name
  if (data.slug !== undefined) updateValues.slug = data.slug
  if (data.type !== undefined) updateValues.type = data.type
  if (data.color !== undefined) updateValues.color = data.color
  if (data.icon !== undefined) updateValues.icon = data.icon
  if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder
  if (data.isActive !== undefined) updateValues.isActive = data.isActive

  db.update(treatmentCategories)
    .set(updateValues)
    .where(eq(treatmentCategories.id, id))
    .run()

  return (
    db
      .select()
      .from(treatmentCategories)
      .where(eq(treatmentCategories.id, id))
      .get() || null
  )
}

export function deleteTreatmentCategory(id: string): void {
  const db = getDatabase()
  db.update(treatmentCategories)
    .set({ isActive: false, updatedAt: sql`datetime('now')` })
    .where(eq(treatmentCategories.id, id))
    .run()
}
