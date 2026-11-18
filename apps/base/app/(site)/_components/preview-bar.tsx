'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Shown on every preview page. Internal links keep the preview prefix, so
// clicking around stays in the draft; "View live" leaves it.
export function PreviewBar({ token }: { token: string }) {
  const prefix = `/preview/${token}`
  const pathname = usePathname()
  const router = useRouter()
  const livePath = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length) || '/'
    : pathname

  useEffect(() => {
    // Capture phase: runs before next/link handles the click.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const link = (event.target as Element).closest('a')
      const href = link?.getAttribute('href')
      if (!link || link.dataset.live !== undefined || link.target === '_blank')
        return
      if (
        !href?.startsWith('/') ||
        href.startsWith('//') ||
        href.startsWith(prefix)
      )
        return
      event.preventDefault()
      router.push(`${prefix}${href === '/' ? '' : href}`)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [prefix, router])

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-300 px-4 py-2 text-sm text-amber-950">
      <span className="font-medium">Preview (draft)</span>
      <span aria-hidden>·</span>
      <a href={livePath} data-live className="underline underline-offset-2">
        View live
      </a>
    </div>
  )
}
