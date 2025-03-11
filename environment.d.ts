// Workflowy Extensions API
// https://workflowy.com/#/8c9cb227d2d5

import { ExtensionsAPI, WFEventListener } from './workflowy.types'

declare global {
  interface Window {
    WF: ExtensionsAPI

    /**
     * If a global WFEventListener is defined, it will be called with every
     * event that occurs in Workflowy.
     *
     * @alpha very experimental and likely to change!
     */
    WFEventListener: WFEventListener
  }
}
