import { Container } from '@/components/headcode/themes/vienna/container'
import { Feature } from '@/components/headcode/themes/vienna/feature'
import { Features } from '@/components/headcode/themes/vienna/features'
import { Header } from '@/components/headcode/themes/vienna/header'
import { Hero } from '@/components/headcode/themes/vienna/hero'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text } from '@/components/headcode/themes/vienna/text'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { getDefaultSections } from '@/lib/headcode/config'
import { cacheTag } from 'next/cache'
import { Fragment } from 'react/jsx-runtime'
import { Iframe } from './iframe'
import { HeaderMega } from '@/components/headcode/themes/vienna/header-mega'
import { cn } from '@/lib/utils'
import { getDefaultPages } from '@/components/headcode/themes/vienna/defaults'
import { Footer } from '@/components/headcode/themes/vienna/footer'

export default async function AllSections() {
  'use cache'
  cacheTag('/headcode/entries/global/sections')

  const sections = getDefaultSections('global', 'sections')
  const pages = getDefaultPages()

  if (!sections) return null

  for (const section of sections) {
    if (section.name === 'text') {
      console.log('text section', section)
    }
  }

  return sections.map((section) => (
    <Fragment key={section.id}>
      {section.name === 'header-mega' && (
        <Resizable>
          <HeaderMega sectionData={section.data} pages={pages} />
        </Resizable>
      )}
      {section.name === 'header' && (
        <Resizable className="min-h-[100px]">
          <Header sectionData={section.data} />
        </Resizable>
      )}
      {section.name === 'hero' && (
        <Resizable>
          <Hero sectionData={section.data} />
        </Resizable>
      )}
      {section.name === 'features' && (
        <Resizable className="min-h-[800px]">
          <Features sectionData={section.data} />
        </Resizable>
      )}
      {section.name === 'feature' && (
        <Resizable className="min-h-[600px]">
          <Feature sectionData={section.data} />
        </Resizable>
      )}
      {section.name === 'text' && (
        <Container className="py-8 lg:py-16">
          <Text sectionData={section.data} />
        </Container>
      )}
      {section.name === 'textResizable' && (
        <Resizable className="min-h-[500px]">
          <Text sectionData={section.data} />
        </Resizable>
      )}
      {section.name === 'image' && (
        <Resizable>
          <SingleImage sectionData={section.data} />
        </Resizable>
      )}
      {section.name === 'footer' && (
        <Resizable className="min-h-[300px]">
          <Footer sectionData={section.data} />
        </Resizable>
      )}
    </Fragment>
  ))
}

const Resizable = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <Container className="py-4 lg:py-8">
      <ResizablePanelGroup
        orientation="horizontal"
        className={cn(
          'bg-muted min-h-[500px] w-full rounded-lg border py-5 pr-2 pl-5 md:min-w-[450px]',
          className,
        )}
      >
        <ResizablePanel defaultSize={99}>
          <div className="h-full w-full bg-white p-5">
            <Iframe className="h-full w-full">{children}</Iframe>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={1}>
          <div className="h-full w-full"></div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Container>
  )
}
