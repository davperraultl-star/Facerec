import { ipcMain } from 'electron'
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
} from '../services/backup.service'

export function registerBackupIPC(): void {
  ipcMain.handle('backup:create', () => createBackup())
  ipcMain.handle('backup:list', () => listBackups())
  ipcMain.handle('backup:restore', (_event, filename: string) => restoreBackup(filename))
  ipcMain.handle('backup:delete', (_event, filename: string) => deleteBackup(filename))
}
