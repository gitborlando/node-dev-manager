import { css, cx } from '@linaria/core'
import { Play, RotateCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { createStoppedSnapshot, type ProcessSnapshot, type ProjectConfig } from '../shared'
import { IconButton } from './icon-button'

type ProjectTabsProps = {
  activeProjectId: string
  projects: ProjectConfig[]
  runtimeById: Record<string, ProcessSnapshot>
  onSelect: (projectId: string) => void
  onReorder: (sourceId: string, targetId: string, after: boolean) => void
  onStart: (projectId: string) => void
  onRestart: (projectId: string) => void
}

export const ProjectTabs = ({
  activeProjectId,
  projects,
  runtimeById,
  onSelect,
  onReorder,
  onStart,
  onRestart,
}: ProjectTabsProps) => {
  const draggedId = useRef('')
  const [dropTarget, setDropTarget] = useState<{ id: string; after: boolean } | null>(null)

  if (projects.length === 0) {
    return <div className={emptyClass}>暂无服务</div>
  }

  return (
    <div className={scrollerClass} role="tablist" aria-label="已登记服务"
      onDragOver={(event) => {
        if (!draggedId.current) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left + 32) event.currentTarget.scrollBy(-16, 0)
        if (event.clientX > bounds.right - 32) event.currentTarget.scrollBy(16, 0)
      }}>
      {projects.map((project) => {
        const isActive = project.id === activeProjectId
        const runtime = runtimeById[project.id] ?? createStoppedSnapshot(project.id)
        const isRunning = runtime.status === 'running'
        const isBusy = runtime.status === 'starting' || runtime.status === 'stopping'
        const actionLabel = isBusy ? '处理中' : isRunning ? '刷新并清空输出' : '启动'
        const targetClass = dropTarget?.id === project.id
          ? dropTarget.after ? dropAfterClass : dropBeforeClass
          : ''

        return (
          <div key={project.id}
            className={cx(tabClass, isActive ? tabActiveClass : tabIdleClass, targetClass)}
            draggable
            onDragStart={(event) => {
              draggedId.current = project.id
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', project.id)
            }}
            onDragOver={(event) => {
              if (!draggedId.current || draggedId.current === project.id) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              const bounds = event.currentTarget.getBoundingClientRect()
              setDropTarget({ id: project.id, after: event.clientX > bounds.left + bounds.width / 2 })
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (draggedId.current && draggedId.current !== project.id) {
                const bounds = event.currentTarget.getBoundingClientRect()
                onReorder(draggedId.current, project.id, event.clientX > bounds.left + bounds.width / 2)
              }
              draggedId.current = ''
              setDropTarget(null)
            }}
            onDragEnd={() => {
              draggedId.current = ''
              setDropTarget(null)
            }}>
            <button className={selectClass} role="tab" aria-selected={isActive}
              data-no-titlebar-toggle="true" onClick={() => onSelect(project.id)} title={project.cwd}>
              <span className={nameClass}>{project.name}</span>
            </button>
            <IconButton
              className={cx(actionClass, isRunning ? runningClass : '')}
              data-no-titlebar-toggle="true"
              disabled={isBusy}
              title={`${actionLabel}：${project.name}`}
              aria-label={`${actionLabel}：${project.name}`}
              onClick={() => isRunning ? onRestart(project.id) : onStart(project.id)}>
              {isRunning || isBusy
                ? <RotateCw size={14} className={isBusy ? spinningClass : undefined} />
                : <Play size={14} />}
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}

const scrollerClass = css`
  display: flex;
  min-width: 0;
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
  position: relative;
  display: inline-flex;
  flex: none;
  max-width: 220px;
  height: 40px;
  align-items: center;
  gap: 4px;
  padding: 0 8px 0 14px;
  color: var(--text-main);
  cursor: default;
  -webkit-app-region: no-drag;
  -webkit-user-drag: element;

`

const selectClass = css`
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
  border: none;
  padding: 0 4px 0 0;
  color: inherit;
  background: transparent;
  cursor: inherit;
  user-select: none;
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

const actionClass = css`
  flex: none;
  cursor: default;
  height: 23px;
  width: 23px;
  border: none;
  background: transparent;

  &:hover:not(:disabled) {
    background: #e5e7eb;
    color: inherit;
  }
`

const runningClass = css`
  color: #047857;
`

const spinningClass = css`
  animation: tab-process-spin 1s linear infinite;
  @keyframes tab-process-spin {
    to { transform: rotate(360deg); }
  }
`

const dropBeforeClass = css`
  box-shadow: inset 2px 0 #0ea5e9;
`

const dropAfterClass = css`
  box-shadow: inset -2px 0 #0ea5e9;
`

const nameClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
`
