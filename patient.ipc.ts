import { ipcMain } from 'electron'
import {
  createPatient,
  getPatient,
  listPatients,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientStats,
  getRecentPatients
} from '../database/repository/patient.repository'

export function registerPatientIPC(): void {
  ipcMain.handle('patient:create', (_event, data) => {
    return createPatient(data)
  })

  ipcMain.handle('patient:get', (_event, id: string) => {
    return getPatient(id)
  })

  ipcMain.handle('patient:list', (_event, filters?: Record<string, unknown>) => {
    return listPatients(filters as { search?: string; limit?: number; offset?: number })
  })

  ipcMain.handle('patient:update', (_event, id: string, data) => {
    return updatePatient(id, data)
  })

  ipcMain.handle('patient:delete', (_event, id: string) => {
    deletePatient(id)
  })

  ipcMain.handle('patient:search', (_event, query: string) => {
    return searchPatients(query)
  })

  ipcMain.handle('patient:stats', () => {
    return getPatientStats()
  })

  ipcMain.handle('patient:recent', (_event, limit?: number) => {
    return getRecentPatients(limit)
  })
}
