import { css, cx } from '@linaria/core'
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Terminal,
} from 'lucide-react'
import { useDevManager } from './core'
import { createStoppedSnapshot } from './shared'
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
            <div className={brandTitleClass}>Node Dev Manager</div>
          </div>

          <div className={toolbarClass}>
            <ToolButton
              className={primaryToolButtonClass}
              onClick={controller.openCreateDrawer}>
              <Plus size={14} />
              新建
            </ToolButton>
            {state.mode !== 'desktop' ? (
              <ToolButton onClick={controller.seedDemo}>示例</ToolButton>
            ) : null}
          </div>
        </header>

        <main className={mainClass}>
          <section className={cx(panelClass, workspaceClass)}>
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
  grid-template-rows: auto minmax(0, 1fr);
`

const topbarClass = css`
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.88);
  padding: 0 8px;
  backdrop-filter: blur(14px);

  @media (max-width: 860px) {
    flex-wrap: wrap;
  }
`

const brandWrapClass = css`
  display: flex;
  align-items: center;
  gap: 6px;
`

const brandIconClass = css`
  display: flex;
  height: 22px;
  width: 22px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--sky-50);
  color: var(--sky-700);
`

const brandTitleClass = css`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-strong);
`

const toolbarClass = css`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
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
  padding: 8px;
`

const workspaceClass = css`
  height: 100%;
`
