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

// Public origin of a request, for OAuth redirects. Behind a proxy (Vercel,
// Coolify) Next.js sees an internal host and port, so the forwarded headers
// decide.
export const requestOrigin = (req: Request) => {
  const url = new URL(req.url)
  const first = (value: string | null) => value?.split(',')[0].trim()
  const host =
    first(req.headers.get('x-forwarded-host')) ??
    req.headers.get('host') ??
    url.host
  const proto =
    first(req.headers.get('x-forwarded-proto')) ?? url.protocol.slice(0, -1)
  return `${proto}://${host}`
}
