import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { createInterface } from 'node:readline'
import { setTimeout as delay } from 'node:timers/promises'
import type { Readable } from 'node:stream'
import type {
  ProcessEvent,
  ProcessLogLevel,
  ProcessSnapshot,
  ProcessStartInput,
  ProcessStatus,
} from '../src/shared'

type ManagedChild = ChildProcessByStdio<null, Readable, Readable>

type ManagedProcess = {
  child: ManagedChild | null
  snapshot: ProcessSnapshot
  stopRequested: boolean
  waitForExit: Promise<void>
  resolveExit: () => void
}

export class ProcessHost {
  private readonly processes = new Map<string, ManagedProcess>()

  constructor(
    private readonly emitEvent: (event: ProcessEvent) => void,
  ) {}

  listProcesses = async () =>
    Array.from(this.processes.values(), ({ snapshot }) => cloneSnapshot(snapshot))

  startProcess = async (input: ProcessStartInput) => {
    const existing = this.processes.get(input.id)
    if (existing && isActiveStatus(existing.snapshot.status)) {
      throw new Error('PROCESS_ALREADY_RUNNING')
    }

    const child = createManagedChild(input)
    if (!child.pid) {
      throw new Error('PROCESS_PID_MISSING')
    }

    const now = isoNow()
    const snapshot: ProcessSnapshot = {
      id: input.id,
      status: 'running',
      pid: child.pid,
      startedAt: now,
      updatedAt: now,
      exitCode: null,
      lastError: null,
    }

    this.processes.set(input.id, {
      child,
      snapshot,
      stopRequested: false,
      ...createDeferred(),
    })

    this.emitEvent({
      type: 'status',
      processId: input.id,
      snapshot: cloneSnapshot(snapshot),
      time: now,
    })
    this.emitEvent({
      type: 'log',
      processId: input.id,
      level: 'system',
      message: `启动命令：${input.command}`,
      time: now,
    })

    this.bindLogStream(input.id, child.stdout, 'stdout')
    this.bindLogStream(input.id, child.stderr, 'stderr')
    this.bindWaiter(input.id, child)

    return cloneSnapshot(snapshot)
  }

  stopProcess = async (processId: string) => {
    const record = this.processes.get(processId)
    if (!record) {
      throw new Error('PROCESS_NOT_FOUND')
    }

    if (!isActiveStatus(record.snapshot.status)) {
      return cloneSnapshot(record.snapshot)
    }

    if (!record.snapshot.pid) {
      throw new Error('PROCESS_PID_MISSING')
    }

    record.stopRequested = true
    record.snapshot = {
      ...record.snapshot,
      status: 'stopping',
      updatedAt: isoNow(),
    }

    this.emitEvent({
      type: 'status',
      processId,
      snapshot: cloneSnapshot(record.snapshot),
      time: record.snapshot.updatedAt,
    })
    this.emitEvent({
      type: 'log',
      processId,
      level: 'system',
      message: '收到停止指令',
      time: isoNow(),
    })

    const stopped = await killProcessTree(record.snapshot.pid)
    if (!stopped) {
      record.snapshot = {
        ...record.snapshot,
        status: 'error',
        updatedAt: isoNow(),
        lastError: 'PROCESS_STOP_FAILED',
      }

      this.emitEvent({
        type: 'status',
        processId,
        snapshot: cloneSnapshot(record.snapshot),
        time: record.snapshot.updatedAt,
      })
      throw new Error('PROCESS_STOP_FAILED')
    }

    await waitForExit(record.waitForExit)
    return cloneSnapshot(this.processes.get(processId)?.snapshot ?? record.snapshot)
  }

  restartProcess = async (input: ProcessStartInput) => {
    const existing = this.processes.get(input.id)
    if (existing && isActiveStatus(existing.snapshot.status)) {
      await this.stopProcess(input.id)
      await delay(350)
    }

    return this.startProcess(input)
  }

  dispose = async () => {
    const activeIds = Array.from(this.processes.entries())
      .filter(([, record]) => isActiveStatus(record.snapshot.status))
      .map(([processId]) => processId)

    for (const processId of activeIds) {
      try {
        await this.stopProcess(processId)
      } catch {
        continue
      }
    }
  }

  private bindLogStream = (
    processId: string,
    stream: Readable,
    level: ProcessLogLevel,
  ) => {
    const reader = createInterface({
      input: stream,
      crlfDelay: Infinity,
    })

    reader.on('line', (message) => {
      const normalized = message.trimEnd()
      if (!normalized) {
        return
      }

      this.emitEvent({
        type: 'log',
        processId,
        level,
        message: normalized,
        time: isoNow(),
      })
    })

    reader.on('error', (error) => {
      this.emitEvent({
        type: 'log',
        processId,
        level: 'system',
        message: `日志读取失败：${toErrorMessage(error)}`,
        time: isoNow(),
      })
    })
  }

  private bindWaiter = (processId: string, child: ManagedChild) => {
    let settled = false

    const finalize = (
      nextStatus: ProcessStatus,
      exitCode: number | null,
      lastError: string | null,
      logMessage: string,
    ) => {
      if (settled) {
        return
      }
      settled = true

      const record = this.processes.get(processId)
      if (!record) {
        return
      }

      record.child = null
      record.resolveExit()
      record.snapshot = {
        ...record.snapshot,
        status: nextStatus,
        pid: null,
        updatedAt: isoNow(),
        exitCode,
        lastError,
      }

      this.emitEvent({
        type: 'log',
        processId,
        level: 'system',
        message: logMessage,
        time: isoNow(),
      })
      this.emitEvent({
        type: 'status',
        processId,
        snapshot: cloneSnapshot(record.snapshot),
        time: record.snapshot.updatedAt,
      })
    }

    child.once('exit', (code) => {
      const record = this.processes.get(processId)
      const exitCode = code ?? null
      if (record?.stopRequested || code === 0) {
        finalize('stopped', exitCode, null, `进程退出：code=${formatCode(exitCode)}`)
        return
      }

      finalize(
        'error',
        exitCode,
        `进程异常退出，code=${formatCode(exitCode)}`,
        `进程退出：code=${formatCode(exitCode)}`,
      )
    })

    child.once('error', (error) => {
      finalize(
        'error',
        null,
        `等待进程退出失败：${toErrorMessage(error)}`,
        `进程退出异常：${toErrorMessage(error)}`,
      )
    })
  }
}

const createManagedChild = (input: ProcessStartInput) => {
  if (process.platform === 'win32') {
    return spawn('cmd', ['/C', input.command], {
      cwd: input.cwd,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
  }

  return spawn('sh', ['-lc', input.command], {
    cwd: input.cwd,
    detached: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

const killProcessTree = async (pid: number) => {
  if (process.platform === 'win32') {
    return new Promise<boolean>((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })

      killer.once('close', (code) => {
        resolve(code === 0)
      })
      killer.once('error', () => {
        resolve(false)
      })
    })
  }

  try {
    process.kill(-pid, 'SIGTERM')
    return true
  } catch {
    try {
      process.kill(pid, 'SIGTERM')
      return true
    } catch {
      return false
    }
  }
}

const isoNow = () => new Date().toISOString()

const formatCode = (code: number | null) => String(code ?? 'null')

const cloneSnapshot = (snapshot: ProcessSnapshot): ProcessSnapshot => ({
  ...snapshot,
})

const isActiveStatus = (status: ProcessSnapshot['status']) =>
  status === 'starting' || status === 'running' || status === 'stopping'

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

const createDeferred = () => {
  let resolveExit = () => {}

  const waitForExit = new Promise<void>((resolve) => {
    resolveExit = resolve
  })

  return {
    waitForExit,
    resolveExit,
  }
}

const waitForExit = async (promise: Promise<void>) => {
  await Promise.race([promise, delay(3000).then(() => undefined)])
}
