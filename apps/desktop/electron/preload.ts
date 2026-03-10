import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopProcessApi, ProcessEvent } from '@node-dev-mgr/shared'
import {
  desktopProcessChannel,
  desktopProcessEventChannel,
} from './ipc-channel'

const desktopApi: DesktopProcessApi = {
  listProcesses: () => ipcRenderer.invoke(desktopProcessChannel.list),
  startProcess: (input) => ipcRenderer.invoke(desktopProcessChannel.start, input),
  stopProcess: (processId) =>
    ipcRenderer.invoke(desktopProcessChannel.stop, processId),
  restartProcess: (input) => ipcRenderer.invoke(desktopProcessChannel.restart, input),
  importProjectFromDirectory: () => ipcRenderer.invoke(desktopProcessChannel.importProject),
  onProcessEvent: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: ProcessEvent) => {
      listener(payload)
    }

    ipcRenderer.on(desktopProcessEventChannel, handler)
    return () => {
      ipcRenderer.removeListener(desktopProcessEventChannel, handler)
    }
  },
}

contextBridge.exposeInMainWorld('nodeDevMgrDesktop', desktopApi)
