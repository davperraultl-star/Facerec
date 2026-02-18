import { eq, isNull, sql, asc } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { users } from '../schema'

// ── Types ────────────────────────────────────────────────────────

export interface UserRow {
  id: string
  name: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserData {
  name: string
  email?: string
  role?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: string
  isActive?: boolean
}

// ── CRUD ─────────────────────────────────────────────────────────

export function listUsers(): UserRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.name))
    .all()
    .filter((u) => u.isActive) as UserRow[]
}

export function listAllUsers(): UserRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.name))
    .all() as UserRow[]
}

export function getUser(id: string): UserRow | null {
  const db = getDatabase()
  const result = db.select().from(users).where(eq(users.id, id)).get()
  return (result as UserRow) || null
}

export function createUser(data: CreateUserData): UserRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(users)
    .values({
      id,
      name: data.name,
      email: data.email || null,
      role: data.role || 'practitioner'
    })
    .run()

  return getUser(id)!
}

export function updateUser(id: string, data: UpdateUserData): UserRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.name !== undefined) updateValues.name = data.name
  if (data.email !== undefined) updateValues.email = data.email
  if (data.role !== undefined) updateValues.role = data.role
  if (data.isActive !== undefined) updateValues.isActive = data.isActive

  db.update(users).set(updateValues).where(eq(users.id, id)).run()

  return getUser(id)
}

export function deleteUser(id: string): void {
  const db = getDatabase()
  db.update(users)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(users.id, id))
    .run()
}
