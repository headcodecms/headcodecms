import { Container } from '@/components/headcode/admin/container'
import { Header } from '@/components/headcode/admin/header'
import { EntryTitle } from '@/components/headcode/admin/titles'
import { getSection } from '@/db'
import type { Role } from '@/lib/headcode/types'
import { requireRole } from '@/lib/auth'
import { getValidatedSections } from '@/lib/headcode/admin'
import { redirect } from 'next/navigation'
import { SectionLayout } from './section-layout'
import { cacheTag } from 'next/cache'

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
  'use cache'
  cacheTag(`/headcode/entries/${entryId}`)
  cacheTag(`/headcode/sections/${sectionId}`)

  const result = await getSection(sectionId)
  if (!result) {
    redirect(`/headcode/section/${entryId}`)
  }
  const sections = await getValidatedSections(entryId)
  if (sections.length === 0) {
    throw new Error(`No sections found: ${entryId}`)
  }

  return (
    <Container>
      <Header role={role} />
      <EntryTitle entry={result.entry} />
      <SectionLayout
        entry={result.entry}
        sections={sections}
        sectionId={sectionId}
      />
    </Container>
  )
}
