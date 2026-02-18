import { ipcMain } from 'electron'
import {
  getSetting,
  setSetting,
  getMultipleSettings,
  setMultipleSettings
} from '../database/repository/settings.repository'

export function registerSettingsIPC(): void {
  ipcMain.handle('settings:get', (_event, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    setSetting(key, value)
  })

  ipcMain.handle('settings:getMultiple', (_event, keys: string[]) => {
    return getMultipleSettings(keys)
  })

  ipcMain.handle('settings:setMultiple', (_event, entries: Record<string, string>) => {
    setMultipleSettings(entries)
  })
}
