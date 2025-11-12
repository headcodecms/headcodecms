import { Form } from './form'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { SectionEntries } from './section-entries'
import { Entry } from './entry'

export type SectionEntry = {
  id: string
  entryId: string
  sectionId: string
  version: string
  title: string
  type: string
  pinned: boolean
  pos: number
}

async function getSectionEntries(
  entryId: string,
  version: string,
): Promise<SectionEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return [
    {
      id: '1',
      entryId: '1',
      sectionId: '1',
      version: 'v02',
      title: 'Hero Section',
      type: 'hero',
      pinned: true,
      pos: 1,
    },
    {
      id: '2',
      entryId: '1',
      sectionId: '2',
      version: 'v02',
      title: 'Hero Section 2',
      type: 'hero',
      pinned: false,
      pos: 2,
    },
    {
      id: '3',
      entryId: '1',
      sectionId: '2',
      version: 'v02',
      title: 'Hero Section 3',
      type: 'hero',
      pinned: false,
      pos: 3,
    },
  ]
}

export type Section = {
  id: string
  // pinned is only in section entries, not in section
  pinned: boolean
  version: string
  title: string
  type: string
  data: unknown
}

async function getSection(
  sectionId: string,
  version: string,
): Promise<Section> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return {
    id: '1',
    version,
    title: 'Hero Section',
    type: 'hero',
    pinned: false,
    data: {
      title: 'Hero Section',
      description: 'Hero Section Description',
    },
  }
}

export async function SectionForm({
  entryId,
  sectionId,
  entry,
}: {
  entryId: string
  sectionId: string | null
  entry: Entry
}) {
  const sectionEntries = await getSectionEntries(entryId, entry.version)
  if (sectionEntries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No sections found</EmptyTitle>
          <EmptyDescription>
            Create a new section to get started
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const currentSectionId = sectionId
    ? sectionEntries.find((section) => section.id === sectionId)?.id
    : sectionEntries[0].id
  if (!currentSectionId) throw new Error('Section not found')

  const section = await getSection(currentSectionId, entry.version)

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
      <div className="col-span-1 py-5">
        <SectionEntries
          sectionEntries={sectionEntries}
          sectionId={currentSectionId}
          entry={entry}
        />
      </div>
      <div className="col-span-1 md:col-span-2">
        <Form section={section} />
      </div>
    </div>
  )
}
