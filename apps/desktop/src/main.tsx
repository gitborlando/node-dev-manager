import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app'
import './style/index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('ROOT_CONTAINER_NOT_FOUND')
}

type FatalBoundaryProps = {
  children: ReactNode
}

type FatalBoundaryState = {
  error: null | string
}

class FatalBoundary extends Component<FatalBoundaryProps, FatalBoundaryState> {
  state: FatalBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: unknown): FatalBoundaryState {
    return {
      error: toErrorMessage(error),
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('APP_RENDER_ERROR', error, info)
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  render() {
    if (this.state.error) {
      return (
        <pre style={fatalStyle}>
          {`APP_FATAL_ERROR\n\n${this.state.error}`}
        </pre>
      )
    }

    return this.props.children
  }

  private handleWindowError = (event: ErrorEvent) => {
    this.setState({
      error: event.error
        ? toErrorMessage(event.error)
        : event.message || 'UNKNOWN_WINDOW_ERROR',
    })
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.setState({
      error: `UNHANDLED_REJECTION: ${toErrorMessage(event.reason)}`,
    })
  }
}

const fatalStyle = {
  margin: 0,
  minHeight: '100vh',
  padding: '24px',
  background: '#0f172a',
  color: '#f8fafc',
  fontFamily: 'Consolas, ui-monospace, monospace',
  fontSize: '13px',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} satisfies React.CSSProperties

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.stack || error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

createRoot(container).render(
  <StrictMode>
    <FatalBoundary>
      <App />
    </FatalBoundary>
  </StrictMode>,
)
