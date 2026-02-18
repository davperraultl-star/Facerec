import { eq, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { products } from '../schema'

export interface ProductRow {
  id: string
  name: string
  brand: string | null
  category: string
  unitType: string | null
  defaultCost: number | null
  color: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductData {
  name: string
  brand?: string
  category: string
  unitType?: string
  defaultCost?: number
  color?: string
}

export function listProducts(): ProductRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.category, products.name)
    .all()
}

export function listAllProducts(): ProductRow[] {
  const db = getDatabase()
  return db.select().from(products).orderBy(products.category, products.name).all()
}

export function getProduct(id: string): ProductRow | null {
  const db = getDatabase()
  return db.select().from(products).where(eq(products.id, id)).get() || null
}

export function createProduct(data: CreateProductData): ProductRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(products)
    .values({
      id,
      name: data.name,
      brand: data.brand,
      category: data.category,
      unitType: data.unitType,
      defaultCost: data.defaultCost,
      color: data.color
    })
    .run()

  return db.select().from(products).where(eq(products.id, id)).get()!
}

export function updateProduct(
  id: string,
  data: Partial<CreateProductData & { isActive: boolean }>
): ProductRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.name !== undefined) updateValues.name = data.name
  if (data.brand !== undefined) updateValues.brand = data.brand
  if (data.category !== undefined) updateValues.category = data.category
  if (data.unitType !== undefined) updateValues.unitType = data.unitType
  if (data.defaultCost !== undefined) updateValues.defaultCost = data.defaultCost
  if (data.color !== undefined) updateValues.color = data.color
  if (data.isActive !== undefined) updateValues.isActive = data.isActive

  db.update(products).set(updateValues).where(eq(products.id, id)).run()

  return db.select().from(products).where(eq(products.id, id)).get() || null
}

export function deleteProduct(id: string): void {
  const db = getDatabase()
  db.update(products)
    .set({ isActive: false, updatedAt: sql`datetime('now')` })
    .where(eq(products.id, id))
    .run()
}
