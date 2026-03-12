import { css, cx } from '@linaria/core'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { FolderOpen, Plus, Trash2, X } from 'lucide-react'
import type { ProjectCommandOption, ProjectForm } from '../shared'
import { IconButton } from './icon-button'
import { ConfirmDialog } from './confirm-dialog'
import { inputClass } from '../style/common'

type ProjectDrawerProps = {
  mode: 'desktop' | 'browser-demo'
  open: boolean
  form: ProjectForm
  commandOptions: ProjectCommandOption[]
  onChange: <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => void
  onImport: () => void
  onSubmit: () => void
  onClose: () => void
  onDelete: (projectId: string) => Promise<void> | void
}

export const ProjectDrawer = ({
  mode,
  open,
  form,
  commandOptions,
  onChange,
  onImport,
  onSubmit,
  onClose,
  onDelete,
}: ProjectDrawerProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false)
      setDeletePending(false)
    }
  }, [open])

  useEffect(() => {
    setConfirmOpen(false)
    setDeletePending(false)
  }, [form.id])

  if (!open) {
    return null
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  const handleDelete = async () => {
    if (!form.id || deletePending) {
      return
    }

    setDeletePending(true)

    try {
      await onDelete(form.id)
      setConfirmOpen(false)
      onClose()
    } finally {
      setDeletePending(false)
    }
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
                className={cx(modalIconButtonClass, dangerButtonClass)}
                onClick={() => setConfirmOpen(true)}
                title="删除项目">
                <Trash2 size={14} />
              </IconButton>
            ) : null}
            <IconButton className={modalIconButtonClass} onClick={onClose} title="关闭">
              <X size={14} />
            </IconButton>
          </div>
        </div>

        <form className={formClass} onSubmit={handleSubmit}>
          <div className={fieldStackClass}>
            <Field label="名称">
              <input
                className={cx(inputClass, modalInputClass)}
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                required
              />
            </Field>

            <Field label="目录">
              <div className={pathPickerClass}>
                <div className={pathFieldClass}>
                  <FolderOpen className={folderIconClass} size={14} />
                  <input
                    className={cx(inputClass, modalInputClass, pathInputClass)}
                    value={form.cwd}
                    onChange={(event) => onChange('cwd', event.target.value)}
                    readOnly={mode === 'desktop'}
                    required
                  />
                </div>
                {mode === 'desktop' ? (
                  <button
                    className={pickerButtonClass}
                    onClick={onImport}
                    type="button">
                    选择目录
                  </button>
                ) : null}
              </div>
            </Field>

            <Field label="命令">
              {commandOptions.length > 0 ? (
                <select
                  className={cx(inputClass, modalInputClass, monoInputClass)}
                  value={form.command}
                  onChange={(event) => onChange('command', event.target.value)}
                  required>
                  {commandOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={cx(inputClass, modalInputClass, monoInputClass)}
                  value={form.command}
                  onChange={(event) => onChange('command', event.target.value)}
                  required
                />
              )}
            </Field>

            <Field label="备注">
              <textarea
                className={textareaClass}
                value={form.note}
                onChange={(event) => onChange('note', event.target.value)}
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
          </div>
        </form>
        <ConfirmDialog
          cancelLabel="保留项目"
          confirmDanger
          confirmLabel="确认删除"
          description={
            <>
              删除后会移除项目配置与当前日志记录。
              <br />
              <strong>{form.name || '这个项目'}</strong>
              {' 将从列表中消失。'}
            </>
          }
          onCancel={() => {
            if (!deletePending) {
              setConfirmOpen(false)
            }
          }}
          onConfirm={() => {
            void handleDelete()
          }}
          open={confirmOpen}
          pending={deletePending}
          title="确认删除这个项目？"
        />
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
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(3px);
`

const drawerClass = css`
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 50;
  display: flex;
  width: min(calc(100vw - 32px), 440px);
  max-height: min(calc(100vh - 32px), 560px);
  flex-direction: column;
  transform: translate(-50%, -50%);
  border: none;
  border-radius: 10px;
  background: white;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
`

const headerClass = css`
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
`

const headerTitleClass = css`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
`

const headerActionClass = css`
  display: flex;
  align-items: center;
  gap: 2px;
`

const dangerButtonClass = css`
  color: var(--rose-700);
`

const modalIconButtonClass = css`
  border: none;
  border-radius: 6px;
  background: #f8fafc;

  &:hover:not(:disabled) {
    background: #f1f5f9;
  }
`

const formClass = css`
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 6px 12px 12px;
`

const fieldStackClass = css`
  display: grid;
  gap: 12px;
`

const pathFieldClass = css`
  position: relative;
`

const pathPickerClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
`

const folderIconClass = css`
  position: absolute;
  left: 8px;
  top: 9px;
  color: var(--text-soft);
  pointer-events: none;
`

const pathInputClass = css`
  padding-left: 32px;
`

const pickerButtonClass = css`
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: #f1f5f9;
  padding: 0 10px;
  font-size: 11px;
  color: #334155;
  cursor: pointer;

  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
`

const modalInputClass = css`
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f8fafc;
  padding-inline: 12px;

  &:focus {
    background: #f1f5f9;
  }
`

const monoInputClass = css`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
`

const textareaClass = css`
  min-height: 72px;
  width: 100%;
  resize: vertical;
  border: none;
  border-radius: 6px;
  background: #f8fafc;
  padding: 10px 12px;
  color: var(--text-main);
  outline: none;
  transition:
    background-color 0.18s ease;

  &:focus {
    background: #f1f5f9;
  }
`

const footerClass = css`
  display: grid;
  gap: 6px;
  margin-top: 10px;
`

const footerButtonClass = css`
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  border: none;
  background: #f8fafc;
  font-size: 11px;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
`

const primaryButtonClass = css`
  background: #e0f2fe;
  color: var(--sky-700);

  &:hover {
    background: #bae6fd;
  }
`

const fieldClass = css`
  display: block;
`

const fieldLabelClass = css`
  padding-bottom: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
`
