import { buttonVariants } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'

type Entry = {
  id: string
  namespace: string
  key: string
  title: string
  isDynamic: boolean
}

async function getEntry(entryId: string, version: string): Promise<Entry> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return {
    id: '1',
    namespace: 'blog',
    key: 'getting-started',
    title: 'Getting Started',
    isDynamic: true,
  }
}

export async function SectionHeader({
  entryId,
  version,
}: {
  entryId: string
  version: string
}) {
  const entry = await getEntry(entryId, version)

  return (
    <div className="flex items-end justify-between gap-12">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Link
            href="/headcode"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            <ChevronLeftIcon />
          </Link>
          <span>{entry.title}</span>
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          {entry.namespace} / {entry.key}
        </p>
      </div>
    </div>
  )
}
