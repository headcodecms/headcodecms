import { getHeadcodeGlobal, getSection } from '@/app/(site)/_lib/headcode'
import type { LlmsTxtData } from '@/headcode/sections'
import type { HeadcodeVersion } from '@/headcode/types'

export async function GET(
  _request: Request,
  { params }: RouteContext<'/[version]/llms.txt'>,
) {
  const { version } = await params
  const llms = await getHeadcodeGlobal(version as HeadcodeVersion, 'llms')
  const content =
    llms &&
    getSection<LlmsTxtData>(llms.sections, 'llms-txt')?.data.content?.trim()
  return content
    ? new Response(`${content}\n`, {
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      })
    : new Response('Not found\n', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
}
