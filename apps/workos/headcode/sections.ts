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
import type { InferFields } from './types'

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
    'SEO title and description of the page. Not visible on the page itself; used in search results, link previews, and browser tabs. One per page, keep it first.',
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
  description:
    'Logo text and main navigation links. Change it to add or rename menu items on every page.',
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
  description:
    'Brand, short text, and footer links on every page. Use it for legal links, contact, and secondary navigation.',
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
    'First impression of a page: one core message with eyebrow, headline, short copy, and up to two call-to-action buttons. Use once per page, at the top.',
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
  description:
    'Row of technology or partner logos (name and SVG icon). Builds trust right after the hero ("works with", "trusted by").',
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
  description:
    'Image next to a heading, copy, and an optional link. Use several in a row to explain features or steps; the the reversed option puts the image on the other side.',
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
  description:
    'Large standalone image with alt text and optional caption. Use it to break up long pages or show a screenshot.',
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
  description:
    'Rich text with headings, lists, links, and code. The main building block for articles, legal pages, and FAQs.',
  fields: {
    content: RichtextField({
      label: 'Content',
    }),
  },
}

export const llmsTxt = {
  name: 'llms-txt',
  label: 'llms.txt',
  description:
    'Markdown for AI agents, served at /llms.txt. Describe the site and link its most important pages.',
  fields: {
    content: RichtextField({
      label: 'Content',
    }),
  },
}

export const plans = {
  name: 'plans',
  label: 'Pricing Plans',
  description:
    'Pricing cards with name, price, short description, features, and a button per plan, plus optional small print.',
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
  description:
    'Shell commands in tabs (e.g. pnpm, npm, bun). Use it for install and setup steps in docs.',
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
  description:
    'Source code files in tabs with file names. Use it to show code examples in docs.',
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
    'Title, SEO description, summary, category, date, and featured flag of a blog post. Feeds the blog list, search results, and the article header. One per post, keep it first.',
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

export type MetaData = InferFields<typeof meta.fields>
export type HeaderData = InferFields<typeof header.fields>
export type FooterData = InferFields<typeof footer.fields>
export type HeroData = InferFields<typeof hero.fields>
export type LogosData = InferFields<typeof logos.fields>
export type ImageTextData = InferFields<typeof imageText.fields>
export type ImageData = InferFields<typeof image.fields>
export type TextData = InferFields<typeof text.fields>
export type LlmsTxtData = InferFields<typeof llmsTxt.fields>
export type PlansData = InferFields<typeof plans.fields>
export type SnippetData = InferFields<typeof snippet.fields>
export type CodeData = InferFields<typeof code.fields>
export type BlogMetaData = InferFields<typeof blogMeta.fields>
