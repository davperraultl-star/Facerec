import { getSqlite } from './connection'

/**
 * Run migrations by creating tables directly from schema definitions.
 * For Stage 1, we use a simple CREATE TABLE IF NOT EXISTS approach.
 * Drizzle-kit migrations can be layered on later for production schema evolution.
 */
export function runMigrations(): void {
  const sqlite = getSqlite()

  console.log('[DB] Running migrations...')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'practitioner',
      pin TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      sex TEXT,
      birthday TEXT,
      ethnicity TEXT,
      email TEXT,
      home_phone TEXT,
      cell_phone TEXT,
      work_phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      province TEXT,
      medical_conditions TEXT,
      family_physician TEXT,
      weight TEXT,
      height TEXT,
      past_illnesses TEXT,
      current_medications TEXT,
      conditions_being_treated TEXT,
      previous_specialist_treatment INTEGER,
      pregnant_or_breastfeeding INTEGER,
      smoker INTEGER,
      referral_sources TEXT,
      treatment_interests TEXT,
      botulinum_toxin_consent TEXT,
      photo_consent TEXT,
      quick_register INTEGER DEFAULT 0,
      avatar_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      practitioner_id TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      time TEXT,
      clinical_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id),
      patient_id TEXT NOT NULL REFERENCES patients(id),
      original_path TEXT NOT NULL,
      thumbnail_path TEXT,
      photo_position TEXT,
      photo_state TEXT,
      is_marked INTEGER DEFAULT 0,
      marked_path TEXT,
      width INTEGER,
      height INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT NOT NULL,
      unit_type TEXT DEFAULT 'units',
      default_cost REAL,
      color TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS treated_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL REFERENCES visits(id),
      treatment_type TEXT,
      product_id TEXT REFERENCES products(id),
      lot_number TEXT,
      expiry_date TEXT,
      total_units REAL,
      total_cost REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS treatment_areas (
      id TEXT PRIMARY KEY,
      treatment_id TEXT NOT NULL REFERENCES treatments(id),
      treated_area_id TEXT NOT NULL REFERENCES treated_areas(id),
      units REAL,
      cost REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      treatment_id TEXT NOT NULL REFERENCES treatments(id),
      diagram_view TEXT,
      points_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      visit_id TEXT REFERENCES visits(id),
      type TEXT NOT NULL,
      consent_text TEXT,
      signature_data TEXT,
      signed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consent_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content_json TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      demographics_filter TEXT,
      owner_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY,
      portfolio_id TEXT NOT NULL REFERENCES portfolios(id),
      patient_id TEXT NOT NULL REFERENCES patients(id),
      before_visit_id TEXT REFERENCES visits(id),
      after_visit_id TEXT REFERENCES visits(id),
      photo_position TEXT,
      photo_state TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS treatment_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'facial',
      color TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Create indexes for common queries
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);
    CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
    CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
    CREATE INDEX IF NOT EXISTS idx_photos_visit ON photos(visit_id);
    CREATE INDEX IF NOT EXISTS idx_photos_patient ON photos(patient_id);
    CREATE INDEX IF NOT EXISTS idx_treatments_visit ON treatments(visit_id);
    CREATE INDEX IF NOT EXISTS idx_treatment_areas_treatment ON treatment_areas(treatment_id);
    CREATE INDEX IF NOT EXISTS idx_treatment_categories_slug ON treatment_categories(slug);
    CREATE INDEX IF NOT EXISTS idx_treatment_categories_type ON treatment_categories(type);
    CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio ON portfolio_items(portfolio_id);
    CREATE INDEX IF NOT EXISTS idx_portfolio_items_patient ON portfolio_items(patient_id);
    CREATE INDEX IF NOT EXISTS idx_photos_position ON photos(photo_position);
  `)

  // Additive column migrations (safe for existing databases)
  try {
    sqlite.exec(`ALTER TABLE portfolio_items ADD COLUMN photo_state TEXT;`)
    console.log('[DB] Added photo_state column to portfolio_items')
  } catch {
    // Column already exists — this is expected on subsequent launches
  }

  console.log('[DB] Migrations complete')
}
