import { css, cx } from '@linaria/core'
import {
  Copy,
  Minus,
  Plus,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDevManager } from './core'
import { createStoppedSnapshot } from './shared'
import { IconButton } from './component/icon-button'
import { LogPanel } from './component/log-panel'
import { ProjectDrawer } from './component/project-drawer'
import { ProjectTabs } from './component/project-tabs'

export const App = () => {
  const { controller, state } = useDevManager()
  const [windowMaximized, setWindowMaximized] = useState(false)
  const activeProject =
    state.projects.find((project) => project.id === state.activeProjectId) ?? null
  const activeRuntime = activeProject
    ? state.runtimeById[activeProject.id] ?? createStoppedSnapshot(activeProject.id)
    : null
  const activeLogs = activeProject ? state.logsById[activeProject.id] ?? [] : []

  useEffect(() => {
    if (state.mode !== 'desktop') {
      return
    }

    const desktopApi = window.nodeDevMgrDesktop
    if (!desktopApi) {
      return
    }

    void desktopApi.getWindowState().then((nextState) => {
      setWindowMaximized(nextState.maximized)
    })

    return desktopApi.onWindowState((nextState) => {
      setWindowMaximized(nextState.maximized)
    })
  }, [state.mode])

  return (
    <div className={pageClass}>
      <div className={shellClass}>
        <header
          className={cx(titlebarClass, windowMaximized ? titlebarMaximizedClass : '')}
          onDoubleClick={(event) => {
            if (state.mode !== 'desktop') {
              return
            }

            const target = event.target
            if (!(target instanceof HTMLElement)) {
              return
            }

            if (target.closest('[data-no-titlebar-toggle="true"]')) {
              return
            }

            window.nodeDevMgrDesktop?.toggleMaximizeWindow()
          }}>
          <div className={brandWrapClass}>
            <div className={brandIconClass}>
              <Terminal size={16} />
            </div>
          </div>

          <div className={tabsWrapClass}>
            <ProjectTabs
              activeProjectId={state.activeProjectId}
              projects={state.projects}
              runtimeById={state.runtimeById}
              onSelect={controller.selectProject}
            />
          </div>

          <div className={toolbarClass}>
            <IconButton
              className={primaryToolButtonClass}
              data-no-titlebar-toggle="true"
              title="新建项目"
              onClick={controller.openCreateDialog}>
              <Plus size={17} />
            </IconButton>
            {state.mode !== 'desktop' ? (
              <IconButton
                data-no-titlebar-toggle="true"
                onClick={controller.seedDemo}
                title="填充示例">
                <Copy size={17} />
              </IconButton>
            ) : null}
          </div>

          {state.mode === 'desktop' ? (
            <div className={windowControlsClass} data-no-titlebar-toggle="true">
              <IconButton
                className={windowButtonClass}
                onClick={() => window.nodeDevMgrDesktop?.minimizeWindow()}
                title="最小化">
                <Minus size={16} />
              </IconButton>
              <IconButton
                className={windowButtonClass}
                onClick={() => window.nodeDevMgrDesktop?.toggleMaximizeWindow()}
                title={windowMaximized ? '还原' : '最大化'}>
                {windowMaximized ? <Copy size={15} /> : <Square size={15} />}
              </IconButton>
              <IconButton
                className={cx(windowButtonClass, closeButtonClass)}
                onClick={() => window.nodeDevMgrDesktop?.closeWindow()}
                title="关闭">
                <X size={16} />
              </IconButton>
            </div>
          ) : null}
        </header>

        <main className={mainClass}>
          <LogPanel
            logs={activeLogs}
            project={activeProject}
            runtime={activeRuntime}
            onClearLogs={controller.clearActiveLogs}
            onEdit={controller.openEditDialog}
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

          <ProjectDrawer
            commandOptions={state.commandOptions}
            form={state.form}
            mode={state.mode}
            open={state.projectDialogOpen}
            onChange={controller.updateForm}
            onClose={controller.closeProjectDialog}
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
  height: 100vh;
  color: var(--text-main);
`

const shellClass = css`
  display: grid;
  height: 100%;
  grid-template-rows: auto minmax(0, 1fr);
`

const titlebarClass = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  background: rgba(245, 248, 250, 0.96);
  padding: 0 0 0 12px;
  backdrop-filter: blur(12px);
  -webkit-app-region: drag;

  @media (max-width: 860px) {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
  }
`

const titlebarMaximizedClass = css`
  padding-right: 8px;
`

const brandWrapClass = css`
  display: flex;
  align-items: center;
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

const tabsWrapClass = css`
  min-width: 0;
  height: 40px;
  align-self: stretch;
  -webkit-app-region: drag;
`

const toolbarClass = css`
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 8px;
  -webkit-app-region: no-drag;
`

const primaryToolButtonClass = css`
  border-color: var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-700);

  &:hover:not(:disabled) {
    background: var(--sky-100);
  }
`

const windowControlsClass = css`
  display: flex;
  align-items: stretch;
  gap: 1px;
  align-self: stretch;
  padding-left: 2px;
  border-left: 1px solid var(--panel-border);
  -webkit-app-region: no-drag;
`

const windowButtonClass = css`
  height: 100%;
  width: 34px;
  border: none;
  border-radius: 0;
  background: transparent;
`

const closeButtonClass = css`
  &:hover:not(:disabled) {
    border-color: transparent;
    background: #ef4444;
    color: white;
  }
`

const mainClass = css`
  position: relative;
  display: flex;
  min-height: 0;
  overflow: hidden;
`
