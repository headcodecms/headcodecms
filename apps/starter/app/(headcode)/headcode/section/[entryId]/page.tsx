import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { EntryTitle } from '@/components/headcode/titles'
import { getEntriesToSectionsWithNamesById, getEntry, Role } from '@/db'
import { requireRole } from '@/lib/auth'
import { getValidatedEntriesToSections } from '@/lib/headcode/admin'
import { getUnpinnedSectionNames } from '@/lib/headcode/config'
import { redirect } from 'next/navigation'
import { EmptySections } from './empty'
import { cacheTag } from 'next/cache'

export default async function Page({
  params,
}: {
  params: Promise<{ entryId: string }>
}) {
  const { entryId } = await params
  const entryIdInt = parseInt(entryId)

  const { role } = await requireRole(['user', 'admin'])

  return <EntryPage role={role as Role} entryId={entryIdInt} />
}

export async function EntryPage({
  role,
  entryId,
}: {
  role: Role
  entryId: number
}) {
  const entryToSections = await getEntriesToSectionsWithNamesById(entryId)
  if (entryToSections.length > 0) {
    redirect(`/headcode/section/${entryId}/${entryToSections[0].sectionId}`)
  }

  const validatedEntryToSections = await getValidatedEntriesToSections(entryId)
  if (validatedEntryToSections.length > 0) {
    redirect(
      `/headcode/section/${entryId}/${validatedEntryToSections[0].sectionId}`,
    )
  }

  const entry = await getEntry(entryId)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }
  const unpinnedSections = getUnpinnedSectionNames(entry.namespace, entry.key)
  if (unpinnedSections.length === 0) {
    throw new Error(
      `No unpinned sections found: ${entry.namespace} / ${entry.key}`,
    )
  }

  return (
    <Container>
      <Header role={role} />
      <EntryTitle entry={entry} />
      <EmptySections entry={entry} sectionNames={unpinnedSections} />
    </Container>
  )
}
