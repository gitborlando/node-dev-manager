import {
  createEmptyProjectForm,
  type ProjectConfig,
  type ProjectForm,
} from '../shared'

const storageKey = 'node-dev-mgr/project-configs/v1'

export const projectStorage = {
  load: (): ProjectConfig[] => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        return []
      }
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.flatMap(normalizeProjectConfig)
    } catch {
      return []
    }
  },

  save: (projects: ProjectConfig[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(projects))
  },

  createDraft: (): ProjectForm => createEmptyProjectForm(),
}

const normalizeProjectConfig = (value: unknown): ProjectConfig[] => {
  if (!value || typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const id = toStringValue(record.id)
  const name = toStringValue(record.name)
  const cwd = toStringValue(record.cwd)
  const command = toStringValue(record.command)
  if (!id || !name || !cwd || !command) {
    return []
  }

  return [
    {
      id,
      name,
      cwd,
      command,
      note: toStringValue(record.note),
      createdAt: toIsoString(record.createdAt),
      updatedAt: toIsoString(record.updatedAt),
    },
  ]
}

const toStringValue = (value: unknown) => (typeof value === 'string' ? value : '')

const toIsoString = (value: unknown) => {
  if (typeof value === 'string' && value) {
    return value
  }

  return new Date().toISOString()
}
