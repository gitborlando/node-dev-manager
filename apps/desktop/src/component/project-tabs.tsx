import { css, cx } from '@linaria/core'
import { Play, Square, X } from 'lucide-react'
import {
  createStoppedSnapshot,
  type ProcessSnapshot,
  type ProjectConfig,
} from '../shared'

type ProjectTabsProps = {
  activeProjectId: string
  projects: ProjectConfig[]
  runtimeById: Record<string, ProcessSnapshot>
  onSelect: (projectId: string) => void
  onStart: (projectId: string) => void
  onStop: (projectId: string) => void
  onClose: (projectId: string) => void
}

export const ProjectTabs = ({
  activeProjectId,
  projects,
  runtimeById,
  onSelect,
  onStart,
  onStop,
  onClose,
}: ProjectTabsProps) => {
  if (projects.length === 0) {
    return <div className={emptyClass}>还没有项目，先导入一个目录。</div>
  }

  return (
    <div className={scrollerClass}>
      {projects.map((project) => {
        const runtime = runtimeById[project.id] ?? createStoppedSnapshot(project.id)
        const isActive = project.id === activeProjectId
        const isRunning = runtime.status === 'running'
        const isBusy = runtime.status === 'starting' || runtime.status === 'stopping'
        const actionLabel = getActionLabel(runtime.status, isRunning)

        return (
          <div
            key={project.id}
            className={cx(tabClass, isActive ? tabActiveClass : tabIdleClass)}>
            <button
              className={tabButtonClass}
              onClick={() => onSelect(project.id)}
              title={project.cwd}>
              <span
                className={cx(
                  stateMarkClass,
                  toneClassMap[runtime.status],
                )}
              />
              <span className={nameClass}>{project.name}</span>
            </button>

            <button
              className={cx(actionClass, toneClassMap[runtime.status])}
              disabled={isBusy}
              onClick={() => (isRunning ? onStop(project.id) : onStart(project.id))}
              title={actionLabel}>
              {isRunning ? <Square size={11} /> : <Play size={11} />}
              <span>{actionLabel}</span>
            </button>

            <button
              className={actionClass}
              onClick={() => onClose(project.id)}
              title="删除项目">
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

const scrollerClass = css`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 0 8px;
`

const emptyClass = css`
  padding: 8px;
  font-size: 10px;
  color: var(--text-soft);
`

const tabClass = css`
  display: inline-flex;
  min-width: 0;
  max-width: 200px;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0 4px;
`

const tabActiveClass = css`
  border-color: var(--sky-200);
  background: white;
`

const tabIdleClass = css`
  background: rgba(255, 255, 255, 0.72);
`

const tabButtonClass = css`
  display: inline-flex;
  min-width: 0;
  height: 26px;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--text-main);
`

const stateMarkClass = css`
  height: 6px;
  width: 6px;
  border-radius: 999px;
  flex: none;
`

const nameClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 600;
`

const actionClass = css`
  display: inline-flex;
  height: 20px;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  padding: 0 5px;
  font-size: 9px;
  cursor: pointer;

  &:hover:not(:disabled) {
    filter: brightness(0.98);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const toneClassMap = {
  starting: css`
    background: #eff6ff;
    color: #1d4ed8;
  `,
  running: css`
    background: #ecfdf5;
    color: #047857;
  `,
  stopping: css`
    background: #f8fafc;
    color: #64748b;
  `,
  stopped: css`
    background: #f8fafc;
    color: #64748b;
  `,
  error: css`
    background: #fff1f2;
    color: #be123c;
  `,
} satisfies Record<ProcessSnapshot['status'], string>

const getActionLabel = (
  status: ProcessSnapshot['status'],
  isRunning: boolean,
) => {
  if (status === 'starting') {
    return '忙'
  }
  if (status === 'stopping') {
    return '停'
  }
  if (status === 'error') {
    return '重'
  }
  return isRunning ? '停' : '启'
}
