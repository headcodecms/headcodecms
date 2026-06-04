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
      description:
        'Used for the HTML title and search title links. Keep it concise, unique, and usually around 50-60 characters.',
    }),
    description: TextareaField({
      label: 'Description',
      description:
        'Used as the meta description and sometimes as the search snippet. Summarize the page in about 140-160 characters.',
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
      description: 'Short footer text shown below the brand.',
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
      description:
        'Main headline for this section. Keep it clear and scannable.',
    }),
    description: TextareaField({
      label: 'Description',
      description:
        'Supporting copy for the headline. One or two short sentences usually work best.',
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
          description:
            'SVG path data used by the logo icon renderer. Leave unchanged unless you are replacing the icon.',
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
      description:
        'Short supporting copy for this feature row. Keep it close to the image and action.',
    }),
    image: ImageField({
      label: 'Image',
      description:
        'Recommended 16:9 image, for example 1200x675px. Use a sharp image that supports the surrounding copy.',
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
      description:
        'Use a high-quality image relevant to the surrounding page content. Wide 16:9 images, for example 1200x675px, work well here.',
    }),
    alt: TextField({
      label: 'Alt Text',
      description:
        'Describe the image for accessibility and image search. Be specific and avoid keyword stuffing.',
    }),
    caption: TextField({
      label: 'Caption',
      description: 'Optional visible caption shown below the image.',
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
          description:
            'Visible price text, for example "$29", "Free", or "Custom".',
        }),
        cadence: TextField({
          label: 'Cadence',
          description:
            'Short billing note shown next to the price, for example "/month" or "one time".',
        }),
        description: TextareaField({
          label: 'Description',
          description: 'One concise sentence explaining who this plan is for.',
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
          description:
            'Highlights this plan visually as the recommended option.',
        }),
      },
    ],
    note: TextField({
      label: 'Note',
      description: 'Optional small print shown below the pricing cards.',
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
      description:
        'Short intro shown above the command tabs. Explain when to use this snippet.',
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
          description:
            'Stable tab key used internally, for example "pnpm" or "npm".',
        }),
        label: TextField({
          label: 'Label',
        }),
        command: TextareaField({
          label: 'Command',
          description: 'Shell command shown in the selected tab.',
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
      description:
        'Short intro shown above the code example. Explain what the example demonstrates.',
    }),
    files: [
      {
        value: TextField({
          label: 'Value',
        }),
        filename: TextField({
          label: 'Filename',
          description:
            'Displayed filename for the code tab, for example "headcode/config.ts".',
        }),
        language: TextField({
          label: 'Language',
          description:
            'Code fence language used for highlighting, for example "ts", "tsx", "bash", or "json".',
        }),
        code: RichtextField({
          label: 'Code',
          description:
            'Code shown in this example. Keep it focused and copy-paste friendly.',
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
      description:
        'Used on blog listing cards and article previews. Write one or two sentences.',
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
      description:
        'Publication date shown in article metadata and listing pages.',
    }),
    featured: CheckboxField({
      label: 'Featured',
      description: 'Highlights this post in listing views.',
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
