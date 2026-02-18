import { ipcMain } from 'electron'
import {
  createTreatment,
  getTreatment,
  listTreatmentsForVisit,
  updateTreatment,
  deleteTreatment
} from '../database/repository/treatment.repository'
import {
  createTreatmentArea,
  listAreasForTreatment,
  updateTreatmentArea,
  deleteTreatmentArea,
  deleteAreasForTreatment
} from '../database/repository/treatment-area.repository'

export function registerTreatmentIPC(): void {
  // Treatments
  ipcMain.handle('treatment:create', (_event, data) => createTreatment(data))
  ipcMain.handle('treatment:get', (_event, id: string) => getTreatment(id))
  ipcMain.handle('treatment:list', (_event, visitId: string) => listTreatmentsForVisit(visitId))
  ipcMain.handle('treatment:update', (_event, id: string, data) => updateTreatment(id, data))
  ipcMain.handle('treatment:delete', (_event, id: string) => {
    deleteAreasForTreatment(id)
    deleteTreatment(id)
  })

  // Treatment Areas
  ipcMain.handle('treatmentArea:create', (_event, data) => createTreatmentArea(data))
  ipcMain.handle('treatmentArea:list', (_event, treatmentId: string) =>
    listAreasForTreatment(treatmentId)
  )
  ipcMain.handle('treatmentArea:update', (_event, id: string, data) =>
    updateTreatmentArea(id, data)
  )
  ipcMain.handle('treatmentArea:delete', (_event, id: string) => deleteTreatmentArea(id))
}
