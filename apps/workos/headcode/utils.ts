export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Public origin of a request. Next.js reports `localhost` for every local host,
// so the Host header decides (live and draft hosts need their own URLs).
export const requestOrigin = (req: Request) => {
  const url = new URL(req.url)
  url.host =
    req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host
  return url.origin
}
