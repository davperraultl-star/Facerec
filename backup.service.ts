import { join } from 'path'
import { copyFileSync, readdirSync, statSync, unlinkSync, existsSync } from 'fs'
import { getDataDirectory, closeDatabase, initDatabase } from '../database/connection'

export interface BackupInfo {
  filename: string
  path: string
  size: number
  createdAt: string
}

function getBackupDir(): string {
  return join(getDataDirectory(), 'backups')
}

function getDbPath(): string {
  return join(getDataDirectory(), 'db', 'apexrec.db')
}

function formatTimestamp(): string {
  const now = new Date()
  return now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .slice(0, 19)
}

export function createBackup(): BackupInfo {
  const dbPath = getDbPath()
  const backupDir = getBackupDir()
  const timestamp = formatTimestamp()
  const filename = `apexrec-backup-${timestamp}.db`
  const backupPath = join(backupDir, filename)

  // Use SQLite backup API via checkpoint then copy
  // Close and reopen to ensure WAL is flushed
  closeDatabase()

  try {
    copyFileSync(dbPath, backupPath)

    // Also copy WAL file if it exists
    const walPath = dbPath + '-wal'
    if (existsSync(walPath)) {
      copyFileSync(walPath, backupPath + '-wal')
    }
  } finally {
    // Always reopen
    initDatabase()
  }

  const stats = statSync(backupPath)

  return {
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: new Date().toISOString()
  }
}

export function listBackups(): BackupInfo[] {
  const backupDir = getBackupDir()

  if (!existsSync(backupDir)) return []

  const files = readdirSync(backupDir).filter(
    (f) => f.endsWith('.db') && f.startsWith('apexrec-backup-')
  )

  return files
    .map((filename) => {
      const fullPath = join(backupDir, filename)
      const stats = statSync(fullPath)
      return {
        filename,
        path: fullPath,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function restoreBackup(filename: string): { success: boolean; error?: string } {
  const backupDir = getBackupDir()
  const backupPath = join(backupDir, filename)
  const dbPath = getDbPath()

  if (!existsSync(backupPath)) {
    return { success: false, error: 'Backup file not found' }
  }

  // Create a safety backup before restoring
  const timestamp = formatTimestamp()
  const safetyFilename = `pre-restore-${timestamp}.db`
  const safetyPath = join(backupDir, safetyFilename)

  closeDatabase()

  try {
    // Safety backup of current DB
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, safetyPath)
    }

    // Restore backup over current DB
    copyFileSync(backupPath, dbPath)

    // Remove WAL/SHM if they exist (fresh start with restored DB)
    const walPath = dbPath + '-wal'
    const shmPath = dbPath + '-shm'
    if (existsSync(walPath)) unlinkSync(walPath)
    if (existsSync(shmPath)) unlinkSync(shmPath)

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  } finally {
    initDatabase()
  }
}

export function deleteBackup(filename: string): void {
  const backupDir = getBackupDir()
  const backupPath = join(backupDir, filename)

  if (existsSync(backupPath)) {
    unlinkSync(backupPath)
  }

  // Also delete WAL if it exists
  const walPath = backupPath + '-wal'
  if (existsSync(walPath)) {
    unlinkSync(walPath)
  }
}
