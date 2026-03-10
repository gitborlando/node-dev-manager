import { css, cx } from '@linaria/core'
import type { ProcessStatus } from '@node-dev-mgr/shared'

const statusLabelMap: Record<ProcessStatus, string> = {
  starting: '启动中',
  running: '运行中',
  stopping: '停止中',
  stopped: '已停止',
  error: '异常',
}

export const StatusPill = ({ status }: { status: ProcessStatus }) => (
  <span className={cx(baseClass, statusClassMap[status])}>
    {statusLabelMap[status]}
  </span>
)

const baseClass = css`
  display: inline-flex;
  height: 20px;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 600;
`

const statusClassMap: Record<ProcessStatus, string> = {
  starting: css`
    border-color: var(--amber-200);
    background: var(--amber-50);
    color: var(--amber-700);
  `,
  running: css`
    border-color: var(--emerald-200);
    background: var(--emerald-50);
    color: var(--emerald-700);
  `,
  stopping: css`
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #64748b;
  `,
  stopped: css`
    border-color: #e2e8f0;
    background: #f8fafc;
    color: #64748b;
  `,
  error: css`
    border-color: var(--rose-200);
    background: var(--rose-50);
    color: var(--rose-700);
  `,
}
