import { contextBridge, ipcRenderer } from 'electron'
import type {
  DesktopProcessApi,
  DesktopWindowState,
  ProcessEvent,
} from '../src/shared'
import {
  desktopProcessChannel,
  desktopProcessEventChannel,
  desktopWindowStateEventChannel,
} from './ipc-channel'

const desktopApi: DesktopProcessApi = {
  listProcesses: () => ipcRenderer.invoke(desktopProcessChannel.list),
  getLogs: () => ipcRenderer.invoke(desktopProcessChannel.logs),
  startProcess: (input) => ipcRenderer.invoke(desktopProcessChannel.start, input),
  stopProcess: (processId) =>
    ipcRenderer.invoke(desktopProcessChannel.stop, processId),
  restartProcess: (input) => ipcRenderer.invoke(desktopProcessChannel.restart, input),
  importProjectFromDirectory: () => ipcRenderer.invoke(desktopProcessChannel.importProject),
  loadProjects: (fallback) => ipcRenderer.invoke(desktopProcessChannel.loadProjects, fallback),
  saveProjects: (projects) => ipcRenderer.invoke(desktopProcessChannel.saveProjects, projects),
  copyText: (text) => ipcRenderer.invoke(desktopProcessChannel.copyText, text),
  minimizeWindow: () => {
    ipcRenderer.send(desktopProcessChannel.minimizeWindow)
  },
  toggleMaximizeWindow: () => {
    ipcRenderer.send(desktopProcessChannel.toggleMaximizeWindow)
  },
  getWindowState: () => ipcRenderer.invoke(desktopProcessChannel.getWindowState),
  closeWindow: () => {
    ipcRenderer.send(desktopProcessChannel.closeWindow)
  },
  onWindowState: (listener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: DesktopWindowState,
    ) => {
      listener(payload)
    }

    ipcRenderer.on(desktopWindowStateEventChannel, handler)
    return () => {
      ipcRenderer.removeListener(desktopWindowStateEventChannel, handler)
    }
  },
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
