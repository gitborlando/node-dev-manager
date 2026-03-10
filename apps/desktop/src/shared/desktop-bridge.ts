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
} as const

export const desktopProcessEventChannel = processEventName

export type DesktopProcessApi = {
  listProcesses: () => Promise<ProcessSnapshot[]>
  startProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  stopProcess: (processId: string) => Promise<ProcessSnapshot>
  restartProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  importProjectFromDirectory: () => Promise<ProjectImportResult | null>
  onProcessEvent: (listener: (event: ProcessEvent) => void) => () => void
}
