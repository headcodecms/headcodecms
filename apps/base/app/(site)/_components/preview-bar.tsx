'use client'

import { Eye, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'

const dismissedKey = 'headcode-preview-toast'

const subscribe = () => () => {}
const wasDismissed = () => {
  try {
    return sessionStorage.getItem(dismissedKey) === '1'
  } catch {
    return false
  }
}

// A toast on every preview page. Closing it hides it for this tab; the tab
// stays in the draft. Internal links keep the preview prefix, so clicking
// around stays in the draft; "View live" leaves it.
export function PreviewBar({ token }: { token: string }) {
  const prefix = `/preview/${token}`
  const pathname = usePathname()
  const router = useRouter()
  // Hidden on the server; the browser knows whether this tab closed it.
  const dismissed = useSyncExternalStore(subscribe, wasDismissed, () => true)
  const [closed, setClosed] = useState(false)
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

  const close = () => {
    setClosed(true)
    try {
      sessionStorage.setItem(dismissedKey, '1')
    } catch {}
  }

  if (dismissed || closed) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role="status"
        className="bg-popover/80 text-popover-foreground animate-in fade-in slide-in-from-bottom-4 pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl border p-3 pl-4 shadow-lg backdrop-blur-md"
      >
        <Eye className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Preview</p>
          <p className="text-muted-foreground">
            You are viewing the unpublished draft.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={livePath} data-live />}
        >
          View live
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={close}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
