import { ipcMain } from 'electron'
import {
  createVisit,
  getVisit,
  listVisitsForPatient,
  updateVisit,
  deleteVisit
} from '../database/repository/visit.repository'

export function registerVisitIPC(): void {
  ipcMain.handle('visit:create', (_event, data) => createVisit(data))
  ipcMain.handle('visit:get', (_event, id: string) => getVisit(id))
  ipcMain.handle('visit:list', (_event, patientId: string) => listVisitsForPatient(patientId))
  ipcMain.handle('visit:update', (_event, id: string, data) => updateVisit(id, data))
  ipcMain.handle('visit:delete', (_event, id: string) => deleteVisit(id))
}
