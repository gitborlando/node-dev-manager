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
import type { ProjectCommandOption, ProjectImportResult } from '@node-dev-mgr/shared'
import { ProcessHost } from './process-host'
import {
  desktopProcessChannel,
  desktopProcessEventChannel,
} from './ipc-channel'

const rendererDevUrl = 'http://127.0.0.1:1420'
const preloadPath = path.join(__dirname, 'preload.cjs')
const rendererIndexPath = path.join(__dirname, '..', 'dist', 'index.html')
const trayIconPath = path.join(__dirname, '..', 'src-tauri', 'icons', 'icon.ico')

let mainWindow: BrowserWindow | null = null
let appTray: Tray | null = null
let isQuitting = false

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

app.on('before-quit', () => {
  isQuitting = true
  void processHost.dispose()
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
          isQuitting = true
          app.quit()
        },
      },
    ]),
  )
  appTray.on('double-click', () => {
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
