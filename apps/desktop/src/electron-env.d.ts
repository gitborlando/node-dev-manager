import type { DesktopProcessApi } from '@node-dev-mgr/shared'

declare global {
  interface Window {
    nodeDevMgrDesktop?: DesktopProcessApi
  }
}

export {}
