import { css } from '@linaria/core'
import { Eraser, Pencil, Play, RotateCw, Square, Trash2 } from 'lucide-react'
import {
  createStoppedSnapshot,
  type ProcessLogEntry,
  type ProcessSnapshot,
  type ProjectConfig,
} from '@node-dev-mgr/shared'
import { IconButton } from './icon-button'
import { StatusPill } from './status-pill'
import { ToolButton } from './tool-button'
import { chipClass, panelClass, sectionHeaderClass } from '../style/common'

type LogPanelProps = {
  project: ProjectConfig | null
  runtime: ProcessSnapshot | null
  logs: ProcessLogEntry[]
  onStart: (projectId: string) => void
  onStop: (projectId: string) => void
  onRestart: (projectId: string) => void
  onEdit: (projectId: string) => void
  onDelete: (projectId: string) => void
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
  onDelete,
  onClearLogs,
}: LogPanelProps) => {
  const snapshot = project ? runtime ?? createStoppedSnapshot(project.id) : null
  const isRunning = snapshot?.status === 'running'
  const isBusy = snapshot?.status === 'starting' || snapshot?.status === 'stopping'

  return (
    <section className={panelClass}>
      <div className={sectionHeaderClass}>
        <div className={headerInfoClass}>
          <div className={titleRowClass}>
            <div className={titleClass}>{project?.name ?? '日志'}</div>
            {snapshot ? <StatusPill status={snapshot.status} /> : null}
          </div>
          <div className={subtitleClass}>{project?.cwd ?? '还没有选中项目'}</div>
        </div>

        <div className={headerActionClass}>
          <ToolButton
            disabled={!project || isBusy}
            onClick={() =>
              project && (isRunning ? onStop(project.id) : onStart(project.id))
            }>
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
          </ToolButton>
          <ToolButton
            disabled={!project || isBusy}
            onClick={() => project && onRestart(project.id)}>
            <RotateCw size={14} />
            重启
          </ToolButton>
          <ToolButton disabled={!project} onClick={() => project && onEdit(project.id)}>
            <Pencil size={14} />
            修改
          </ToolButton>
          <ToolButton
            className={dangerButtonClass}
            disabled={!project}
            onClick={() => project && onDelete(project.id)}>
            <Trash2 size={14} />
            删除
          </ToolButton>
          <IconButton disabled={!project} onClick={onClearLogs} title="清空日志">
            <Eraser size={14} />
          </IconButton>
        </div>
      </div>

      <div className={metaRowClass}>
        <span className={chipClass}>
          PID: {snapshot?.pid ?? '-'}
        </span>
        <span className={chipClass}>
          端口: {project?.port || '-'}
        </span>
        <span className={chipClass}>
          分组: {project?.group || '-'}
        </span>
        <span className={chipClass}>
          更新时间: {snapshot ? formatDateTime(snapshot.updatedAt) : '-'}
        </span>
      </div>

      <div className={logBodyClass}>
        {project ? (
          logs.length > 0 ? (
            logs.map((entry, index) => (
              <div key={`${entry.time}-${index}`} className={logLineClass}>
                <span className={logTimeClass}>[{formatTime(entry.time)}]</span>
                <span className={levelClassMap[entry.level]}>[{entry.level}]</span>
                <span className={logMessageClass}>{entry.message}</span>
              </div>
            ))
          ) : (
            <div className={emptyLogClass}>[system] 还没有日志输出</div>
          )
        ) : (
          <div className={emptyLogClass}>[system] 还没有选中项目</div>
        )}
      </div>
    </section>
  )
}

const levelClassMap = {
  stdout: css`
    color: #86efac;
  `,
  stderr: css`
    color: #fda4af;
  `,
  system: css`
    color: #7dd3fc;
  `,
} satisfies Record<ProcessLogEntry['level'], string>

const headerInfoClass = css`
  min-width: 0;
`

const titleRowClass = css`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
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
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: var(--text-soft);
`

const headerActionClass = css`
  display: flex;
  align-items: center;
  gap: 4px;
`

const dangerButtonClass = css`
  color: var(--rose-700);

  &:hover:not(:disabled) {
    border-color: var(--rose-200);
    background: var(--rose-50);
    color: var(--rose-700);
  }
`

const metaRowClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--line);
  padding: 8px 16px;
  font-size: 10px;
`

const logBodyClass = css`
  min-height: 0;
  flex: 1;
  overflow: auto;
  background: #020617;
  padding: 12px 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.8;
  color: #e2e8f0;
`

const logLineClass = css`
  border-left: 1px solid rgba(148, 163, 184, 0.45);
  padding-left: 12px;
  color: #e2e8f0;
`

const logTimeClass = css`
  margin-right: 8px;
  color: #64748b;
`

const logMessageClass = css`
  margin-left: 8px;
  white-space: pre-wrap;
  word-break: break-all;
`

const emptyLogClass = css`
  color: #64748b;
`

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('zh-CN', {
    hour12: false,
  })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('zh-CN', {
    hour12: false,
  })
