import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import {
  processEventName,
  type ProcessEvent,
  type ProcessSnapshot,
} from '@node-dev-mgr/shared'
import type { ProcessBridge } from './process-bridge'

export const createTauriProcessBridge = (): ProcessBridge => ({
  mode: 'desktop',

  listProcesses: () => invoke<ProcessSnapshot[]>('list_process_snapshots'),

  startProcess: (input) =>
    invoke<ProcessSnapshot>('start_process', {
      input,
    }),

  stopProcess: (processId) =>
    invoke<ProcessSnapshot>('stop_process', {
      processId,
    }),

  restartProcess: (input) =>
    invoke<ProcessSnapshot>('restart_process', {
      input,
    }),

  subscribe: async (listener) => {
    const unlisten = await listen<ProcessEvent>(processEventName, (event) => {
      listener(event.payload)
    })
    return () => {
      unlisten()
    }
  },
})
