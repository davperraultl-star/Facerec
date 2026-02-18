import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sqlite: Database.Database | null = null

function getDataPath(): string {
  const userDataPath = app.getPath('userData')
  const dataDir = join(userDataPath, 'apexrec-data')
  const dbDir = join(dataDir, 'db')

  // Ensure directories exist
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

  // Also create photo directories
  const photoDirs = ['photos/originals', 'photos/thumbnails', 'photos/marked', 'exports', 'backups']
  for (const dir of photoDirs) {
    const fullPath = join(dataDir, dir)
    if (!existsSync(fullPath)) mkdirSync(fullPath, { recursive: true })
  }

  return join(dbDir, 'apexrec.db')
}

export function initDatabase(): ReturnType<typeof drizzle> {
  if (db) return db

  const dbPath = getDataPath()
  console.log('[DB] Opening database at:', dbPath)

  sqlite = new Database(dbPath)

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })

  return db
}

export function getDatabase(): ReturnType<typeof drizzle> {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function getSqlite(): Database.Database {
  if (!sqlite) throw new Error('Database not initialized. Call initDatabase() first.')
  return sqlite
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
    console.log('[DB] Database closed')
  }
}

export function getDataDirectory(): string {
  return join(app.getPath('userData'), 'apexrec-data')
}
