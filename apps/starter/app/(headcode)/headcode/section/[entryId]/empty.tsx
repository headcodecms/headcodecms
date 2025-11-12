import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Entry } from '@/db'
import { PlusIcon } from 'lucide-react'
import { DialogAddSection } from './dialogs'
import { SectionReference } from '@/components/headcode/form/form'

export function EmptySections({
  entry,
  sections,
}: {
  entry: Entry
  sections: SectionReference[]
}) {
  const sectionNames = sections.map((item) => ({
    name: item.section.name,
    label: item.section.label,
  }))

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
        <DialogAddSection entry={entry} sections={sectionNames} />
      </EmptyContent>
    </Empty>
  )
}
