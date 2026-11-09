'use client'

import * as React from 'react'

import {
  getConfiguredHeadcodeVersion,
  getHeadcodeVersionForHost,
} from '@/headcode/versions'

const subscribe = () => () => {}

// Server snapshot: null while 'auto' still needs the browser host.
const getServerVersion = () => {
  const configured = getConfiguredHeadcodeVersion()
  return configured === 'auto' ? null : configured
}

export const useAdminHeadcodeVersion = () => {
  const version = React.useSyncExternalStore(
    subscribe,
    () => getHeadcodeVersionForHost(window.location.host),
    getServerVersion,
  )
  return { version: version ?? 'live', resolved: version !== null }
}
