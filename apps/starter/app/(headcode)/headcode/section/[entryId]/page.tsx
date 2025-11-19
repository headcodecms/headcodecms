import { Container } from '@/components/headcode/admin/container'
import { Header } from '@/components/headcode/admin/header'
import { EntryTitle } from '@/components/headcode/admin/titles'
import { getEntry } from '@/db'
import type { Role } from '@/lib/headcode/types'
import { requireRole } from '@/lib/auth'
import { getValidatedSections } from '@/lib/headcode/admin'
import { getConfigSectionNames } from '@/lib/headcode/config'
import { cacheTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { EmptySections } from './empty'

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
  'use cache'
  cacheTag(`/headcode/entries/${entryId}`)

  const sections = await getValidatedSections(entryId)
  if (sections.length > 0) {
    redirect(`/headcode/section/${entryId}/${sections[0].id}`)
  }

  const entry = await getEntry(entryId)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }
  const unpinnedSections = getConfigSectionNames(
    entry.namespace,
    entry.key,
    false,
  )
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
