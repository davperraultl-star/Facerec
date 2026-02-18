import { ipcMain } from 'electron'
import {
  listUsers,
  listAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../database/repository/user.repository'

export function registerUserIPC(): void {
  ipcMain.handle('user:list', () => listUsers())
  ipcMain.handle('user:listAll', () => listAllUsers())
  ipcMain.handle('user:get', (_event, id: string) => getUser(id))
  ipcMain.handle('user:create', (_event, data: Record<string, unknown>) =>
    createUser(data as never)
  )
  ipcMain.handle('user:update', (_event, id: string, data: Record<string, unknown>) =>
    updateUser(id, data as never)
  )
  ipcMain.handle('user:delete', (_event, id: string) => deleteUser(id))
}
