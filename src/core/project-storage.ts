import { createEmptyProjectForm, normalizeProjectConfigs, type ProjectConfig, type ProjectForm } from '../shared'

const storageKey = 'node-dev-mgr/project-configs/v1'

export const projectStorage = {
  load: (): ProjectConfig[] => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? normalizeProjectConfigs(JSON.parse(raw)) : []
    } catch {
      return []
    }
  },

  save: (projects: ProjectConfig[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(projects))
  },

  createDraft: (): ProjectForm => createEmptyProjectForm(),
}
