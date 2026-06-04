import {
  CheckboxField,
  DateTimeField,
  ImageField,
  LinkField,
  RichtextField,
  SelectField,
  TextareaField,
  TextField,
} from './fields'
import type { InferSectionData } from './types'

const iconOptions = [
  { label: 'None', value: 'none' },
  { label: 'Arrow Right', value: 'arrow-right' },
  { label: 'Book Open', value: 'book-open' },
  { label: 'Check', value: 'check' },
  { label: 'Database', value: 'database' },
  { label: 'Eye', value: 'eye' },
  { label: 'Layers', value: 'layers' },
  { label: 'Network', value: 'network' },
  { label: 'Newspaper', value: 'newspaper' },
  { label: 'Play Circle', value: 'play-circle' },
  { label: 'Rocket', value: 'rocket' },
  { label: 'Sparkles', value: 'sparkles' },
  { label: 'Workflow', value: 'workflow' },
  { label: 'Zap', value: 'zap' },
]

export const meta = {
  name: 'meta',
  label: 'Page Meta',
  description:
    'SEO title and description for pages, globals, and collection entries.',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
  },
}

export const header = {
  name: 'header',
  label: 'Site Header',
  description: 'Shared top navigation for the public site.',
  fields: {
    brand: TextField({
      label: 'Brand',
    }),
    navigation: [
      {
        navItem: LinkField({
          label: 'Navigation Item',
        }),
      },
    ],
    primaryLink: LinkField({
      label: 'Primary Link',
    }),
  },
}

export const footer = {
  name: 'footer',
  label: 'Site Footer',
  description: 'Shared footer content and navigation.',
  fields: {
    brand: TextField({
      label: 'Brand',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    navigation: [
      {
        navItem: LinkField({
          label: 'Navigation Item',
        }),
      },
    ],
    copyright: TextField({
      label: 'Copyright',
    }),
  },
}

export const hero = {
  name: 'hero',
  label: 'Hero',
  description:
    'Primary page introduction with eyebrow, headline, copy, and actions.',
  fields: {
    eyebrow: TextField({
      label: 'Eyebrow',
    }),
    eyebrowIcon: SelectField({
      label: 'Eyebrow Icon',
      options: iconOptions,
      defaultValue: 'none',
    }),
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    primaryButton: LinkField({
      label: 'Primary Button',
    }),
    secondaryButton: LinkField({
      label: 'Secondary Button',
    }),
  },
}

export const logos = {
  name: 'logos',
  label: 'Logo List',
  description: 'A compact list of technologies or partner logos.',
  fields: {
    eyebrow: TextField({
      label: 'Eyebrow',
    }),
    items: [
      {
        name: TextField({
          label: 'Name',
        }),
        iconPath: TextareaField({
          label: 'Icon Path',
        }),
      },
    ],
  },
}

export const imageText = {
  name: 'image-text',
  label: 'Image With Text',
  description: 'Feature row with image, copy, and call to action.',
  fields: {
    eyebrow: TextField({
      label: 'Eyebrow',
    }),
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    image: ImageField({
      label: 'Image',
    }),
    reversed: CheckboxField({
      label: 'Reverse Layout',
    }),
    action: LinkField({
      label: 'Action',
    }),
  },
}

export const image = {
  name: 'image',
  label: 'Image',
  description: 'Standalone visual section used in landing pages and articles.',
  fields: {
    image: ImageField({
      label: 'Image',
    }),
    alt: TextField({
      label: 'Alt Text',
    }),
    caption: TextField({
      label: 'Caption',
    }),
  },
}

export const text = {
  name: 'text',
  label: 'Text',
  description: 'Rich editorial content rendered as a prose section.',
  fields: {
    content: RichtextField({
      label: 'Content',
    }),
  },
}

export const llmsTxt = {
  name: 'llms-txt',
  label: 'llms.txt',
  description: 'Agent-readable Markdown content served from /llms.txt.',
  fields: {
    content: RichtextField({
      label: 'Content',
    }),
  },
}

export const plans = {
  name: 'plans',
  label: 'Pricing Plans',
  description: 'Pricing card content for the pricing page.',
  fields: {
    plans: [
      {
        name: TextField({
          label: 'Name',
        }),
        price: TextField({
          label: 'Price',
        }),
        cadence: TextField({
          label: 'Cadence',
        }),
        description: TextareaField({
          label: 'Description',
        }),
        features: [
          {
            feature: TextField({
              label: 'Feature',
            }),
          },
        ],
        cta: LinkField({
          label: 'Call to Action',
        }),
        featured: CheckboxField({
          label: 'Featured',
        }),
      },
    ],
    note: TextField({
      label: 'Note',
    }),
  },
}

export const snippet = {
  name: 'snippet',
  label: 'Install Snippet',
  description: 'Tabbed command snippets used on documentation pages.',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    icon: SelectField({
      label: 'Icon',
      options: iconOptions,
      defaultValue: 'none',
    }),
    tabs: [
      {
        value: TextField({
          label: 'Value',
        }),
        label: TextField({
          label: 'Label',
        }),
        command: TextareaField({
          label: 'Command',
        }),
      },
    ],
  },
}

export const code = {
  name: 'code',
  label: 'Code Block',
  description: 'Tabbed source code examples for documentation pages.',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    files: [
      {
        value: TextField({
          label: 'Value',
        }),
        filename: TextField({
          label: 'Filename',
        }),
        language: TextField({
          label: 'Language',
        }),
        code: RichtextField({
          label: 'Code',
        }),
      },
    ],
  },
}

export const blogMeta = {
  name: 'blog-meta',
  label: 'Blog Meta',
  description:
    'Blog post metadata used for listing pages, SEO, and article heroes.',
  fields: {
    ...meta.fields,
    summary: TextareaField({
      label: 'Summary',
    }),
    category: SelectField({
      label: 'Category',
      options: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Product', value: 'product' },
        { label: 'Guides', value: 'guides' },
        { label: 'Migration', value: 'migration' },
      ],
      defaultValue: 'engineering',
    }),
    author: TextField({
      label: 'Author',
    }),
    publishedAt: DateTimeField({
      label: 'Published At',
    }),
    featured: CheckboxField({
      label: 'Featured',
    }),
    icon: SelectField({
      label: 'Icon',
      options: iconOptions,
      defaultValue: 'sparkles',
    }),
  },
}

export const sections = {
  meta,
  header,
  footer,
  hero,
  logos,
  imageText,
  image,
  text,
  llmsTxt,
  plans,
  snippet,
  code,
  blogMeta,
}

export type MetaData = InferSectionData<typeof meta.fields>
export type HeaderData = InferSectionData<typeof header.fields>
export type FooterData = InferSectionData<typeof footer.fields>
export type HeroData = InferSectionData<typeof hero.fields>
export type LogosData = InferSectionData<typeof logos.fields>
export type ImageTextData = InferSectionData<typeof imageText.fields>
export type ImageData = InferSectionData<typeof image.fields>
export type TextData = InferSectionData<typeof text.fields>
export type LlmsTxtData = InferSectionData<typeof llmsTxt.fields>
export type PlansData = InferSectionData<typeof plans.fields>
export type SnippetData = InferSectionData<typeof snippet.fields>
export type CodeData = InferSectionData<typeof code.fields>
export type BlogMetaData = InferSectionData<typeof blogMeta.fields>
