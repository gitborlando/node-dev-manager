import {
  createStoppedSnapshot,
  type ProcessEvent,
  type ProcessSnapshot,
} from '../shared'
import type { ProcessBridge } from './process-bridge'

type MockRecord = {
  snapshot: ProcessSnapshot
  timer: number | null
}

const listeners = new Set<(event: ProcessEvent) => void>()
const records = new Map<string, MockRecord>()

export const browserProcessBridge: ProcessBridge = {
  mode: 'browser-demo',

  listProcesses: async () =>
    Array.from(records.values(), ({ snapshot }) => ({ ...snapshot })),

  startProcess: async (input) => {
    const existing = records.get(input.id)
    if (existing && isActiveStatus(existing.snapshot.status)) {
      throw new Error('PROCESS_ALREADY_RUNNING')
    }

    const now = new Date().toISOString()
    const next: ProcessSnapshot = {
      id: input.id,
      status: 'running',
      pid: Math.floor(Math.random() * 9000) + 1000,
      startedAt: now,
      updatedAt: now,
      exitCode: null,
      lastError: null,
    }

    clearRecordTimer(existing)
    const timer = window.setInterval(() => {
      emit({
        type: 'log',
        processId: input.id,
        level: 'stdout',
        message: `[mock] ${input.command} 正在输出运行日志`,
        time: new Date().toISOString(),
      })
    }, 2400)

    records.set(input.id, { snapshot: next, timer })
    emit({
      type: 'status',
      processId: input.id,
      snapshot: next,
      time: now,
    })
    emit({
      type: 'log',
      processId: input.id,
      level: 'system',
      message: `启动命令：${input.command}`,
      time: now,
    })
    return { ...next }
  },

  stopProcess: async (processId) => {
    const record = records.get(processId)
    if (!record || !isActiveStatus(record.snapshot.status)) {
      throw new Error('PROCESS_NOT_RUNNING')
    }

    clearRecordTimer(record)
    const next: ProcessSnapshot = {
      ...record.snapshot,
      status: 'stopped',
      pid: null,
      updatedAt: new Date().toISOString(),
      exitCode: 0,
    }

    records.set(processId, { snapshot: next, timer: null })
    emit({
      type: 'log',
      processId,
      level: 'system',
      message: '收到停止指令',
      time: next.updatedAt,
    })
    emit({
      type: 'status',
      processId,
      snapshot: next,
      time: next.updatedAt,
    })
    return { ...next }
  },

  restartProcess: async (input) => {
    const existing = records.get(input.id)
    if (existing && isActiveStatus(existing.snapshot.status)) {
      await browserProcessBridge.stopProcess(input.id)
      await wait(180)
    }
    return browserProcessBridge.startProcess(input)
  },

  subscribe: async (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

const emit = (event: ProcessEvent) => {
  for (const listener of listeners) {
    listener(event)
  }
}

const clearRecordTimer = (record: MockRecord | undefined) => {
  if (!record?.timer) {
    return
  }
  window.clearInterval(record.timer)
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const isActiveStatus = (status: ProcessSnapshot['status']) =>
  status === 'starting' || status === 'running' || status === 'stopping'

records.set('browser-demo-bootstrap', {
  snapshot: createStoppedSnapshot('browser-demo-bootstrap'),
  timer: null,
})
records.delete('browser-demo-bootstrap')
