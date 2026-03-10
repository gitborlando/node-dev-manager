import { css, cx } from '@linaria/core'
import type { FormEvent, ReactNode } from 'react'
import { FolderOpen, Plus, Trash2, X } from 'lucide-react'
import type { ProjectForm } from '@node-dev-mgr/shared'
import { IconButton } from './icon-button'
import { inputClass } from '../style/common'

type ProjectDrawerProps = {
  open: boolean
  form: ProjectForm
  onChange: <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => void
  onSubmit: () => void
  onClose: () => void
  onDelete: (projectId: string) => void
}

export const ProjectDrawer = ({
  open,
  form,
  onChange,
  onSubmit,
  onClose,
  onDelete,
}: ProjectDrawerProps) => {
  if (!open) {
    return null
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <aside className={drawerClass}>
        <div className={headerClass}>
          <div className={headerTitleClass}>{form.id ? '修改项目' : '新建项目'}</div>
          <div className={headerActionClass}>
            {form.id ? (
              <IconButton
                className={dangerButtonClass}
                onClick={() => {
                  onDelete(form.id)
                  onClose()
                }}
                title="删除项目">
                <Trash2 size={14} />
              </IconButton>
            ) : null}
            <IconButton onClick={onClose} title="关闭">
              <X size={14} />
            </IconButton>
          </div>
        </div>

        <form className={formClass} onSubmit={handleSubmit}>
          <div className={fieldStackClass}>
            <Field label="名称">
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder="web-admin"
                required
              />
            </Field>

            <Field label="目录">
              <div className={pathFieldClass}>
                <FolderOpen className={folderIconClass} size={14} />
                <input
                  className={cx(inputClass, pathInputClass)}
                  value={form.cwd}
                  onChange={(event) => onChange('cwd', event.target.value)}
                  placeholder="D:/workspace/web-admin"
                  required
                />
              </div>
            </Field>

            <Field label="命令">
              <input
                className={cx(inputClass, monoInputClass)}
                value={form.command}
                onChange={(event) => onChange('command', event.target.value)}
                placeholder="pnpm dev"
                required
              />
            </Field>

            <div className={dualFieldClass}>
              <Field label="端口">
                <input
                  className={inputClass}
                  value={form.port}
                  onChange={(event) => onChange('port', event.target.value)}
                  placeholder="3000"
                />
              </Field>
              <Field label="分组">
                <input
                  className={inputClass}
                  value={form.group}
                  onChange={(event) => onChange('group', event.target.value)}
                  placeholder="前端"
                />
              </Field>
            </div>

            <Field label="备注">
              <textarea
                className={textareaClass}
                value={form.note}
                onChange={(event) => onChange('note', event.target.value)}
                placeholder="可不填"
              />
            </Field>
          </div>

          <div className={footerClass}>
            <button
              className={cx(footerButtonClass, primaryButtonClass)}
              type="submit">
              <Plus size={14} />
              保存
            </button>
            <button
              className={cx(footerButtonClass, secondaryButtonClass)}
              onClick={onClose}
              type="button">
              <X size={14} />
              关闭
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className={fieldClass}>
    <div className={fieldLabelClass}>{label}</div>
    {children}
  </label>
)

const overlayClass = css`
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(2, 6, 23, 0.15);
  backdrop-filter: blur(1px);
`

const drawerClass = css`
  position: absolute;
  inset-block: 0;
  left: 0;
  z-index: 20;
  display: flex;
  width: min(100%, 360px);
  flex-direction: column;
  border-right: 1px solid var(--line);
  background: white;
  box-shadow: 0 20px 80px rgba(15, 23, 42, 0.18);
`

const headerClass = css`
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
  padding: 0 16px;
`

const headerTitleClass = css`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
`

const headerActionClass = css`
  display: flex;
  align-items: center;
  gap: 4px;
`

const dangerButtonClass = css`
  color: var(--rose-700);
`

const formClass = css`
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 16px;
`

const fieldStackClass = css`
  display: grid;
  gap: 12px;
`

const pathFieldClass = css`
  position: relative;
`

const folderIconClass = css`
  position: absolute;
  left: 8px;
  top: 9px;
  color: var(--text-soft);
  pointer-events: none;
`

const pathInputClass = css`
  padding-left: 28px;
`

const monoInputClass = css`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
`

const dualFieldClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`

const textareaClass = css`
  min-height: 96px;
  width: 100%;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: white;
  padding: 10px 12px;
  color: var(--text-main);
  outline: none;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:focus {
    border-color: var(--sky-200);
    background: var(--sky-50);
  }
`

const footerClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
  border-top: 1px solid var(--line);
  padding-top: 16px;
`

const footerButtonClass = css`
  display: inline-flex;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
`

const primaryButtonClass = css`
  border-color: var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-700);

  &:hover {
    background: var(--sky-100);
  }
`

const secondaryButtonClass = css`
  color: var(--text-main);

  &:hover {
    border-color: var(--sky-200);
    background: var(--sky-50);
  }
`

const fieldClass = css`
  display: block;
`

const fieldLabelClass = css`
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
`
