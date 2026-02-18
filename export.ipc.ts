import { ipcMain, shell } from 'electron'
import { exportVisitReport, exportPortfolioReport } from '../services/pdf-export.service'

export function registerExportIPC(): void {
  ipcMain.handle('export:visitReport', async (_event, visitId: string) => {
    return exportVisitReport(visitId)
  })

  ipcMain.handle('export:portfolioReport', async (_event, portfolioId: string) => {
    return exportPortfolioReport(portfolioId)
  })

  ipcMain.handle('export:openFile', async (_event, filePath: string) => {
    return shell.openPath(filePath)
  })
}
