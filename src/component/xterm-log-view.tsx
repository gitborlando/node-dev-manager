import { css } from '@linaria/core'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef, useState } from 'react'
import type { ProcessLogEntry } from '../shared'
import '@xterm/xterm/css/xterm.css'

type XtermLogViewProps = {
  logs: ProcessLogEntry[]
  projectId: null | string
  emptyMessage: string
}

export const XtermLogView = ({
  logs,
  projectId,
  emptyMessage,
}: XtermLogViewProps) => {
  const [copyNotice, setCopyNotice] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const renderedRef = useRef({
    logs: [] as ProcessLogEntry[],
    projectId: '',
    empty: false,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }
    let active = true
    let noticeTimer: ReturnType<typeof setTimeout> | undefined
    const showCopyNotice = (message: string) => {
      if (!active) return
      clearTimeout(noticeTimer)
      setCopyNotice(message)
      noticeTimer = setTimeout(() => setCopyNotice(''), 1600)
    }

    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: false,
      cursorStyle: 'bar',
      disableStdin: true,
      fontFamily: 'Consolas, "Cascadia Mono", "JetBrains Mono", monospace',
      fontSize: 11,
      lineHeight: 1.25,
      letterSpacing: 0,
      theme: {
        background: '#050816',
        foreground: '#d7e3f4',
        cursor: '#d7e3f4',
        selectionBackground: '#334766',
        selectionInactiveBackground: '#263449',
        black: '#050816',
        red: '#ff6f91',
        green: '#6ee7a8',
        yellow: '#f6c86f',
        blue: '#77c8ff',
        magenta: '#c4a5ff',
        cyan: '#66d9ef',
        white: '#d7e3f4',
        brightBlack: '#5a687a',
        brightRed: '#ff90a5',
        brightGreen: '#8ef7b0',
        brightYellow: '#ffe09a',
        brightBlue: '#8fd5ff',
        brightMagenta: '#dac5ff',
        brightCyan: '#7be3ff',
        brightWhite: '#f1f5ff',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)
    const copySelection = () => {
      const text = terminal.getSelection()
      if (!text) return
      const copying = window.nodeDevMgrDesktop
        ? window.nodeDevMgrDesktop.copyText(text)
        : navigator.clipboard.writeText(text)
      void copying.then(
        () => showCopyNotice('已复制'),
        () => showCopyNotice('复制失败，请重试'),
      )
    }
    terminal.attachCustomKeyEventHandler((event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return true
      const key = event.key.toLowerCase()
      if (key === 'c' && terminal.hasSelection()) {
        if (event.type === 'keydown') {
          event.preventDefault()
          copySelection()
        }
        return false
      }
      if (key === 'a') {
        if (event.type === 'keydown') {
          event.preventDefault()
          terminal.selectAll()
        }
        return false
      }
      return true
    })
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      copySelection()
    }
    container.addEventListener('contextmenu', handleContextMenu)
    terminalRef.current = terminal
    fitRef.current = fitAddon

    const resize = () => {
      fitAddon.fit()
      terminal.scrollToBottom()
    }

    resize()

    const observer = new ResizeObserver(() => {
      resize()
    })

    observer.observe(container)
    return () => {
      active = false
      clearTimeout(noticeTimer)
      observer.disconnect()
      container.removeEventListener('contextmenu', handleContextMenu)
      renderedRef.current = {
        logs: [],
        projectId: '',
        empty: false,
      }
      fitRef.current = null
      terminalRef.current = null
      terminal.dispose()
    }
  }, [])

  useEffect(() => {
    const terminal = terminalRef.current
    const fitAddon = fitRef.current
    if (!terminal || !fitAddon) {
      return
    }

    const nextProjectId = projectId ?? ''
    const previous = renderedRef.current
    const lastEntry = previous.logs.at(-1)
    const lastIndex = lastEntry ? logs.indexOf(lastEntry) : -1
    const needReset =
      previous.projectId !== nextProjectId ||
      previous.empty ||
      (lastEntry !== undefined && lastIndex < 0)

    if (needReset) {
      terminal.reset()
    }

    if (logs.length === 0) {
      terminal.writeln(`\x1b[90m${emptyMessage}\x1b[0m`)
      renderedRef.current = { logs, projectId: nextProjectId, empty: true }
      fitAddon.fit()
      return
    }

    const startIndex = needReset ? 0 : lastIndex + 1
    for (const entry of logs.slice(startIndex)) {
      terminal.writeln(formatEntry(entry))
    }

    renderedRef.current = { logs, projectId: nextProjectId, empty: false }
    if (!terminal.hasSelection()) terminal.scrollToBottom()
    fitAddon.fit()
  }, [emptyMessage, logs, projectId])

  return (
    <div className={terminalWrapClass}>
      <div className={terminalClass} ref={containerRef} />
      {copyNotice ? <div className={copyNoticeClass} role="status">{copyNotice}</div> : null}
    </div>
  )
}

const terminalWrapClass = css`
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  background: #050816;
`

const copyNoticeClass = css`
  position: absolute;
  right: 16px;
  bottom: 14px;
  z-index: 1;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  pointer-events: none;
`

const terminalClass = css`
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  background: #050816;

  & .xterm {
    height: 100%;
    width: 100%;
    padding: 8px 10px;
    background: #050816;
  }

  & .xterm .xterm-viewport {
    inset: 0;
    width: auto !important;
    background-color: #050816;
  }
`

const formatEntry = (entry: ProcessLogEntry) => {
  const prefix = `\x1b[90m${formatTime(entry.time)}\x1b[0m `
  if (entry.level === 'stderr') {
    return `${prefix}\x1b[31m${entry.message}\x1b[0m`
  }
  if (entry.level === 'system') {
    return `${prefix}\x1b[36m${entry.message}\x1b[0m`
  }
  return `${prefix}${entry.message}`
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('zh-CN', {
    hour12: false,
  })
