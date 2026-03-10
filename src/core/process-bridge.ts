import type {
  ProcessEvent,
  ProcessSnapshot,
  ProcessStartInput,
} from '../shared'
import { browserProcessBridge } from './browser-process-bridge'
import { createElectronProcessBridge } from './electron-process-bridge'

export type ProcessBridgeMode = 'desktop' | 'browser-demo'

export interface ProcessBridge {
  readonly mode: ProcessBridgeMode
  listProcesses: () => Promise<ProcessSnapshot[]>
  startProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  stopProcess: (processId: string) => Promise<ProcessSnapshot>
  restartProcess: (input: ProcessStartInput) => Promise<ProcessSnapshot>
  subscribe: (listener: (event: ProcessEvent) => void) => Promise<() => void>
}

export const createProcessBridge = (): ProcessBridge =>
  isDesktopRuntime() ? createElectronProcessBridge() : browserProcessBridge

const isDesktopRuntime = () =>
  typeof window !== 'undefined' && typeof window.nodeDevMgrDesktop !== 'undefined'
