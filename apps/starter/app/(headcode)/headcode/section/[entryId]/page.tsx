import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { EntryTitle } from '@/components/headcode/titles'
import { getEntriesToSectionsWithNames, getEntry } from '@/db'
import { requireRole } from '@/lib/auth'
import { getUnpinnedSectionNames } from '@/lib/headcode/config'
import { getValidatedEntriesToSections } from '@/lib/headcode/entries'
import { redirect } from 'next/navigation'
import { EmptySections } from './empty'

export default async function Page({
  params,
}: {
  params: Promise<{ entryId: string }>
}) {
  const { entryId } = await params
  const entryIdInt = parseInt(entryId)

  const entryToSections = await getEntriesToSectionsWithNames(entryIdInt)
  if (entryToSections.length > 0) {
    redirect(`/headcode/section/${entryId}/${entryToSections[0].sectionId}`)
  }

  const validatedEntryToSections =
    await getValidatedEntriesToSections(entryIdInt)
  if (validatedEntryToSections.length > 0) {
    redirect(
      `/headcode/section/${entryId}/${validatedEntryToSections[0].sectionId}`,
    )
  }

  const entry = await getEntry(entryIdInt)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }
  const unpinnedSections = getUnpinnedSectionNames(entry.namespace, entry.key)
  if (unpinnedSections.length === 0) {
    throw new Error(
      `No unpinned sections found: ${entry.namespace} / ${entry.key}`,
    )
  }

  const { role } = await requireRole(['user', 'admin'])

  return (
    <Container>
      <Header role={role} />
      <EntryTitle entry={entry} />
      <EmptySections entry={entry} sectionNames={unpinnedSections} />
    </Container>
  )
}
