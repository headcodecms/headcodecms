'use client'

import * as React from 'react'

import type { HeadcodeVersion } from '@/headcode/types'
import {
  getConfiguredHeadcodeVersion,
  getHeadcodeVersionForHost,
} from '@/headcode/versions'

export const getAdminHeadcodeVersion = () => {
  if (typeof window === 'undefined') return 'live'

  return getHeadcodeVersionForHost(window.location.host)
}

const getInitialAdminHeadcodeVersion = (): HeadcodeVersion => {
  return getConfiguredHeadcodeVersion() === 'draft' ? 'draft' : 'live'
}

const getInitialAdminHeadcodeVersionSnapshot = () => {
  const configuredVersion = getConfiguredHeadcodeVersion()

  return `${getInitialAdminHeadcodeVersion()}:${
    configuredVersion === 'auto' ? 'pending' : 'resolved'
  }`
}

const getAdminHeadcodeVersionSnapshot = () =>
  `${getAdminHeadcodeVersion()}:resolved`

const subscribeToHeadcodeVersion = () => () => {}

export const useAdminHeadcodeVersion = () => {
  const snapshot = React.useSyncExternalStore(
    subscribeToHeadcodeVersion,
    getAdminHeadcodeVersionSnapshot,
    getInitialAdminHeadcodeVersionSnapshot,
  )
  const [version, state] = snapshot.split(':') as [
    HeadcodeVersion,
    'pending' | 'resolved',
  ]

  return { version, resolved: state === 'resolved' }
}
