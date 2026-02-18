import { eq, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { treatedAreas } from '../schema'

export interface TreatedAreaRow {
  id: string
  name: string
  color: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTreatedAreaData {
  name: string
  color?: string
}

export function listTreatedAreas(): TreatedAreaRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(treatedAreas)
    .where(eq(treatedAreas.isActive, true))
    .orderBy(treatedAreas.name)
    .all()
}

export function listAllTreatedAreas(): TreatedAreaRow[] {
  const db = getDatabase()
  return db.select().from(treatedAreas).orderBy(treatedAreas.name).all()
}

export function getTreatedArea(id: string): TreatedAreaRow | null {
  const db = getDatabase()
  return db.select().from(treatedAreas).where(eq(treatedAreas.id, id)).get() || null
}

export function createTreatedArea(data: CreateTreatedAreaData): TreatedAreaRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(treatedAreas)
    .values({
      id,
      name: data.name,
      color: data.color
    })
    .run()

  return db.select().from(treatedAreas).where(eq(treatedAreas.id, id)).get()!
}

export function updateTreatedArea(
  id: string,
  data: Partial<CreateTreatedAreaData & { isActive: boolean }>
): TreatedAreaRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.name !== undefined) updateValues.name = data.name
  if (data.color !== undefined) updateValues.color = data.color
  if (data.isActive !== undefined) updateValues.isActive = data.isActive

  db.update(treatedAreas).set(updateValues).where(eq(treatedAreas.id, id)).run()

  return db.select().from(treatedAreas).where(eq(treatedAreas.id, id)).get() || null
}

export function deleteTreatedArea(id: string): void {
  const db = getDatabase()
  db.update(treatedAreas)
    .set({ isActive: false, updatedAt: sql`datetime('now')` })
    .where(eq(treatedAreas.id, id))
    .run()
}
