import { app, ipcMain, dialog, shell, BrowserWindow } from "electron";
import { join, extname, basename } from "path";
import { is, electronApp, optimizer } from "@electron-toolkit/utils";
import { existsSync, mkdirSync, copyFileSync, unlinkSync, statSync, readdirSync, createWriteStream } from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql, eq, and, isNull, or, like, desc, asc } from "drizzle-orm";
import { v4 } from "uuid";
import sharp from "sharp";
import PDFDocument from "pdfkit";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("practitioner"),
  pin: text("pin"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at")
});
const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  sex: text("sex"),
  birthday: text("birthday"),
  ethnicity: text("ethnicity"),
  // Contact
  email: text("email"),
  homePhone: text("home_phone"),
  cellPhone: text("cell_phone"),
  workPhone: text("work_phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  province: text("province"),
  // Medical conditions stored as JSON array of condition names
  medicalConditions: text("medical_conditions"),
  // Medical history
  familyPhysician: text("family_physician"),
  weight: text("weight"),
  height: text("height"),
  pastIllnesses: text("past_illnesses"),
  currentMedications: text("current_medications"),
  conditionsBeingTreated: text("conditions_being_treated"),
  previousSpecialistTreatment: integer("previous_specialist_treatment", { mode: "boolean" }),
  pregnantOrBreastfeeding: integer("pregnant_or_breastfeeding", { mode: "boolean" }),
  smoker: integer("smoker", { mode: "boolean" }),
  // Visit info
  referralSources: text("referral_sources"),
  // JSON array
  treatmentInterests: text("treatment_interests"),
  // JSON array
  // Consents
  botulinumToxinConsent: text("botulinum_toxin_consent"),
  photoConsent: text("photo_consent"),
  // Quick register flag
  quickRegister: integer("quick_register", { mode: "boolean" }).default(false),
  // Avatar photo path
  avatarPath: text("avatar_path"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at")
});
const visits = sqliteTable("visits", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  practitionerId: text("practitioner_id").references(() => users.id),
  date: text("date").notNull(),
  time: text("time"),
  clinicalNotes: text("clinical_notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at")
});
const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  visitId: text("visit_id").notNull().references(() => visits.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  originalPath: text("original_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  photoPosition: text("photo_position"),
  photoState: text("photo_state"),
  // 'relaxed' | 'active'
  isMarked: integer("is_marked", { mode: "boolean" }).default(false),
  markedPath: text("marked_path"),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at")
});
const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").notNull(),
  // 'neurotoxin' | 'filler' | 'microneedling'
  unitType: text("unit_type").default("units"),
  defaultCost: real("default_cost"),
  color: text("color"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
const treatedAreas = sqliteTable("treated_areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
const treatments = sqliteTable("treatments", {
  id: text("id").primaryKey(),
  visitId: text("visit_id").notNull().references(() => visits.id),
  treatmentType: text("treatment_type"),
  productId: text("product_id").references(() => products.id),
  lotNumber: text("lot_number"),
  expiryDate: text("expiry_date"),
  totalUnits: real("total_units"),
  totalCost: real("total_cost"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at")
});
const treatmentAreas = sqliteTable("treatment_areas", {
  id: text("id").primaryKey(),
  treatmentId: text("treatment_id").notNull().references(() => treatments.id),
  treatedAreaId: text("treated_area_id").notNull().references(() => treatedAreas.id),
  units: real("units"),
  cost: real("cost"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});
const annotations = sqliteTable("annotations", {
  id: text("id").primaryKey(),
  treatmentId: text("treatment_id").notNull().references(() => treatments.id),
  diagramView: text("diagram_view"),
  // 'front' | 'left' | 'right' | 'three_quarter'
  pointsJson: text("points_json"),
  // JSON array of {x, y, label}
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
const consents = sqliteTable("consents", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  visitId: text("visit_id").references(() => visits.id),
  type: text("type").notNull(),
  // 'botulinum' | 'filler' | 'photo'
  consentText: text("consent_text"),
  signatureData: text("signature_data"),
  // base64 signature image
  signedAt: text("signed_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});
const consentTemplates = sqliteTable("consent_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  contentJson: text("content_json"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
const portfolios = sqliteTable("portfolios", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category"),
  demographicsFilter: text("demographics_filter"),
  // JSON
  ownerId: text("owner_id").references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at")
});
const portfolioItems = sqliteTable("portfolio_items", {
  id: text("id").primaryKey(),
  portfolioId: text("portfolio_id").notNull().references(() => portfolios.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  beforeVisitId: text("before_visit_id").references(() => visits.id),
  afterVisitId: text("after_visit_id").references(() => visits.id),
  photoPosition: text("photo_position"),
  photoState: text("photo_state"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});
const treatmentCategories = sqliteTable("treatment_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull().default("facial"),
  // 'facial' | 'dental'
  color: text("color"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  annotations,
  appSettings,
  consentTemplates,
  consents,
  patients,
  photos,
  portfolioItems,
  portfolios,
  products,
  treatedAreas,
  treatmentAreas,
  treatmentCategories,
  treatments,
  users,
  visits
}, Symbol.toStringTag, { value: "Module" }));
let db = null;
let sqlite = null;
function getDataPath() {
  const userDataPath = app.getPath("userData");
  const dataDir = join(userDataPath, "apexrec-data");
  const dbDir = join(dataDir, "db");
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
  const photoDirs = ["photos/originals", "photos/thumbnails", "photos/marked", "exports", "backups"];
  for (const dir of photoDirs) {
    const fullPath = join(dataDir, dir);
    if (!existsSync(fullPath)) mkdirSync(fullPath, { recursive: true });
  }
  return join(dbDir, "apexrec.db");
}
function initDatabase() {
  if (db) return db;
  const dbPath = getDataPath();
  console.log("[DB] Opening database at:", dbPath);
  sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });
  return db;
}
function getDatabase() {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}
function getSqlite() {
  if (!sqlite) throw new Error("Database not initialized. Call initDatabase() first.");
  return sqlite;
}
function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    console.log("[DB] Database closed");
  }
}
function getDataDirectory() {
  return join(app.getPath("userData"), "apexrec-data");
}
function runMigrations() {
  const sqlite2 = getSqlite();
  console.log("[DB] Running migrations...");
  sqlite2.exec(`
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
  `);
  sqlite2.exec(`
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
  `);
  try {
    sqlite2.exec(`ALTER TABLE portfolio_items ADD COLUMN photo_state TEXT;`);
    console.log("[DB] Added photo_state column to portfolio_items");
  } catch {
  }
  console.log("[DB] Migrations complete");
}
function seedDatabase() {
  const db2 = getDatabase();
  console.log("[DB] Seeding database...");
  const existingUsers = db2.select().from(users).all();
  if (existingUsers.length === 0) {
    const userId = v4();
    db2.insert(users).values({
      id: userId,
      name: "Dr. Warren",
      role: "practitioner"
    }).run();
    const existingPref = db2.select().from(appSettings).where(eq(appSettings.key, "active_practitioner_id")).get();
    if (!existingPref) {
      db2.insert(appSettings).values({ key: "active_practitioner_id", value: userId }).run();
    }
    console.log("[DB] Created default practitioner");
  }
  const existingCategories = db2.select().from(treatmentCategories).all();
  if (existingCategories.length === 0) {
    const categoryData = [
      // Facial categories (slugs match existing products.category values)
      { name: "Neurotoxin", slug: "neurotoxin", type: "facial", color: "#3B82F6", sortOrder: 1 },
      { name: "Filler", slug: "filler", type: "facial", color: "#EC4899", sortOrder: 2 },
      { name: "Microneedling", slug: "microneedling", type: "facial", color: "#F59E0B", sortOrder: 3 },
      // Dental categories
      { name: "Whitening", slug: "whitening", type: "dental", color: "#FBBF24", sortOrder: 10 },
      { name: "Veneer", slug: "veneer", type: "dental", color: "#F0FDFA", sortOrder: 11 },
      { name: "Bonding", slug: "bonding", type: "dental", color: "#A78BFA", sortOrder: 12 },
      { name: "Crowns & Bridges", slug: "crowns-bridges", type: "dental", color: "#D4A574", sortOrder: 13 },
      { name: "Orthodontics / Aligners", slug: "orthodontics", type: "dental", color: "#60A5FA", sortOrder: 14 },
      { name: "Implants", slug: "implants", type: "dental", color: "#94A3B8", sortOrder: 15 },
      { name: "Gum Contouring", slug: "gum-contouring", type: "dental", color: "#FB7185", sortOrder: 16 },
      { name: "Resin Infiltration", slug: "resin-infiltration", type: "dental", color: "#34D399", sortOrder: 17 }
    ];
    for (const c of categoryData) {
      db2.insert(treatmentCategories).values({ id: v4(), ...c }).run();
    }
    console.log("[DB] Seeded", categoryData.length, "treatment categories");
  }
  const existingProducts = db2.select().from(products).all();
  if (existingProducts.length === 0) {
    const productData = [
      // Neurotoxins
      { name: "Botox", brand: "Allergan", category: "neurotoxin", unitType: "units", color: "#3B82F6" },
      { name: "Botox Cosmetic", brand: "Allergan", category: "neurotoxin", unitType: "units", color: "#2563EB" },
      { name: "Dysport", brand: "Galderma", category: "neurotoxin", unitType: "units", color: "#8B5CF6" },
      { name: "Xeomin", brand: "Merz", category: "neurotoxin", unitType: "units", color: "#6366F1" },
      // Fillers
      { name: "Belotero", brand: "Merz", category: "filler", unitType: "ml", color: "#EC4899" },
      { name: "Emervel", brand: "Galderma", category: "filler", unitType: "ml", color: "#F43F5E" },
      { name: "Juvederm Ultra", brand: "Allergan", category: "filler", unitType: "ml", color: "#F97316" },
      { name: "Juvederm Ultra Plus", brand: "Allergan", category: "filler", unitType: "ml", color: "#FB923C" },
      { name: "Restylane", brand: "Galderma", category: "filler", unitType: "ml", color: "#14B8A6" },
      { name: "Teosyal", brand: "Teoxane", category: "filler", unitType: "ml", color: "#06B6D4" },
      { name: "Perlane", brand: "Galderma", category: "filler", unitType: "ml", color: "#0EA5E9" },
      { name: "Sculptra", brand: "Galderma", category: "filler", unitType: "vial", color: "#10B981" }
    ];
    for (const p of productData) {
      db2.insert(products).values({ id: v4(), ...p }).run();
    }
    console.log("[DB] Seeded", productData.length, "facial products");
  }
  const existingDentalProducts = db2.select().from(products).where(eq(products.category, "veneer")).all();
  if (existingDentalProducts.length === 0) {
    const dentalProductData = [
      // Veneers
      { name: "E.max Press", brand: "Ivoclar", category: "veneer", unitType: "unit", color: "#F0FDFA" },
      { name: "Lumineers", brand: "DenMat", category: "veneer", unitType: "unit", color: "#ECFDF5" },
      { name: "Empress", brand: "Ivoclar", category: "veneer", unitType: "unit", color: "#F0FDF4" },
      // Aligners / Orthodontics
      { name: "Invisalign", brand: "Align Technology", category: "orthodontics", unitType: "tray", color: "#60A5FA" },
      { name: "ClearCorrect", brand: "Straumann", category: "orthodontics", unitType: "tray", color: "#93C5FD" },
      { name: "SureSmile", brand: "Dentsply Sirona", category: "orthodontics", unitType: "tray", color: "#BFDBFE" },
      // Whitening
      { name: "ZOOM", brand: "Philips", category: "whitening", unitType: "session", color: "#FBBF24" },
      { name: "Opalescence Boost", brand: "Ultradent", category: "whitening", unitType: "session", color: "#FDE68A" },
      { name: "KöR Whitening", brand: "KöR", category: "whitening", unitType: "session", color: "#FEF3C7" },
      // Bonding / Composites
      { name: "Venus Diamond", brand: "Kulzer", category: "bonding", unitType: "syringe", color: "#A78BFA" },
      { name: "Filtek Supreme", brand: "3M", category: "bonding", unitType: "syringe", color: "#C4B5FD" },
      { name: "Clearfil Majesty", brand: "Kuraray", category: "bonding", unitType: "syringe", color: "#DDD6FE" },
      // Resin Infiltration
      { name: "ICON", brand: "DMG", category: "resin-infiltration", unitType: "application", color: "#34D399" },
      // Crowns & Bridges
      { name: "Zirconia Crown", brand: "Generic", category: "crowns-bridges", unitType: "unit", color: "#D4A574" },
      { name: "PFM Crown", brand: "Generic", category: "crowns-bridges", unitType: "unit", color: "#C9A67E" },
      // Implants
      { name: "Straumann BLT", brand: "Straumann", category: "implants", unitType: "unit", color: "#94A3B8" },
      { name: "Nobel Biocare Active", brand: "Nobel Biocare", category: "implants", unitType: "unit", color: "#CBD5E1" },
      // Gum Contouring
      { name: "Diode Laser Gingivectomy", brand: "Generic", category: "gum-contouring", unitType: "session", color: "#FB7185" }
    ];
    for (const p of dentalProductData) {
      db2.insert(products).values({ id: v4(), ...p }).run();
    }
    console.log("[DB] Seeded", dentalProductData.length, "dental products");
  }
  const existingAreas = db2.select().from(treatedAreas).all();
  if (existingAreas.length === 0) {
    const areaData = [
      { name: "Brow Lift", color: "#F59E0B" },
      { name: "Crow's Feet", color: "#8B5CF6" },
      { name: "Frontalis", color: "#3B82F6" },
      { name: "Glabella", color: "#22C55E" },
      { name: "Lower Face", color: "#EF4444" },
      { name: "Mid Face", color: "#F97316" },
      { name: "Platysma", color: "#14B8A6" },
      { name: "Occipital", color: "#6366F1" },
      { name: "TMD", color: "#EC4899" }
    ];
    for (const a of areaData) {
      db2.insert(treatedAreas).values({ id: v4(), ...a }).run();
    }
    console.log("[DB] Seeded", areaData.length, "facial treated areas");
  }
  const existingDentalAreas = db2.select().from(treatedAreas).where(eq(treatedAreas.name, "Upper Right Quadrant (11-18)")).all();
  if (existingDentalAreas.length === 0) {
    const dentalAreaData = [
      // Quadrants (FDI notation)
      { name: "Upper Right Quadrant (11-18)", color: "#3B82F6" },
      { name: "Upper Left Quadrant (21-28)", color: "#8B5CF6" },
      { name: "Lower Left Quadrant (31-38)", color: "#22C55E" },
      { name: "Lower Right Quadrant (41-48)", color: "#F59E0B" },
      // Zones
      { name: "Upper Anteriors", color: "#06B6D4" },
      { name: "Lower Anteriors", color: "#14B8A6" },
      { name: "Upper Premolars", color: "#F97316" },
      { name: "Lower Premolars", color: "#FB923C" },
      { name: "Upper Molars", color: "#EF4444" },
      { name: "Lower Molars", color: "#F43F5E" },
      // Full arches
      { name: "Full Upper Arch", color: "#6366F1" },
      { name: "Full Lower Arch", color: "#A78BFA" }
    ];
    for (const a of dentalAreaData) {
      db2.insert(treatedAreas).values({ id: v4(), ...a }).run();
    }
    console.log("[DB] Seeded", dentalAreaData.length, "dental treated areas");
  }
  const existingTemplates = db2.select().from(consentTemplates).all();
  if (existingTemplates.length === 0) {
    const templateData = [
      {
        name: "Botulinum Toxin Consent",
        type: "botulinum",
        isDefault: true,
        contentJson: JSON.stringify({
          title: "Consent for Botulinum Toxin Treatment",
          sections: [
            {
              heading: "Purpose of Treatment",
              body: "Botulinum toxin (e.g. Botox®, Dysport®, Xeomin®) is a prescription medication injected into muscles to temporarily reduce the appearance of moderate to severe wrinkles, or to treat other medical conditions such as TMD/TMJ disorders, migraines, and hyperhidrosis. The effects typically last 3–6 months."
            },
            {
              heading: "Risks and Side Effects",
              body: "Common side effects include temporary redness, swelling, bruising, or tenderness at the injection site. Less common risks include headache, flu-like symptoms, drooping of the eyelid or eyebrow (ptosis), asymmetry, dry eyes, and allergic reactions. Rare but serious complications may include difficulty swallowing, breathing, or speaking if the toxin spreads beyond the injection site."
            },
            {
              heading: "Contraindications",
              body: "This treatment is not recommended for individuals who are pregnant or breastfeeding, have a neuromuscular disease (e.g. myasthenia gravis, Lambert-Eaton syndrome), are allergic to any botulinum toxin product or its ingredients, or have an active infection at the planned injection site."
            },
            {
              heading: "Alternatives",
              body: "Alternatives to botulinum toxin treatment include dermal fillers, chemical peels, laser resurfacing, microneedling, topical retinoids, or no treatment at all. Each alternative has its own risks and benefits, which can be discussed with your practitioner."
            },
            {
              heading: "Aftercare Instructions",
              body: "Do not rub or massage the treated area for 24 hours. Avoid lying down for 4 hours after treatment. Avoid strenuous exercise, alcohol, and excessive heat (saunas, hot tubs) for 24 hours. Contact the clinic immediately if you experience difficulty breathing, swallowing, or any signs of a severe allergic reaction."
            }
          ],
          acknowledgment: "I have read and understood the information provided above. I have had the opportunity to ask questions and have received satisfactory answers. I voluntarily consent to the botulinum toxin treatment as described by my practitioner."
        })
      },
      {
        name: "Dermal Filler Consent",
        type: "filler",
        isDefault: true,
        contentJson: JSON.stringify({
          title: "Consent for Dermal Filler Treatment",
          sections: [
            {
              heading: "Purpose of Treatment",
              body: "Dermal fillers (e.g. Juvederm®, Restylane®, Belotero®, Sculptra®) are injectable gel substances used to restore facial volume, smooth wrinkles and folds, enhance lips, and improve facial contours. Results are typically visible immediately and may last 6–24 months depending on the product used."
            },
            {
              heading: "Risks and Side Effects",
              body: "Common side effects include temporary swelling, redness, bruising, tenderness, and firmness at the injection site. Less common risks include lumps, asymmetry, migration of filler, infection, and allergic reactions. Rare but serious complications include vascular occlusion (blockage of blood vessels) which may lead to tissue necrosis or, in extremely rare cases, vision impairment or blindness."
            },
            {
              heading: "Contraindications",
              body: "This treatment is not recommended for individuals who are pregnant or breastfeeding, have active skin infections or inflammation at the treatment site, have a history of severe allergic reactions or anaphylaxis, have autoimmune conditions, or are taking blood-thinning medications without medical clearance."
            },
            {
              heading: "Alternatives",
              body: "Alternatives include botulinum toxin injections, fat transfer, surgical procedures (e.g. facelift), laser treatments, or no treatment. Your practitioner can discuss the benefits and risks of each alternative."
            },
            {
              heading: "Aftercare Instructions",
              body: "Avoid touching or massaging the treated area for 24 hours unless instructed otherwise. Apply ice gently to reduce swelling. Avoid strenuous exercise, alcohol, and excessive sun or heat exposure for 48 hours. Report any signs of unusual pain, skin discoloration, or vision changes to the clinic immediately."
            }
          ],
          acknowledgment: "I have read and understood the information provided above. I have had the opportunity to ask questions and have received satisfactory answers. I voluntarily consent to the dermal filler treatment as described by my practitioner."
        })
      },
      {
        name: "Photography Consent",
        type: "photo",
        isDefault: true,
        contentJson: JSON.stringify({
          title: "Consent for Clinical Photography",
          sections: [
            {
              heading: "Purpose",
              body: "Clinical photographs are taken to document your condition before, during, and after treatment. These photographs become part of your medical record and are used to monitor progress, plan treatment, and ensure the highest quality of care."
            },
            {
              heading: "Usage of Photographs",
              body: "With your permission, de-identified photographs (with no personally identifiable information) may be used for educational purposes, professional presentations, academic publications, or marketing materials. Your identity will be protected in all such uses. You may decline educational use without affecting your treatment in any way."
            },
            {
              heading: "Revocation",
              body: "You may revoke your consent for the educational or marketing use of your photographs at any time by notifying the clinic in writing. Revocation does not affect the use of photographs as part of your medical record, nor any uses that occurred prior to revocation."
            }
          ],
          acknowledgment: "I consent to having clinical photographs taken for my medical record. I understand that I may separately agree or decline to have my de-identified photographs used for educational or marketing purposes."
        })
      },
      {
        name: "General Dental Consent",
        type: "dental_general",
        isDefault: true,
        contentJson: JSON.stringify({
          title: "Consent for Cosmetic Dental Treatment",
          sections: [
            {
              heading: "Purpose of Treatment",
              body: "Cosmetic dental treatments (including but not limited to veneers, bonding, whitening, orthodontic aligners, crowns, bridges, implants, and gum contouring) are performed to improve the appearance, function, and health of your teeth and smile. Your practitioner will discuss the specific procedures recommended for your case."
            },
            {
              heading: "Risks and Complications",
              body: "General risks of cosmetic dental procedures include tooth sensitivity, discomfort or pain, allergic reactions to materials, damage to existing dental work, nerve injury, infection, and unsatisfactory aesthetic results. Specific risks vary by procedure: veneers require irreversible enamel removal; whitening may cause temporary sensitivity; implants carry surgical risks including bone loss; orthodontic treatment may cause root resorption."
            },
            {
              heading: "Alternatives",
              body: "Depending on your condition, alternatives may include different cosmetic approaches, restorative treatments, or no treatment. Your practitioner will discuss all available options, including their respective benefits, risks, and costs."
            },
            {
              heading: "Aftercare and Expectations",
              body: "Follow all post-treatment instructions provided by your practitioner. Attend all scheduled follow-up appointments. Results may vary and additional treatments may be necessary to achieve desired outcomes. Maintain good oral hygiene and regular dental check-ups to preserve treatment results."
            }
          ],
          acknowledgment: "I have read and understood the information provided above. I have had the opportunity to discuss my treatment plan, ask questions, and receive satisfactory answers. I voluntarily consent to the cosmetic dental treatment as recommended by my practitioner."
        })
      }
    ];
    for (const t of templateData) {
      db2.insert(consentTemplates).values({ id: v4(), ...t }).run();
    }
    console.log("[DB] Seeded", templateData.length, "consent templates");
  }
  const existingSettings = db2.select().from(appSettings).all();
  if (existingSettings.length === 0) {
    const settings = [
      { key: "tax_provincial_rate", value: "9.975" },
      { key: "tax_provincial_label", value: "QST" },
      { key: "tax_federal_rate", value: "5" },
      { key: "tax_federal_label", value: "GST" },
      { key: "clinic_name", value: "ApexRec Clinic" },
      { key: "currency", value: "CAD" }
    ];
    for (const s of settings) {
      db2.insert(appSettings).values(s).run();
    }
    console.log("[DB] Seeded default settings");
  }
  console.log("[DB] Seeding complete");
}
function serializeArrayField(arr) {
  return arr ? JSON.stringify(arr) : void 0;
}
function createPatient(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(patients).values({
    id,
    firstName: data.firstName,
    lastName: data.lastName,
    sex: data.sex,
    birthday: data.birthday,
    ethnicity: data.ethnicity,
    email: data.email,
    homePhone: data.homePhone,
    cellPhone: data.cellPhone,
    workPhone: data.workPhone,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode,
    province: data.province,
    medicalConditions: serializeArrayField(data.medicalConditions),
    familyPhysician: data.familyPhysician,
    weight: data.weight,
    height: data.height,
    pastIllnesses: data.pastIllnesses,
    currentMedications: data.currentMedications,
    conditionsBeingTreated: data.conditionsBeingTreated,
    previousSpecialistTreatment: data.previousSpecialistTreatment,
    pregnantOrBreastfeeding: data.pregnantOrBreastfeeding,
    smoker: data.smoker,
    referralSources: serializeArrayField(data.referralSources),
    treatmentInterests: serializeArrayField(data.treatmentInterests),
    botulinumToxinConsent: data.botulinumToxinConsent,
    photoConsent: data.photoConsent,
    quickRegister: data.quickRegister
  }).run();
  return getPatient(id);
}
function getPatient(id) {
  const db2 = getDatabase();
  const result = db2.select().from(patients).where(and(eq(patients.id, id), isNull(patients.deletedAt))).get();
  return result || null;
}
function listPatients(filters) {
  const db2 = getDatabase();
  const limit = filters?.limit || 25;
  const offset = filters?.offset || 0;
  let whereClause = isNull(patients.deletedAt);
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    whereClause = and(
      isNull(patients.deletedAt),
      or(
        like(patients.firstName, searchTerm),
        like(patients.lastName, searchTerm),
        like(patients.email, searchTerm),
        like(patients.cellPhone, searchTerm),
        like(patients.city, searchTerm)
      )
    );
  }
  const data = db2.select().from(patients).where(whereClause).orderBy(desc(patients.createdAt)).limit(limit).offset(offset).all();
  const totalResult = db2.select({ count: sql`count(*)` }).from(patients).where(whereClause).get();
  return { data, total: totalResult?.count || 0 };
}
function updatePatient(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.firstName !== void 0) updateValues.firstName = data.firstName;
  if (data.lastName !== void 0) updateValues.lastName = data.lastName;
  if (data.sex !== void 0) updateValues.sex = data.sex;
  if (data.birthday !== void 0) updateValues.birthday = data.birthday;
  if (data.ethnicity !== void 0) updateValues.ethnicity = data.ethnicity;
  if (data.email !== void 0) updateValues.email = data.email;
  if (data.homePhone !== void 0) updateValues.homePhone = data.homePhone;
  if (data.cellPhone !== void 0) updateValues.cellPhone = data.cellPhone;
  if (data.workPhone !== void 0) updateValues.workPhone = data.workPhone;
  if (data.address !== void 0) updateValues.address = data.address;
  if (data.city !== void 0) updateValues.city = data.city;
  if (data.postalCode !== void 0) updateValues.postalCode = data.postalCode;
  if (data.province !== void 0) updateValues.province = data.province;
  if (data.medicalConditions !== void 0)
    updateValues.medicalConditions = serializeArrayField(data.medicalConditions);
  if (data.familyPhysician !== void 0) updateValues.familyPhysician = data.familyPhysician;
  if (data.weight !== void 0) updateValues.weight = data.weight;
  if (data.height !== void 0) updateValues.height = data.height;
  if (data.pastIllnesses !== void 0) updateValues.pastIllnesses = data.pastIllnesses;
  if (data.currentMedications !== void 0)
    updateValues.currentMedications = data.currentMedications;
  if (data.conditionsBeingTreated !== void 0)
    updateValues.conditionsBeingTreated = data.conditionsBeingTreated;
  if (data.previousSpecialistTreatment !== void 0)
    updateValues.previousSpecialistTreatment = data.previousSpecialistTreatment;
  if (data.pregnantOrBreastfeeding !== void 0)
    updateValues.pregnantOrBreastfeeding = data.pregnantOrBreastfeeding;
  if (data.smoker !== void 0) updateValues.smoker = data.smoker;
  if (data.referralSources !== void 0)
    updateValues.referralSources = serializeArrayField(data.referralSources);
  if (data.treatmentInterests !== void 0)
    updateValues.treatmentInterests = serializeArrayField(data.treatmentInterests);
  if (data.botulinumToxinConsent !== void 0)
    updateValues.botulinumToxinConsent = data.botulinumToxinConsent;
  if (data.photoConsent !== void 0) updateValues.photoConsent = data.photoConsent;
  if (data.quickRegister !== void 0) updateValues.quickRegister = data.quickRegister;
  db2.update(patients).set(updateValues).where(eq(patients.id, id)).run();
  return getPatient(id);
}
function deletePatient(id) {
  const db2 = getDatabase();
  db2.update(patients).set({ deletedAt: sql`datetime('now')` }).where(eq(patients.id, id)).run();
}
function searchPatients(query) {
  const db2 = getDatabase();
  const searchTerm = `%${query}%`;
  return db2.select().from(patients).where(
    and(
      isNull(patients.deletedAt),
      or(
        like(patients.firstName, searchTerm),
        like(patients.lastName, searchTerm),
        like(patients.email, searchTerm),
        like(patients.cellPhone, searchTerm)
      )
    )
  ).orderBy(patients.lastName, patients.firstName).limit(50).all();
}
function getPatientStats() {
  const db2 = getDatabase();
  const patientCount = db2.select({ count: sql`count(*)` }).from(patients).where(isNull(patients.deletedAt)).get();
  const visitCount = db2.select({ count: sql`count(*)` }).from(visits).where(isNull(visits.deletedAt)).get();
  return {
    totalPatients: patientCount?.count || 0,
    totalVisits: visitCount?.count || 0
  };
}
function getRecentPatients(limit = 5) {
  const db2 = getDatabase();
  return db2.select().from(patients).where(isNull(patients.deletedAt)).orderBy(desc(patients.createdAt)).limit(limit).all();
}
function registerPatientIPC() {
  ipcMain.handle("patient:create", (_event, data) => {
    return createPatient(data);
  });
  ipcMain.handle("patient:get", (_event, id) => {
    return getPatient(id);
  });
  ipcMain.handle("patient:list", (_event, filters) => {
    return listPatients(filters);
  });
  ipcMain.handle("patient:update", (_event, id, data) => {
    return updatePatient(id, data);
  });
  ipcMain.handle("patient:delete", (_event, id) => {
    deletePatient(id);
  });
  ipcMain.handle("patient:search", (_event, query) => {
    return searchPatients(query);
  });
  ipcMain.handle("patient:stats", () => {
    return getPatientStats();
  });
  ipcMain.handle("patient:recent", (_event, limit) => {
    return getRecentPatients(limit);
  });
}
function getSetting(key) {
  const db2 = getDatabase();
  const result = db2.select().from(appSettings).where(eq(appSettings.key, key)).get();
  return result?.value ?? null;
}
function setSetting(key, value) {
  const db2 = getDatabase();
  db2.insert(appSettings).values({
    key,
    value,
    updatedAt: sql`datetime('now')`
  }).onConflictDoUpdate({
    target: appSettings.key,
    set: {
      value,
      updatedAt: sql`datetime('now')`
    }
  }).run();
}
function getMultipleSettings(keys) {
  const result = {};
  for (const key of keys) {
    result[key] = getSetting(key);
  }
  return result;
}
function setMultipleSettings(entries) {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value);
  }
}
function registerSettingsIPC() {
  ipcMain.handle("settings:get", (_event, key) => {
    return getSetting(key);
  });
  ipcMain.handle("settings:set", (_event, key, value) => {
    setSetting(key, value);
  });
  ipcMain.handle("settings:getMultiple", (_event, keys) => {
    return getMultipleSettings(keys);
  });
  ipcMain.handle("settings:setMultiple", (_event, entries) => {
    setMultipleSettings(entries);
  });
}
function createVisit(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(visits).values({
    id,
    patientId: data.patientId,
    practitionerId: data.practitionerId,
    date: data.date,
    time: data.time,
    clinicalNotes: data.clinicalNotes
  }).run();
  return getVisit(id);
}
function getVisit(id) {
  const db2 = getDatabase();
  const result = db2.select().from(visits).where(and(eq(visits.id, id), isNull(visits.deletedAt))).get();
  return result || null;
}
function listVisitsForPatient(patientId) {
  const db2 = getDatabase();
  const visitRows = db2.select().from(visits).where(and(eq(visits.patientId, patientId), isNull(visits.deletedAt))).orderBy(desc(visits.date)).all();
  return visitRows.map((v) => {
    const photoCount = db2.select({ count: sql`count(*)` }).from(photos).where(and(eq(photos.visitId, v.id), isNull(photos.deletedAt))).get();
    const treatmentCount = db2.select({ count: sql`count(*)` }).from(treatments).where(and(eq(treatments.visitId, v.id), isNull(treatments.deletedAt))).get();
    return {
      ...v,
      photoCount: photoCount?.count || 0,
      hasTreatments: (treatmentCount?.count || 0) > 0
    };
  });
}
function updateVisit(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.date !== void 0) updateValues.date = data.date;
  if (data.time !== void 0) updateValues.time = data.time;
  if (data.clinicalNotes !== void 0) updateValues.clinicalNotes = data.clinicalNotes;
  if (data.practitionerId !== void 0) updateValues.practitionerId = data.practitionerId;
  db2.update(visits).set(updateValues).where(eq(visits.id, id)).run();
  return getVisit(id);
}
function deleteVisit(id) {
  const db2 = getDatabase();
  db2.update(visits).set({ deletedAt: sql`datetime('now')` }).where(eq(visits.id, id)).run();
}
function registerVisitIPC() {
  ipcMain.handle("visit:create", (_event, data) => createVisit(data));
  ipcMain.handle("visit:get", (_event, id) => getVisit(id));
  ipcMain.handle("visit:list", (_event, patientId) => listVisitsForPatient(patientId));
  ipcMain.handle("visit:update", (_event, id, data) => updateVisit(id, data));
  ipcMain.handle("visit:delete", (_event, id) => deleteVisit(id));
}
function createPhoto(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(photos).values({
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
  }).run();
  return getPhoto(id);
}
function getPhoto(id) {
  const db2 = getDatabase();
  const result = db2.select().from(photos).where(and(eq(photos.id, id), isNull(photos.deletedAt))).get();
  return result || null;
}
function listPhotosForVisit(visitId) {
  const db2 = getDatabase();
  return db2.select().from(photos).where(and(eq(photos.visitId, visitId), isNull(photos.deletedAt))).orderBy(photos.sortOrder).all();
}
function updatePhoto(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.originalPath !== void 0) updateValues.originalPath = data.originalPath;
  if (data.thumbnailPath !== void 0) updateValues.thumbnailPath = data.thumbnailPath;
  if (data.photoPosition !== void 0) updateValues.photoPosition = data.photoPosition;
  if (data.photoState !== void 0) updateValues.photoState = data.photoState;
  if (data.isMarked !== void 0) updateValues.isMarked = data.isMarked;
  if (data.markedPath !== void 0) updateValues.markedPath = data.markedPath;
  if (data.width !== void 0) updateValues.width = data.width;
  if (data.height !== void 0) updateValues.height = data.height;
  if (data.sortOrder !== void 0) updateValues.sortOrder = data.sortOrder;
  db2.update(photos).set(updateValues).where(eq(photos.id, id)).run();
  return getPhoto(id);
}
function deletePhoto(id) {
  const db2 = getDatabase();
  db2.update(photos).set({ deletedAt: sql`datetime('now')` }).where(eq(photos.id, id)).run();
}
const THUMBNAIL_WIDTH = 300;
function ensureDir(dirPath) {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
}
async function importPhoto(sourcePath, patientId, visitId) {
  const dataDir = getDataDirectory();
  const ext = extname(sourcePath).toLowerCase() || ".jpg";
  const fileId = v4();
  const originalsDir = join(dataDir, "photos", "originals", patientId, visitId);
  const thumbnailsDir = join(dataDir, "photos", "thumbnails");
  ensureDir(originalsDir);
  ensureDir(thumbnailsDir);
  const originalFilename = `${fileId}${ext}`;
  const originalAbsPath = join(originalsDir, originalFilename);
  copyFileSync(sourcePath, originalAbsPath);
  const thumbnailFilename = `${fileId}_thumb.jpg`;
  const thumbnailAbsPath = join(thumbnailsDir, thumbnailFilename);
  const metadata = await sharp(originalAbsPath).metadata();
  await sharp(originalAbsPath).resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(thumbnailAbsPath);
  const originalRelPath = join("photos", "originals", patientId, visitId, originalFilename);
  const thumbnailRelPath = join("photos", "thumbnails", thumbnailFilename);
  return {
    originalPath: originalRelPath,
    thumbnailPath: thumbnailRelPath,
    width: metadata.width || 0,
    height: metadata.height || 0
  };
}
async function rotatePhoto(relativePath, degrees) {
  const absPath = resolvePhotoPath(relativePath);
  const buffer = await sharp(absPath).rotate(degrees).toBuffer();
  await sharp(buffer).toFile(absPath);
  await regenerateThumbnail(relativePath);
  const meta = await sharp(absPath).metadata();
  return { width: meta.width || 0, height: meta.height || 0 };
}
async function flipPhoto(relativePath, direction) {
  const absPath = resolvePhotoPath(relativePath);
  const pipeline = sharp(absPath);
  if (direction === "horizontal") {
    pipeline.flop();
  } else {
    pipeline.flip();
  }
  const buffer = await pipeline.toBuffer();
  await sharp(buffer).toFile(absPath);
  await regenerateThumbnail(relativePath);
}
async function cropPhoto(relativePath, left, top, width, height) {
  const absPath = resolvePhotoPath(relativePath);
  const buffer = await sharp(absPath).extract({ left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) }).toBuffer();
  await sharp(buffer).toFile(absPath);
  await regenerateThumbnail(relativePath);
  return { width: Math.round(width), height: Math.round(height) };
}
function resolvePhotoPath(relativePath) {
  const dataDir = getDataDirectory();
  return join(dataDir, relativePath);
}
function deletePhotoFiles(originalRelPath, thumbnailRelPath) {
  try {
    const origAbs = resolvePhotoPath(originalRelPath);
    if (existsSync(origAbs)) unlinkSync(origAbs);
  } catch {
  }
  if (thumbnailRelPath) {
    try {
      const thumbAbs = resolvePhotoPath(thumbnailRelPath);
      if (existsSync(thumbAbs)) unlinkSync(thumbAbs);
    } catch {
    }
  }
}
async function regenerateThumbnail(originalRelPath) {
  const dataDir = getDataDirectory();
  const absPath = join(dataDir, originalRelPath);
  const fileId = basename(originalRelPath, extname(originalRelPath));
  const thumbnailFilename = `${fileId}_thumb.jpg`;
  const thumbnailAbsPath = join(dataDir, "photos", "thumbnails", thumbnailFilename);
  await sharp(absPath).resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(thumbnailAbsPath);
}
async function exportAllPhotos(photoPaths, outputDir) {
  ensureDir(outputDir);
  const exported = [];
  for (const relPath of photoPaths) {
    const absPath = resolvePhotoPath(relPath);
    if (existsSync(absPath)) {
      const filename = basename(relPath);
      const destPath = join(outputDir, filename);
      copyFileSync(absPath, destPath);
      exported.push(destPath);
    }
  }
  return exported;
}
function registerPhotoIPC() {
  ipcMain.handle(
    "photo:import",
    async (_event, sourcePath, patientId, visitId, photoState) => {
      const result = await importPhoto(sourcePath, patientId, visitId);
      const photo = createPhoto({
        visitId,
        patientId,
        originalPath: result.originalPath,
        thumbnailPath: result.thumbnailPath,
        photoState,
        width: result.width,
        height: result.height
      });
      return photo;
    }
  );
  ipcMain.handle("photo:get", (_event, id) => getPhoto(id));
  ipcMain.handle("photo:list", (_event, visitId) => listPhotosForVisit(visitId));
  ipcMain.handle("photo:update", (_event, id, data) => updatePhoto(id, data));
  ipcMain.handle("photo:delete", (_event, id) => {
    const photo = getPhoto(id);
    if (photo) {
      deletePhotoFiles(photo.originalPath, photo.thumbnailPath || void 0);
      deletePhoto(id);
    }
  });
  ipcMain.handle("photo:rotate", async (_event, id, degrees) => {
    const photo = getPhoto(id);
    if (!photo) return null;
    const result = await rotatePhoto(photo.originalPath, degrees);
    return updatePhoto(id, { width: result.width, height: result.height });
  });
  ipcMain.handle("photo:flip", async (_event, id, direction) => {
    const photo = getPhoto(id);
    if (!photo) return null;
    await flipPhoto(photo.originalPath, direction);
    return getPhoto(id);
  });
  ipcMain.handle(
    "photo:crop",
    async (_event, id, left, top, width, height) => {
      const photo = getPhoto(id);
      if (!photo) return null;
      const result = await cropPhoto(photo.originalPath, left, top, width, height);
      return updatePhoto(id, { width: result.width, height: result.height });
    }
  );
  ipcMain.handle("photo:getFilePath", (_event, relativePath) => {
    return resolvePhotoPath(relativePath);
  });
  ipcMain.handle("photo:exportAll", async (_event, visitId) => {
    const photos2 = listPhotosForVisit(visitId);
    if (photos2.length === 0) return null;
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "Choose export folder"
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const paths = photos2.map((p) => p.originalPath);
    return exportAllPhotos(paths, result.filePaths[0]);
  });
  ipcMain.handle("photo:selectFiles", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "heic", "webp", "tiff"] }]
    });
    if (result.canceled) return [];
    return result.filePaths;
  });
}
function createTreatment(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(treatments).values({
    id,
    visitId: data.visitId,
    treatmentType: data.treatmentType,
    productId: data.productId,
    lotNumber: data.lotNumber,
    expiryDate: data.expiryDate,
    totalUnits: data.totalUnits,
    totalCost: data.totalCost
  }).run();
  return getTreatment(id);
}
function getTreatment(id) {
  const db2 = getDatabase();
  const result = db2.select().from(treatments).where(and(eq(treatments.id, id), isNull(treatments.deletedAt))).get();
  return result || null;
}
function listTreatmentsForVisit(visitId) {
  const db2 = getDatabase();
  const rows = db2.select({
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
  }).from(treatments).leftJoin(products, eq(treatments.productId, products.id)).where(and(eq(treatments.visitId, visitId), isNull(treatments.deletedAt))).orderBy(treatments.createdAt).all();
  return rows;
}
function updateTreatment(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.treatmentType !== void 0) updateValues.treatmentType = data.treatmentType;
  if (data.productId !== void 0) updateValues.productId = data.productId;
  if (data.lotNumber !== void 0) updateValues.lotNumber = data.lotNumber;
  if (data.expiryDate !== void 0) updateValues.expiryDate = data.expiryDate;
  if (data.totalUnits !== void 0) updateValues.totalUnits = data.totalUnits;
  if (data.totalCost !== void 0) updateValues.totalCost = data.totalCost;
  db2.update(treatments).set(updateValues).where(eq(treatments.id, id)).run();
  return getTreatment(id);
}
function deleteTreatment(id) {
  const db2 = getDatabase();
  db2.update(treatments).set({ deletedAt: sql`datetime('now')` }).where(eq(treatments.id, id)).run();
}
function createTreatmentArea(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(treatmentAreas).values({
    id,
    treatmentId: data.treatmentId,
    treatedAreaId: data.treatedAreaId,
    units: data.units,
    cost: data.cost
  }).run();
  return db2.select().from(treatmentAreas).where(eq(treatmentAreas.id, id)).get();
}
function listAreasForTreatment(treatmentId) {
  const db2 = getDatabase();
  return db2.select({
    id: treatmentAreas.id,
    treatmentId: treatmentAreas.treatmentId,
    treatedAreaId: treatmentAreas.treatedAreaId,
    units: treatmentAreas.units,
    cost: treatmentAreas.cost,
    createdAt: treatmentAreas.createdAt,
    areaName: treatedAreas.name,
    areaColor: treatedAreas.color
  }).from(treatmentAreas).leftJoin(treatedAreas, eq(treatmentAreas.treatedAreaId, treatedAreas.id)).where(eq(treatmentAreas.treatmentId, treatmentId)).all();
}
function updateTreatmentArea(id, data) {
  const db2 = getDatabase();
  const updateValues = {};
  if (data.units !== void 0) updateValues.units = data.units;
  if (data.cost !== void 0) updateValues.cost = data.cost;
  if (Object.keys(updateValues).length === 0) return null;
  db2.update(treatmentAreas).set(updateValues).where(eq(treatmentAreas.id, id)).run();
  return db2.select().from(treatmentAreas).where(eq(treatmentAreas.id, id)).get() || null;
}
function deleteTreatmentArea(id) {
  const db2 = getDatabase();
  db2.delete(treatmentAreas).where(eq(treatmentAreas.id, id)).run();
}
function deleteAreasForTreatment(treatmentId) {
  const db2 = getDatabase();
  db2.delete(treatmentAreas).where(eq(treatmentAreas.treatmentId, treatmentId)).run();
}
function registerTreatmentIPC() {
  ipcMain.handle("treatment:create", (_event, data) => createTreatment(data));
  ipcMain.handle("treatment:get", (_event, id) => getTreatment(id));
  ipcMain.handle("treatment:list", (_event, visitId) => listTreatmentsForVisit(visitId));
  ipcMain.handle("treatment:update", (_event, id, data) => updateTreatment(id, data));
  ipcMain.handle("treatment:delete", (_event, id) => {
    deleteAreasForTreatment(id);
    deleteTreatment(id);
  });
  ipcMain.handle("treatmentArea:create", (_event, data) => createTreatmentArea(data));
  ipcMain.handle(
    "treatmentArea:list",
    (_event, treatmentId) => listAreasForTreatment(treatmentId)
  );
  ipcMain.handle(
    "treatmentArea:update",
    (_event, id, data) => updateTreatmentArea(id, data)
  );
  ipcMain.handle("treatmentArea:delete", (_event, id) => deleteTreatmentArea(id));
}
function listProducts() {
  const db2 = getDatabase();
  return db2.select().from(products).where(eq(products.isActive, true)).orderBy(products.category, products.name).all();
}
function listAllProducts() {
  const db2 = getDatabase();
  return db2.select().from(products).orderBy(products.category, products.name).all();
}
function getProduct(id) {
  const db2 = getDatabase();
  return db2.select().from(products).where(eq(products.id, id)).get() || null;
}
function createProduct(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(products).values({
    id,
    name: data.name,
    brand: data.brand,
    category: data.category,
    unitType: data.unitType,
    defaultCost: data.defaultCost,
    color: data.color
  }).run();
  return db2.select().from(products).where(eq(products.id, id)).get();
}
function updateProduct(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.name !== void 0) updateValues.name = data.name;
  if (data.brand !== void 0) updateValues.brand = data.brand;
  if (data.category !== void 0) updateValues.category = data.category;
  if (data.unitType !== void 0) updateValues.unitType = data.unitType;
  if (data.defaultCost !== void 0) updateValues.defaultCost = data.defaultCost;
  if (data.color !== void 0) updateValues.color = data.color;
  if (data.isActive !== void 0) updateValues.isActive = data.isActive;
  db2.update(products).set(updateValues).where(eq(products.id, id)).run();
  return db2.select().from(products).where(eq(products.id, id)).get() || null;
}
function deleteProduct(id) {
  const db2 = getDatabase();
  db2.update(products).set({ isActive: false, updatedAt: sql`datetime('now')` }).where(eq(products.id, id)).run();
}
function listTreatedAreas() {
  const db2 = getDatabase();
  return db2.select().from(treatedAreas).where(eq(treatedAreas.isActive, true)).orderBy(treatedAreas.name).all();
}
function listAllTreatedAreas() {
  const db2 = getDatabase();
  return db2.select().from(treatedAreas).orderBy(treatedAreas.name).all();
}
function getTreatedArea(id) {
  const db2 = getDatabase();
  return db2.select().from(treatedAreas).where(eq(treatedAreas.id, id)).get() || null;
}
function createTreatedArea(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(treatedAreas).values({
    id,
    name: data.name,
    color: data.color
  }).run();
  return db2.select().from(treatedAreas).where(eq(treatedAreas.id, id)).get();
}
function updateTreatedArea(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.name !== void 0) updateValues.name = data.name;
  if (data.color !== void 0) updateValues.color = data.color;
  if (data.isActive !== void 0) updateValues.isActive = data.isActive;
  db2.update(treatedAreas).set(updateValues).where(eq(treatedAreas.id, id)).run();
  return db2.select().from(treatedAreas).where(eq(treatedAreas.id, id)).get() || null;
}
function deleteTreatedArea(id) {
  const db2 = getDatabase();
  db2.update(treatedAreas).set({ isActive: false, updatedAt: sql`datetime('now')` }).where(eq(treatedAreas.id, id)).run();
}
function listTreatmentCategories() {
  const db2 = getDatabase();
  return db2.select().from(treatmentCategories).where(eq(treatmentCategories.isActive, true)).orderBy(treatmentCategories.sortOrder, treatmentCategories.name).all();
}
function listAllTreatmentCategories() {
  const db2 = getDatabase();
  return db2.select().from(treatmentCategories).orderBy(treatmentCategories.sortOrder, treatmentCategories.name).all();
}
function getTreatmentCategory(id) {
  const db2 = getDatabase();
  return db2.select().from(treatmentCategories).where(eq(treatmentCategories.id, id)).get() || null;
}
function getTreatmentCategoryBySlug(slug) {
  const db2 = getDatabase();
  return db2.select().from(treatmentCategories).where(eq(treatmentCategories.slug, slug)).get() || null;
}
function createTreatmentCategory(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(treatmentCategories).values({
    id,
    name: data.name,
    slug: data.slug,
    type: data.type || "facial",
    color: data.color,
    icon: data.icon,
    sortOrder: data.sortOrder
  }).run();
  return db2.select().from(treatmentCategories).where(eq(treatmentCategories.id, id)).get();
}
function updateTreatmentCategory(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.name !== void 0) updateValues.name = data.name;
  if (data.slug !== void 0) updateValues.slug = data.slug;
  if (data.type !== void 0) updateValues.type = data.type;
  if (data.color !== void 0) updateValues.color = data.color;
  if (data.icon !== void 0) updateValues.icon = data.icon;
  if (data.sortOrder !== void 0) updateValues.sortOrder = data.sortOrder;
  if (data.isActive !== void 0) updateValues.isActive = data.isActive;
  db2.update(treatmentCategories).set(updateValues).where(eq(treatmentCategories.id, id)).run();
  return db2.select().from(treatmentCategories).where(eq(treatmentCategories.id, id)).get() || null;
}
function deleteTreatmentCategory(id) {
  const db2 = getDatabase();
  db2.update(treatmentCategories).set({ isActive: false, updatedAt: sql`datetime('now')` }).where(eq(treatmentCategories.id, id)).run();
}
function registerCatalogIPC() {
  ipcMain.handle("product:list", () => listProducts());
  ipcMain.handle("product:listAll", () => listAllProducts());
  ipcMain.handle("product:get", (_event, id) => getProduct(id));
  ipcMain.handle("product:create", (_event, data) => createProduct(data));
  ipcMain.handle(
    "product:update",
    (_event, id, data) => updateProduct(id, data)
  );
  ipcMain.handle("product:delete", (_event, id) => deleteProduct(id));
  ipcMain.handle("treatedArea:list", () => listTreatedAreas());
  ipcMain.handle("treatedArea:listAll", () => listAllTreatedAreas());
  ipcMain.handle("treatedArea:get", (_event, id) => getTreatedArea(id));
  ipcMain.handle(
    "treatedArea:create",
    (_event, data) => createTreatedArea(data)
  );
  ipcMain.handle(
    "treatedArea:update",
    (_event, id, data) => updateTreatedArea(id, data)
  );
  ipcMain.handle("treatedArea:delete", (_event, id) => deleteTreatedArea(id));
  ipcMain.handle("treatmentCategory:list", () => listTreatmentCategories());
  ipcMain.handle("treatmentCategory:listAll", () => listAllTreatmentCategories());
  ipcMain.handle("treatmentCategory:get", (_event, id) => getTreatmentCategory(id));
  ipcMain.handle(
    "treatmentCategory:getBySlug",
    (_event, slug) => getTreatmentCategoryBySlug(slug)
  );
  ipcMain.handle(
    "treatmentCategory:create",
    (_event, data) => createTreatmentCategory(data)
  );
  ipcMain.handle(
    "treatmentCategory:update",
    (_event, id, data) => updateTreatmentCategory(id, data)
  );
  ipcMain.handle(
    "treatmentCategory:delete",
    (_event, id) => deleteTreatmentCategory(id)
  );
}
function createAnnotation(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(annotations).values({
    id,
    treatmentId: data.treatmentId,
    diagramView: data.diagramView,
    pointsJson: data.pointsJson
  }).run();
  return db2.select().from(annotations).where(eq(annotations.id, id)).get();
}
function getAnnotationsForTreatment(treatmentId) {
  const db2 = getDatabase();
  return db2.select().from(annotations).where(eq(annotations.treatmentId, treatmentId)).all();
}
function updateAnnotation(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.diagramView !== void 0) updateValues.diagramView = data.diagramView;
  if (data.pointsJson !== void 0) updateValues.pointsJson = data.pointsJson;
  db2.update(annotations).set(updateValues).where(eq(annotations.id, id)).run();
  return db2.select().from(annotations).where(eq(annotations.id, id)).get() || null;
}
function deleteAnnotation(id) {
  const db2 = getDatabase();
  db2.delete(annotations).where(eq(annotations.id, id)).run();
}
function registerAnnotationIPC() {
  ipcMain.handle("annotation:create", (_event, data) => createAnnotation(data));
  ipcMain.handle(
    "annotation:listForTreatment",
    (_event, treatmentId) => getAnnotationsForTreatment(treatmentId)
  );
  ipcMain.handle("annotation:update", (_event, id, data) => updateAnnotation(id, data));
  ipcMain.handle("annotation:delete", (_event, id) => deleteAnnotation(id));
}
function createPortfolio(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(portfolios).values({
    id,
    title: data.title,
    category: data.category,
    demographicsFilter: data.demographicsFilter,
    ownerId: data.ownerId
  }).run();
  return getPortfolio(id);
}
function getPortfolio(id) {
  const db2 = getDatabase();
  const result = db2.select().from(portfolios).where(and(eq(portfolios.id, id), isNull(portfolios.deletedAt))).get();
  return result || null;
}
function listPortfolios() {
  const db2 = getDatabase();
  const rows = db2.select().from(portfolios).where(isNull(portfolios.deletedAt)).orderBy(desc(portfolios.updatedAt)).all();
  return rows.map((p) => {
    const countResult = db2.select({ count: sql`count(*)` }).from(portfolioItems).where(eq(portfolioItems.portfolioId, p.id)).get();
    return {
      ...p,
      itemCount: countResult?.count || 0
    };
  });
}
function updatePortfolio(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.title !== void 0) updateValues.title = data.title;
  if (data.category !== void 0) updateValues.category = data.category;
  if (data.demographicsFilter !== void 0)
    updateValues.demographicsFilter = data.demographicsFilter;
  if (data.ownerId !== void 0) updateValues.ownerId = data.ownerId;
  db2.update(portfolios).set(updateValues).where(eq(portfolios.id, id)).run();
  return getPortfolio(id);
}
function deletePortfolio(id) {
  const db2 = getDatabase();
  db2.update(portfolios).set({ deletedAt: sql`datetime('now')` }).where(eq(portfolios.id, id)).run();
}
function createPortfolioItem(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(portfolioItems).values({
    id,
    portfolioId: data.portfolioId,
    patientId: data.patientId,
    beforeVisitId: data.beforeVisitId,
    afterVisitId: data.afterVisitId,
    photoPosition: data.photoPosition,
    photoState: data.photoState
  }).run();
  return getPortfolioItem(id);
}
function getPortfolioItem(id) {
  const db2 = getDatabase();
  const result = db2.select().from(portfolioItems).where(eq(portfolioItems.id, id)).get();
  return result || null;
}
function listPortfolioItems(portfolioId) {
  const db2 = getDatabase();
  const items = db2.select().from(portfolioItems).where(eq(portfolioItems.portfolioId, portfolioId)).orderBy(desc(portfolioItems.createdAt)).all();
  return items.map((item) => {
    const patient = db2.select({ firstName: patients.firstName, lastName: patients.lastName }).from(patients).where(eq(patients.id, item.patientId)).get();
    const beforeVisit = item.beforeVisitId ? db2.select({ date: visits.date }).from(visits).where(eq(visits.id, item.beforeVisitId)).get() : null;
    const afterVisit = item.afterVisitId ? db2.select({ date: visits.date }).from(visits).where(eq(visits.id, item.afterVisitId)).get() : null;
    const buildPhotoFilter = (visitId) => {
      const conditions = [
        eq(photos.visitId, visitId),
        eq(photos.photoPosition, item.photoPosition),
        isNull(photos.deletedAt)
      ];
      if (item.photoState) {
        conditions.push(eq(photos.photoState, item.photoState));
      }
      return and(...conditions);
    };
    let beforePhoto = null;
    if (item.beforeVisitId && item.photoPosition) {
      beforePhoto = db2.select({ originalPath: photos.originalPath, thumbnailPath: photos.thumbnailPath }).from(photos).where(buildPhotoFilter(item.beforeVisitId)).get() || null;
    }
    let afterPhoto = null;
    if (item.afterVisitId && item.photoPosition) {
      afterPhoto = db2.select({ originalPath: photos.originalPath, thumbnailPath: photos.thumbnailPath }).from(photos).where(buildPhotoFilter(item.afterVisitId)).get() || null;
    }
    return {
      ...item,
      patientFirstName: patient?.firstName || "Unknown",
      patientLastName: patient?.lastName || "",
      beforeDate: beforeVisit?.date || null,
      afterDate: afterVisit?.date || null,
      beforePhotoPath: beforePhoto?.originalPath || null,
      afterPhotoPath: afterPhoto?.originalPath || null,
      beforeThumbnailPath: beforePhoto?.thumbnailPath || null,
      afterThumbnailPath: afterPhoto?.thumbnailPath || null
    };
  });
}
function deletePortfolioItem(id) {
  const db2 = getDatabase();
  db2.delete(portfolioItems).where(eq(portfolioItems.id, id)).run();
}
function getCompareVisitPhotos(beforeVisitId, afterVisitId) {
  const db2 = getDatabase();
  const beforePhotos = db2.select().from(photos).where(and(eq(photos.visitId, beforeVisitId), isNull(photos.deletedAt))).orderBy(asc(photos.sortOrder), asc(photos.createdAt)).all();
  const afterPhotos = db2.select().from(photos).where(and(eq(photos.visitId, afterVisitId), isNull(photos.deletedAt))).orderBy(asc(photos.sortOrder), asc(photos.createdAt)).all();
  const compositeKey = (p) => {
    const pos = p.photoPosition || "";
    const state = p.photoState || "";
    return `${pos}|${state}`;
  };
  const keySet = /* @__PURE__ */ new Set();
  for (const p of beforePhotos) {
    if (p.photoPosition) keySet.add(compositeKey(p));
  }
  for (const p of afterPhotos) {
    if (p.photoPosition) keySet.add(compositeKey(p));
  }
  const pairs = [];
  for (const key of keySet) {
    const [position, state] = key.split("|");
    if (!position) continue;
    const before = beforePhotos.find(
      (p) => p.photoPosition === position && (p.photoState || "") === state
    ) || null;
    const after = afterPhotos.find(
      (p) => p.photoPosition === position && (p.photoState || "") === state
    ) || null;
    pairs.push({
      position,
      photoState: state || null,
      beforePhoto: before ? {
        id: before.id,
        originalPath: before.originalPath,
        thumbnailPath: before.thumbnailPath,
        photoState: before.photoState
      } : null,
      afterPhoto: after ? {
        id: after.id,
        originalPath: after.originalPath,
        thumbnailPath: after.thumbnailPath,
        photoState: after.photoState
      } : null
    });
  }
  return pairs;
}
function registerPortfolioIPC() {
  ipcMain.handle("portfolio:create", (_event, data) => createPortfolio(data));
  ipcMain.handle("portfolio:get", (_event, id) => getPortfolio(id));
  ipcMain.handle("portfolio:list", () => listPortfolios());
  ipcMain.handle("portfolio:update", (_event, id, data) => updatePortfolio(id, data));
  ipcMain.handle("portfolio:delete", (_event, id) => deletePortfolio(id));
  ipcMain.handle("portfolioItem:create", (_event, data) => createPortfolioItem(data));
  ipcMain.handle(
    "portfolioItem:list",
    (_event, portfolioId) => listPortfolioItems(portfolioId)
  );
  ipcMain.handle("portfolioItem:delete", (_event, id) => deletePortfolioItem(id));
  ipcMain.handle(
    "compare:photos",
    (_event, beforeVisitId, afterVisitId) => getCompareVisitPhotos(beforeVisitId, afterVisitId)
  );
}
function createConsent(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(consents).values({
    id,
    patientId: data.patientId,
    visitId: data.visitId,
    type: data.type,
    consentText: data.consentText,
    signatureData: data.signatureData,
    signedAt: data.signedAt
  }).run();
  return getConsent(id);
}
function getConsent(id) {
  const db2 = getDatabase();
  const result = db2.select().from(consents).where(eq(consents.id, id)).get();
  return result || null;
}
function listConsentsForPatient(patientId) {
  const db2 = getDatabase();
  return db2.select().from(consents).where(eq(consents.patientId, patientId)).orderBy(desc(consents.createdAt)).all();
}
function listConsentsForVisit(visitId) {
  const db2 = getDatabase();
  return db2.select().from(consents).where(eq(consents.visitId, visitId)).orderBy(desc(consents.createdAt)).all();
}
function deleteConsent(id) {
  const db2 = getDatabase();
  db2.delete(consents).where(eq(consents.id, id)).run();
}
function createConsentTemplate(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(consentTemplates).values({
    id,
    name: data.name,
    type: data.type,
    contentJson: data.contentJson,
    isDefault: data.isDefault
  }).run();
  return getConsentTemplate(id);
}
function getConsentTemplate(id) {
  const db2 = getDatabase();
  const result = db2.select().from(consentTemplates).where(eq(consentTemplates.id, id)).get();
  return result || null;
}
function listConsentTemplates() {
  const db2 = getDatabase();
  return db2.select().from(consentTemplates).orderBy(consentTemplates.type, consentTemplates.name).all();
}
function updateConsentTemplate(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.name !== void 0) updateValues.name = data.name;
  if (data.type !== void 0) updateValues.type = data.type;
  if (data.contentJson !== void 0) updateValues.contentJson = data.contentJson;
  if (data.isDefault !== void 0) updateValues.isDefault = data.isDefault;
  db2.update(consentTemplates).set(updateValues).where(eq(consentTemplates.id, id)).run();
  return getConsentTemplate(id);
}
function deleteConsentTemplate(id) {
  const db2 = getDatabase();
  db2.delete(consentTemplates).where(eq(consentTemplates.id, id)).run();
}
function registerConsentIPC() {
  ipcMain.handle(
    "consent:create",
    (_event, data) => createConsent(data)
  );
  ipcMain.handle("consent:get", (_event, id) => getConsent(id));
  ipcMain.handle(
    "consent:listForPatient",
    (_event, patientId) => listConsentsForPatient(patientId)
  );
  ipcMain.handle(
    "consent:listForVisit",
    (_event, visitId) => listConsentsForVisit(visitId)
  );
  ipcMain.handle("consent:delete", (_event, id) => deleteConsent(id));
  ipcMain.handle(
    "consentTemplate:create",
    (_event, data) => createConsentTemplate(data)
  );
  ipcMain.handle("consentTemplate:get", (_event, id) => getConsentTemplate(id));
  ipcMain.handle("consentTemplate:list", () => listConsentTemplates());
  ipcMain.handle(
    "consentTemplate:update",
    (_event, id, data) => updateConsentTemplate(id, data)
  );
  ipcMain.handle("consentTemplate:delete", (_event, id) => deleteConsentTemplate(id));
}
function searchCases(filters) {
  const sqlite2 = getSqlite();
  const conditions = [];
  const params = [];
  conditions.push("p.deleted_at IS NULL");
  if (filters.ethnicity) {
    conditions.push("p.ethnicity = ?");
    params.push(filters.ethnicity);
  }
  if (filters.sex) {
    conditions.push("p.sex = ?");
    params.push(filters.sex);
  }
  if (filters.ageMin != null) {
    conditions.push("p.birthday <= date('now', '-' || ? || ' years')");
    params.push(filters.ageMin);
  }
  if (filters.ageMax != null) {
    conditions.push("p.birthday > date('now', '-' || ? || ' years')");
    params.push(filters.ageMax + 1);
  }
  if (filters.minVisits != null) {
    conditions.push(`(SELECT COUNT(*) FROM visits WHERE patient_id = p.id AND deleted_at IS NULL) >= ?`);
    params.push(filters.minVisits);
  }
  if (filters.hasBotulinumConsent) {
    conditions.push(
      "EXISTS (SELECT 1 FROM consents c WHERE c.patient_id = p.id AND c.type = 'botulinum')"
    );
  }
  if (filters.hasFillerConsent) {
    conditions.push(
      "EXISTS (SELECT 1 FROM consents c WHERE c.patient_id = p.id AND c.type = 'filler')"
    );
  }
  if (filters.hasPhotoConsent) {
    conditions.push(
      "EXISTS (SELECT 1 FROM consents c WHERE c.patient_id = p.id AND c.type = 'photo')"
    );
  }
  filters.visitDateFrom || filters.visitDateTo || filters.lotNumber || filters.practitionerId || filters.productIds && filters.productIds.length > 0 || filters.treatmentCategorySlugs && filters.treatmentCategorySlugs.length > 0 || filters.treatedAreaIds && filters.treatedAreaIds.length > 0;
  if (filters.visitDateFrom) {
    conditions.push(
      "EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND v.date >= ?)"
    );
    params.push(filters.visitDateFrom);
  }
  if (filters.visitDateTo) {
    conditions.push(
      "EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND v.date <= ?)"
    );
    params.push(filters.visitDateTo);
  }
  if (filters.practitionerId) {
    conditions.push(
      "EXISTS (SELECT 1 FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND v.practitioner_id = ?)"
    );
    params.push(filters.practitionerId);
  }
  if (filters.lotNumber) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND t.lot_number LIKE ?
      )`
    );
    params.push(`%${filters.lotNumber}%`);
  }
  if (filters.productIds && filters.productIds.length > 0) {
    const placeholders = filters.productIds.map(() => "?").join(",");
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL
        AND t.product_id IN (${placeholders})
      )`
    );
    params.push(...filters.productIds);
  }
  if (filters.treatmentCategorySlugs && filters.treatmentCategorySlugs.length > 0) {
    const placeholders = filters.treatmentCategorySlugs.map(() => "?").join(",");
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL
        AND t.treatment_type IN (${placeholders})
      )`
    );
    params.push(...filters.treatmentCategorySlugs);
  }
  if (filters.treatedAreaIds && filters.treatedAreaIds.length > 0) {
    const placeholders = filters.treatedAreaIds.map(() => "?").join(",");
    conditions.push(
      `EXISTS (
        SELECT 1 FROM visits v
        JOIN treatments t ON t.visit_id = v.id AND t.deleted_at IS NULL
        JOIN treatment_areas ta ON ta.treatment_id = t.id
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL
        AND ta.treated_area_id IN (${placeholders})
      )`
    );
    params.push(...filters.treatedAreaIds);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql2 = `
    SELECT
      p.id AS patientId,
      p.first_name AS firstName,
      p.last_name AS lastName,
      p.sex,
      p.birthday,
      p.ethnicity,
      p.city,
      p.province,
      COALESCE((SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id AND v.deleted_at IS NULL), 0) AS visitCount,
      COALESCE((
        SELECT COUNT(*) FROM treatments t
        JOIN visits v ON v.id = t.visit_id
        WHERE v.patient_id = p.id AND v.deleted_at IS NULL AND t.deleted_at IS NULL
      ), 0) AS treatmentCount
    FROM patients p
    ${whereClause}
    ORDER BY p.last_name, p.first_name
    LIMIT 200
  `;
  const stmt = sqlite2.prepare(sql2);
  const rows = stmt.all(...params);
  return rows;
}
function registerSearchIPC() {
  ipcMain.handle(
    "search:cases",
    (_event, filters) => searchCases(filters)
  );
}
function listUsers() {
  const db2 = getDatabase();
  return db2.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.name)).all().filter((u) => u.isActive);
}
function listAllUsers() {
  const db2 = getDatabase();
  return db2.select().from(users).where(isNull(users.deletedAt)).orderBy(asc(users.name)).all();
}
function getUser(id) {
  const db2 = getDatabase();
  const result = db2.select().from(users).where(eq(users.id, id)).get();
  return result || null;
}
function createUser(data) {
  const db2 = getDatabase();
  const id = v4();
  db2.insert(users).values({
    id,
    name: data.name,
    email: data.email || null,
    role: data.role || "practitioner"
  }).run();
  return getUser(id);
}
function updateUser(id, data) {
  const db2 = getDatabase();
  const updateValues = {
    updatedAt: sql`datetime('now')`
  };
  if (data.name !== void 0) updateValues.name = data.name;
  if (data.email !== void 0) updateValues.email = data.email;
  if (data.role !== void 0) updateValues.role = data.role;
  if (data.isActive !== void 0) updateValues.isActive = data.isActive;
  db2.update(users).set(updateValues).where(eq(users.id, id)).run();
  return getUser(id);
}
function deleteUser(id) {
  const db2 = getDatabase();
  db2.update(users).set({ deletedAt: sql`datetime('now')` }).where(eq(users.id, id)).run();
}
function registerUserIPC() {
  ipcMain.handle("user:list", () => listUsers());
  ipcMain.handle("user:listAll", () => listAllUsers());
  ipcMain.handle("user:get", (_event, id) => getUser(id));
  ipcMain.handle(
    "user:create",
    (_event, data) => createUser(data)
  );
  ipcMain.handle(
    "user:update",
    (_event, id, data) => updateUser(id, data)
  );
  ipcMain.handle("user:delete", (_event, id) => deleteUser(id));
}
function getBackupDir() {
  return join(getDataDirectory(), "backups");
}
function getDbPath() {
  return join(getDataDirectory(), "db", "apexrec.db");
}
function formatTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return now.toISOString().replace(/[:.]/g, "-").replace("T", "-").slice(0, 19);
}
function createBackup() {
  const dbPath = getDbPath();
  const backupDir = getBackupDir();
  const timestamp = formatTimestamp();
  const filename = `apexrec-backup-${timestamp}.db`;
  const backupPath = join(backupDir, filename);
  closeDatabase();
  try {
    copyFileSync(dbPath, backupPath);
    const walPath = dbPath + "-wal";
    if (existsSync(walPath)) {
      copyFileSync(walPath, backupPath + "-wal");
    }
  } finally {
    initDatabase();
  }
  const stats = statSync(backupPath);
  return {
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function listBackups() {
  const backupDir = getBackupDir();
  if (!existsSync(backupDir)) return [];
  const files = readdirSync(backupDir).filter(
    (f) => f.endsWith(".db") && f.startsWith("apexrec-backup-")
  );
  return files.map((filename) => {
    const fullPath = join(backupDir, filename);
    const stats = statSync(fullPath);
    return {
      filename,
      path: fullPath,
      size: stats.size,
      createdAt: stats.mtime.toISOString()
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function restoreBackup(filename) {
  const backupDir = getBackupDir();
  const backupPath = join(backupDir, filename);
  const dbPath = getDbPath();
  if (!existsSync(backupPath)) {
    return { success: false, error: "Backup file not found" };
  }
  const timestamp = formatTimestamp();
  const safetyFilename = `pre-restore-${timestamp}.db`;
  const safetyPath = join(backupDir, safetyFilename);
  closeDatabase();
  try {
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, safetyPath);
    }
    copyFileSync(backupPath, dbPath);
    const walPath = dbPath + "-wal";
    const shmPath = dbPath + "-shm";
    if (existsSync(walPath)) unlinkSync(walPath);
    if (existsSync(shmPath)) unlinkSync(shmPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  } finally {
    initDatabase();
  }
}
function deleteBackup(filename) {
  const backupDir = getBackupDir();
  const backupPath = join(backupDir, filename);
  if (existsSync(backupPath)) {
    unlinkSync(backupPath);
  }
  const walPath = backupPath + "-wal";
  if (existsSync(walPath)) {
    unlinkSync(walPath);
  }
}
function registerBackupIPC() {
  ipcMain.handle("backup:create", () => createBackup());
  ipcMain.handle("backup:list", () => listBackups());
  ipcMain.handle("backup:restore", (_event, filename) => restoreBackup(filename));
  ipcMain.handle("backup:delete", (_event, filename) => deleteBackup(filename));
}
function getExportsDir() {
  const dir = join(getDataDirectory(), "exports");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, "").replace(/\s+/g, "-");
}
function stripHtml(html) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/li>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
async function exportVisitReport(visitId) {
  const visit = getVisit(visitId);
  if (!visit) throw new Error("Visit not found");
  const patient = getPatient(visit.patientId);
  if (!patient) throw new Error("Patient not found");
  const treatments2 = listTreatmentsForVisit(visitId);
  const photoRows = listPhotosForVisit(visitId);
  const consents2 = listConsentsForVisit(visitId);
  const settings = getMultipleSettings([
    "clinic_name",
    "provincial_tax_label",
    "provincial_tax_rate",
    "federal_tax_label",
    "federal_tax_rate"
  ]);
  const clinicName = settings["clinic_name"] || "ApexRec";
  const practitioner = visit.practitionerId ? getUser(visit.practitionerId) : null;
  const patientName = sanitizeFilename(`${patient.firstName}-${patient.lastName}`);
  const filename = `visit-report-${patientName}-${visit.date}.pdf`;
  const outputPath = join(getExportsDir(), filename);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);
    doc.fontSize(20).font("Helvetica-Bold").text(clinicName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").fillColor("#666666").text("Visit Report", { align: "center" });
    doc.moveDown(1);
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.8);
    doc.fillColor("#000000");
    doc.fontSize(14).font("Helvetica-Bold").text("Patient Information");
    doc.moveDown(0.4);
    doc.fontSize(10).font("Helvetica");
    const infoLines = [
      `Name: ${patient.firstName} ${patient.lastName}`,
      patient.birthday ? `Date of Birth: ${patient.birthday}` : null,
      patient.sex ? `Sex: ${patient.sex}` : null,
      patient.ethnicity ? `Ethnicity: ${patient.ethnicity}` : null,
      patient.email ? `Email: ${patient.email}` : null,
      patient.cellPhone ? `Phone: ${patient.cellPhone}` : null,
      patient.city ? `City: ${patient.city}${patient.province ? ", " + patient.province : ""}` : null
    ].filter(Boolean);
    for (const line of infoLines) {
      doc.text(line);
    }
    doc.moveDown(1);
    doc.fontSize(14).font("Helvetica-Bold").text("Visit Details");
    doc.moveDown(0.4);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Date: ${visit.date}`);
    if (visit.time) doc.text(`Time: ${visit.time}`);
    if (practitioner) doc.text(`Practitioner: ${practitioner.name}`);
    doc.moveDown(1);
    if (visit.clinicalNotes) {
      doc.fontSize(14).font("Helvetica-Bold").text("Clinical Notes");
      doc.moveDown(0.4);
      doc.fontSize(10).font("Helvetica");
      const notes = stripHtml(visit.clinicalNotes);
      doc.text(notes, { width: 512 });
      doc.moveDown(1);
    }
    if (photoRows.length > 0) {
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Photos");
      doc.moveDown(0.6);
      const photoWidth = 160;
      const photoHeight = 120;
      const colCount = 3;
      const gapX = 16;
      const gapY = 30;
      let col = 0;
      let startY = doc.y;
      for (const photo of photoRows) {
        const absPath = resolvePhotoPath(photo.originalPath);
        if (!existsSync(absPath)) continue;
        const x = 50 + col * (photoWidth + gapX);
        const y = startY;
        try {
          doc.image(absPath, x, y, {
            width: photoWidth,
            height: photoHeight,
            fit: [photoWidth, photoHeight]
          });
        } catch {
        }
        const label = [photo.photoPosition, photo.photoState].filter(Boolean).join(" - ");
        doc.fontSize(7).font("Helvetica").text(label, x, y + photoHeight + 2, {
          width: photoWidth,
          align: "center"
        });
        col++;
        if (col >= colCount) {
          col = 0;
          startY += photoHeight + gapY;
          if (startY > 650) {
            doc.addPage();
            startY = 50;
          }
        }
      }
    }
    if (treatments2.length > 0) {
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Treatment Records");
      doc.moveDown(0.6);
      let subtotal = 0;
      for (const tx of treatments2) {
        doc.fontSize(11).font("Helvetica-Bold");
        const productLabel = [tx.productName, tx.productBrand].filter(Boolean).join(" — ");
        doc.text(productLabel || tx.treatmentType || "Treatment");
        doc.moveDown(0.2);
        doc.fontSize(9).font("Helvetica").fillColor("#444444");
        if (tx.treatmentType) doc.text(`Type: ${tx.treatmentType}`);
        if (tx.lotNumber) doc.text(`Lot #: ${tx.lotNumber}`);
        if (tx.expiryDate) doc.text(`Expiry: ${tx.expiryDate}`);
        const areas = listAreasForTreatment(tx.id);
        if (areas.length > 0) {
          doc.moveDown(0.2);
          for (const area of areas) {
            const areaLine = `  ${area.treatedAreaName || "Area"}: ${area.units || 0} units — $${(area.cost || 0).toFixed(2)}`;
            doc.text(areaLine);
          }
        }
        const txCost = tx.totalCost || 0;
        subtotal += txCost;
        doc.moveDown(0.2);
        doc.font("Helvetica-Bold").text(`Total: ${tx.totalUnits || 0} units — $${txCost.toFixed(2)}`);
        doc.fillColor("#000000");
        doc.moveDown(0.6);
        doc.strokeColor("#eeeeee").lineWidth(0.5).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(0.4);
      }
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const provRate = parseFloat(settings["provincial_tax_rate"] || "0");
      const fedRate = parseFloat(settings["federal_tax_rate"] || "0");
      const provLabel = settings["provincial_tax_label"] || "Provincial Tax";
      const fedLabel = settings["federal_tax_label"] || "Federal Tax";
      const provTax = subtotal * (provRate / 100);
      const fedTax = subtotal * (fedRate / 100);
      const total = subtotal + provTax + fedTax;
      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: "right" });
      if (provRate > 0) {
        doc.text(`${provLabel} (${provRate}%): $${provTax.toFixed(2)}`, { align: "right" });
      }
      if (fedRate > 0) {
        doc.text(`${fedLabel} (${fedRate}%): $${fedTax.toFixed(2)}`, { align: "right" });
      }
      doc.font("Helvetica-Bold").text(`Total: $${total.toFixed(2)}`, { align: "right" });
    }
    if (treatments2.length > 0) {
      let hasAnnotations = false;
      for (const tx of treatments2) {
        const annotations2 = getAnnotationsForTreatment(tx.id);
        if (annotations2.length > 0) {
          if (!hasAnnotations) {
            doc.addPage();
            doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000").text("Injection Site Maps");
            doc.moveDown(0.6);
            hasAnnotations = true;
          }
          const productLabel = [tx.productName, tx.productBrand].filter(Boolean).join(" — ");
          doc.fontSize(11).font("Helvetica-Bold").text(productLabel || "Treatment");
          doc.moveDown(0.3);
          doc.fontSize(9).font("Helvetica");
          for (const ann of annotations2) {
            try {
              const data = JSON.parse(ann.dataJson || "{}");
              const views = Object.keys(data);
              if (views.length > 0) {
                doc.text(`Views: ${views.join(", ")}`);
                for (const view of views) {
                  const points = data[view];
                  if (Array.isArray(points) && points.length > 0) {
                    doc.text(`  ${view}: ${points.length} injection point(s)`);
                  }
                }
              }
            } catch {
              doc.text("Annotation data available");
            }
          }
          doc.moveDown(0.6);
        }
      }
    }
    if (consents2.length > 0) {
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000").text("Consent Records");
      doc.moveDown(0.6);
      for (const consent of consents2) {
        doc.fontSize(11).font("Helvetica-Bold").text(`Type: ${consent.type}`);
        doc.fontSize(9).font("Helvetica");
        if (consent.signedAt) doc.text(`Signed: ${consent.signedAt}`);
        if (consent.signatureData && consent.signatureData.startsWith("data:image/png;base64,")) {
          const base64 = consent.signatureData.replace("data:image/png;base64,", "");
          const sigBuffer = Buffer.from(base64, "base64");
          try {
            doc.image(sigBuffer, doc.x, doc.y + 8, { width: 200, height: 60 });
            doc.moveDown(5);
          } catch {
            doc.moveDown(0.3);
          }
        }
        doc.moveDown(0.8);
      }
    }
    doc.end();
    stream.on("finish", () => {
      resolve({ path: outputPath, filename });
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}
async function exportPortfolioReport(portfolioId) {
  const portfolio = getPortfolio(portfolioId);
  if (!portfolio) throw new Error("Portfolio not found");
  const items = listPortfolioItems(portfolioId);
  const title = sanitizeFilename(portfolio.title || "portfolio");
  const filename = `portfolio-${title}.pdf`;
  const outputPath = join(getExportsDir(), filename);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });
    const stream = createWriteStream(outputPath);
    doc.pipe(stream);
    doc.fontSize(24).font("Helvetica-Bold").text(portfolio.title, { align: "center" });
    doc.moveDown(0.5);
    if (portfolio.category) {
      doc.fontSize(12).font("Helvetica").fillColor("#666666").text(portfolio.category, { align: "center" });
    }
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#999999").text(`${items.length} comparison pair(s)`, { align: "center" });
    for (const item of items) {
      doc.addPage();
      doc.fillColor("#000000");
      doc.fontSize(12).font("Helvetica-Bold").text(`${item.patientFirstName} ${item.patientLastName}`, { align: "center" });
      doc.moveDown(0.3);
      const photoWidth = 330;
      const photoHeight = 380;
      const leftX = 40;
      const rightX = 412;
      doc.fontSize(9).font("Helvetica").fillColor("#666666").text(`Before: ${item.beforeDate || "N/A"}`, leftX, doc.y);
      const photoY = doc.y + 4;
      if (item.beforePhotoPath) {
        const absPath = resolvePhotoPath(item.beforePhotoPath);
        if (existsSync(absPath)) {
          try {
            doc.image(absPath, leftX, photoY, {
              width: photoWidth,
              height: photoHeight,
              fit: [photoWidth, photoHeight]
            });
          } catch {
          }
        }
      }
      doc.fontSize(9).font("Helvetica").fillColor("#666666").text(`After: ${item.afterDate || "N/A"}`, rightX, photoY - 14);
      if (item.afterPhotoPath) {
        const absPath = resolvePhotoPath(item.afterPhotoPath);
        if (existsSync(absPath)) {
          try {
            doc.image(absPath, rightX, photoY, {
              width: photoWidth,
              height: photoHeight,
              fit: [photoWidth, photoHeight]
            });
          } catch {
          }
        }
      }
      if (item.photoPosition) {
        doc.fontSize(8).font("Helvetica").fillColor("#999999").text(item.photoPosition, 40, photoY + photoHeight + 8, {
          width: 732,
          align: "center"
        });
      }
    }
    doc.end();
    stream.on("finish", () => {
      resolve({ path: outputPath, filename });
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}
function registerExportIPC() {
  ipcMain.handle("export:visitReport", async (_event, visitId) => {
    return exportVisitReport(visitId);
  });
  ipcMain.handle("export:portfolioReport", async (_event, portfolioId) => {
    return exportPortfolioReport(portfolioId);
  });
  ipcMain.handle("export:openFile", async (_event, filePath) => {
    return shell.openPath(filePath);
  });
}
if (is.dev) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222");
}
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.apexrec.app");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  initDatabase();
  runMigrations();
  seedDatabase();
  registerPatientIPC();
  registerSettingsIPC();
  registerVisitIPC();
  registerPhotoIPC();
  registerTreatmentIPC();
  registerCatalogIPC();
  registerAnnotationIPC();
  registerPortfolioIPC();
  registerConsentIPC();
  registerSearchIPC();
  registerUserIPC();
  registerBackupIPC();
  registerExportIPC();
  createWindow();
  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("will-quit", () => {
  closeDatabase();
});
