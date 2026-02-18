import { ipcMain } from 'electron'
import {
  createPortfolio,
  getPortfolio,
  listPortfolios,
  updatePortfolio,
  deletePortfolio,
  createPortfolioItem,
  listPortfolioItems,
  deletePortfolioItem,
  getCompareVisitPhotos
} from '../database/repository/portfolio.repository'

export function registerPortfolioIPC(): void {
  // Portfolio CRUD
  ipcMain.handle('portfolio:create', (_event, data) => createPortfolio(data))
  ipcMain.handle('portfolio:get', (_event, id: string) => getPortfolio(id))
  ipcMain.handle('portfolio:list', () => listPortfolios())
  ipcMain.handle('portfolio:update', (_event, id: string, data) => updatePortfolio(id, data))
  ipcMain.handle('portfolio:delete', (_event, id: string) => deletePortfolio(id))

  // Portfolio Item CRUD
  ipcMain.handle('portfolioItem:create', (_event, data) => createPortfolioItem(data))
  ipcMain.handle('portfolioItem:list', (_event, portfolioId: string) =>
    listPortfolioItems(portfolioId)
  )
  ipcMain.handle('portfolioItem:delete', (_event, id: string) => deletePortfolioItem(id))

  // Compare visits helper
  ipcMain.handle(
    'compare:photos',
    (_event, beforeVisitId: string, afterVisitId: string) =>
      getCompareVisitPhotos(beforeVisitId, afterVisitId)
  )
}
