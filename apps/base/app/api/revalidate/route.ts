import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'

import { headcodeTag } from '@/app/(site)/_lib/headcode'

// The backend calls this after publish and rollback (apps/backend
// src/kit/site.rs): an HMAC-SHA256 of `<timestamp>.<body>` with
// HEADCODE_REVALIDATE_SECRET, at most 5 minutes old.
export const POST = async (req: Request) => {
  const secret = process.env.HEADCODE_REVALIDATE_SECRET
  const timestamp = req.headers.get('x-headcode-timestamp') ?? ''
  const signature = req.headers.get('x-headcode-signature') ?? ''
  const body = await req.text()
  if (!secret || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
    return new Response(null, { status: 401 })
  const expected = Buffer.from(
    `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`,
  )
  const given = Buffer.from(signature)
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return new Response(null, { status: 401 })
  revalidateTag(headcodeTag, { expire: 0 })
  return new Response(null, { status: 204 })
}
