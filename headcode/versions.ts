import type { HeadcodeVersion, HeadcodeVersionConfig } from './types'

export const normalizeHeadcodeHost = (host: string) =>
  host.split(',')[0].trim().replace(/:\d+$/, '').toLowerCase()

export const getConfiguredHeadcodeVersion = (): HeadcodeVersionConfig => {
  const version = process.env.NEXT_PUBLIC_HEADCODE_VERSION

  if (version === 'draft' || version === 'auto') return version

  return 'live'
}

export const getHeadcodeDraftHosts = () =>
  (process.env.NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS ?? '')
    .split(',')
    .map((host) => normalizeHeadcodeHost(host))
    .filter(Boolean)

export const getHeadcodeVersionForHost = (host: string): HeadcodeVersion => {
  const configuredVersion = getConfiguredHeadcodeVersion()
  if (configuredVersion !== 'auto') return configuredVersion

  return getHeadcodeDraftHosts().includes(normalizeHeadcodeHost(host))
    ? 'draft'
    : 'live'
}
