import { getHeadcodeGlobal, getSection } from '@/app/(site)/_lib/headcode'
import type { LlmsTxtData } from '@/headcode/sections'

export const dynamic = 'force-dynamic'

export async function GET() {
  const llms = await getHeadcodeGlobal('llms')
  const section = llms
    ? getSection<LlmsTxtData>(llms.sections, 'llms-txt')
    : null
  const content = section?.data.content?.trim()

  if (!content) {
    return new Response('Not found\n', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  }

  return new Response(`${content}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
