import { eq, and, isNull, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { photos } from '../schema'

export interface CreatePhotoData {
  visitId: string
  patientId: string
  originalPath: string
  thumbnailPath?: string
  photoPosition?: string
  photoState?: string
  width?: number
  height?: number
  sortOrder?: number
}

export interface PhotoRow {
  id: string
  visitId: string
  patientId: string
  originalPath: string
  thumbnailPath: string | null
  photoPosition: string | null
  photoState: string | null
  isMarked: boolean | null
  markedPath: string | null
  width: number | null
  height: number | null
  sortOrder: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export function createPhoto(data: CreatePhotoData): PhotoRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(photos)
    .values({
      id,
      visitId: data.visitId,
      patientId: data.patientId,
      originalPath: data.originalPath,
      thumbnailPath: data.thumbnailPath,
      photoPosition: data.photoPosition,
      photoState: data.photoState,
      width: data.width,
      height: data.height,
      sortOrder: data.sortOrder ?? 0
    })
    .run()

  return getPhoto(id)!
}

export function getPhoto(id: string): PhotoRow | null {
  const db = getDatabase()
  const result = db
    .select()
    .from(photos)
    .where(and(eq(photos.id, id), isNull(photos.deletedAt)))
    .get()

  return result || null
}

export function listPhotosForVisit(visitId: string): PhotoRow[] {
  const db = getDatabase()

  return db
    .select()
    .from(photos)
    .where(and(eq(photos.visitId, visitId), isNull(photos.deletedAt)))
    .orderBy(photos.sortOrder)
    .all()
}

export function updatePhoto(
  id: string,
  data: Partial<{
    originalPath: string
    thumbnailPath: string
    photoPosition: string
    photoState: string
    isMarked: boolean
    markedPath: string
    width: number
    height: number
    sortOrder: number
  }>
): PhotoRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.originalPath !== undefined) updateValues.originalPath = data.originalPath
  if (data.thumbnailPath !== undefined) updateValues.thumbnailPath = data.thumbnailPath
  if (data.photoPosition !== undefined) updateValues.photoPosition = data.photoPosition
  if (data.photoState !== undefined) updateValues.photoState = data.photoState
  if (data.isMarked !== undefined) updateValues.isMarked = data.isMarked
  if (data.markedPath !== undefined) updateValues.markedPath = data.markedPath
  if (data.width !== undefined) updateValues.width = data.width
  if (data.height !== undefined) updateValues.height = data.height
  if (data.sortOrder !== undefined) updateValues.sortOrder = data.sortOrder

  db.update(photos).set(updateValues).where(eq(photos.id, id)).run()

  return getPhoto(id)
}

export function deletePhoto(id: string): void {
  const db = getDatabase()
  db.update(photos)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(photos.id, id))
    .run()
}

export function countPhotosForVisit(visitId: string): number {
  const db = getDatabase()
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(photos)
    .where(and(eq(photos.visitId, visitId), isNull(photos.deletedAt)))
    .get()
  return result?.count || 0
}
