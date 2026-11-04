import type { HeadcodeVersion, HeadcodeVersionConfig } from './types'

const normalizeHost = (host: string) =>
  host.split(',')[0].trim().replace(/:\d+$/, '').toLowerCase()

export const getConfiguredHeadcodeVersion = (): HeadcodeVersionConfig => {
  const version = process.env.NEXT_PUBLIC_HEADCODE_VERSION
  return version === 'draft' || version === 'auto' ? version : 'live'
}

export const getHeadcodeVersionForHost = (host: string): HeadcodeVersion => {
  const version = getConfiguredHeadcodeVersion()
  if (version !== 'auto') return version
  const draftHosts = (process.env.NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS ?? '')
    .split(',')
    .map(normalizeHost)
    .filter(Boolean)
  return draftHosts.includes(normalizeHost(host)) ? 'draft' : 'live'
}
