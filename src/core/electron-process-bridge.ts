import type { DesktopProcessApi } from '../shared'
import type { ProcessBridge } from './process-bridge'

export const createElectronProcessBridge = (): ProcessBridge => ({
  mode: 'desktop',

  listProcesses: () => getDesktopApi().listProcesses(),

  startProcess: (input) => getDesktopApi().startProcess(input),

  stopProcess: (processId) => getDesktopApi().stopProcess(processId),

  restartProcess: (input) => getDesktopApi().restartProcess(input),

  subscribe: async (listener) => getDesktopApi().onProcessEvent(listener),
})

export const getDesktopApi = (): DesktopProcessApi => {
  const desktopApi = window.nodeDevMgrDesktop
  if (!desktopApi) {
    throw new Error('DESKTOP_API_UNAVAILABLE')
  }

  return desktopApi
}
