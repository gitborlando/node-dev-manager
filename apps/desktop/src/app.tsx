import { css, cx } from '@linaria/core'
import {
  Activity,
  Layers3,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Terminal,
} from 'lucide-react'
import { useDevManager } from '@node-dev-mgr/process-core'
import { createStoppedSnapshot } from '@node-dev-mgr/shared'
import { IconButton } from './component/icon-button'
import { LogPanel } from './component/log-panel'
import { ProjectDrawer } from './component/project-drawer'
import { ProjectTabs } from './component/project-tabs'
import { ToolButton } from './component/tool-button'
import { panelClass } from './style/common'

export const App = () => {
  const { controller, state } = useDevManager()
  const activeProject =
    state.projects.find((project) => project.id === state.activeProjectId) ?? null
  const activeRuntime = activeProject
    ? state.runtimeById[activeProject.id] ?? createStoppedSnapshot(activeProject.id)
    : null
  const activeLogs = activeProject ? state.logsById[activeProject.id] ?? [] : []
  const runningCount = state.projects.reduce((count, project) => {
    const snapshot = state.runtimeById[project.id]
    return snapshot?.status === 'running' ? count + 1 : count
  }, 0)
  const modeLabel = state.mode === 'desktop' ? 'Electron 桌面模式' : '浏览器演示模式'

  return (
    <div className={pageClass}>
      <div className={shellClass}>
        <header className={topbarClass}>
          <div className={brandWrapClass}>
            <IconButton
              onClick={() =>
                state.drawerOpen ? controller.closeDrawer() : controller.openCreateDrawer()
              }
              title={state.drawerOpen ? '关闭抽屉' : '打开抽屉'}>
              {state.drawerOpen ? (
                <PanelLeftClose size={14} />
              ) : (
                <PanelLeftOpen size={14} />
              )}
            </IconButton>
            <div className={brandIconClass}>
              <Terminal size={16} />
            </div>
            <div>
              <div className={brandTitleClass}>Node Dev Manager</div>
              <div className={brandSubtitleClass}>{modeLabel}</div>
            </div>
          </div>

          <div className={toolbarClass}>
            <div className={statCardClass}>
              <Activity className={statIconClass} size={14} />
              <span>{runningCount}</span>
            </div>
            <ToolButton onClick={controller.seedDemo}>
              <Layers3 size={14} />
              示例
            </ToolButton>
            <ToolButton
              className={primaryToolButtonClass}
              onClick={controller.openCreateDrawer}>
              <Plus size={14} />
              新建
            </ToolButton>
          </div>
        </header>

        <main className={mainClass}>
          <section className={cx(panelClass, workspaceClass)}>
            <div className={workspaceHeaderClass}>
              <div>
                <div className={sectionTitleClass}>项目会话</div>
                <div className={sectionSubtitleClass}>
                  每个项目一个标签，日志和控制都在同一工作区完成
                </div>
              </div>
            </div>

            <ProjectTabs
              activeProjectId={state.activeProjectId}
              projects={state.projects}
              runtimeById={state.runtimeById}
              onClose={(projectId) => {
                void controller.deleteProject(projectId)
              }}
              onSelect={controller.selectProject}
              onStart={(projectId) => {
                void controller.startProject(projectId)
              }}
              onStop={(projectId) => {
                void controller.stopProject(projectId)
              }}
            />

            <LogPanel
              logs={activeLogs}
              project={activeProject}
              runtime={activeRuntime}
              onClearLogs={controller.clearActiveLogs}
              onDelete={(projectId) => {
                void controller.deleteProject(projectId)
              }}
              onEdit={controller.openEditDrawer}
              onRestart={(projectId) => {
                void controller.restartProject(projectId)
              }}
              onStart={(projectId) => {
                void controller.startProject(projectId)
              }}
              onStop={(projectId) => {
                void controller.stopProject(projectId)
              }}
            />
          </section>

          <ProjectDrawer
            commandOptions={state.commandOptions}
            form={state.form}
            mode={state.mode}
            open={state.drawerOpen}
            onChange={controller.updateForm}
            onClose={controller.closeDrawer}
            onDelete={(projectId) => {
              void controller.deleteProject(projectId)
            }}
            onImport={() => {
              void controller.importProjectDirectory()
            }}
            onSubmit={controller.submitForm}
          />
        </main>
      </div>
    </div>
  )
}

const pageClass = css`
  min-height: 100vh;
  color: var(--text-main);
`

const shellClass = css`
  display: grid;
  min-height: 100vh;
  grid-template-rows: 56px minmax(0, 1fr);
`

const topbarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.8);
  padding: 0 16px;
  backdrop-filter: blur(18px);
`

const brandWrapClass = css`
  display: flex;
  align-items: center;
  gap: 8px;
`

const brandIconClass = css`
  display: flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sky-200);
  border-radius: 12px;
  background: var(--sky-50);
  color: var(--sky-700);
`

const brandTitleClass = css`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
`

const brandSubtitleClass = css`
  font-size: 10px;
  color: var(--text-soft);
`

const toolbarClass = css`
  display: flex;
  align-items: center;
  gap: 8px;
`

const statCardClass = css`
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: white;
  padding: 0 12px;
  font-size: 11px;
  color: #475569;
`

const statIconClass = css`
  color: var(--emerald-700);
`

const primaryToolButtonClass = css`
  border-color: var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-700);

  &:hover:not(:disabled) {
    background: var(--sky-100);
  }
`

const mainClass = css`
  position: relative;
  min-height: 0;
  padding: 16px;
`

const workspaceClass = css`
  height: 100%;
`

const workspaceHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  padding: 12px 16px;
`

const sectionTitleClass = css`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
`

const sectionSubtitleClass = css`
  font-size: 10px;
  color: var(--text-soft);
`
