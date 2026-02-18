import { ipcMain } from 'electron'
import { searchCases } from '../database/repository/search.repository'

export function registerSearchIPC(): void {
  ipcMain.handle('search:cases', (_event, filters: Record<string, unknown>) =>
    searchCases(filters as never)
  )
}
