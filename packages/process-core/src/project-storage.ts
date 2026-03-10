import {
  createEmptyProjectForm,
  type ProjectConfig,
  type ProjectForm,
} from '@node-dev-mgr/shared'

const storageKey = 'node-dev-mgr/project-configs/v1'

export const projectStorage = {
  load: (): ProjectConfig[] => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        return []
      }
      const parsed = JSON.parse(raw) as ProjectConfig[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },

  save: (projects: ProjectConfig[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(projects))
  },

  createDraft: (): ProjectForm => createEmptyProjectForm(),
}
