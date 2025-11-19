import type { Entry } from '@/lib/headcode/types'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '../../ui/button'
import { Separator } from '../../ui/separator'

export function EntryTitle({ entry }: { entry: Entry }) {
  return (
    <>
      <div>
        <div className="flex items-center gap-3">
          <Link
            href="/headcode"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            <ChevronLeftIcon />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Edit Sections</h2>
        </div>
        <p className="text-muted-foreground ml-12 flex items-center gap-2 text-sm">
          <span>
            <strong>Namespace:</strong> {entry.namespace}
          </span>
          <span>/</span>
          <span>
            <strong>Key:</strong> {entry.key}
          </span>
        </p>
      </div>
      <Separator className="my-6" />
    </>
  )
}
