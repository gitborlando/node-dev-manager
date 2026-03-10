import { css, cx } from '@linaria/core'
import {
  Activity,
  Layers3,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Terminal,
} from 'lucide-react'
import { useDevManager } from '@node-dev-mgr/process-core'
import { createStoppedSnapshot } from '@node-dev-mgr/shared'
import { IconButton } from './component/icon-button'
import { LogPanel } from './component/log-panel'
import { ProjectDrawer } from './component/project-drawer'
import { ProjectList } from './component/project-list'
import { ToolButton } from './component/tool-button'
import { inputClass, panelClass, sectionHeaderClass } from './style/common'

export const App = () => {
  const { controller, state } = useDevManager()
  const keyword = state.keyword.trim().toLowerCase()

  const filteredProjects = state.projects.filter((project) => {
    if (!keyword) {
      return true
    }

    return [project.name, project.cwd, project.command, project.group, project.note]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })

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
  const modeLabel = state.mode === 'desktop' ? 'Tauri 桌面模式' : '浏览器演示模式'

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
          <div className={contentGridClass}>
            <section className={panelClass}>
              <div className={sectionHeaderClass}>
                <div>
                  <div className={sectionTitleClass}>项目</div>
                  <div className={sectionSubtitleClass}>
                    配置与运行态分离，日志实时推送
                  </div>
                </div>
                <div className={searchWrapClass}>
                  <Search className={searchIconClass} size={14} />
                  <input
                    className={cx(inputClass, searchInputClass)}
                    value={state.keyword}
                    onChange={(event) => controller.setKeyword(event.target.value)}
                    placeholder="搜索项目"
                  />
                </div>
              </div>

              <ProjectList
                activeProjectId={state.activeProjectId}
                projects={filteredProjects}
                runtimeById={state.runtimeById}
                onEdit={controller.openEditDrawer}
                onRestart={(projectId) => {
                  void controller.restartProject(projectId)
                }}
                onSelect={controller.selectProject}
                onStart={(projectId) => {
                  void controller.startProject(projectId)
                }}
                onStop={(projectId) => {
                  void controller.stopProject(projectId)
                }}
              />
            </section>

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
          </div>

          <ProjectDrawer
            form={state.form}
            open={state.drawerOpen}
            onChange={controller.updateForm}
            onClose={controller.closeDrawer}
            onDelete={(projectId) => {
              void controller.deleteProject(projectId)
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

const contentGridClass = css`
  display: grid;
  height: 100%;
  min-height: 0;
  gap: 16px;
  grid-template-columns: minmax(340px, 420px) minmax(0, 1fr);

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
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

const searchWrapClass = css`
  position: relative;
`

const searchIconClass = css`
  position: absolute;
  top: 9px;
  left: 8px;
  color: var(--text-soft);
  pointer-events: none;
`

const searchInputClass = css`
  width: 192px;
  padding-left: 28px;
`
