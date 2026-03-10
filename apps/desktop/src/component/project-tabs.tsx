import { css, cx } from '@linaria/core'
import { Play, Square, X } from 'lucide-react'
import {
  createStoppedSnapshot,
  type ProcessSnapshot,
  type ProjectConfig,
} from '@node-dev-mgr/shared'

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
                  dotClass,
                  isRunning
                    ? dotRunningClass
                    : runtime.status === 'error'
                      ? dotErrorClass
                      : dotIdleClass,
                )}
              />
              <span className={nameClass}>{project.name}</span>
            </button>

            <button
              className={actionClass}
              disabled={isBusy}
              onClick={() => (isRunning ? onStop(project.id) : onStart(project.id))}
              title={isRunning ? '停止' : '启动'}>
              {isRunning ? <Square size={12} /> : <Play size={12} />}
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
  gap: 8px;
  overflow-x: auto;
  padding: 12px 16px 8px;
`

const emptyClass = css`
  padding: 20px 16px 8px;
  font-size: 12px;
  color: var(--text-soft);
`

const tabClass = css`
  display: inline-flex;
  min-width: 0;
  max-width: 240px;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: 14px 14px 0 0;
  padding: 0 8px;
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
  height: 36px;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: var(--text-main);
`

const dotClass = css`
  height: 8px;
  width: 8px;
  border-radius: 999px;
  flex: none;
`

const dotRunningClass = css`
  background: #10b981;
`

const dotErrorClass = css`
  background: #f43f5e;
`

const dotIdleClass = css`
  background: #cbd5e1;
`

const nameClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
`

const actionClass = css`
  display: inline-flex;
  height: 24px;
  width: 24px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--sky-50);
    color: var(--sky-700);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`
