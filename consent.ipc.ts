import { ipcMain } from 'electron'
import {
  createConsent,
  getConsent,
  listConsentsForPatient,
  listConsentsForVisit,
  deleteConsent,
  createConsentTemplate,
  getConsentTemplate,
  listConsentTemplates,
  updateConsentTemplate,
  deleteConsentTemplate
} from '../database/repository/consent.repository'

export function registerConsentIPC(): void {
  // Consents
  ipcMain.handle('consent:create', (_event, data: Record<string, unknown>) =>
    createConsent(data as never)
  )
  ipcMain.handle('consent:get', (_event, id: string) => getConsent(id))
  ipcMain.handle('consent:listForPatient', (_event, patientId: string) =>
    listConsentsForPatient(patientId)
  )
  ipcMain.handle('consent:listForVisit', (_event, visitId: string) =>
    listConsentsForVisit(visitId)
  )
  ipcMain.handle('consent:delete', (_event, id: string) => deleteConsent(id))

  // Consent Templates
  ipcMain.handle('consentTemplate:create', (_event, data: Record<string, unknown>) =>
    createConsentTemplate(data as never)
  )
  ipcMain.handle('consentTemplate:get', (_event, id: string) => getConsentTemplate(id))
  ipcMain.handle('consentTemplate:list', () => listConsentTemplates())
  ipcMain.handle(
    'consentTemplate:update',
    (_event, id: string, data: Record<string, unknown>) =>
      updateConsentTemplate(id, data as never)
  )
  ipcMain.handle('consentTemplate:delete', (_event, id: string) => deleteConsentTemplate(id))
}
