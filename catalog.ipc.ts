import { ipcMain } from 'electron'
import {
  listProducts,
  listAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../database/repository/product.repository'
import {
  listTreatedAreas,
  listAllTreatedAreas,
  getTreatedArea,
  createTreatedArea,
  updateTreatedArea,
  deleteTreatedArea
} from '../database/repository/treated-area.repository'
import {
  listTreatmentCategories,
  listAllTreatmentCategories,
  getTreatmentCategory,
  getTreatmentCategoryBySlug,
  createTreatmentCategory,
  updateTreatmentCategory,
  deleteTreatmentCategory
} from '../database/repository/treatment-category.repository'

export function registerCatalogIPC(): void {
  // Products
  ipcMain.handle('product:list', () => listProducts())
  ipcMain.handle('product:listAll', () => listAllProducts())
  ipcMain.handle('product:get', (_event, id: string) => getProduct(id))
  ipcMain.handle('product:create', (_event, data: Record<string, unknown>) => createProduct(data as never))
  ipcMain.handle('product:update', (_event, id: string, data: Record<string, unknown>) =>
    updateProduct(id, data as never)
  )
  ipcMain.handle('product:delete', (_event, id: string) => deleteProduct(id))

  // Treated Areas
  ipcMain.handle('treatedArea:list', () => listTreatedAreas())
  ipcMain.handle('treatedArea:listAll', () => listAllTreatedAreas())
  ipcMain.handle('treatedArea:get', (_event, id: string) => getTreatedArea(id))
  ipcMain.handle('treatedArea:create', (_event, data: Record<string, unknown>) =>
    createTreatedArea(data as never)
  )
  ipcMain.handle('treatedArea:update', (_event, id: string, data: Record<string, unknown>) =>
    updateTreatedArea(id, data as never)
  )
  ipcMain.handle('treatedArea:delete', (_event, id: string) => deleteTreatedArea(id))

  // Treatment Categories
  ipcMain.handle('treatmentCategory:list', () => listTreatmentCategories())
  ipcMain.handle('treatmentCategory:listAll', () => listAllTreatmentCategories())
  ipcMain.handle('treatmentCategory:get', (_event, id: string) => getTreatmentCategory(id))
  ipcMain.handle('treatmentCategory:getBySlug', (_event, slug: string) =>
    getTreatmentCategoryBySlug(slug)
  )
  ipcMain.handle(
    'treatmentCategory:create',
    (_event, data: Record<string, unknown>) => createTreatmentCategory(data as never)
  )
  ipcMain.handle(
    'treatmentCategory:update',
    (_event, id: string, data: Record<string, unknown>) =>
      updateTreatmentCategory(id, data as never)
  )
  ipcMain.handle('treatmentCategory:delete', (_event, id: string) =>
    deleteTreatmentCategory(id)
  )
}
