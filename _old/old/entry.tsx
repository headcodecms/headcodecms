import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { SectionForm } from './section-form'
import { headcodeConfig } from '@/headcode.config'

export type Entry = {
  id: string
  namespace: string
  key: string
  title: string
  isDynamic: boolean
  version: string
}

async function getEntry(entryId: string, version: string): Promise<Entry> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    id: '1',
    namespace: 'global',
    key: 'homepage',
    title: 'Homepage',
    isDynamic: true,
    version: 'v02',
  }
}

export async function Entry({
  entryId,
  sectionId,
}: {
  entryId: string
  sectionId: string | null
}) {
  const entry = await getEntry(entryId, headcodeConfig.version)

  return (
    <>
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

      <Separator className="my-6" />

      <Suspense fallback={<Skeleton className="h-36 w-full" />}>
        <SectionForm entryId={entryId} sectionId={sectionId} entry={entry} />
      </Suspense>
    </>
  )
}
