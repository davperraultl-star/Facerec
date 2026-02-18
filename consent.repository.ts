import { eq, desc, sql } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../connection'
import { consents, consentTemplates } from '../schema'

// ── Consent Types ─────────────────────────────────────────────────

export interface ConsentRow {
  id: string
  patientId: string
  visitId: string | null
  type: string
  consentText: string | null
  signatureData: string | null
  signedAt: string | null
  createdAt: string
}

export interface CreateConsentData {
  patientId: string
  visitId?: string
  type: string
  consentText?: string
  signatureData?: string
  signedAt?: string
}

export interface ConsentTemplateRow {
  id: string
  name: string
  type: string
  contentJson: string | null
  isDefault: boolean | null
  createdAt: string
  updatedAt: string
}

export interface CreateConsentTemplateData {
  name: string
  type: string
  contentJson?: string
  isDefault?: boolean
}

// ── Consent CRUD ──────────────────────────────────────────────────

export function createConsent(data: CreateConsentData): ConsentRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(consents)
    .values({
      id,
      patientId: data.patientId,
      visitId: data.visitId,
      type: data.type,
      consentText: data.consentText,
      signatureData: data.signatureData,
      signedAt: data.signedAt
    })
    .run()

  return getConsent(id)!
}

export function getConsent(id: string): ConsentRow | null {
  const db = getDatabase()
  const result = db.select().from(consents).where(eq(consents.id, id)).get()
  return result || null
}

export function listConsentsForPatient(patientId: string): ConsentRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(consents)
    .where(eq(consents.patientId, patientId))
    .orderBy(desc(consents.createdAt))
    .all()
}

export function listConsentsForVisit(visitId: string): ConsentRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(consents)
    .where(eq(consents.visitId, visitId))
    .orderBy(desc(consents.createdAt))
    .all()
}

export function deleteConsent(id: string): void {
  const db = getDatabase()
  db.delete(consents).where(eq(consents.id, id)).run()
}

// ── Consent Template CRUD ─────────────────────────────────────────

export function createConsentTemplate(data: CreateConsentTemplateData): ConsentTemplateRow {
  const db = getDatabase()
  const id = uuid()

  db.insert(consentTemplates)
    .values({
      id,
      name: data.name,
      type: data.type,
      contentJson: data.contentJson,
      isDefault: data.isDefault
    })
    .run()

  return getConsentTemplate(id)!
}

export function getConsentTemplate(id: string): ConsentTemplateRow | null {
  const db = getDatabase()
  const result = db.select().from(consentTemplates).where(eq(consentTemplates.id, id)).get()
  return result || null
}

export function listConsentTemplates(): ConsentTemplateRow[] {
  const db = getDatabase()
  return db
    .select()
    .from(consentTemplates)
    .orderBy(consentTemplates.type, consentTemplates.name)
    .all()
}

export function updateConsentTemplate(
  id: string,
  data: Partial<CreateConsentTemplateData>
): ConsentTemplateRow | null {
  const db = getDatabase()

  const updateValues: Record<string, unknown> = {
    updatedAt: sql`datetime('now')`
  }

  if (data.name !== undefined) updateValues.name = data.name
  if (data.type !== undefined) updateValues.type = data.type
  if (data.contentJson !== undefined) updateValues.contentJson = data.contentJson
  if (data.isDefault !== undefined) updateValues.isDefault = data.isDefault

  db.update(consentTemplates).set(updateValues).where(eq(consentTemplates.id, id)).run()

  return getConsentTemplate(id)
}

export function deleteConsentTemplate(id: string): void {
  const db = getDatabase()
  db.delete(consentTemplates).where(eq(consentTemplates.id, id)).run()
}
