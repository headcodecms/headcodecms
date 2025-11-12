import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { SectionReference } from '@/components/headcode/form/form'
import { EntryTitle } from '@/components/headcode/titles'
import { getEntriesToSectionsWithNames, getEntry } from '@/db'
import { requireRole } from '@/lib/auth'
import {
  getConfigEntry,
  getValidatedEntriesToSections,
} from '@/lib/headcode/entries'
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
  const configEntry = getConfigEntry(entry.namespace, entry.key)
  if (!configEntry) {
    throw new Error(`Config entry not found: ${entry.namespace} / ${entry.key}`)
  }
  const unpinnedSections = configEntry.sections.filter(
    (section: SectionReference) => !section.pinned,
  ) as SectionReference[]
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
      <EmptySections entry={entry} sections={unpinnedSections} />
    </Container>
  )
}
