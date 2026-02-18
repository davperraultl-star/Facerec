import { ipcMain, dialog } from 'electron'
import {
  createPhoto,
  getPhoto,
  listPhotosForVisit,
  updatePhoto,
  deletePhoto
} from '../database/repository/photo.repository'
import {
  importPhoto,
  rotatePhoto,
  flipPhoto,
  cropPhoto,
  resolvePhotoPath,
  deletePhotoFiles,
  exportAllPhotos
} from '../services/photo.service'

export function registerPhotoIPC(): void {
  ipcMain.handle(
    'photo:import',
    async (_event, sourcePath: string, patientId: string, visitId: string, photoState?: string) => {
      const result = await importPhoto(sourcePath, patientId, visitId)
      const photo = createPhoto({
        visitId,
        patientId,
        originalPath: result.originalPath,
        thumbnailPath: result.thumbnailPath,
        photoState,
        width: result.width,
        height: result.height
      })
      return photo
    }
  )

  ipcMain.handle('photo:get', (_event, id: string) => getPhoto(id))

  ipcMain.handle('photo:list', (_event, visitId: string) => listPhotosForVisit(visitId))

  ipcMain.handle('photo:update', (_event, id: string, data) => updatePhoto(id, data))

  ipcMain.handle('photo:delete', (_event, id: string) => {
    const photo = getPhoto(id)
    if (photo) {
      deletePhotoFiles(photo.originalPath, photo.thumbnailPath || undefined)
      deletePhoto(id)
    }
  })

  ipcMain.handle('photo:rotate', async (_event, id: string, degrees: number) => {
    const photo = getPhoto(id)
    if (!photo) return null
    const result = await rotatePhoto(photo.originalPath, degrees)
    return updatePhoto(id, { width: result.width, height: result.height })
  })

  ipcMain.handle('photo:flip', async (_event, id: string, direction: 'horizontal' | 'vertical') => {
    const photo = getPhoto(id)
    if (!photo) return null
    await flipPhoto(photo.originalPath, direction)
    return getPhoto(id)
  })

  ipcMain.handle(
    'photo:crop',
    async (_event, id: string, left: number, top: number, width: number, height: number) => {
      const photo = getPhoto(id)
      if (!photo) return null
      const result = await cropPhoto(photo.originalPath, left, top, width, height)
      return updatePhoto(id, { width: result.width, height: result.height })
    }
  )

  ipcMain.handle('photo:getFilePath', (_event, relativePath: string) => {
    return resolvePhotoPath(relativePath)
  })

  ipcMain.handle('photo:exportAll', async (_event, visitId: string) => {
    const photos = listPhotosForVisit(visitId)
    if (photos.length === 0) return null

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose export folder'
    })

    if (result.canceled || !result.filePaths[0]) return null

    const paths = photos.map((p) => p.originalPath)
    return exportAllPhotos(paths, result.filePaths[0])
  })

  ipcMain.handle('photo:selectFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'heic', 'webp', 'tiff'] }]
    })
    if (result.canceled) return []
    return result.filePaths
  })
}
