// check if sectionToEntry elements exist and are correct
// display section form

import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { EntryTitle } from '@/components/headcode/titles'
import { getEntry, getSection } from '@/db'
import { requireRole } from '@/lib/auth'
import { getValidatedEntriesToSections } from '@/lib/headcode/entries'
import { Form } from './form'
import { Sidebar } from './sidebar'

export default async function Page({
  params,
}: {
  params: Promise<{ entryId: string; sectionId: string }>
}) {
  const { entryId, sectionId } = await params
  const entryIdInt = parseInt(entryId)
  const sectionIdInt = parseInt(sectionId)

  const { role } = await requireRole(['user', 'admin'])

  const entry = await getEntry(entryIdInt)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }
  const section = await getSection(sectionIdInt)
  if (!section) {
    throw new Error(`Section not found: ${sectionId}`)
  }
  const entriesToSections = await getValidatedEntriesToSections(entryIdInt)
  if (entriesToSections.length === 0) {
    throw new Error(`No entries to sections found: ${entryId}`)
  }
  const canDelete =
    entriesToSections.find((item) => item.sectionId === sectionIdInt)
      ?.pinned === false

  return (
    <Container>
      <Header role={role} />
      <EntryTitle entry={entry} />
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        <div className="col-span-1">
          <Sidebar
            entry={entry}
            entriesToSections={entriesToSections}
            sectionId={sectionIdInt}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Form entry={entry} section={section} canDelete={canDelete} />
        </div>
      </div>
    </Container>
  )
}
