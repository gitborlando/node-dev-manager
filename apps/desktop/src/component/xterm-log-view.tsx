import { css } from '@linaria/core'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const renderedRef = useRef({
    count: 0,
    projectId: '',
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
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
        brightBlack: '#5a687a',
        brightBlue: '#8fd5ff',
        brightCyan: '#7be3ff',
        brightGreen: '#8ef7b0',
        brightRed: '#ff90a5',
        cursor: '#d7e3f4',
        red: '#ff6f91',
        green: '#6ee7a8',
        yellow: '#f6c86f',
        blue: '#77c8ff',
        cyan: '#66d9ef',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)
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
      observer.disconnect()
      renderedRef.current = {
        count: 0,
        projectId: '',
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
    const needReset =
      renderedRef.current.projectId !== nextProjectId ||
      logs.length < renderedRef.current.count

    if (needReset) {
      terminal.clear()
      terminal.reset()
      renderedRef.current = {
        count: 0,
        projectId: nextProjectId,
      }
    }

    if (logs.length === 0) {
      if (renderedRef.current.count > 0 && !needReset) {
        return
      }
      terminal.writeln(`\x1b[90m${emptyMessage}\x1b[0m`)
      renderedRef.current.count = 1
      renderedRef.current.projectId = nextProjectId
      fitAddon.fit()
      return
    }

    const startIndex = Math.min(renderedRef.current.count, logs.length)
    for (const entry of logs.slice(startIndex)) {
      terminal.writeln(formatEntry(entry))
    }

    renderedRef.current.count = logs.length
    renderedRef.current.projectId = nextProjectId
    terminal.scrollToBottom()
    fitAddon.fit()
  }, [emptyMessage, logs, projectId])

  return <div className={terminalClass} ref={containerRef} />
}

const terminalClass = css`
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: #050816;
  padding: 8px;
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
