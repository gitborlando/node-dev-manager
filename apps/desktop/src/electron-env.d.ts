import type { DesktopProcessApi } from './shared'

declare global {
  interface Window {
    nodeDevMgrDesktop?: DesktopProcessApi
  }
}

export {}
