import {
  defaultBlogHero,
  defaultBlogMeta,
  defaultBlogText,
  defaultDocs,
  defaultFooter,
  defaultHeader,
  defaultHero,
  defaultHomeText,
  defaultImage,
  defaultImageTexts,
  defaultLlmsTxt,
  defaultLogos,
  defaultMeta,
  defaultPageHero,
  defaultPageMeta,
  defaultPageText,
  defaultPlans,
  defaultPricingHero,
  defaultPricingMeta,
  defaultPricingText,
} from './defaults'
import {
  blogMeta,
  code,
  footer,
  header,
  hero,
  image,
  imageText,
  llmsTxt,
  logos,
  meta,
  plans,
  snippet,
  text,
} from './sections'

export const headcodeConfig = {
  collections: [
    {
      slug: 'blog',
      description:
        'Blog posts with article metadata, a hero, a visual lead-in, and rich editorial body sections.',
      sections: [blogMeta, hero, image, text, imageText],
      defaults: [
        defaultBlogMeta,
        defaultBlogHero,
        defaultImage,
        defaultBlogText,
      ],
    },
    {
      slug: 'pages',
      description: 'General pages like about, contact, legal, and policies.',
      sections: [meta, hero, text, imageText, image],
      defaults: [defaultPageMeta, defaultPageHero, defaultPageText],
    },
  ],
  globals: [
    {
      slug: 'header',
      description: 'Shared public site header.',
      sections: [header],
      defaults: [defaultHeader],
    },
    {
      slug: 'footer',
      description: 'Shared public site footer.',
      sections: [footer],
      defaults: [defaultFooter],
    },
    {
      slug: 'llms',
      description: 'Agent-readable Markdown served from /llms.txt.',
      sections: [llmsTxt],
      defaults: [defaultLlmsTxt],
    },
    {
      slug: 'home',
      description: 'Homepage for the agentic web CMS marketing site.',
      sections: [meta, hero, logos, imageText, image, text],
      defaults: [
        defaultMeta,
        defaultHero,
        defaultLogos,
        ...defaultImageTexts,
        defaultImage,
        defaultHomeText,
      ],
    },
    {
      slug: 'pricing',
      description: 'Pricing page with plan cards and pricing FAQ copy.',
      sections: [meta, hero, plans, text],
      defaults: [
        defaultPricingMeta,
        defaultPricingHero,
        defaultPlans,
        defaultPricingText,
      ],
    },
    {
      slug: 'docs',
      description:
        'Documentation page with install snippets, feature rows, code examples, and next steps.',
      sections: [meta, hero, snippet, imageText, code, text],
      defaults: defaultDocs,
    },
  ],
}
