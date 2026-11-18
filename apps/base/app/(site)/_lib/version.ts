import { notFound } from 'next/navigation'
import { version } from 'next/root-params'

import type { HeadcodeVersion } from '@/headcode/types'

// Root param of app/(site)/[version]. proxy.ts rewrites site URLs to /live/...
// and preview URLs to /preview-<token>/...; anything else is 404.
export const siteVersion = async () => {
  const value = await version()
  if (value !== 'live' && !value?.startsWith('preview-')) notFound()
  return value as HeadcodeVersion
}

export const previewToken = (version: HeadcodeVersion) =>
  version === 'live' ? null : version.slice('preview-'.length)
