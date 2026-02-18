import { join, extname, basename } from 'path'
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'fs'
import { v4 as uuid } from 'uuid'
import sharp from 'sharp'
import { getDataDirectory } from '../database/connection'

const THUMBNAIL_WIDTH = 300

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
}

export interface ImportResult {
  originalPath: string
  thumbnailPath: string
  width: number
  height: number
}

export async function importPhoto(
  sourcePath: string,
  patientId: string,
  visitId: string
): Promise<ImportResult> {
  const dataDir = getDataDirectory()
  const ext = extname(sourcePath).toLowerCase() || '.jpg'
  const fileId = uuid()

  // Create directories
  const originalsDir = join(dataDir, 'photos', 'originals', patientId, visitId)
  const thumbnailsDir = join(dataDir, 'photos', 'thumbnails')
  ensureDir(originalsDir)
  ensureDir(thumbnailsDir)

  // Copy original
  const originalFilename = `${fileId}${ext}`
  const originalAbsPath = join(originalsDir, originalFilename)
  copyFileSync(sourcePath, originalAbsPath)

  // Generate thumbnail
  const thumbnailFilename = `${fileId}_thumb.jpg`
  const thumbnailAbsPath = join(thumbnailsDir, thumbnailFilename)

  const metadata = await sharp(originalAbsPath).metadata()

  await sharp(originalAbsPath)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(thumbnailAbsPath)

  // Store relative paths (from data dir)
  const originalRelPath = join('photos', 'originals', patientId, visitId, originalFilename)
  const thumbnailRelPath = join('photos', 'thumbnails', thumbnailFilename)

  return {
    originalPath: originalRelPath,
    thumbnailPath: thumbnailRelPath,
    width: metadata.width || 0,
    height: metadata.height || 0
  }
}

export async function rotatePhoto(
  relativePath: string,
  degrees: number
): Promise<{ width: number; height: number }> {
  const absPath = resolvePhotoPath(relativePath)
  const buffer = await sharp(absPath).rotate(degrees).toBuffer()
  await sharp(buffer).toFile(absPath)

  // Regenerate thumbnail
  await regenerateThumbnail(relativePath)

  const meta = await sharp(absPath).metadata()
  return { width: meta.width || 0, height: meta.height || 0 }
}

export async function flipPhoto(
  relativePath: string,
  direction: 'horizontal' | 'vertical'
): Promise<void> {
  const absPath = resolvePhotoPath(relativePath)
  const pipeline = sharp(absPath)

  if (direction === 'horizontal') {
    pipeline.flop()
  } else {
    pipeline.flip()
  }

  const buffer = await pipeline.toBuffer()
  await sharp(buffer).toFile(absPath)
  await regenerateThumbnail(relativePath)
}

export async function cropPhoto(
  relativePath: string,
  left: number,
  top: number,
  width: number,
  height: number
): Promise<{ width: number; height: number }> {
  const absPath = resolvePhotoPath(relativePath)
  const buffer = await sharp(absPath)
    .extract({ left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) })
    .toBuffer()
  await sharp(buffer).toFile(absPath)
  await regenerateThumbnail(relativePath)

  return { width: Math.round(width), height: Math.round(height) }
}

export function resolvePhotoPath(relativePath: string): string {
  const dataDir = getDataDirectory()
  return join(dataDir, relativePath)
}

export function deletePhotoFiles(originalRelPath: string, thumbnailRelPath?: string): void {
  try {
    const origAbs = resolvePhotoPath(originalRelPath)
    if (existsSync(origAbs)) unlinkSync(origAbs)
  } catch {
    // File may already be deleted
  }

  if (thumbnailRelPath) {
    try {
      const thumbAbs = resolvePhotoPath(thumbnailRelPath)
      if (existsSync(thumbAbs)) unlinkSync(thumbAbs)
    } catch {
      // File may already be deleted
    }
  }
}

async function regenerateThumbnail(originalRelPath: string): Promise<void> {
  const dataDir = getDataDirectory()
  const absPath = join(dataDir, originalRelPath)

  // Derive thumbnail path from original
  const fileId = basename(originalRelPath, extname(originalRelPath))
  const thumbnailFilename = `${fileId}_thumb.jpg`
  const thumbnailAbsPath = join(dataDir, 'photos', 'thumbnails', thumbnailFilename)

  await sharp(absPath)
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(thumbnailAbsPath)
}

export async function exportAllPhotos(
  photoPaths: string[],
  outputDir: string
): Promise<string[]> {
  ensureDir(outputDir)
  const exported: string[] = []

  for (const relPath of photoPaths) {
    const absPath = resolvePhotoPath(relPath)
    if (existsSync(absPath)) {
      const filename = basename(relPath)
      const destPath = join(outputDir, filename)
      copyFileSync(absPath, destPath)
      exported.push(destPath)
    }
  }

  return exported
}
