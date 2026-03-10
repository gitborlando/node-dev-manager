import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  DevManagerController,
  type DevManagerState,
} from './create-dev-manager-controller'

type UseDevManagerResult = {
  controller: DevManagerController
  state: DevManagerState
}

export const useDevManager = (): UseDevManagerResult => {
  const [controller] = useState(() => new DevManagerController())
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  )

  useEffect(() => {
    void controller.initialize()
    return () => {
      controller.dispose()
    }
  }, [controller])

  return {
    controller,
    state,
  }
}
