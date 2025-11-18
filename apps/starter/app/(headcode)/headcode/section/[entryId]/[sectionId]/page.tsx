import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { EntryTitle } from '@/components/headcode/titles'
import { getEntry, getSection, Role } from '@/db'
import { requireRole } from '@/lib/auth'
import { getValidatedEntriesToSections } from '@/lib/headcode/admin'
import { Form } from './form'
import { Sidebar } from './sidebar'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<{ entryId: string; sectionId: string }>
}) {
  const { entryId, sectionId } = await params
  const entryIdInt = parseInt(entryId)
  const sectionIdInt = parseInt(sectionId)

  const { role } = await requireRole(['user', 'admin'])

  return (
    <SectionPage
      role={role as Role}
      entryId={entryIdInt}
      sectionId={sectionIdInt}
    />
  )
}

export async function SectionPage({
  role,
  entryId,
  sectionId,
}: {
  role: Role
  entryId: number
  sectionId: number
}) {
  const entry = await getEntry(entryId)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }
  const result = await getSection(sectionId)
  if (!result) {
    redirect(`/headcode/section/${entryId}`)
  }
  const section = result.section
  const entriesToSections = await getValidatedEntriesToSections(entryId)
  if (entriesToSections.length === 0) {
    throw new Error(`No entries to sections found: ${entryId}`)
  }
  const canDelete =
    entriesToSections.find((item) => item.sectionId === sectionId)?.pinned ===
    false

  return (
    <Container>
      <Header role={role} />
      <EntryTitle entry={entry} />
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        <div className="col-span-1">
          <Sidebar
            entry={entry}
            entriesToSections={entriesToSections}
            sectionId={sectionId}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Form entry={entry} section={section} canDelete={canDelete} />
        </div>
      </div>
    </Container>
  )
}
