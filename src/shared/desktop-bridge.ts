import type {
  ProcessEvent,
  ProcessSnapshot,
  ProcessStartInput,
  ProjectImportResult,
} from './process-contract'
import { processEventName } from './process-contract'

export const desktopProcessChannel = {
  list: 'process:list',
  start: 'process:start',
  stop: 'process:stop',
  restart: 'process:restart',
  importProject: 'project:import',
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
  startProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  stopProcess: (processId: string) => Promise<ProcessSnapshot>
  restartProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  importProjectFromDirectory: () => Promise<ProjectImportResult | null>
  minimizeWindow: () => void
  toggleMaximizeWindow: () => void
  getWindowState: () => Promise<DesktopWindowState>
  closeWindow: () => void
  onWindowState: (listener: (state: DesktopWindowState) => void) => () => void
  onProcessEvent: (listener: (event: ProcessEvent) => void) => () => void
}
