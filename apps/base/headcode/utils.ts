export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Entry names may contain "/" for nested paths (docs/install/vercel).
export const slugifyPath = (value: string) =>
  value.split('/').map(slugify).filter(Boolean).join('/')

// Site path of an entry: globals are /slug, collection entries /slug/name.
// The collection entry "index" is the collection root (/docs).
export const entryPath = (entry: { slug: string; name: string | null }) => {
  const name = entry.name === null ? 'index' : slugifyPath(entry.name)
  return name === 'index' ? `/${entry.slug}` : `/${entry.slug}/${name}`
}

// Public origin of a request. Next.js reports `localhost` for every local host,
// so the Host header decides (live and draft hosts need their own URLs).
export const requestOrigin = (req: Request) => {
  const url = new URL(req.url)
  url.host =
    req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host
  return url.origin
}

// Responsive widths served by /media/<key>?w=<width> (app/media/[key]).
export const mediaWidths = [384, 640, 828, 1080, 1200, 1920, 2048]

export const mediaSrcSet = (src: string) =>
  mediaWidths.map((width) => `${src}?w=${width} ${width}w`).join(', ')
