export type ProcessStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

export type ProcessLogLevel = 'stdout' | 'stderr' | 'system'

export type ProjectConfig = {
  id: string
  name: string
  cwd: string
  command: string
  note: string
  createdAt: string
  updatedAt: string
}

export type ProjectForm = {
  id: string
  name: string
  cwd: string
  command: string
  note: string
}

export type ProjectCommandOption = {
  label: string
  value: string
}

export type ProjectImportResult = {
  cwd: string
  name: string
  commandOptions: ProjectCommandOption[]
}

export type ProcessStartInput = Pick<ProjectConfig, 'id' | 'cwd' | 'command'>

export type ProcessSnapshot = {
  id: string
  status: ProcessStatus
  pid: number | null
  startedAt: string | null
  updatedAt: string
  exitCode: number | null
  lastError: string | null
}

export type ProcessLogEntry = {
  processId: string
  level: ProcessLogLevel
  message: string
  time: string
}

export type ProcessStatusEvent = {
  type: 'status'
  processId: string
  snapshot: ProcessSnapshot
  time: string
}

export type ProcessLogEvent = {
  type: 'log'
  processId: string
  level: ProcessLogLevel
  message: string
  time: string
}

export type ProcessEvent = ProcessStatusEvent | ProcessLogEvent

export const processEventName = 'process-event'

export const createEmptyProjectForm = (): ProjectForm => ({
  id: '',
  name: '',
  cwd: '',
  command: '',
  note: '',
})

export const createStoppedSnapshot = (id: string): ProcessSnapshot => ({
  id,
  status: 'stopped',
  pid: null,
  startedAt: null,
  updatedAt: new Date().toISOString(),
  exitCode: null,
  lastError: null,
})
