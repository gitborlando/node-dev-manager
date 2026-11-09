import { css } from '@linaria/core'
import type { ProcessLogEntry, ProjectConfig } from '../shared'
import { panelClass } from '../style/common'
import { XtermLogView } from './xterm-log-view'

type LogPanelProps = {
  project: ProjectConfig | null
  logs: ProcessLogEntry[]
}

export const LogPanel = ({ project, logs }: LogPanelProps) => (
  <section className={panelClass}>
    <div className={terminalWrapClass}>
      <XtermLogView
        emptyMessage={project ? '[system] 暂无输出' : '[system] 先选择一个服务'}
        logs={logs}
        projectId={project?.id ?? null}
      />
    </div>
  </section>
)

const terminalWrapClass = css`
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
`
