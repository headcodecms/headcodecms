import { Container } from '@/components/headcode/admin/container'
import { Header } from '@/components/headcode/admin/header'
import { EntryTitle } from '@/components/headcode/admin/titles'
import { getSection } from '@/db'
import type { Role } from '@/lib/headcode/types'
import { requireRole } from '@/lib/auth'
import { getValidatedSections } from '@/lib/headcode/admin'
import { redirect } from 'next/navigation'
import { Form } from './form'
import { Sidebar } from './sidebar'
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
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        <div className="col-span-1">
          <Sidebar
            entry={result.entry}
            sections={sections}
            sectionId={sectionId}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Form entry={result.entry} section={result.section} />
        </div>
      </div>
    </Container>
  )
}
