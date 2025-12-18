import type { HeaderData } from './header'
import type { FooterData } from './footer'
import type { HeroData } from './hero'
import type { FeaturesData } from './features'
import type { TextData } from './text'

export const defaultHeader: HeaderData = {
  logo: null,
  name: 'Headcode CMS',
  nav: [
    {
      link: {
        title: 'headcodecms.com',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Admin',
        url: '/headcode',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Docs',
        url: 'https://headcodecms.com/docs',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Pages',
        url: '/pages',
        openInNewWindow: false,
      },
    },
  ],
}

export const defaultFooter: FooterData = {
  company: '© 2026 Headcode CMS. All rights reserved.',
  nav: [
    {
      link: {
        title: 'Website',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Docs',
        url: 'https://headcodecms.com/docs',
        openInNewWindow: true,
      },
    },
  ],
  social: [
    {
      link: {
        title: 'Facebook',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
      icon: 'facebook',
    },
    {
      link: {
        title: 'Instagram',
        url: 'https://headcodecms.com/docs',
        openInNewWindow: true,
      },
      icon: 'instagram',
    },
  ],
}

export const defaultHero: HeroData = {
  title: 'Welcome to Headcode CMS',
  subtitle:
    'A minimalistic web content management system for Next.js. Start with editing content in the Headcode Admin.',
  primaryButton: {
    title: 'Headcode Admin',
    url: '/headcode',
    openInNewWindow: false,
  },
  secondaryButton: {
    title: 'Documentation',
    url: 'https://headcodecms.com/docs',
    openInNewWindow: true,
  },
}

export const defaultFeatures: FeaturesData = {
  title: 'Features',
  subtitle:
    'A minimalistic web content management system for Next.js. Start with editing content in the Headcode Admin.',
  tagline: 'Features',
  features: [
    {
      title: 'Feature 1',
      description:
        'Feature 1 lorem ipsum dolor sit amet. Consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      icon: 'cloud',
      link: {
        title: 'Feature 1',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      title: 'Feature 2',
      description:
        'Feature 2 lorem ipsum dolor sit amet. Consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      icon: 'refresh',
      link: {
        title: 'Feature 2',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      title: 'Feature 3',
      description:
        'Feature 3 lorem ipsum dolor sit amet. Consectetur adipiscing elit.',
      icon: 'settings',
      link: {
        title: 'Feature 3',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
  ],
}

export const defaultText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          },
        ],
      },
    ],
  },
}
