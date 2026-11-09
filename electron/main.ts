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
  clipboard,
} from 'electron'
import type { ProjectCommandOption, ProjectConfig, ProjectImportResult } from '../src/shared'
import { ProcessHost } from './process-host'
import { ProjectRegistry } from './project-registry'
import { desktopProcessChannel, desktopProcessEventChannel } from './ipc-channel'

const rendererDevUrl = 'http://127.0.0.1:1420'
const preloadPath = path.join(__dirname, 'preload.cjs')
const rendererIndexPath = path.join(__dirname, '..', 'dist', 'index.html')
const appIconPath = path.join(__dirname, '..', 'assets', 'icon.png')
const desktopAppId = 'com.node-dev-mgr.desktop'

let mainWindow: BrowserWindow | null = null
let appTray: Tray | null = null
let isQuitting = false
let quitTask: Promise<void> | null = null
let quitReady = false
let projectRegistry: ProjectRegistry
let registeredProjects: ProjectConfig[] | null = null
let registryLoadError: unknown = null
let servicesStarted = false

const processHost = new ProcessHost((event) => {
  mainWindow?.webContents.send(desktopProcessEventChannel, event)
})

if (process.platform === 'win32') {
  app.setAppUserModelId(desktopAppId)
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.exit(0)
}

const ensureOpenAtLogin = () => {
  if (!app.isPackaged || process.platform !== 'win32') {
    return
  }

  app.setLoginItemSettings({
    enabled: true,
    name: desktopAppId,
    openAtLogin: true,
    path: process.execPath,
  })
}

const emitWindowState = (window: BrowserWindow | null) => {
  if (!window) {
    return
  }

  window.webContents.send(desktopProcessChannel.windowState, {
    maximized: window.isMaximized(),
  })
}

const createMainWindow = async () => {
  if (mainWindow) {
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    width: 820,
    height: 560,
    minWidth: 820,
    minHeight: 560,
    backgroundColor: '#e2e8f0',
    autoHideMenuBar: true,
    frame: false,
    icon: appIconPath,
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

  return mainWindow
}

const registerIpcHandlers = () => {
  ipcMain.handle(desktopProcessChannel.list, () => processHost.listProcesses())
  ipcMain.handle(desktopProcessChannel.logs, () => processHost.getLogs())
  ipcMain.handle(desktopProcessChannel.copyText, (_event, text: string) => {
    if (typeof text !== 'string') throw new Error('INVALID_CLIPBOARD_TEXT')
    clipboard.writeText(text)
  })
  ipcMain.handle(desktopProcessChannel.loadProjects, async (_event, fallback: ProjectConfig[]) => {
    if (registryLoadError) throw registryLoadError
    // Migrate the existing renderer-local registrations only on first use.
    if (registeredProjects === null) {
      registeredProjects = await projectRegistry.save(fallback)
    }
    await startRegisteredServices()
    return registeredProjects
  })
  ipcMain.handle(desktopProcessChannel.saveProjects, async (_event, projects: ProjectConfig[]) => {
    if (registryLoadError) throw registryLoadError
    registeredProjects = await projectRegistry.save(projects)
  })
  ipcMain.handle(desktopProcessChannel.start, (_event, input) => {
    if (isQuitting) throw new Error('APP_QUITTING')
    return processHost.startProcess(input)
  })
  ipcMain.handle(desktopProcessChannel.stop, (_event, processId) =>
    processHost.stopProcess(processId),
  )
  ipcMain.handle(desktopProcessChannel.restart, (_event, input) => {
    if (isQuitting) throw new Error('APP_QUITTING')
    return processHost.restartProcess(input)
  })
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

if (hasSingleInstanceLock) {
  app.on('second-instance', () => {
    if (!app.isReady()) {
      return
    }

    if (mainWindow === null) {
      void createMainWindow().then(() => {
        showMainWindow()
      })
      return
    }

    showMainWindow()
  })

  app.whenReady().then(async () => {
    ensureOpenAtLogin()
    projectRegistry = new ProjectRegistry(path.join(app.getPath('userData'), 'project-configs.json'))
    try {
      registeredProjects = await projectRegistry.load()
    } catch (error) {
      registryLoadError = error
      dialog.showErrorBox('服务配置读取失败', `原配置文件已保留，请检查：\n${String(error)}`)
    }
    createTray()
    registerIpcHandlers()
    await startRegisteredServices()
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
}

const createTray = () => {
  const icon = nativeImage.createFromPath(appIconPath)
  appTray = new Tray(icon)
  appTray.setToolTip('Node Dev Manager')
  appTray.on('right-click', () => {
    void createTrayMenu().then(menu => appTray?.popUpContextMenu(menu))
  })
  appTray.on('click', () => {
    showMainWindow()
  })
}

const createTrayMenu = async () => {
  const snapshots = await processHost.listProcesses()
  const runtimeById = new Map(snapshots.map(snapshot => [snapshot.id, snapshot]))
  const serviceItems = (registeredProjects ?? []).map(project => {
    const snapshot = runtimeById.get(project.id)
    const isRunning = snapshot?.status === 'running'
    const isBusy = processHost.isBusy(project.id) ||
      snapshot?.status === 'starting' || snapshot?.status === 'stopping'
    return {
      label: `${isBusy ? '处理中' : isRunning ? '刷新' : '启动'}：${project.name}`,
      enabled: !isBusy,
      click: () => { void runProjectAction(project) },
    }
  })
  return Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          showMainWindow()
        },
      },
      { type: 'separator' },
      ...(serviceItems.length ? serviceItems : [{ label: '暂无登记服务', enabled: false }]),
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          void requestAppQuit()
        },
      },
    ])
}

const runProjectAction = async (project: ProjectConfig) => {
  if (isQuitting || processHost.isBusy(project.id)) return
  try {
    const snapshots = await processHost.listProcesses()
    if (isQuitting || processHost.isBusy(project.id)) return
    const snapshot = snapshots.find(item => item.id === project.id)
    if (snapshot?.status === 'running') {
      await processHost.restartProcess(project)
    } else {
      await processHost.startProcess(project)
    }
  } catch (error) {
    void dialog.showMessageBox({
      type: 'error',
      title: '服务操作失败',
      message: project.name,
      detail: String(error),
    }).catch(error => console.error('显示服务错误失败', error))
  }
}

const startRegisteredServices = async () => {
  if (servicesStarted || registeredProjects === null || registryLoadError || isQuitting) return
  servicesStarted = true
  // One failed service must not prevent the others from starting.
  await Promise.allSettled(registeredProjects.map(project => runProjectAction(project)))
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
    await processHost.dispose()
    appTray?.destroy()
    appTray = null
    quitReady = true
    app.quit()
  })().catch(error => {
    isQuitting = false
    quitTask = null
    void dialog.showMessageBox({
      type: 'error',
      title: '未能关闭全部服务',
      message: '部分服务尚未退出，应用已保留运行，请重试退出。',
      detail: String(error),
    }).catch(error => console.error('显示退出错误失败', error))
  })

  return quitTask
}

const importProjectFromDirectory = async (): Promise<ProjectImportResult | null> => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow ?? undefined
  const options = {
    title: '选择项目目录',
    properties: ['openDirectory'],
  } satisfies Electron.OpenDialogOptions
  const result = await (window
    ? dialog.showOpenDialog(window, options)
    : dialog.showOpenDialog(options))

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
