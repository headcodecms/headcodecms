import { notFound } from 'next/navigation'
import { version } from 'next/root-params'

import type { HeadcodeVersion } from '@/headcode/types'

// Root param of app/(site)/[version]. proxy.ts rewrites every site URL to
// /live/... or /draft/... based on the request host; anything else is 404.
export const siteVersion = async () => {
  const value = await version()
  if (value !== 'live' && value !== 'draft') notFound()
  return value as HeadcodeVersion
}
