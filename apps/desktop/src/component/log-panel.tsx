import { css, cx } from '@linaria/core'
import { Eraser, Pencil, Play, RotateCw, Square } from 'lucide-react'
import {
  createStoppedSnapshot,
  type ProcessLogEntry,
  type ProcessSnapshot,
  type ProjectConfig,
} from '../shared'
import { IconButton } from './icon-button'
import { panelClass, sectionHeaderClass } from '../style/common'
import { XtermLogView } from './xterm-log-view'

type LogPanelProps = {
  project: ProjectConfig | null
  runtime: ProcessSnapshot | null
  logs: ProcessLogEntry[]
  onStart: (projectId: string) => void
  onStop: (projectId: string) => void
  onRestart: (projectId: string) => void
  onEdit: (projectId: string) => void
  onClearLogs: () => void
}

export const LogPanel = ({
  project,
  runtime,
  logs,
  onStart,
  onStop,
  onRestart,
  onEdit,
  onClearLogs,
}: LogPanelProps) => {
  const snapshot = project ? runtime ?? createStoppedSnapshot(project.id) : null
  const isRunning = snapshot?.status === 'running'
  const isBusy = snapshot?.status === 'starting' || snapshot?.status === 'stopping'
  const primaryLabel = getPrimaryLabel(snapshot?.status ?? null, isRunning)
  const emptyMessage = project ? '[system] 暂无输出' : '[system] 先选择一个项目'

  return (
    <section className={panelClass}>
      <div className={sectionHeaderClass}>
        <div className={headerInfoClass}>
          <div className={titleRowClass}>
            <div className={titleClass}>{project?.name ?? '日志'}</div>
          </div>
          <div className={subtitleClass}>{project?.command ?? project?.cwd ?? '未选中项目'}</div>
        </div>

        <div className={headerActionClass}>
          <IconButton
            className={cx(primaryButtonClass, toneClassMap[snapshot?.status ?? 'stopped'])}
            disabled={!project || isBusy}
            title={primaryLabel}
            onClick={() =>
              project && (isRunning ? onStop(project.id) : onStart(project.id))
            }>
            {isRunning ? <Square size={16} /> : <Play size={16} />}
          </IconButton>
          <IconButton
            disabled={!project || isBusy}
            title="重启"
            onClick={() => project && onRestart(project.id)}>
            <RotateCw size={16} />
          </IconButton>
          <IconButton
            disabled={!project}
            onClick={() => project && onEdit(project.id)}
            title="编辑">
            <Pencil size={16} />
          </IconButton>
          <IconButton disabled={!project} onClick={onClearLogs} title="清空日志">
            <Eraser size={16} />
          </IconButton>
        </div>
      </div>

      <div className={terminalWrapClass}>
        <XtermLogView
          emptyMessage={emptyMessage}
          logs={logs}
          projectId={project?.id ?? null}
        />
      </div>
    </section>
  )
}

const headerInfoClass = css`
  min-width: 0;
`

const titleRowClass = css`
  display: flex;
  min-width: 0;
  align-items: center;
`

const titleClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
`

const subtitleClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--text-soft);
`

const headerActionClass = css`
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
`

const primaryButtonClass = css`
  border-color: var(--line);

  &:hover:not(:disabled) {
    color: inherit;
  }
`

const terminalWrapClass = css`
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
`

const toneClassMap = {
  starting: css`
    border-color: #dbeafe;
    background: #eff6ff;
    color: #1d4ed8;

    &:hover:not(:disabled) {
      border-color: #dbeafe;
      background: #dbeafe;
      color: #1d4ed8;
    }
  `,
  running: css`
    border-color: #bbf7d0;
    background: #ecfdf5;
    color: #047857;

    &:hover:not(:disabled) {
      border-color: #bbf7d0;
      background: #d1fae5;
      color: #047857;
    }
  `,
  stopping: css`
    border-color: #e2e8f0;
    background: #f8fafc;
    color: #64748b;

    &:hover:not(:disabled) {
      border-color: #e2e8f0;
      background: #f1f5f9;
      color: #64748b;
    }
  `,
  stopped: css`
    border-color: #e2e8f0;
    background: #f8fafc;
    color: #0f172a;

    &:hover:not(:disabled) {
      border-color: #e2e8f0;
      background: #f1f5f9;
      color: #0f172a;
    }
  `,
  error: css`
    border-color: #fecdd3;
    background: #fff1f2;
    color: #be123c;

    &:hover:not(:disabled) {
      border-color: #fecdd3;
      background: #ffe4e6;
      color: #be123c;
    }
  `,
} satisfies Record<ProcessSnapshot['status'], string>

const getPrimaryLabel = (
  status: ProcessSnapshot['status'] | null,
  isRunning: boolean,
) => {
  if (status === 'starting') {
    return '启动中'
  }
  if (status === 'stopping') {
    return '停止中'
  }
  if (status === 'error') {
    return '重开'
  }
  return isRunning ? '停止' : '启动'
}
