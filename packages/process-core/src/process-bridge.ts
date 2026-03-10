import type {
  ProcessEvent,
  ProcessSnapshot,
  ProcessStartInput,
} from '@node-dev-mgr/shared'
import { browserProcessBridge } from './browser-process-bridge'
import { createTauriProcessBridge } from './tauri-process-bridge'

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
  isTauriRuntime() ? createTauriProcessBridge() : browserProcessBridge

const isTauriRuntime = () =>
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
