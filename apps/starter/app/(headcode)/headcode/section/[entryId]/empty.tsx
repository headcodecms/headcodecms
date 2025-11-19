import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import type { Entry } from '@/lib/headcode/types'
import type { SectionName } from '@/lib/headcode/types'
import { PlusIcon } from 'lucide-react'
import { DialogAddSection } from './dialogs'

export function EmptySections({
  entry,
  sectionNames,
}: {
  entry: Entry
  sectionNames: SectionName[]
}) {
  return (
    <Empty className="bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PlusIcon />
        </EmptyMedia>
        <EmptyTitle>
          Add a section to {entry.namespace} / {entry.key}
        </EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <DialogAddSection size="sm" entry={entry} sectionNames={sectionNames} />
      </EmptyContent>
    </Empty>
  )
}
