import { ElectronAPI } from '@electron-toolkit/preload'

export interface Patient {
  id: string
  firstName: string
  lastName: string
  sex: string | null
  birthday: string | null
  ethnicity: string | null
  email: string | null
  homePhone: string | null
  cellPhone: string | null
  workPhone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  province: string | null
  medicalConditions: string | null
  familyPhysician: string | null
  weight: string | null
  height: string | null
  pastIllnesses: string | null
  currentMedications: string | null
  conditionsBeingTreated: string | null
  previousSpecialistTreatment: boolean | null
  pregnantOrBreastfeeding: boolean | null
  smoker: boolean | null
  referralSources: string | null
  treatmentInterests: string | null
  botulinumToxinConsent: string | null
  photoConsent: string | null
  quickRegister: boolean | null
  avatarPath: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Visit {
  id: string
  patientId: string
  practitionerId: string | null
  date: string
  time: string | null
  clinicalNotes: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface VisitListItem extends Visit {
  photoCount: number
  hasTreatments: boolean
}

export interface Photo {
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

export interface Product {
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

export interface TreatedArea {
  id: string
  name: string
  color: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Treatment {
  id: string
  visitId: string
  treatmentType: string | null
  productId: string | null
  lotNumber: string | null
  expiryDate: string | null
  totalUnits: number | null
  totalCost: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface TreatmentWithProduct extends Treatment {
  productName: string | null
  productBrand: string | null
  productColor: string | null
  productCategory: string | null
  productUnitType: string | null
}

export interface TreatmentAreaItem {
  id: string
  treatmentId: string
  treatedAreaId: string
  units: number | null
  cost: number | null
  createdAt: string
  areaName: string
  areaColor: string | null
}

export interface Annotation {
  id: string
  treatmentId: string
  diagramView: string | null
  pointsJson: string | null
  createdAt: string
  updatedAt: string
}

interface PatientAPI {
  list(filters?: Record<string, unknown>): Promise<{ data: Patient[]; total: number }>
  get(id: string): Promise<Patient | null>
  create(data: Record<string, unknown>): Promise<Patient>
  update(id: string, data: Record<string, unknown>): Promise<Patient | null>
  delete(id: string): Promise<void>
  search(query: string): Promise<Patient[]>
  getStats(): Promise<{ totalPatients: number; totalVisits: number }>
  getRecent(limit?: number): Promise<Patient[]>
}

interface SettingsAPI {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  getMultiple(keys: string[]): Promise<Record<string, string | null>>
  setMultiple(entries: Record<string, string>): Promise<void>
}

interface VisitAPI {
  create(data: Record<string, unknown>): Promise<Visit>
  get(id: string): Promise<Visit | null>
  list(patientId: string): Promise<VisitListItem[]>
  update(id: string, data: Record<string, unknown>): Promise<Visit | null>
  delete(id: string): Promise<void>
}

interface PhotoAPI {
  import(sourcePath: string, patientId: string, visitId: string, photoState?: string): Promise<Photo>
  get(id: string): Promise<Photo | null>
  list(visitId: string): Promise<Photo[]>
  update(id: string, data: Record<string, unknown>): Promise<Photo | null>
  delete(id: string): Promise<void>
  rotate(id: string, degrees: number): Promise<Photo | null>
  flip(id: string, direction: 'horizontal' | 'vertical'): Promise<Photo | null>
  crop(id: string, left: number, top: number, width: number, height: number): Promise<Photo | null>
  getFilePath(relativePath: string): Promise<string>
  exportAll(visitId: string): Promise<string[] | null>
  selectFiles(): Promise<string[]>
}

interface TreatmentAPI {
  create(data: Record<string, unknown>): Promise<Treatment>
  get(id: string): Promise<Treatment | null>
  list(visitId: string): Promise<TreatmentWithProduct[]>
  update(id: string, data: Record<string, unknown>): Promise<Treatment | null>
  delete(id: string): Promise<void>
}

interface TreatmentAreaAPI {
  create(data: Record<string, unknown>): Promise<TreatmentAreaItem>
  list(treatmentId: string): Promise<TreatmentAreaItem[]>
  update(id: string, data: Record<string, unknown>): Promise<TreatmentAreaItem | null>
  delete(id: string): Promise<void>
}

interface ProductAPI {
  list(): Promise<Product[]>
  listAll(): Promise<Product[]>
  get(id: string): Promise<Product | null>
  create(data: Record<string, unknown>): Promise<Product>
  update(id: string, data: Record<string, unknown>): Promise<Product | null>
  delete(id: string): Promise<void>
}

interface TreatedAreaAPI {
  list(): Promise<TreatedArea[]>
  listAll(): Promise<TreatedArea[]>
  get(id: string): Promise<TreatedArea | null>
  create(data: Record<string, unknown>): Promise<TreatedArea>
  update(id: string, data: Record<string, unknown>): Promise<TreatedArea | null>
  delete(id: string): Promise<void>
}

export interface TreatmentCategory {
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

interface TreatmentCategoryAPI {
  list(): Promise<TreatmentCategory[]>
  listAll(): Promise<TreatmentCategory[]>
  get(id: string): Promise<TreatmentCategory | null>
  getBySlug(slug: string): Promise<TreatmentCategory | null>
  create(data: Record<string, unknown>): Promise<TreatmentCategory>
  update(id: string, data: Record<string, unknown>): Promise<TreatmentCategory | null>
  delete(id: string): Promise<void>
}

interface AnnotationAPI {
  create(data: Record<string, unknown>): Promise<Annotation>
  listForTreatment(treatmentId: string): Promise<Annotation[]>
  update(id: string, data: Record<string, unknown>): Promise<Annotation | null>
  delete(id: string): Promise<void>
}

export interface Consent {
  id: string
  patientId: string
  visitId: string | null
  type: string
  consentText: string | null
  signatureData: string | null
  signedAt: string | null
  createdAt: string
}

export interface ConsentTemplate {
  id: string
  name: string
  type: string
  contentJson: string | null
  isDefault: boolean | null
  createdAt: string
  updatedAt: string
}

interface ConsentAPI {
  create(data: Record<string, unknown>): Promise<Consent>
  get(id: string): Promise<Consent | null>
  listForPatient(patientId: string): Promise<Consent[]>
  listForVisit(visitId: string): Promise<Consent[]>
  delete(id: string): Promise<void>
}

interface ConsentTemplateAPI {
  create(data: Record<string, unknown>): Promise<ConsentTemplate>
  get(id: string): Promise<ConsentTemplate | null>
  list(): Promise<ConsentTemplate[]>
  update(id: string, data: Record<string, unknown>): Promise<ConsentTemplate | null>
  delete(id: string): Promise<void>
}

export interface CaseSearchFilters {
  ethnicity?: string
  sex?: string
  ageMin?: number
  ageMax?: number
  minVisits?: number
  hasBotulinumConsent?: boolean
  hasFillerConsent?: boolean
  hasPhotoConsent?: boolean
  visitDateFrom?: string
  visitDateTo?: string
  lotNumber?: string
  practitionerId?: string
  productIds?: string[]
  treatmentCategorySlugs?: string[]
  treatedAreaIds?: string[]
}

export interface CaseSearchResult {
  patientId: string
  firstName: string
  lastName: string
  sex: string | null
  birthday: string | null
  ethnicity: string | null
  city: string | null
  province: string | null
  visitCount: number
  treatmentCount: number
}

interface SearchAPI {
  cases(filters: CaseSearchFilters): Promise<CaseSearchResult[]>
}

export interface Portfolio {
  id: string
  title: string
  category: string | null
  demographicsFilter: string | null
  ownerId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface PortfolioWithCount extends Portfolio {
  itemCount: number
}

export interface PortfolioItem {
  id: string
  portfolioId: string
  patientId: string
  beforeVisitId: string | null
  afterVisitId: string | null
  photoPosition: string | null
  photoState: string | null
  createdAt: string
}

export interface PortfolioItemWithDetails extends PortfolioItem {
  patientFirstName: string
  patientLastName: string
  beforeDate: string | null
  afterDate: string | null
  beforePhotoPath: string | null
  afterPhotoPath: string | null
  beforeThumbnailPath: string | null
  afterThumbnailPath: string | null
}

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

interface PortfolioAPI {
  create(data: Record<string, unknown>): Promise<Portfolio>
  get(id: string): Promise<Portfolio | null>
  list(): Promise<PortfolioWithCount[]>
  update(id: string, data: Record<string, unknown>): Promise<Portfolio | null>
  delete(id: string): Promise<void>
}

interface PortfolioItemAPI {
  create(data: Record<string, unknown>): Promise<PortfolioItem>
  list(portfolioId: string): Promise<PortfolioItemWithDetails[]>
  delete(id: string): Promise<void>
}

interface CompareAPI {
  photos(beforeVisitId: string, afterVisitId: string): Promise<ComparePhotoPair[]>
}

// ── User / Practitioner ──────────────────────────────────────────

interface User {
  id: string
  name: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface UserAPI {
  list(): Promise<User[]>
  listAll(): Promise<User[]>
  get(id: string): Promise<User | null>
  create(data: Record<string, unknown>): Promise<User>
  update(id: string, data: Record<string, unknown>): Promise<User | null>
  delete(id: string): Promise<void>
}

// ── Backup ────────────────────────────────────────────────────────

interface BackupInfo {
  filename: string
  path: string
  size: number
  createdAt: string
}

interface BackupAPI {
  create(): Promise<BackupInfo>
  list(): Promise<BackupInfo[]>
  restore(filename: string): Promise<{ success: boolean; error?: string }>
  delete(filename: string): Promise<void>
}

// ── Export ─────────────────────────────────────────────────────────

interface ExportResult {
  path: string
  filename: string
}

interface ExportAPI {
  visitReport(visitId: string): Promise<ExportResult>
  portfolioReport(portfolioId: string): Promise<ExportResult>
  openFile(filePath: string): Promise<string>
}

interface ApexRecAPI {
  patients: PatientAPI
  settings: SettingsAPI
  visits: VisitAPI
  photos: PhotoAPI
  treatments: TreatmentAPI
  treatmentAreas: TreatmentAreaAPI
  products: ProductAPI
  treatedAreas: TreatedAreaAPI
  treatmentCategories: TreatmentCategoryAPI
  portfolios: PortfolioAPI
  portfolioItems: PortfolioItemAPI
  compare: CompareAPI
  annotations: AnnotationAPI
  consents: ConsentAPI
  consentTemplates: ConsentTemplateAPI
  search: SearchAPI
  users: UserAPI
  backup: BackupAPI
  exports: ExportAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApexRecAPI
  }
}
