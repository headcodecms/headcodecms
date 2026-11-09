import { expireSite } from '@/app/(site)/_lib/headcode'
import { getAdminIdentity } from '@/headcode/auth'
import { HeadcodeError } from '@/headcode/authorization'
import { getDb } from '@/headcode/db'
import { callService } from '@/headcode/services'

// The admin's data API (headcode/client.tsx). Every write expires the site cache.
export const POST = async (req: Request) => {
  const { name, args } = (await req.json()) as {
    name: string
    args?: Record<string, unknown>
  }
  try {
    const identity = await getAdminIdentity()
    const { kind, result } = await callService(getDb(), name, args, {
      identity,
    })
    if (kind === 'mutation') expireSite()
    return Response.json({ result: result ?? null })
  } catch (error) {
    return Response.json(
      error instanceof HeadcodeError
        ? { error: error.message, data: error.data }
        : { error: error instanceof Error ? error.message : 'Server error.' },
      { status: 400 },
    )
  }
}
