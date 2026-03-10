import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  dialog,
  ipcMain,
  nativeImage,
} from 'electron'
import type { ProjectCommandOption, ProjectImportResult } from '../src/shared'
import { ProcessHost } from './process-host'
import { desktopProcessChannel, desktopProcessEventChannel } from './ipc-channel'

const rendererDevUrl = 'http://127.0.0.1:1420'
const preloadPath = path.join(__dirname, 'preload.cjs')
const rendererIndexPath = path.join(__dirname, '..', 'dist', 'index.html')
const trayIconPath = path.join(__dirname, '..', 'assets', 'icon.ico')

let mainWindow: BrowserWindow | null = null
let appTray: Tray | null = null
let isQuitting = false
let quitTask: Promise<void> | null = null
let quitReady = false

const processHost = new ProcessHost((event) => {
  mainWindow?.webContents.send(desktopProcessEventChannel, event)
})

const emitWindowState = (window: BrowserWindow | null) => {
  if (!window) {
    return
  }

  window.webContents.send(desktopProcessChannel.windowState, {
    maximized: window.isMaximized(),
  })
}

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 560,
    minWidth: 820,
    minHeight: 560,
    backgroundColor: '#e2e8f0',
    autoHideMenuBar: true,
    frame: false,
    resizable: true,
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

  mainWindow.on('close', (event) => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('maximize', () => {
    emitWindowState(mainWindow)
  })
  mainWindow.on('unmaximize', () => {
    emitWindowState(mainWindow)
  })
  mainWindow.on('enter-full-screen', () => {
    emitWindowState(mainWindow)
  })
  mainWindow.on('leave-full-screen', () => {
    emitWindowState(mainWindow)
  })
  mainWindow.webContents.once('did-finish-load', () => {
    emitWindowState(mainWindow)
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
  ipcMain.handle(desktopProcessChannel.importProject, () => importProjectFromDirectory())
  ipcMain.handle(desktopProcessChannel.getWindowState, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
    return {
      maximized: window?.isMaximized() ?? false,
    }
  })
  ipcMain.on(desktopProcessChannel.minimizeWindow, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
    window?.minimize()
  })
  ipcMain.on(desktopProcessChannel.toggleMaximizeWindow, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
    if (!window) {
      return
    }

    if (window.isMaximized()) {
      window.unmaximize()
      return
    }

    window.maximize()
  })
  ipcMain.on(desktopProcessChannel.closeWindow, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
    window?.close()
  })
}

app.whenReady().then(async () => {
  createTray()
  registerIpcHandlers()
  await createMainWindow()

  app.on('activate', () => {
    if (mainWindow === null || BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow()
      return
    }

    showMainWindow()
  })
})

app.on('before-quit', (event) => {
  isQuitting = true

  if (quitReady) {
    return
  }

  event.preventDefault()
  void requestAppQuit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    return
  }
})

const createTray = () => {
  const icon = nativeImage.createFromPath(trayIconPath)
  appTray = new Tray(icon)
  appTray.setToolTip('Node Dev Manager')
  appTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          showMainWindow()
        },
      },
      {
        label: '退出',
        click: () => {
          void requestAppQuit()
        },
      },
    ]),
  )
  appTray.on('click', () => {
    showMainWindow()
  })
}

const showMainWindow = () => {
  if (!mainWindow) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.show()
  mainWindow.focus()
}

const requestAppQuit = async () => {
  if (quitTask) {
    return quitTask
  }

  isQuitting = true
  quitTask = (async () => {
    appTray?.destroy()
    appTray = null
    await processHost.dispose()
    quitReady = true
    app.quit()
  })()

  return quitTask
}

const importProjectFromDirectory = async (): Promise<ProjectImportResult | null> => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined
  const result = await dialog.showOpenDialog(window, {
    title: '选择项目目录',
    properties: ['openDirectory'],
  })

  const targetPath = result.filePaths[0]
  if (result.canceled || !targetPath) {
    return null
  }

  const packageJsonPath = path.join(targetPath, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)
  const commandOptions = getCommandOptions(packageJson?.scripts, targetPath)

  return {
    cwd: targetPath,
    name: resolveProjectName(targetPath, packageJson?.name),
    commandOptions,
  }
}

const readPackageJson = async (packageJsonPath: string) => {
  try {
    const raw = await fs.readFile(packageJsonPath, 'utf8')
    const parsed = JSON.parse(raw) as {
      name?: unknown
      scripts?: unknown
    }

    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      scripts:
        parsed.scripts && typeof parsed.scripts === 'object'
          ? (parsed.scripts as Record<string, unknown>)
          : {},
    }
  } catch {
    return null
  }
}

const resolveProjectName = (cwd: string, packageName?: string) => {
  if (packageName) {
    return packageName
  }

  return path.basename(cwd)
}

const getCommandOptions = (
  scripts: Record<string, unknown> | undefined,
  cwd: string,
): ProjectCommandOption[] => {
  if (!scripts) {
    return []
  }

  const packageManager = detectPackageManager(cwd)
  return Object.entries(scripts)
    .filter(([, command]) => typeof command === 'string' && command.trim())
    .sort(([left], [right]) => compareScriptName(left, right))
    .map(([name]) => ({
      label: `${name} (${packageManager} run ${name})`,
      value: `${packageManager} run ${name}`,
    }))
}

const detectPackageManager = (cwd: string) => {
  const lockfileMap = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['bun.lockb', 'bun'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
  ] as const

  for (const [filename, packageManager] of lockfileMap) {
    if (fsSync.existsSync(path.join(cwd, filename))) {
      return packageManager
    }
  }

  return 'npm'
}

const compareScriptName = (left: string, right: string) => {
  const rank = (value: string) => {
    if (value === 'dev') {
      return 0
    }
    if (value === 'start') {
      return 1
    }
    if (value.includes('dev')) {
      return 2
    }
    return 3
  }

  return rank(left) - rank(right) || left.localeCompare(right)
}
