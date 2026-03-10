import path from 'node:path'
import { app, BrowserWindow, ipcMain } from 'electron'
import {
  desktopProcessChannel,
  desktopProcessEventChannel,
} from '@node-dev-mgr/shared'
import { ProcessHost } from './process-host'

const rendererDevUrl = 'http://127.0.0.1:1420'
const preloadPath = path.join(__dirname, 'preload.cjs')
const rendererIndexPath = path.join(__dirname, '..', 'dist', 'index.html')

let mainWindow: BrowserWindow | null = null

const processHost = new ProcessHost((event) => {
  mainWindow?.webContents.send(desktopProcessEventChannel, event)
})

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#e2e8f0',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
    },
  })

  if (app.isPackaged) {
    await mainWindow.loadFile(rendererIndexPath)
  } else {
    await mainWindow.loadURL(process.env.NODE_DEV_MGR_RENDERER_URL ?? rendererDevUrl)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const registerIpcHandlers = () => {
  ipcMain.handle(desktopProcessChannel.list, () => processHost.listProcesses())
  ipcMain.handle(desktopProcessChannel.start, (_event, input) =>
    processHost.startProcess(input),
  )
  ipcMain.handle(desktopProcessChannel.stop, (_event, processId) =>
    processHost.stopProcess(processId),
  )
  ipcMain.handle(desktopProcessChannel.restart, (_event, input) =>
    processHost.restartProcess(input),
  )
}

app.whenReady().then(async () => {
  registerIpcHandlers()
  await createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow()
    }
  })
})

app.on('before-quit', () => {
  void processHost.dispose()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
