import { css } from '@linaria/core'

export const panelClass = css`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  width: 100%;
  background: var(--panel-bg);
`

export const sectionHeaderClass = css`
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  border-bottom: 1px solid var(--line);
  padding: 0 10px;
`

export const iconButtonClass = css`
  display: inline-flex;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: #475569;
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
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
  height: 28px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: #334155;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
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

