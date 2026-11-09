import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizeProjectConfigs, type ProjectConfig } from '../src/shared'

export class ProjectRegistry {
  private saveTask = Promise.resolve()

  constructor(private readonly filePath: string) {}

  load = async () => {
    try {
      return validateProjects(JSON.parse(await fs.readFile(this.filePath, 'utf8')))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  save = (input: ProjectConfig[]) => {
    const projects = validateProjects(input)
    const task = this.saveTask.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true })
      const temporaryPath = `${this.filePath}.tmp`
      await fs.writeFile(temporaryPath, JSON.stringify(projects, null, 2), 'utf8')
      await fs.rename(temporaryPath, this.filePath)
    })
    this.saveTask = task.catch(() => {})
    return task.then(() => projects)
  }
}

const validateProjects = (value: unknown) => {
  const projects = normalizeProjectConfigs(value)
  if (!Array.isArray(value) || projects.length !== value.length ||
      new Set(projects.map(project => project.id)).size !== projects.length) {
    throw new Error('INVALID_PROJECT_CONFIGS')
  }
  return projects
}
