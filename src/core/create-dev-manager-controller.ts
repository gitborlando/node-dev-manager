import {
  createEmptyProjectForm,
  createStoppedSnapshot,
  type ProcessEvent,
  type ProcessLogEntry,
  type ProcessSnapshot,
  type ProcessStartInput,
  type ProjectCommandOption,
  type ProjectConfig,
  type ProjectForm,
} from '../shared'
import { getDesktopApi } from './electron-process-bridge'
import { createProcessBridge } from './process-bridge'
import { projectStorage } from './project-storage'

const maxLogEntries = 400

export type DevManagerState = {
  ready: boolean
  mode: 'desktop' | 'browser-demo'
  keyword: string
  projectDialogOpen: boolean
  form: ProjectForm
  commandOptions: ProjectCommandOption[]
  activeProjectId: string
  projects: ProjectConfig[]
  runtimeById: Record<string, ProcessSnapshot>
  logsById: Record<string, ProcessLogEntry[]>
}

type Listener = () => void

export class DevManagerController {
  private state: DevManagerState
  private readonly listeners = new Set<Listener>()
  private readonly bridge = createProcessBridge()
  private unsubscribe: null | (() => void) = null
  private lifecycleVersion = 0
  private readonly pendingActions = new Set<string>()

  constructor() {
    this.state = {
      ready: false,
      mode: this.bridge.mode,
      keyword: '',
      projectDialogOpen: false,
      form: createEmptyProjectForm(),
      commandOptions: [],
      activeProjectId: '',
      projects: [],
      runtimeById: {},
      logsById: {},
    }
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState = () => this.state

  initialize = async () => {
    const version = ++this.lifecycleVersion
    const projects = this.state.ready ? this.state.projects : projectStorage.load()
    this.replaceState({
      ...this.state,
      projects,
      activeProjectId: this.state.activeProjectId || projects[0]?.id || '',
    })

    const unsubscribe = await this.bridge.subscribe(this.handleEvent)
    if (version !== this.lifecycleVersion) {
      unsubscribe()
      return
    }
    this.unsubscribe = unsubscribe

    try {
      if (this.state.mode === 'desktop') {
        const savedProjects = await getDesktopApi().loadProjects(projects)
        if (version !== this.lifecycleVersion) return
        projectStorage.save(savedProjects)
        this.patchState({
          projects: savedProjects,
          activeProjectId: savedProjects.some(project => project.id === this.state.activeProjectId)
            ? this.state.activeProjectId : savedProjects[0]?.id ?? '',
        })
        const logsById = await getDesktopApi().getLogs()
        if (version !== this.lifecycleVersion) return
        this.patchState({ logsById })
      }
      const snapshots = await this.bridge.listProcesses()
      if (version !== this.lifecycleVersion) return
      this.mergeSnapshots(snapshots)
    } catch (error) {
      if (version !== this.lifecycleVersion) return
      this.pushSystemLog(
        this.state.activeProjectId,
        `初始化运行态失败：${toErrorMessage(error)}`,
      )
    } finally {
      if (version === this.lifecycleVersion) this.patchState({ ready: true })
    }
  }

  dispose = () => {
    this.lifecycleVersion++
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  setKeyword = (keyword: string) => {
    this.patchState({
      keyword,
    })
  }

  selectProject = (projectId: string) => {
    this.patchState({
      activeProjectId: projectId,
    })
  }

  reorderProjects = (sourceId: string, targetId: string, after: boolean) => {
    if (sourceId === targetId) return
    const source = this.findProject(sourceId)
    if (!source || !this.findProject(targetId)) return
    const projects = this.state.projects.filter(project => project.id !== sourceId)
    const targetIndex = projects.findIndex(project => project.id === targetId)
    projects.splice(targetIndex + (after ? 1 : 0), 0, source)
    this.saveProjects(projects)
    this.patchState({ projects })
  }

  openCreateDialog = () => {
    this.patchState({
      projectDialogOpen: true,
      form: createEmptyProjectForm(),
      commandOptions: [],
    })
  }

  openEditDialog = (projectId: string) => {
    const project = this.findProject(projectId)
    if (!project) {
      return
    }

    this.patchState({
      projectDialogOpen: true,
      form: {
        id: project.id,
        name: project.name,
        cwd: project.cwd,
        command: project.command,
        note: project.note,
      },
      commandOptions: project.command
        ? [{ label: project.command, value: project.command }]
        : [],
    })
  }

  closeProjectDialog = () => {
    this.patchState({
      projectDialogOpen: false,
      form: createEmptyProjectForm(),
      commandOptions: [],
    })
  }

  importProjectDirectory = async () => {
    if (this.state.mode !== 'desktop') {
      return
    }

    const existingId = this.state.form.id
    const existingNote = this.state.form.note

    try {
      const imported = await getDesktopApi().importProjectFromDirectory()
      if (!imported) {
        return
      }

      this.patchState({
        projectDialogOpen: true,
        form: {
          id: existingId,
          name: imported.name,
          cwd: imported.cwd,
          command: imported.commandOptions[0]?.value ?? '',
          note: existingNote,
        },
        commandOptions: imported.commandOptions,
      })
    } catch (error) {
      this.pushSystemLog(
        this.state.activeProjectId,
        `读取项目目录失败：${toErrorMessage(error)}`,
      )
    }
  }

  updateForm = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => {
    this.patchState({
      form: {
        ...this.state.form,
        [key]: value,
      },
    })
  }

  submitForm = () => {
    const normalized = normalizeForm(this.state.form)
    if (!normalized.name || !normalized.cwd || !normalized.command) {
      return
    }

    const now = new Date().toISOString()
    const isEditing = Boolean(normalized.id)
    const current = isEditing ? this.findProject(normalized.id) : null
    const nextProject: ProjectConfig = {
      ...normalized,
      id: normalized.id || createId(),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    }

    const projects = current
      ? this.state.projects.map((project) =>
          project.id === current.id ? nextProject : project,
        )
      : [nextProject, ...this.state.projects]

    this.saveProjects(projects)

    this.patchState({
      projects,
      activeProjectId: nextProject.id,
      projectDialogOpen: false,
      form: createEmptyProjectForm(),
      commandOptions: [],
    })

    this.pushSystemLog(nextProject.id, current ? '项目配置已更新' : '项目已保存')
  }

  private clearProjectLogs = (projectId: string) => {
    this.patchState({
      logsById: {
        ...this.state.logsById,
        [projectId]: [],
      },
    })
  }

  deleteProject = async (projectId: string) => {
    const runtime = this.state.runtimeById[projectId]
    if (runtime && isActiveStatus(runtime.status)) {
      await this.stopProject(projectId)
    }

    const projects = this.state.projects.filter((project) => project.id !== projectId)
    const runtimeById = { ...this.state.runtimeById }
    const logsById = { ...this.state.logsById }
    delete runtimeById[projectId]
    delete logsById[projectId]

    this.saveProjects(projects)

    this.patchState({
      projects,
      runtimeById,
      logsById,
      activeProjectId:
        this.state.activeProjectId === projectId
          ? projects[0]?.id ?? ''
          : this.state.activeProjectId,
    })
  }

  seedDemo = () => {
    const now = new Date().toISOString()
    const projects: ProjectConfig[] = [
      {
        id: createId(),
        name: 'web-admin',
        cwd: 'D:/workspace/web-admin',
        command: 'pnpm dev',
        note: 'Vite 管理后台',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        name: 'api-server',
        cwd: 'D:/workspace/api-server',
        command: 'pnpm start:dev',
        note: 'NestJS API',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        name: 'queue-worker',
        cwd: 'D:/workspace/queue-worker',
        command: 'pnpm worker:dev',
        note: '异步消费 worker',
        createdAt: now,
        updatedAt: now,
      },
    ]

    const runtimeById: Record<string, ProcessSnapshot> = {
      [projects[0].id]: {
        id: projects[0].id,
        status: 'running',
        pid: 5173,
        startedAt: now,
        updatedAt: now,
        exitCode: null,
        lastError: null,
      },
      [projects[1].id]: createStoppedSnapshot(projects[1].id),
      [projects[2].id]: {
        id: projects[2].id,
        status: 'error',
        pid: null,
        startedAt: now,
        updatedAt: now,
        exitCode: 1,
        lastError: 'Redis connection refused',
      },
    }

    const logsById: Record<string, ProcessLogEntry[]> = {
      [projects[0].id]: [
        createLog(projects[0].id, 'system', '启动命令：pnpm dev', now),
        createLog(projects[0].id, 'stdout', 'VITE v5 ready in 428 ms', now),
        createLog(projects[0].id, 'stdout', 'Local: http://localhost:5173/', now),
      ],
      [projects[1].id]: [createLog(projects[1].id, 'system', '等待启动', now)],
      [projects[2].id]: [
        createLog(projects[2].id, 'system', '启动命令：pnpm worker:dev', now),
        createLog(projects[2].id, 'stderr', 'Redis connection refused', now),
      ],
    }

    this.saveProjects(projects)
    this.replaceState({
      ...this.state,
      projects,
      runtimeById,
      logsById,
      activeProjectId: projects[0]?.id ?? '',
    })
  }

  startProject = async (projectId: string) => {
    const project = this.findProject(projectId)
    if (!project || this.pendingActions.has(projectId) || isActiveStatus(this.getSnapshot(projectId).status)) {
      return
    }

    this.pendingActions.add(projectId)
    this.selectProject(projectId)
    this.upsertSnapshot({
      ...this.getSnapshot(projectId),
      status: 'starting',
      updatedAt: new Date().toISOString(),
      lastError: null,
    })

    try {
      const snapshot = await this.bridge.startProcess(toStartInput(project))
      this.upsertSnapshot(snapshot)
    } catch (error) {
      this.failProcess(projectId, `启动失败：${toErrorMessage(error)}`)
    } finally {
      this.pendingActions.delete(projectId)
    }
  }

  stopProject = async (projectId: string) => {
    const snapshot = this.getSnapshot(projectId)
    if (!snapshot || !isActiveStatus(snapshot.status)) {
      return
    }

    this.upsertSnapshot({
      ...snapshot,
      status: 'stopping',
      updatedAt: new Date().toISOString(),
    })

    try {
      const next = await this.bridge.stopProcess(projectId)
      this.upsertSnapshot(next)
    } catch (error) {
      this.failProcess(projectId, `停止失败：${toErrorMessage(error)}`)
    }
  }

  restartProject = async (projectId: string) => {
    const project = this.findProject(projectId)
    const status = this.getSnapshot(projectId).status
    if (!project || this.pendingActions.has(projectId) || status === 'starting' || status === 'stopping') {
      return
    }

    this.pendingActions.add(projectId)
    this.selectProject(projectId)
    this.upsertSnapshot({
      ...this.getSnapshot(projectId),
      status: 'starting',
      updatedAt: new Date().toISOString(),
      lastError: null,
    })

    try {
      const snapshot = await this.bridge.restartProcess(toStartInput(project))
      this.upsertSnapshot(snapshot)
    } catch (error) {
      this.failProcess(projectId, `重启失败：${toErrorMessage(error)}`)
    } finally {
      this.pendingActions.delete(projectId)
    }
  }

  private findProject = (projectId: string) =>
    this.state.projects.find((project) => project.id === projectId) ?? null

  private handleEvent = (event: ProcessEvent) => {
    if (event.type === 'reset') {
      this.clearProjectLogs(event.processId)
      return
    }
    if (event.type === 'status') {
      this.upsertSnapshot(this.pendingActions.has(event.processId) && event.snapshot.status === 'stopped'
        ? { ...event.snapshot, status: 'starting' } : event.snapshot)
      return
    }

    this.appendLog({
      processId: event.processId,
      level: event.level,
      message: event.message,
      time: event.time,
    })
  }

  private saveProjects = (projects: ProjectConfig[]) => {
    projectStorage.save(projects)
    if (this.state.mode === 'desktop') {
      void getDesktopApi().saveProjects(projects).catch(error => {
        this.pushSystemLog(this.state.activeProjectId, `保存服务配置失败：${toErrorMessage(error)}`)
      })
    }
  }

  private mergeSnapshots = (snapshots: ProcessSnapshot[]) => {
    const runtimeById = { ...this.state.runtimeById }
    for (const snapshot of snapshots) {
      runtimeById[snapshot.id] = snapshot
    }
    this.patchState({
      runtimeById,
    })
  }

  private getSnapshot = (projectId: string) =>
    this.state.runtimeById[projectId] ?? createStoppedSnapshot(projectId)

  private upsertSnapshot = (snapshot: ProcessSnapshot) => {
    this.patchState({
      runtimeById: {
        ...this.state.runtimeById,
        [snapshot.id]: snapshot,
      },
    })
  }

  private failProcess = (projectId: string, message: string) => {
    const current = this.getSnapshot(projectId)
    this.upsertSnapshot({
      ...current,
      status: 'error',
      updatedAt: new Date().toISOString(),
      lastError: message,
    })
    this.pushSystemLog(projectId, message)
  }

  private pushSystemLog = (projectId: string, message: string) => {
    if (!projectId) {
      return
    }
    this.appendLog(createLog(projectId, 'system', message))
  }

  private appendLog = (entry: ProcessLogEntry) => {
    const current = this.state.logsById[entry.processId] ?? []
    const nextLogs = [...current, entry].slice(-maxLogEntries)
    this.patchState({
      logsById: {
        ...this.state.logsById,
        [entry.processId]: nextLogs,
      },
    })
  }

  private patchState = (patch: Partial<DevManagerState>) => {
    this.replaceState({
      ...this.state,
      ...patch,
    })
  }

  private replaceState = (state: DevManagerState) => {
    this.state = state
    this.emit()
  }

  private emit = () => {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

const normalizeForm = (form: ProjectForm): ProjectForm => ({
  id: form.id.trim(),
  name: form.name.trim(),
  cwd: form.cwd.trim(),
  command: form.command.trim(),
  note: form.note.trim(),
})

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const toStartInput = (project: ProjectConfig): ProcessStartInput => ({
  id: project.id,
  cwd: project.cwd,
  command: project.command,
})

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'UNKNOWN_ERROR'

const isActiveStatus = (status: ProcessSnapshot['status']) =>
  status === 'starting' || status === 'running' || status === 'stopping'

const createLog = (
  processId: string,
  level: ProcessLogEntry['level'],
  message: string,
  time = new Date().toISOString(),
): ProcessLogEntry => ({
  processId,
  level,
  message,
  time,
})
