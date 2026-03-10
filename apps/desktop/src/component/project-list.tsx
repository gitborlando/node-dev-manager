import { css, cx } from '@linaria/core'
import { Pencil, Play, RotateCw, Square } from 'lucide-react'
import { createStoppedSnapshot, type ProcessSnapshot, type ProjectConfig } from '@node-dev-mgr/shared'
import { IconButton } from './icon-button'
import { StatusPill } from './status-pill'
import { chipClass } from '../style/common'

type ProjectListProps = {
  projects: ProjectConfig[]
  runtimeById: Record<string, ProcessSnapshot>
  activeProjectId: string
  onSelect: (projectId: string) => void
  onStart: (projectId: string) => void
  onStop: (projectId: string) => void
  onRestart: (projectId: string) => void
  onEdit: (projectId: string) => void
}

export const ProjectList = ({
  projects,
  runtimeById,
  activeProjectId,
  onSelect,
  onStart,
  onStop,
  onRestart,
  onEdit,
}: ProjectListProps) => (
  <div className={listClass}>
    {projects.length === 0 ? (
      <div className={emptyClass}>
        没有项目，先创建一个条目。
      </div>
    ) : (
      projects.map((project) => {
        const runtime = runtimeById[project.id] ?? createStoppedSnapshot(project.id)
        const isRunning = runtime.status === 'running'
        const isBusy = runtime.status === 'starting' || runtime.status === 'stopping'
        const isActive = activeProjectId === project.id

        return (
          <div
            key={project.id}
            className={cx(rowClass, isActive ? rowActiveClass : rowIdleClass)}>
            <button
              className={itemButtonClass}
              onClick={() => onSelect(project.id)}
              title={project.cwd}>
              <div className={titleRowClass}>
                <div className={nameClass}>{project.name}</div>
                <StatusPill status={runtime.status} />
                {project.group ? (
                  <span className={chipClass}>{project.group}</span>
                ) : null}
                {project.port ? (
                  <span className={portChipClass}>:{project.port}</span>
                ) : null}
              </div>
              <div className={commandClass}>{project.command}</div>
              <div className={cwdClass}>{project.cwd}</div>
            </button>

            <div className={actionGroupClass}>
              <button
                className={cx(
                  runButtonClass,
                  isRunning
                    ? runButtonRunningClass
                    : runtime.status === 'error'
                      ? runButtonErrorClass
                      : runButtonIdleClass,
                )}
                disabled={isBusy}
                onClick={() => (isRunning ? onStop(project.id) : onStart(project.id))}>
                {isRunning ? (
                  <>
                    <Square size={14} />
                    停止
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    启动
                  </>
                )}
              </button>

              <IconButton
                className={restartButtonClass}
                disabled={isBusy}
                onClick={() => onRestart(project.id)}
                title="重启">
                <RotateCw size={14} />
              </IconButton>

              <IconButton onClick={() => onEdit(project.id)} title="编辑">
                <Pencil size={14} />
              </IconButton>
            </div>
          </div>
        )
      })
    )}
  </div>
)

const listClass = css`
  min-height: 0;
  flex: 1;
  overflow: auto;
`

const emptyClass = css`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  color: #64748b;
`

const rowClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  align-items: center;
  border-bottom: 1px solid var(--line);
`

const rowActiveClass = css`
  background: rgba(240, 249, 255, 0.86);
`

const rowIdleClass = css`
  background: white;

  &:hover {
    background: #f8fafc;
  }
`

const itemButtonClass = css`
  min-width: 0;
  padding: 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease;

  &:hover {
    background: var(--sky-50);
  }
`

const titleRowClass = css`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`

const nameClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
`

const portChipClass = css`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--sky-50);
  padding: 2px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  color: var(--sky-700);
`

const commandClass = css`
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #475569;
`

const cwdClass = css`
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: var(--text-soft);
`

const actionGroupClass = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 0 12px;
`

const runButtonClass = css`
  display: inline-flex;
  min-width: 56px;
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: white;
  font-size: 11px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    opacity 0.18s ease;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
`

const runButtonIdleClass = css`
  color: #334155;

  &:hover:not(:disabled) {
    border-color: var(--sky-200);
    background: var(--sky-50);
  }
`

const runButtonRunningClass = css`
  border-color: var(--emerald-200);
  background: var(--emerald-50);
  color: var(--emerald-700);

  &:hover:not(:disabled) {
    background: #d1fae5;
  }
`

const runButtonErrorClass = css`
  border-color: var(--rose-200);
  background: var(--rose-50);
  color: var(--rose-700);

  &:hover:not(:disabled) {
    background: #ffe4e6;
  }
`

const restartButtonClass = css`
  color: var(--sky-700);
`
