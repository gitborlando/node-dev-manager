import type {
  ProcessEvent,
  ProcessLogEntry,
  ProcessSnapshot,
  ProcessStartInput,
  ProjectConfig,
  ProjectImportResult,
} from './process-contract'
import { processEventName } from './process-contract'

export const desktopProcessChannel = {
  list: 'process:list',
  logs: 'process:logs',
  start: 'process:start',
  stop: 'process:stop',
  restart: 'process:restart',
  importProject: 'project:import',
  loadProjects: 'project:load',
  saveProjects: 'project:save',
  copyText: 'clipboard:copy-text',
  minimizeWindow: 'window:minimize',
  toggleMaximizeWindow: 'window:toggle-maximize',
  windowState: 'window:state',
  getWindowState: 'window:get-state',
  closeWindow: 'window:close',
} as const

export const desktopProcessEventChannel = processEventName
export const desktopWindowStateEventChannel = desktopProcessChannel.windowState

export type DesktopWindowState = {
  maximized: boolean
}

export type DesktopProcessApi = {
  listProcesses: () => Promise<ProcessSnapshot[]>
  getLogs: () => Promise<Record<string, ProcessLogEntry[]>>
  startProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  stopProcess: (processId: string) => Promise<ProcessSnapshot>
  restartProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  importProjectFromDirectory: () => Promise<ProjectImportResult | null>
  loadProjects: (fallback: ProjectConfig[]) => Promise<ProjectConfig[]>
  saveProjects: (projects: ProjectConfig[]) => Promise<void>
  copyText: (text: string) => Promise<void>
  minimizeWindow: () => void
  toggleMaximizeWindow: () => void
  getWindowState: () => Promise<DesktopWindowState>
  closeWindow: () => void
  onWindowState: (listener: (state: DesktopWindowState) => void) => () => void
  onProcessEvent: (listener: (event: ProcessEvent) => void) => () => void
}
