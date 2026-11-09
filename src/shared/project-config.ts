import type { ProjectConfig } from './process-contract'

export const normalizeProjectConfigs = (value: unknown): ProjectConfig[] =>
  Array.isArray(value) ? value.flatMap(normalizeProjectConfig) : []

const normalizeProjectConfig = (value: unknown): ProjectConfig[] => {
  if (!value || typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  const id = toStringValue(record.id)
  const name = toStringValue(record.name)
  const cwd = toStringValue(record.cwd)
  const command = toStringValue(record.command)
  if (!id || !name || !cwd || !command) return []
  const now = new Date().toISOString()
  return [{
    id, name, cwd, command,
    note: toStringValue(record.note),
    createdAt: toStringValue(record.createdAt) || now,
    updatedAt: toStringValue(record.updatedAt) || now,
  }]
}

const toStringValue = (value: unknown) => typeof value === 'string' ? value : ''
