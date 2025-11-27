'use cache'

import { Code } from '@/components/headcode/themes/custom/code'
import { Snippet } from '@/components/headcode/themes/custom/snippet'
import { Container } from '@/components/headcode/themes/vienna/container'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text } from '@/components/headcode/themes/vienna/text'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getSections } from '@/lib/headcode'
import { Fragment } from 'react/jsx-runtime'
import { AppSidebar } from './app-sidebar'

export default async function Docs({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const sections = await getSections('docs', slug)
  return (
    <Container className="mb-8 lg:mb-16">
      <SidebarProvider>
        <AppSidebar variant="floating" className="relative" />
        <SidebarInset>
          <div className="md:px-8 md:py-2">
            {sections.map((section) => (
              <Fragment key={section.id}>
                {section.name === 'text' && <Text sectionData={section.data} />}
                {section.name === 'code' && <Code sectionData={section.data} />}
                {section.name === 'snippet' && (
                  <Snippet sectionData={section.data} />
                )}
                {section.name === 'image' && (
                  <SingleImage sectionData={section.data} />
                )}
              </Fragment>
            ))}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Container>
  )
}
