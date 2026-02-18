import { eq, sql } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { appSettings } from '../schema'

export function getSetting(key: string): string | null {
  const db = getDatabase()
  const result = db.select().from(appSettings).where(eq(appSettings.key, key)).get()
  return result?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const db = getDatabase()
  db.insert(appSettings)
    .values({
      key,
      value,
      updatedAt: sql`datetime('now')`
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        updatedAt: sql`datetime('now')`
      }
    })
    .run()
}

export function getMultipleSettings(keys: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {}
  for (const key of keys) {
    result[key] = getSetting(key)
  }
  return result
}

export function setMultipleSettings(entries: Record<string, string>): void {
  // For better-sqlite3, iterate and set each key individually
  // (db.transaction() executes immediately and doesn't return a callable)
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value)
  }
}
