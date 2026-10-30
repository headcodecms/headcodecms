import type { Metadata } from 'next'

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

type Image = { src?: string; alt?: string; width?: unknown; height?: unknown }

// First image of a page (image or image-text section), used as its social preview.
export const firstImage = (sections: { data: unknown }[]) =>
  sections
    .map((section) => (section.data as { image?: Image | null }).image)
    .find((image) => image?.src)

// Title, description, canonical URL, Open Graph and Twitter card of a site page.
export const pageMetadata = ({
  title,
  description,
  path,
  image,
  type = 'website',
}: {
  title?: string
  description?: string
  path: string
  image?: Image | null
  type?: 'website' | 'article'
}): Metadata => {
  const images = image?.src
    ? [
        {
          url: image.src,
          alt: image.alt,
          width: Number(image.width) || undefined,
          height: Number(image.height) || undefined,
        },
      ]
    : undefined
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type, images },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images,
    },
  }
}

// Structured data for search engines and AI clients (schema.org JSON-LD).
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        '@context': 'https://schema.org',
        ...data,
      }).replace(/</g, '\\u003c'),
    }}
  />
)
