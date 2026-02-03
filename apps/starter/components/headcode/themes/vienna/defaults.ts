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
        title: 'All Sections',
        url: '/sections',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Header (Mega Menu)',
        url: '/sections#header-mega',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Header (Simple)',
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
    {
      link: {
        title: 'Features',
        url: '/sections#features',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Feature (Left)',
        url: '/sections#feature-9',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Feature (Right)',
        url: '/sections#feature-10',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Text',
        url: '/sections#text',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Image',
        url: '/sections#image',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Footer',
        url: '/sections#footer',
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
      title: 'Pricing',
      url: '/pages/pricing',
      openInNewWindow: false,
    },
    {
      title: 'Contact',
      url: '/pages/contact',
      openInNewWindow: false,
    },
  ]
}

// Page Defaults
export const defaultPageAboutHero: HeroData = {
  title: 'About Helpstack',
  subtitle:
    'We believe every customer deserves exceptional support. Our mission is to empower businesses with the tools they need to deliver fast, personal, and effective customer service.',
  primaryButton: {
    title: 'Meet Our Team',
    url: '#team',
    openInNewWindow: false,
  },
  secondaryButton: {
    title: 'Our Story',
    url: '#story',
    openInNewWindow: false,
  },
}

export const defaultPageAboutText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Our Story' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Helpstack was founded in 2020 by a team of customer support veterans who saw a gap in the market. Too many businesses were struggling with fragmented tools, slow response times, and frustrated customers. We set out to build something better.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Today, Helpstack serves over 2,000 companies worldwide, from fast-growing startups to Fortune 500 enterprises. Our platform handles millions of support interactions every month, helping businesses deliver the kind of customer experience that builds loyalty and drives growth.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Our Values' }],
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
                    marks: [{ type: 'bold' }],
                    text: 'Customer Obsession',
                  },
                  {
                    type: 'text',
                    text: ' — We practice what we preach. Every decision starts with asking how it will impact our customers.',
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
                    marks: [{ type: 'bold' }],
                    text: 'Radical Simplicity',
                  },
                  {
                    type: 'text',
                    text: ' — Complex problems deserve elegant solutions. We obsess over making our platform intuitive and powerful.',
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
                    marks: [{ type: 'bold' }],
                    text: 'Continuous Innovation',
                  },
                  {
                    type: 'text',
                    text: ' — The support landscape is always evolving. We stay ahead with cutting-edge AI and automation.',
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
                    marks: [{ type: 'bold' }],
                    text: 'Transparency',
                  },
                  {
                    type: 'text',
                    text: ' — We believe in honest communication with our customers, partners, and each other.',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'The Team' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'We are a remote-first team of 85 passionate individuals spread across 15 countries. United by our mission to transform customer support, we bring together expertise in engineering, design, customer success, and support operations.',
          },
        ],
      },
    ],
  },
}

export const defaultPagePricingHero: HeroData = {
  title: 'Enterprise-Grade Support',
  subtitle:
    'Helpstack scales with your business. Get a custom plan tailored to your team size, support volume, and specific requirements.',
  primaryButton: {
    title: 'Contact Sales',
    url: '/pages/contact',
    openInNewWindow: false,
  },
  secondaryButton: {
    title: 'Book a Demo',
    url: '/demo',
    openInNewWindow: false,
  },
}

export const defaultPagePricingFeature: FeatureData = {
  title: 'Custom Plans for Every Business',
  subtitle:
    'Our sales team will work with you to create a pricing plan that fits your unique needs and budget.',
  tagline: 'Tailored Solutions',
  description: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Every business is different. Whether you are a growing startup or an established enterprise, we offer flexible pricing that scales with your support operations.',
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
                    text: 'Volume-based discounts for larger teams',
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
                    text: 'Flexible payment terms and billing cycles',
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
                    text: 'Custom integrations and dedicated support included',
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
                    text: 'SLA guarantees tailored to your requirements',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  link: {
    title: 'Get a Custom Quote',
    url: '/pages/contact',
    openInNewWindow: false,
  },
  image: getDefaultImage(
    'https://images.unsplash.com/photo-1553775282-20af80779df7?q=80&w=2670&auto=format',
    'Business meeting',
    2670,
    1780,
  ),
  imageRight: false,
}

export const defaultPagePricingText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'All Plans Include' }],
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
                  { type: 'text', text: 'Unlimited tickets and conversations' },
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
                    text: 'Email, chat, and social channel support',
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
                  { type: 'text', text: 'Mobile apps for iOS and Android' },
                ],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '99.9% uptime SLA' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'GDPR and SOC 2 compliance' }],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Frequently Asked Questions' }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Can I switch plans at any time?' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we will prorate your billing accordingly.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'What happens after my free trial?' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'After your 14-day free trial, you can choose to subscribe to any plan. If you decide not to continue, your account will be paused, but your data will be preserved for 30 days.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [
          { type: 'text', text: 'Do you offer discounts for nonprofits?' },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Yes, we offer a 50% discount for registered nonprofits and educational institutions. Contact our sales team to learn more.',
          },
        ],
      },
    ],
  },
}

export const defaultPageContactHero: HeroData = {
  title: 'Get in Touch',
  subtitle:
    'Have questions? We would love to hear from you. Our team typically responds within 24 hours on business days.',
  primaryButton: {
    title: 'Email Us',
    url: 'mailto:hello@helpstack.io',
    openInNewWindow: false,
  },
  secondaryButton: {
    title: 'Schedule a Demo',
    url: '/demo',
    openInNewWindow: false,
  },
}

export const defaultPageContactText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Contact Information' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'bold' }],
            text: 'General Inquiries',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'hello@helpstack.io',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'bold' }],
            text: 'Sales',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'sales@helpstack.io',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'bold' }],
            text: 'Support',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'support@helpstack.io',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Office Locations' }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'San Francisco (Headquarters)' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '123 Market Street, Suite 400\nSan Francisco, CA 94105\nUnited States',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'London' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '45 Shoreditch High Street\nLondon, E1 6JE\nUnited Kingdom',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Singapore' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '1 Raffles Place, #20-61\nSingapore 048616',
          },
        ],
      },
    ],
  },
}

export const getDefaultPageEntries = () => {
  const now = new Date()
  return [
    {
      entry: {
        key: 'about',
        namespace: 'pages',
        id: 1,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      sections: [
        {
          id: 1,
          name: 'hero',
          data: defaultPageAboutHero,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 0,
          entryId: 1,
        },
        {
          id: 2,
          name: 'text',
          data: defaultPageAboutText,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 1,
          entryId: 1,
        },
      ],
    },
    {
      entry: {
        key: 'pricing',
        namespace: 'pages',
        id: 2,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      sections: [
        {
          id: 3,
          name: 'hero',
          data: defaultPagePricingHero,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 0,
          entryId: 2,
        },
        {
          id: 4,
          name: 'feature',
          data: defaultPagePricingFeature,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 1,
          entryId: 2,
        },
        {
          id: 5,
          name: 'text',
          data: defaultPagePricingText,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 2,
          entryId: 2,
        },
      ],
    },
    {
      entry: {
        key: 'contact',
        namespace: 'pages',
        id: 3,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      sections: [
        {
          id: 6,
          name: 'hero',
          data: defaultPageContactHero,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 0,
          entryId: 3,
        },
        {
          id: 7,
          name: 'text',
          data: defaultPageContactText,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          pos: 1,
          entryId: 3,
        },
      ],
    },
  ]
}

export const getDefaultPageSections = (slug: string) => {
  const pageEntries = getDefaultPageEntries()
  const page = pageEntries.find((p) => p.entry.key === slug)
  return page ? page.sections : []
}

// Blog Meta Defaults
export const defaultBlogMeta1 = {
  title: 'How AI is Revolutionizing Customer Support',
  description:
    'Discover how artificial intelligence is transforming the way businesses handle customer inquiries, from chatbots to predictive analytics.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format',
    'AI and customer support visualization',
    2832,
    1888,
  ),
  author: 'Sarah Mitchell',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format',
    'Sarah Mitchell',
    256,
    256,
  ),
  date: new Date('2025-12-15'),
  category: 'best-practices',
  featured: true,
  readTime: '6 min read',
}

export const defaultBlogMeta2 = {
  title: '10 Tips for Reducing Support Ticket Volume',
  description:
    'Learn proven strategies to decrease incoming support tickets while improving customer satisfaction through self-service and proactive communication.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1553775282-20af80779df7?q=80&w=2670&auto=format',
    'Support team collaboration',
    2670,
    1780,
  ),
  author: 'James Chen',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format',
    'James Chen',
    256,
    256,
  ),
  date: new Date('2025-12-10'),
  category: 'best-practices',
  featured: false,
  readTime: '8 min read',
}

export const defaultBlogMeta3 = {
  title: 'Introducing Our New Analytics Dashboard',
  description:
    'We are excited to announce our completely redesigned analytics dashboard with real-time metrics, custom reports, and team performance insights.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format',
    'Analytics dashboard preview',
    2426,
    1617,
  ),
  author: 'Emily Rodriguez',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format',
    'Emily Rodriguez',
    256,
    256,
  ),
  date: new Date('2025-12-05'),
  category: 'product-updates',
  featured: true,
  readTime: '4 min read',
}

export const defaultBlogMeta4 = {
  title: 'Building a Knowledge Base That Customers Actually Use',
  description:
    'A comprehensive guide to creating, organizing, and maintaining a knowledge base that reduces support load and empowers customers.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format',
    'Knowledge base documentation',
    2574,
    1716,
  ),
  author: 'Michael Park',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format',
    'Michael Park',
    256,
    256,
  ),
  date: new Date('2025-11-28'),
  category: 'best-practices',
  featured: false,
  readTime: '10 min read',
}

export const defaultBlogMeta5 = {
  title: 'Customer Support Trends to Watch in 2026',
  description:
    'From omnichannel experiences to predictive support, explore the trends shaping the future of customer service.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=3552&auto=format',
    'Future of customer support',
    3552,
    2368,
  ),
  author: 'Sarah Mitchell',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format',
    'Sarah Mitchell',
    256,
    256,
  ),
  date: new Date('2025-11-20'),
  category: 'lifestyle',
  featured: false,
  readTime: '7 min read',
}

export const defaultBlogMeta6 = {
  title: 'New Integration: Connect Helpstack with Slack',
  description:
    'Seamlessly manage support tickets directly from Slack with our new native integration.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1611746872915-64382b5c76da?q=80&w=2940&auto=format',
    'Slack integration',
    2940,
    1960,
  ),
  author: 'Michael Torres',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format',
    'Michael Torres',
    256,
    256,
  ),
  date: new Date('2025-11-15'),
  category: 'product-updates',
  featured: false,
  readTime: '3 min read',
}

export const defaultBlogMeta7 = {
  title: 'Work-Life Balance Tips for Support Teams',
  description:
    'Practical strategies for maintaining well-being while delivering exceptional customer service.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2940&auto=format',
    'Work-life balance',
    2940,
    1960,
  ),
  author: 'Emily Chen',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format',
    'Emily Chen',
    256,
    256,
  ),
  date: new Date('2025-11-10'),
  category: 'lifestyle',
  featured: false,
  readTime: '5 min read',
}

export const defaultBlogMeta8 = {
  title: 'Remote Support: Setting Up Your Home Office',
  description:
    'Essential tips for creating a productive workspace for remote customer support professionals.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=2940&auto=format',
    'Home office setup',
    2940,
    1960,
  ),
  author: 'David Kim',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format',
    'David Kim',
    256,
    256,
  ),
  date: new Date('2025-11-05'),
  category: 'destinations',
  featured: false,
  readTime: '6 min read',
}

export const defaultBlogMeta9 = {
  title: 'Global Support Centers: Our New Singapore Office',
  description:
    'Expanding our presence in Asia-Pacific to provide 24/7 support coverage worldwide.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2940&auto=format',
    'Singapore office',
    2940,
    1960,
  ),
  author: 'Sarah Mitchell',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format',
    'Sarah Mitchell',
    256,
    256,
  ),
  date: new Date('2025-10-28'),
  category: 'destinations',
  featured: false,
  readTime: '4 min read',
}

export const defaultBlogMeta10 = {
  title: 'Lessons Learned from 10,000 Support Tickets',
  description:
    'Key insights and patterns we discovered after analyzing thousands of customer interactions.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2940&auto=format',
    'Data analysis',
    2940,
    1960,
  ),
  author: 'Michael Torres',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format',
    'Michael Torres',
    256,
    256,
  ),
  date: new Date('2025-10-20'),
  category: 'reflections',
  featured: false,
  readTime: '8 min read',
}

export const defaultBlogMeta11 = {
  title: 'Why We Rebuilt Our Ticket Routing System',
  description:
    'A behind-the-scenes look at our decision to redesign a core feature and what we learned.',
  heroImage: getDefaultImage(
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2940&auto=format',
    'Engineering decisions',
    2940,
    1960,
  ),
  author: 'Emily Chen',
  authorImage: getDefaultImage(
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format',
    'Emily Chen',
    256,
    256,
  ),
  date: new Date('2025-10-15'),
  category: 'reflections',
  featured: true,
  readTime: '9 min read',
}

// Default blog content sections
export const defaultBlogText1: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Artificial intelligence is no longer a futuristic concept—it is here, and it is fundamentally changing how businesses interact with their customers. From intelligent chatbots that handle routine inquiries to sophisticated analytics that predict customer needs before they arise, AI is becoming an indispensable tool in the customer support arsenal.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'The Rise of Conversational AI' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Modern AI-powered chatbots have evolved far beyond simple keyword matching. Using natural language processing (NLP) and machine learning, these systems can understand context, remember previous interactions, and provide genuinely helpful responses. The result? Faster resolution times and happier customers.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Companies implementing conversational AI report up to 70% reduction in routine inquiry handling time, allowing human agents to focus on complex issues that require empathy and critical thinking.',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [
          {
            type: 'text',
            text: 'Predictive Support: Solving Problems Before They Happen',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Perhaps the most exciting application of AI in customer support is predictive analytics. By analyzing patterns in customer behavior, product usage, and historical support data, AI can identify potential issues before customers even notice them.',
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
                    text: 'Proactive outreach based on usage patterns',
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
                    text: 'Automated health checks and recommendations',
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
                    text: 'Churn prediction and prevention strategies',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'The Human-AI Partnership' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'The goal of AI in customer support is not to replace human agents but to augment their capabilities. The most successful implementations create a seamless partnership where AI handles routine tasks and provides agents with real-time insights and suggestions.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'As we look to the future, the integration of AI into customer support will only deepen. Organizations that embrace these technologies thoughtfully—with a focus on both efficiency and customer experience—will find themselves with a significant competitive advantage.',
          },
        ],
      },
    ],
  },
}

export const getDefaultBlogEntries = () => {
  const now = new Date()
  return [
    {
      entry: {
        key: 'ai-revolutionizing-support',
        namespace: 'blog',
        id: 1,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta1,
        id: 1,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 1,
      },
    },
    {
      entry: {
        key: 'reduce-ticket-volume',
        namespace: 'blog',
        id: 2,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta2,
        id: 2,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 2,
      },
    },
    {
      entry: {
        key: 'new-analytics-dashboard',
        namespace: 'blog',
        id: 3,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta3,
        id: 3,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 3,
      },
    },
    {
      entry: {
        key: 'building-knowledge-base',
        namespace: 'blog',
        id: 4,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta4,
        id: 4,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 4,
      },
    },
    {
      entry: {
        key: 'support-trends-2026',
        namespace: 'blog',
        id: 5,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta5,
        id: 5,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 5,
      },
    },
    {
      entry: {
        key: 'slack-integration',
        namespace: 'blog',
        id: 6,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta6,
        id: 6,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 6,
      },
    },
    {
      entry: {
        key: 'work-life-balance-tips',
        namespace: 'blog',
        id: 7,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta7,
        id: 7,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 7,
      },
    },
    {
      entry: {
        key: 'home-office-setup',
        namespace: 'blog',
        id: 8,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta8,
        id: 8,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 8,
      },
    },
    {
      entry: {
        key: 'singapore-office',
        namespace: 'blog',
        id: 9,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta9,
        id: 9,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 9,
      },
    },
    {
      entry: {
        key: 'lessons-from-10000-tickets',
        namespace: 'blog',
        id: 10,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta10,
        id: 10,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 10,
      },
    },
    {
      entry: {
        key: 'rebuilt-ticket-routing',
        namespace: 'blog',
        id: 11,
        createdAt: now,
        updatedAt: now,
        version: 'v01',
      },
      section: {
        name: 'blog-meta',
        data: defaultBlogMeta11,
        id: 11,
        createdAt: now,
        updatedAt: now,
        pos: 0,
        pinned: true,
        entryId: 11,
      },
    },
  ]
}

export const getDefaultBlogSections = (slug: string) => {
  const now = new Date()
  // Find the matching blog meta by slug
  const blogMetas: Record<string, typeof defaultBlogMeta1> = {
    'ai-revolutionizing-support': defaultBlogMeta1,
    'reduce-ticket-volume': defaultBlogMeta2,
    'new-analytics-dashboard': defaultBlogMeta3,
    'building-knowledge-base': defaultBlogMeta4,
    'support-trends-2026': defaultBlogMeta5,
    'slack-integration': defaultBlogMeta6,
    'work-life-balance-tips': defaultBlogMeta7,
    'home-office-setup': defaultBlogMeta8,
    'singapore-office': defaultBlogMeta9,
    'lessons-from-10000-tickets': defaultBlogMeta10,
    'rebuilt-ticket-routing': defaultBlogMeta11,
  }

  const meta = blogMetas[slug] || defaultBlogMeta1

  // Return default sections for a blog post
  return [
    {
      id: 1,
      name: 'blog-meta',
      data: meta,
      pinned: true,
      createdAt: now,
      updatedAt: now,
      pos: 0,
      entryId: 1,
    },
    {
      id: 2,
      name: 'text',
      data: defaultBlogText1,
      pinned: false,
      createdAt: now,
      updatedAt: now,
      pos: 1,
      entryId: 1,
    },
  ]
}
