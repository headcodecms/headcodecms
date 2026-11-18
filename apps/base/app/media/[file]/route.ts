import { readMedia } from '@/headcode/media'

// Uploaded files from MEDIA_DIR. Names are random and never change.
export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) => {
  const media = await readMedia((await params).file)
  if (!media) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(media.body), {
    headers: {
      'Content-Type': media.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
