import { contextBridge, ipcRenderer } from 'electron'
import {
  desktopProcessChannel,
  desktopProcessEventChannel,
  type DesktopProcessApi,
  type ProcessEvent,
} from '@node-dev-mgr/shared'

const desktopApi: DesktopProcessApi = {
  listProcesses: () => ipcRenderer.invoke(desktopProcessChannel.list),
  startProcess: (input) => ipcRenderer.invoke(desktopProcessChannel.start, input),
  stopProcess: (processId) =>
    ipcRenderer.invoke(desktopProcessChannel.stop, processId),
  restartProcess: (input) => ipcRenderer.invoke(desktopProcessChannel.restart, input),
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
