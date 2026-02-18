import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ── Users (practitioners) ──────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('practitioner'),
  pin: text('pin'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at')
})

// ── Patients ───────────────────────────────────────────────────────
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  sex: text('sex'),
  birthday: text('birthday'),
  ethnicity: text('ethnicity'),

  // Contact
  email: text('email'),
  homePhone: text('home_phone'),
  cellPhone: text('cell_phone'),
  workPhone: text('work_phone'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  province: text('province'),

  // Medical conditions stored as JSON array of condition names
  medicalConditions: text('medical_conditions'),

  // Medical history
  familyPhysician: text('family_physician'),
  weight: text('weight'),
  height: text('height'),
  pastIllnesses: text('past_illnesses'),
  currentMedications: text('current_medications'),
  conditionsBeingTreated: text('conditions_being_treated'),
  previousSpecialistTreatment: integer('previous_specialist_treatment', { mode: 'boolean' }),
  pregnantOrBreastfeeding: integer('pregnant_or_breastfeeding', { mode: 'boolean' }),
  smoker: integer('smoker', { mode: 'boolean' }),

  // Visit info
  referralSources: text('referral_sources'), // JSON array
  treatmentInterests: text('treatment_interests'), // JSON array

  // Consents
  botulinumToxinConsent: text('botulinum_toxin_consent'),
  photoConsent: text('photo_consent'),

  // Quick register flag
  quickRegister: integer('quick_register', { mode: 'boolean' }).default(false),

  // Avatar photo path
  avatarPath: text('avatar_path'),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at')
})

// ── Visits ─────────────────────────────────────────────────────────
export const visits = sqliteTable('visits', {
  id: text('id').primaryKey(),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  practitionerId: text('practitioner_id').references(() => users.id),
  date: text('date').notNull(),
  time: text('time'),
  clinicalNotes: text('clinical_notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at')
})

// ── Photos ─────────────────────────────────────────────────────────
export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  visitId: text('visit_id')
    .notNull()
    .references(() => visits.id),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  originalPath: text('original_path').notNull(),
  thumbnailPath: text('thumbnail_path'),
  photoPosition: text('photo_position'),
  photoState: text('photo_state'), // 'relaxed' | 'active'
  isMarked: integer('is_marked', { mode: 'boolean' }).default(false),
  markedPath: text('marked_path'),
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at')
})

// ── Products (injectable catalog) ──────────────────────────────────
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  category: text('category').notNull(), // 'neurotoxin' | 'filler' | 'microneedling'
  unitType: text('unit_type').default('units'),
  defaultCost: real('default_cost'),
  color: text('color'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Treated Areas ──────────────────────────────────────────────────
export const treatedAreas = sqliteTable('treated_areas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Treatments (per visit) ─────────────────────────────────────────
export const treatments = sqliteTable('treatments', {
  id: text('id').primaryKey(),
  visitId: text('visit_id')
    .notNull()
    .references(() => visits.id),
  treatmentType: text('treatment_type'),
  productId: text('product_id').references(() => products.id),
  lotNumber: text('lot_number'),
  expiryDate: text('expiry_date'),
  totalUnits: real('total_units'),
  totalCost: real('total_cost'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at')
})

// ── Treatment Areas (areas per treatment) ──────────────────────────
export const treatmentAreas = sqliteTable('treatment_areas', {
  id: text('id').primaryKey(),
  treatmentId: text('treatment_id')
    .notNull()
    .references(() => treatments.id),
  treatedAreaId: text('treated_area_id')
    .notNull()
    .references(() => treatedAreas.id),
  units: real('units'),
  cost: real('cost'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Annotations (injection site map data) ──────────────────────────
export const annotations = sqliteTable('annotations', {
  id: text('id').primaryKey(),
  treatmentId: text('treatment_id')
    .notNull()
    .references(() => treatments.id),
  diagramView: text('diagram_view'), // 'front' | 'left' | 'right' | 'three_quarter'
  pointsJson: text('points_json'), // JSON array of {x, y, label}
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Consents ───────────────────────────────────────────────────────
export const consents = sqliteTable('consents', {
  id: text('id').primaryKey(),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  visitId: text('visit_id').references(() => visits.id),
  type: text('type').notNull(), // 'botulinum' | 'filler' | 'photo'
  consentText: text('consent_text'),
  signatureData: text('signature_data'), // base64 signature image
  signedAt: text('signed_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Consent Templates ──────────────────────────────────────────────
export const consentTemplates = sqliteTable('consent_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  contentJson: text('content_json'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Portfolios ─────────────────────────────────────────────────────
export const portfolios = sqliteTable('portfolios', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category'),
  demographicsFilter: text('demographics_filter'), // JSON
  ownerId: text('owner_id').references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at')
})

// ── Portfolio Items ────────────────────────────────────────────────
export const portfolioItems = sqliteTable('portfolio_items', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id')
    .notNull()
    .references(() => portfolios.id),
  patientId: text('patient_id')
    .notNull()
    .references(() => patients.id),
  beforeVisitId: text('before_visit_id').references(() => visits.id),
  afterVisitId: text('after_visit_id').references(() => visits.id),
  photoPosition: text('photo_position'),
  photoState: text('photo_state'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── Treatment Categories ─────────────────────────────────────────────
export const treatmentCategories = sqliteTable('treatment_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull().default('facial'), // 'facial' | 'dental'
  color: text('color'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})

// ── App Settings ───────────────────────────────────────────────────
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`)
})
