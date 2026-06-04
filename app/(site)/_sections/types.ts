import type { ServiceEntry, ServiceSection } from '@/headcode/types'

export type RenderableImage = {
  src: string
  alt: string
  blurDataURL?: string | null
} | null

export type SiteSectionProps<TData> = {
  data: TData
  headcode?: string
}

export type RenderSectionsProps = {
  entry: ServiceEntry
  sections: ServiceSection[]
  showHeroActions?: boolean
}
