import { ipcMain } from 'electron'
import {
  createAnnotation,
  getAnnotationsForTreatment,
  updateAnnotation,
  deleteAnnotation
} from '../database/repository/annotation.repository'

export function registerAnnotationIPC(): void {
  ipcMain.handle('annotation:create', (_event, data) => createAnnotation(data))
  ipcMain.handle('annotation:listForTreatment', (_event, treatmentId: string) =>
    getAnnotationsForTreatment(treatmentId)
  )
  ipcMain.handle('annotation:update', (_event, id: string, data) => updateAnnotation(id, data))
  ipcMain.handle('annotation:delete', (_event, id: string) => deleteAnnotation(id))
}
