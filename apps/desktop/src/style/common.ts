import { css } from '@linaria/core'

export const panelClass = css`
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: var(--panel-bg);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(12px);
`

export const sectionHeaderClass = css`
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  border-bottom: 1px solid var(--line);
  padding: 0 8px;
`

export const iconButtonClass = css`
  display: inline-flex;
  height: 20px;
  width: 20px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: #475569;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    opacity 0.18s ease;

  &:hover:not(:disabled) {
    border-color: var(--sky-200);
    background: var(--sky-50);
    color: var(--sky-700);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
`

export const toolButtonClass = css`
  display: inline-flex;
  height: 20px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: #334155;
  font-size: 10px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    opacity 0.18s ease;

  &:hover:not(:disabled) {
    border-color: var(--sky-200);
    background: var(--sky-50);
    color: var(--sky-700);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
`

export const inputClass = css`
  height: 28px;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 0 8px;
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

