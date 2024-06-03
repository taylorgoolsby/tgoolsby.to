// @flow

import sessionStore from '../stores/SessionStore.js'

export default function reportEvent(
  eventName: string,
  properties: { [string]: any },
): void {
  if (sessionStore.appLoaded) {
    if (!!sessionStore.cookieSettings?.performance) {
      // Todo: Implement analytics
    }
  }
}
