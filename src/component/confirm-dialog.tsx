import { css, cx } from '@linaria/core'
import type { ReactNode } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmDanger?: boolean
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  confirmDanger = false,
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  if (!open) {
    return null
  }

  return (
    <div className={layerClass}>
      <button
        aria-label="关闭确认弹窗"
        className={scrimClass}
        disabled={pending}
        onClick={onCancel}
        type="button"
      />
      <div
        aria-modal="true"
        className={panelClass}
        role="alertdialog">
        <div className={titleClass}>{title}</div>
        {description ? <div className={descriptionClass}>{description}</div> : null}
        <div className={footerClass}>
          <button
            className={buttonClass}
            disabled={pending}
            onClick={onCancel}
            type="button">
            {cancelLabel}
          </button>
          <button
            className={cx(
              buttonClass,
              confirmDanger ? dangerButtonClass : confirmButtonClass,
            )}
            disabled={pending}
            onClick={onConfirm}
            type="button">
            {pending ? '处理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const layerClass = css`
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const scrimClass = css`
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(3px);
  cursor: pointer;
`

const panelClass = css`
  position: relative;
  z-index: 1;
  width: min(100%, 320px);
  border-radius: 10px;
  background: white;
  padding: 16px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
`

const titleClass = css`
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
`

const descriptionClass = css`
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
`

const footerClass = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`

const buttonClass = css`
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  padding: 0 12px;
  background: #f1f5f9;
  font-size: 11px;
  color: #334155;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    opacity 0.18s ease;

  &:hover:not(:disabled) {
    background: #e2e8f0;
    color: #0f172a;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const confirmButtonClass = css`
  background: var(--sky-100);
  color: var(--sky-700);

  &:hover:not(:disabled) {
    background: var(--sky-200);
  }
`

const dangerButtonClass = css`
  background: var(--rose-50);
  color: var(--rose-700);

  &:hover:not(:disabled) {
    background: var(--rose-200);
  }
`
