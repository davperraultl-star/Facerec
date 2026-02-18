import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { portfolios, portfolioItems, patients, visits, photos } from '../schema'

// ── Portfolio Types ─────────────────────────────────────────────────

export interface PortfolioRow {
  id: string
  title: string
  category: string | null
  demographicsFilter: string | null
  ownerId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PortfolioWithCount extends PortfolioRow {
  itemCount: number
}

export interface CreatePortfolioData {
  title: string
  category?: string
  demographicsFilter?: string
  ownerId?: string
}

export interface PortfolioItemRow {
  id: string
  portfolioId: string
  patientId: string
  beforeVisitId: string | null
  afterVisitId: string | null
  photoPosition: string | null
  photoState: string | null
  createdAt: string
}

export interface PortfolioItemWithDetails extends PortfolioItemRow {
  patientFirstName: string
  patientLastName: string
  beforeDate: string | null
  afterDate: string | null
  beforePhotoPath: string | null
  afterPhotoPath: string | null
  beforeThumbnailPath: string | null
  afterThumbnailPath: string | null
  photoPosition: string | null
  photoState: string | null
}

export interface CreatePortfolioItemData {
  portfolioId: string
  patientId: string
  beforeVisitId?: string
  afterVisitId?: string
  photoPosition?: string
  photoState?: string
}

// ── Portfolio CRUD ──────────────────────────────────────────────────

export function createPortfolio(data: CreatePortfolioData): PortfolioRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(portfolios)
    .values({
      id,
      title: data.title,
      category: data.category,
      demographicsFilter: data.demographicsFilter,
      ownerId: data.ownerId
    })
    .run()

  return getPortfolio(id)!
}

export function getPortfolio(id: string): PortfolioRow | null {
  const db = getDatabase()
  const result = db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, id), isNull(portfolios.deletedAt)))
    .get()

  return result || null
}

export function listPortfolios(): PortfolioWithCount[] {
  const db = getDatabase()

  const rows = db
    .select()
    .from(portfolios)
    .where(isNull(portfolios.deletedAt))
    .orderBy(desc(portfolios.updatedAt))
    .all()

  return rows.map((p) => {
    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(portfolioItems)
      .where(eq(portfolioItems.portfolioId, p.id))
      .get()

    return {
      ...p,
      itemCount: countResult?.count || 0
    }
  })
}

export function updatePortfolio(
  id: string,
  data: Partial<CreatePortfolioData>
): PortfolioRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.title !== undefined) updateValues.title = data.title
  if (data.category !== undefined) updateValues.category = data.category
  if (data.demographicsFilter !== undefined)
    updateValues.demographicsFilter = data.demographicsFilter
  if (data.ownerId !== undefined) updateValues.ownerId = data.ownerId

  db.update(portfolios).set(updateValues).where(eq(portfolios.id, id)).run()

  return getPortfolio(id)
}

export function deletePortfolio(id: string): void {
  const db = getDatabase()
  db.update(portfolios)
    .set({ deletedAt: sql`datetime('now')` })
    .where(eq(portfolios.id, id))
    .run()
}

// ── Portfolio Item CRUD ─────────────────────────────────────────────

export function createPortfolioItem(data: CreatePortfolioItemData): PortfolioItemRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(portfolioItems)
    .values({
      id,
      portfolioId: data.portfolioId,
      patientId: data.patientId,
      beforeVisitId: data.beforeVisitId,
      afterVisitId: data.afterVisitId,
      photoPosition: data.photoPosition,
      photoState: data.photoState
    })
    .run()

  return getPortfolioItem(id)!
}

export function getPortfolioItem(id: string): PortfolioItemRow | null {
  const db = getDatabase()
  const result = db.select().from(portfolioItems).where(eq(portfolioItems.id, id)).get()

  return result || null
}

export function listPortfolioItems(portfolioId: string): PortfolioItemWithDetails[] {
  const db = getDatabase()

  const items = db
    .select()
    .from(portfolioItems)
    .where(eq(portfolioItems.portfolioId, portfolioId))
    .orderBy(desc(portfolioItems.createdAt))
    .all()

  return items.map((item) => {
    // Get patient name
    const patient = db
      .select({ firstName: patients.firstName, lastName: patients.lastName })
      .from(patients)
      .where(eq(patients.id, item.patientId))
      .get()

    // Get before visit date
    const beforeVisit = item.beforeVisitId
      ? db.select({ date: visits.date }).from(visits).where(eq(visits.id, item.beforeVisitId)).get()
      : null

    // Get after visit date
    const afterVisit = item.afterVisitId
      ? db.select({ date: visits.date }).from(visits).where(eq(visits.id, item.afterVisitId)).get()
      : null

    // Build photo filter conditions (position + optional state)
    const buildPhotoFilter = (visitId: string) => {
      const conditions = [
        eq(photos.visitId, visitId),
        eq(photos.photoPosition, item.photoPosition!),
        isNull(photos.deletedAt)
      ]
      if (item.photoState) {
        conditions.push(eq(photos.photoState, item.photoState))
      }
      return and(...conditions)
    }

    // Get before photo for this position+state
    let beforePhoto: { originalPath: string; thumbnailPath: string | null } | null = null
    if (item.beforeVisitId && item.photoPosition) {
      beforePhoto = db
        .select({ originalPath: photos.originalPath, thumbnailPath: photos.thumbnailPath })
        .from(photos)
        .where(buildPhotoFilter(item.beforeVisitId))
        .get() || null
    }

    // Get after photo for this position+state
    let afterPhoto: { originalPath: string; thumbnailPath: string | null } | null = null
    if (item.afterVisitId && item.photoPosition) {
      afterPhoto = db
        .select({ originalPath: photos.originalPath, thumbnailPath: photos.thumbnailPath })
        .from(photos)
        .where(buildPhotoFilter(item.afterVisitId))
        .get() || null
    }

    return {
      ...item,
      patientFirstName: patient?.firstName || 'Unknown',
      patientLastName: patient?.lastName || '',
      beforeDate: beforeVisit?.date || null,
      afterDate: afterVisit?.date || null,
      beforePhotoPath: beforePhoto?.originalPath || null,
      afterPhotoPath: afterPhoto?.originalPath || null,
      beforeThumbnailPath: beforePhoto?.thumbnailPath || null,
      afterThumbnailPath: afterPhoto?.thumbnailPath || null
    }
  })
}

export function deletePortfolioItem(id: string): void {
  const db = getDatabase()
  db.delete(portfolioItems).where(eq(portfolioItems.id, id)).run()
}

// ── Compare Visits Helper ───────────────────────────────────────────

export interface ComparePhotoPair {
  position: string
  photoState: string | null
  beforePhoto: {
    id: string
    originalPath: string
    thumbnailPath: string | null
    photoState: string | null
  } | null
  afterPhoto: {
    id: string
    originalPath: string
    thumbnailPath: string | null
    photoState: string | null
  } | null
}

export function getCompareVisitPhotos(
  beforeVisitId: string,
  afterVisitId: string
): ComparePhotoPair[] {
  const db = getDatabase()

  // Get all photos from both visits, ordered deterministically
  const beforePhotos = db
    .select()
    .from(photos)
    .where(and(eq(photos.visitId, beforeVisitId), isNull(photos.deletedAt)))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))
    .all()

  const afterPhotos = db
    .select()
    .from(photos)
    .where(and(eq(photos.visitId, afterVisitId), isNull(photos.deletedAt)))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt))
    .all()

  // Build composite key: "position|state" for matching
  // This ensures same position with different states are treated as separate pairs
  const compositeKey = (p: { photoPosition: string | null; photoState: string | null }): string => {
    const pos = p.photoPosition || ''
    const state = p.photoState || ''
    return `${pos}|${state}`
  }

  // Build a set of all unique composite keys
  const keySet = new Set<string>()
  for (const p of beforePhotos) {
    if (p.photoPosition) keySet.add(compositeKey(p))
  }
  for (const p of afterPhotos) {
    if (p.photoPosition) keySet.add(compositeKey(p))
  }

  // Build pairs by composite key (position + state)
  const pairs: ComparePhotoPair[] = []
  for (const key of keySet) {
    const [position, state] = key.split('|')
    if (!position) continue

    const before = beforePhotos.find(
      (p) => p.photoPosition === position && (p.photoState || '') === state
    ) || null
    const after = afterPhotos.find(
      (p) => p.photoPosition === position && (p.photoState || '') === state
    ) || null

    pairs.push({
      position,
      photoState: state || null,
      beforePhoto: before
        ? {
            id: before.id,
            originalPath: before.originalPath,
            thumbnailPath: before.thumbnailPath,
            photoState: before.photoState
          }
        : null,
      afterPhoto: after
        ? {
            id: after.id,
            originalPath: after.originalPath,
            thumbnailPath: after.thumbnailPath,
            photoState: after.photoState
          }
        : null
    })
  }

  return pairs
}
