import { css, cx } from '@linaria/core'
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
}

export const ProjectTabs = ({
  activeProjectId,
  projects,
  runtimeById,
  onSelect,
}: ProjectTabsProps) => {
  if (projects.length === 0) {
    return <div className={emptyClass}>暂无项目</div>
  }

  return (
    <div className={scrollerClass}>
      {projects.map((project) => {
        const isActive = project.id === activeProjectId
        const runtime = runtimeById[project.id] ?? createStoppedSnapshot(project.id)
        const isRunning = runtime.status === 'running' || runtime.status === 'starting'

        return (
          <button
            key={project.id}
            className={cx(tabClass, isActive ? tabActiveClass : tabIdleClass)}
            onClick={() => onSelect(project.id)}
            draggable={false}
            title={project.cwd}>
            <span className={nameClass}>{project.name}</span>
            <span
              className={cx(dotClass, isRunning ? dotActiveClass : dotIdleClass)}
            />
          </button>
        )
      })}
    </div>
  )
}

const scrollerClass = css`
  display: flex;
  min-width: 0;
  gap: 0;
  height: 40px;
  overflow-x: auto;
  padding: 0 10px;
  -webkit-app-region: drag;
  user-select: none;
`

const emptyClass = css`
  padding: 0 8px;
  font-size: 11px;
  color: var(--text-soft);
  line-height: 40px;
  -webkit-app-region: drag;
`

const tabClass = css`
  display: inline-flex;
  min-width: 0;
  max-width: 220px;
  height: 40px;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0 18px;
  color: var(--text-main);
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-app-region: no-drag;
`

const tabActiveClass = css`
  background: rgba(255, 255, 255, 0.88);
  color: var(--text-strong);
`

const tabIdleClass = css`
  color: #64748b;

  &:hover {
    background: rgba(255, 255, 255, 0.48);
    color: var(--text-strong);
  }
`

const dotClass = css`
  height: 7px;
  width: 7px;
  flex: none;
  border-radius: 999px;
`

const dotActiveClass = css`
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
`

const dotIdleClass = css`
  background: transparent;
`

const nameClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
`
