import { getDefaultImage } from '@/lib/headcode/images'
import type { FeatureData } from './feature'
import type { FeaturesData } from './features'
import type { FooterData } from './footer'
import type { HeaderData } from './header'
import { HeaderMegaData } from './header-mega'
import type { HeroData } from './hero'
import type { TextData } from './text'
import { ImageData } from './image'

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

export const defaultFeatureText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Feature' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Feature section with image on one side and text content on the other. Use the "Image on Right" switch to toggle the image position. On mobile, the image is always displayed on top with text below.',
          },
        ],
      },
    ],
  },
}

export const defaultFeature: FeatureData = {
  title: 'AI-Powered Ticket Routing',
  subtitle:
    'Automatically categorize and assign incoming tickets to the right team members based on content and urgency.',
  tagline: 'Smart Automation',
  description: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Our intelligent routing system analyzes incoming support requests in real-time, using natural language processing to understand intent and sentiment.',
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
                  { type: 'text', text: 'Reduce first response time by 40%' },
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
                    text: 'Automatically prioritize urgent issues',
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
                  { type: 'text', text: 'Match tickets to agent expertise' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  link: {
    title: 'Learn More About Routing',
    url: '/products#routing',
    openInNewWindow: false,
  },
  image: getDefaultImage(
    'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2670&auto=format',
    'Team collaborating on customer support',
    2670,
    1780,
  ),
  imageRight: false,
}

export const defaultFeatureRight: FeatureData = {
  title: 'Customer Satisfaction Analytics',
  subtitle:
    'Track CSAT scores, response times, and resolution rates with beautiful, actionable dashboards.',
  tagline: 'Data-Driven Insights',
  description: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Get a complete picture of your support performance with comprehensive analytics. Identify trends, spot bottlenecks, and celebrate wins with your team.',
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
                  { type: 'text', text: 'Real-time performance dashboards' },
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
                  { type: 'text', text: 'Custom reporting and exports' },
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
                  { type: 'text', text: 'Team and individual metrics' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  link: {
    title: 'Explore Analytics',
    url: '/products#analytics',
    openInNewWindow: false,
  },
  image: getDefaultImage(
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format',
    'Analytics dashboard showing customer support metrics',
    2426,
    1617,
  ),
  imageRight: true,
}

export const defaultTextPreview: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Text' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Simple section of rich text content. It uses the Kibo-UI editor component which uses the TipTap WYSIWYG editor under the hood.',
          },
        ],
      },
    ],
  },
}

export const defaultTextPreviewText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Modern Customer Support Platform' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Our customer support platform helps teams deliver fast, reliable, and human support experiences.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'By bringing conversations, automation, and insights together, we enable support teams to focus on what matters most—helping customers succeed.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'The platform is designed for growing businesses that need scalable tools without added complexity.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Whether you support dozens or thousands of customers, our products adapt to your workflows and channels.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Core Products' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Our product suite covers the full customer support lifecycle, from first contact to resolution.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Each product works seamlessly together, creating a unified experience for agents and customers alike.',
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
                    text: 'Unified Inbox for managing all conversations in one place',
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
                    text: 'Knowledge Base for enabling fast, self‑service support',
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
                    text: 'Support Analytics for tracking performance and satisfaction',
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
            text: 'These tools reduce response times, improve collaboration, and provide actionable insights.',
          },
        ],
      },
    ],
  },
}

export const defaultImageText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Image' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Simple section with an image. The image is displayed full width and can be easily combined with text content.',
          },
        ],
      },
    ],
  },
}

export const defaultImage: ImageData = {
  image: getDefaultImage(
    'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2670&auto=format',
    'Team collaborating on customer support',
    2670,
    1780,
  ),
}

export const defaultFooterText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Footer' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Simple footer section with a company name and navigation links.',
          },
        ],
      },
    ],
  },
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

export const getDefaultBlogEntries = () => {
  return []
}
