import { getDefaultImage } from '@/lib/headcode/images'
import type { FeaturesData } from './features'
import type { FooterData } from './footer'
import type { HeaderData } from './header'
import { HeaderMegaData } from './header-mega'
import type { HeroData } from './hero'
import type { TextData } from './text'

export const defaultHeaderMegaText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'All Sections' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'On this page you find all section UI components provided by the Vienna theme. ',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Header with Mega Menu' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Header component with a logo and brand name on the left, and a mega menu. The menu is structured:',
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Products / Services: Mega Menu Item with an image and a list of related links with optional description',
                  },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Pages: Dropdown menu of dynamic entry pages. The dropdown list is generated from the pages meta data',
                  },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Blog' }] },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Sections: List of all section UI components of the Vienna theme you find on this page',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'On mobile the menu is accessible from a hamburger menu on the top.',
          },
        ],
      },
    ],
  },
}

export const defaultHeaderMega: HeaderMegaData = {
  logo: null,
  name: 'Helpstack',
  mega1Title: 'Products',
  mega1Image: getDefaultImage(
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=3552&auto=format',
    'Default Products Image',
    3552,
    2368,
  ),
  mega1ImageLink: {
    title: 'Products Overview',
    url: '/products',
    openInNewWindow: false,
  },
  mega1Links: [
    {
      link: {
        title: 'HelpDesk Central',
        url: '/products#helpdesk-central',
        openInNewWindow: false,
      },
      description:
        'Unified inbox managing tickets, chat, email, and social messages.',
    },
    {
      link: {
        title: 'Knowledge Base',
        url: '/products#knowledge-base',
        openInNewWindow: false,
      },
      description:
        'Self-service documentation platform reducing support requests and resolution times.',
    },
    {
      link: {
        title: 'Support Analytics',
        url: '/products#support-analytics',
        openInNewWindow: false,
      },
      description:
        'Insightful reports tracking response times, satisfaction, and agent performance.',
    },
  ],
  mega2Title: 'Services',
  mega2Image: getDefaultImage(
    'https://images.unsplash.com/photo-1553775282-20af80779df7?q=80&w=2670&auto=format',
    'Default Services Image',
    2670,
    1780,
  ),
  mega2ImageLink: {
    title: 'Services Overview',
    url: '/services',
    openInNewWindow: false,
  },
  mega2Links: [
    {
      link: {
        title: 'Support Setup',
        url: '/services#support-setup',
        openInNewWindow: false,
      },
      description:
        'We configure channels, automations, and workflows for support teams.',
    },
    {
      link: {
        title: 'Agent Training',
        url: '/services#agent-training',
        openInNewWindow: false,
      },
      description:
        'Hands-on training improving support quality and response consistency.',
    },
    {
      link: {
        title: 'Process Optimization',
        url: '/services#process-optimization',
        openInNewWindow: false,
      },
      description:
        'Refining support processes to improve efficiency and customer satisfaction.',
    },
  ],
  sections: [
    {
      link: {
        title: 'All Sections Types',
        url: '/sections',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Header (with Mega Menu)',
        url: '/sections#header-mega',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Header (with Simple Menu)',
        url: '/sections#header',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Hero',
        url: '/sections#hero',
        openInNewWindow: false,
      },
    },
  ],
}

export const defaultHeaderText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Header' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Simple header with a logo and brand on the left, and a list of navigation items on the right. On mobile the menu is accessible from a hamburger menu.',
          },
        ],
      },
      { type: 'paragraph' },
    ],
  },
}

export const defaultHeader: HeaderData = {
  logo: null,
  name: 'Helpstack',
  nav: [
    {
      link: {
        title: 'Products',
        url: '/products',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Services',
        url: '/services',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Pages',
        url: '/pages',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Blog',
        url: '/blog',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Sections',
        url: '/sections',
        openInNewWindow: false,
      },
    },
  ],
}

export const defaultHeroText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Hero' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Simple hero component with title, subtitle, and optionally a primary and secondary call to action button.',
          },
        ],
      },
    ],
  },
}

export const defaultHero: HeroData = {
  title: 'Welcome to Headcode CMS',
  subtitle:
    'Helpstack is a demo site for a SaaS helpdesk company. It is a perfect starting point to build your own Headcode CMS website.',
  primaryButton: {
    title: 'Headcode Admin',
    url: '/headcode',
    openInNewWindow: false,
  },
  secondaryButton: {
    title: 'Headcode Docs',
    url: 'https://headcodecms.com/docs',
    openInNewWindow: true,
  },
}

export const defaultFeaturesText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Features' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Display product features in boxes with an icon, title, description, and optionally a CTA link. On desktop 3 features are displayed in a grid row, and on mobile the features are displayed full width.',
          },
        ],
      },
    ],
  },
}

export const defaultFeatures: FeaturesData = {
  title: 'Customer Support, Simplified',
  subtitle:
    'Deliver fast, personal, and consistent support across every channel at scale.',
  tagline: 'Everything your support team needs',
  features: [
    {
      title: 'Unified Inbox',
      description:
        'Manage all customer conversations from email, chat, and social channels in one shared inbox.',
      icon: 'inbox',
      link: {
        title: 'Explore Unified Inbox',
        url: '#',
        openInNewWindow: false,
      },
    },
    {
      title: 'Smart Ticket Automation',
      description:
        'Automatically route, prioritize, and resolve tickets using powerful rules and workflows.',
      icon: 'refresh',
      link: {
        title: 'See Automation in Action',
        url: '#',
        openInNewWindow: false,
      },
    },
    {
      title: 'Self-Service Knowledge Base',
      description:
        'Create searchable articles and FAQs that help customers solve issues independently.',
      icon: 'book',
      link: {
        title: 'Build Your Knowledge Base',
        url: '#',
        openInNewWindow: false,
      },
    },
    {
      title: 'Real-Time Collaboration',
      description:
        'Collaborate with teammates using internal notes, assignments, and shared ticket ownership.',
      icon: 'users',
      link: {
        title: 'Improve Team Collaboration',
        url: '#',
        openInNewWindow: false,
      },
    },
    {
      title: 'Support Analytics',
      description:
        'Track response times, resolution rates, and customer satisfaction with actionable insights.',
      icon: 'chart',
      link: {
        title: 'View Analytics Dashboard',
        url: '#',
        openInNewWindow: false,
      },
    },
    {
      title: 'Scalable & Secure Platform',
      description:
        'Enterprise-grade security and infrastructure designed to scale with your business.',
      icon: 'shield',
      link: {
        title: 'Learn About Security',
        url: '#',
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

export const getDefaultPages = () => {
  return [
    {
      title: 'About Us',
      url: '/pages/about',
      openInNewWindow: false,
    },
    {
      title: 'Contact',
      url: '/pages/contact',
      openInNewWindow: false,
    },
  ]
}
