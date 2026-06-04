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
  plans,
  snippet,
  text,
} from './sections'

export const defaultHeader = {
  name: header.name,
  data: {
    brand: 'Headcode',
    navigation: [
      {
        navItem: {
          title: 'Blog',
          url: '/blog',
          openInNewWindow: false,
        },
      },
      {
        navItem: {
          title: 'Docs',
          url: '/docs',
          openInNewWindow: false,
        },
      },
      {
        navItem: {
          title: 'Pricing',
          url: '/pricing',
          openInNewWindow: false,
        },
      },
    ],
    primaryLink: {
      title: 'Admin',
      url: '/admin',
      openInNewWindow: false,
    },
  },
}

export const defaultFooter = {
  name: footer.name,
  data: {
    brand: 'Headcode',
    description:
      'The content platform built for the agentic web. Model content as code, let agents draft and publish through MCP, and ship updates at the speed of thought.',
    navigation: [
      {
        navItem: {
          title: 'Blog',
          url: '/blog',
          openInNewWindow: false,
        },
      },
      {
        navItem: {
          title: 'Docs',
          url: '/docs',
          openInNewWindow: false,
        },
      },
      {
        navItem: {
          title: 'Pricing',
          url: '/pricing',
          openInNewWindow: false,
        },
      },
      {
        navItem: {
          title: 'Contact',
          url: '/pages/contact',
          openInNewWindow: false,
        },
      },
    ],
    copyright: '(c) 2026 Headcode. All rights reserved.',
  },
}

export const defaultMeta = {
  name: 'meta',
  data: {
    title: 'Headcode - Agentic Web CMS',
    description:
      'Headcode is the content platform built for the agentic web. Model content as code, let agents draft and publish through MCP, and ship updates at the speed of thought.',
  },
}

export const defaultHero = {
  name: hero.name,
  data: {
    eyebrow: 'Now in public beta',
    eyebrowIcon: 'zap',
    title: 'Agentic Web CMS',
    description:
      'Headcode is the content platform built for the agentic web. Model content as code, let agents draft and publish through MCP, and ship updates at the speed of thought.',
    primaryButton: {
      title: 'Getting Started',
      url: '/docs',
      openInNewWindow: false,
    },
    secondaryButton: {
      title: 'Watch intro video',
      url: '#intro',
      openInNewWindow: false,
    },
  },
}

export const defaultLogos = {
  name: logos.name,
  data: {
    eyebrow: 'Built with',
    items: [
      { name: 'Next.js', iconPath: '' },
      { name: 'Vercel', iconPath: '' },
      { name: 'Convex', iconPath: '' },
      { name: 'shadcn/ui', iconPath: '' },
      { name: 'Tailwind CSS', iconPath: '' },
      { name: 'React', iconPath: '' },
      { name: 'TypeScript', iconPath: '' },
    ],
  },
}

export const defaultImage = {
  name: image.name,
  data: {
    image: null,
    alt: '',
    caption: '',
  },
}

export const defaultImageTexts = [
  {
    name: imageText.name,
    data: {
      eyebrow: 'Schema as code',
      title: 'Composable content models',
      description:
        'Define entries, globals, and relations in TypeScript. Migrations are diffable, reviewable, and reversible - no more GUI drift between environments.',
      image: null,
      reversed: false,
      action: {
        title: 'Learn more',
        url: '/docs',
        openInNewWindow: false,
      },
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Agent-native',
      title: 'MCP endpoints out of the box',
      description:
        'Every workspace exposes a Model Context Protocol server so agents can read, draft, and publish content with the same permissions as your team.',
      image: null,
      reversed: true,
      action: {
        title: 'Read the docs',
        url: '/docs',
        openInNewWindow: false,
      },
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Live preview',
      title: 'See what the agent sees',
      description:
        'Draft changes stream into your running Next.js app in real time. Review agent-generated edits side-by-side with the rendered page before you publish.',
      image: null,
      reversed: false,
      action: {
        title: 'Open admin',
        url: '/admin',
        openInNewWindow: false,
      },
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Edge-first',
      title: 'Deploys on Vercel in seconds',
      description:
        'Zero-config deploys with edge caching and on-demand revalidation. Your content scales to zero when idle and to the edge when it matters.',
      image: null,
      reversed: true,
      action: {
        title: 'View pricing',
        url: '/pricing',
        openInNewWindow: false,
      },
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Realtime data',
      title: 'Powered by Convex',
      description:
        'A realtime database with end-to-end types and serverless functions. Collaborators and agents see the same document, updating as it changes.',
      image: null,
      reversed: false,
      action: {
        title: 'Explore architecture',
        url: '/docs',
        openInNewWindow: false,
      },
    },
  },
]

export const defaultHomeText = {
  name: text.name,
  data: {
    content: `## Why another CMS?

Because the last generation of content platforms was designed for humans clicking through forms, not for agents composing entire sites on your behalf.

Headcode treats \`content\` as a first-class dataset your agents can query, diff, and evolve. Every field has a schema, every change has a review, and every agent has a scoped identity.

### What you get on day one

- A typed content model that lives in your repo.
- An MCP server for every workspace, ready to wire into Claude or Cursor.
- Preview deployments that reflect agent drafts in real time.

> We shipped a 40-page marketing site in an afternoon by pairing Headcode with an agent. The humans just approved diffs.

Ready to build? [Open the admin](/admin) and create your first entry.`,
  },
}

export const defaultLlmsTxt = {
  name: llmsTxt.name,
  data: {
    content: `# Headcode CMS

> Headcode CMS is a Next.js, Convex, and Convex Auth content system for agent-assisted website editing.

## Summary

Headcode CMS provides structured website content, draft/live publishing, a human admin UI, and MCP tools for authenticated AI clients.

## Key Links

- [Homepage](/?md): Product overview and main positioning.
- [Documentation](/docs?md): Setup and usage documentation.
- [Pricing](/pricing?md): Plans and commercial information.
- [Blog](/blog): Articles and product notes.

## Editing

- [Admin](/admin): Human content editing UI protected by Convex Auth.
- [MCP](/mcp): Authenticated MCP endpoint for content updates.`,
  },
}

export const defaultPricingMeta = {
  name: 'meta',
  data: {
    title: 'Pricing - Headcode',
    description:
      'Start free, scale when your team is ready. Every plan ships with the same content engine - paid plans add collaboration, support, and compliance.',
  },
}

export const defaultPricingHero = {
  name: hero.name,
  data: {
    eyebrow: 'Pricing',
    eyebrowIcon: 'none',
    title: 'Simple, predictable pricing',
    description:
      'Start free, scale when your team is ready. Every plan ships with the same content engine - paid plans add collaboration, support, and compliance.',
    primaryButton: {
      title: 'Start for free',
      url: '/admin',
      openInNewWindow: false,
    },
    secondaryButton: {
      title: 'Talk to sales',
      url: '/pages/contact',
      openInNewWindow: false,
    },
  },
}

export const defaultPlans = {
  name: plans.name,
  data: {
    plans: [
      {
        name: 'Starter',
        price: '$0',
        cadence: 'forever, for one workspace',
        description:
          'Everything you need to evaluate Headcode and ship a small marketing site.',
        features: [
          { feature: '1 workspace' },
          { feature: 'Up to 3 collaborators' },
          { feature: '500 entries' },
          { feature: 'Edge delivery' },
          { feature: 'Community support' },
        ],
        cta: {
          title: 'Start for free',
          url: '/admin',
          openInNewWindow: false,
        },
        featured: false,
      },
      {
        name: 'Team',
        price: '$29',
        cadence: 'per editor, per month',
        description:
          'For teams shipping production sites with agents in the loop.',
        features: [
          { feature: 'Unlimited workspaces' },
          { feature: 'Unlimited collaborators' },
          { feature: 'Unlimited entries' },
          { feature: 'MCP server per workspace' },
          { feature: 'Draft branches and review' },
          { feature: 'Priority email support' },
        ],
        cta: {
          title: 'Start free trial',
          url: '/admin',
          openInNewWindow: false,
        },
        featured: true,
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        cadence: 'annual contract',
        description:
          'For organisations with compliance, scale, or self-hosting needs.',
        features: [
          { feature: 'Everything in Team' },
          { feature: 'Single sign-on (SAML / OIDC)' },
          { feature: 'Self-hosting and audit logs' },
          { feature: 'Custom DPA and security review' },
          { feature: 'Dedicated solutions engineer' },
          { feature: '99.95% uptime SLA' },
        ],
        cta: {
          title: 'Talk to sales',
          url: '/pages/contact',
          openInNewWindow: false,
        },
        featured: false,
      },
    ],
    note: 'Prices in USD. VAT may apply.',
  },
}

export const defaultPricingText = {
  name: text.name,
  data: {
    content: `## What is included in every plan

We do not gate the engine behind a paywall. The schema, the typed API, the admin UI, and the MCP server are part of every plan, including the free tier.

Paid plans add the things teams need once they leave a single workspace: more collaborators, draft branches with review, priority support, and the compliance surface enterprises need from a content platform.

### Common questions

- **Can I switch plans later?** Yes, upgrade or downgrade at any time. Changes prorate to the day.
- **Do agents count as editors?** No. Agents authenticate with their own scoped identity and do not consume an editor seat.
- **Is there an open source option?** The runtime and admin are open source. The hosted plans add the parts most teams do not want to operate themselves.
- **What about non-profits and education?** We offer 50% off Team plans for verified non-profits and accredited educational institutions.

Still have questions? [Reach out](/pages/contact).`,
  },
}

export const defaultDocsMeta = {
  name: 'meta',
  data: {
    title: 'Documentation - Headcode',
    description:
      'Install Headcode through your coding agent, the skills CLI, or by hand. Then point it at your collections and start shipping.',
  },
}

export const defaultDocsHero = {
  name: hero.name,
  data: {
    eyebrow: 'Docs',
    eyebrowIcon: 'book-open',
    title: 'Documentation',
    description:
      'Install Headcode through your coding agent, the skills CLI, or by hand. Then point it at your collections and start shipping.',
    primaryButton: {
      title: 'Install Headcode',
      url: '#install',
      openInNewWindow: false,
    },
    secondaryButton: {
      title: 'Open admin',
      url: '/admin',
      openInNewWindow: false,
    },
  },
}

export const defaultDocs = [
  defaultDocsMeta,
  defaultDocsHero,
  {
    name: text.name,
    data: {
      content: `## Fast local install

Use this path for a new local project with one shared live/draft version on \`http://localhost:3000\`. It is the preferred baseline for coding agents.

Before running Convex or auth commands, agents should ask:

- Does this directory already contain a Next.js/shadcn app?
- Should I use the standard site or adapt an existing design?
- Which Convex project should this app connect to?
- Which local URL should auth use as \`SITE_URL\`?
- Which admin emails are allowed?
- Which Resend sender and API key should magic links use?
- Should development test login and MCP bearer tokens be configured now?

\`\`\`bash
rm -f app/page.tsx app/layout.tsx
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
pnpm install
pnpm convex dev
\`\`\`

Keep Convex running until \`.env.local\` contains \`CONVEX_DEPLOYMENT\`, then run:

\`\`\`bash
pnpm dlx @convex-dev/auth
\`\`\`

Set the minimum Convex environment:

\`\`\`bash
pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com"
pnpm convex env set AUTH_RESEND_KEY "re_..."
pnpm convex env set AUTH_RESEND_FROM "Headcode <admin@example.com>"
pnpm convex env set SITE_URL "http://localhost:3000"
\`\`\`

\`pnpm dlx @convex-dev/auth\` creates \`JWT_PRIVATE_KEY\` and \`JWKS\`. If it prints manual steps, complete them before continuing.

Timing matters: run \`pnpm convex dev\` first so \`CONVEX_DEPLOYMENT\` and generated Convex files exist. Then run \`pnpm dlx @convex-dev/auth\`. Then set Convex env values. Run \`pnpm auth:token\` only when enabling development test login or MCP bearer tokens.

Start the app with \`pnpm dev\`, then open \`http://localhost:3000\` and \`http://localhost:3000/admin/login\`.

### Development agent login

After normal magic-link login works, browser-based coding agents can use the development-only test login:

\`\`\`bash
pnpm auth:token
pnpm convex env set HEADCODE_ENABLE_TEST_LOGIN true
pnpm convex env set HEADCODE_ADMIN_TEST_EMAIL "codex@example.com"
pnpm convex env set HEADCODE_ADMIN_TEST_TOKEN "the-generated-token"
pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com,codex@example.com"
\`\`\`

Add the matching public values to \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN=true
NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN=the-generated-token
\`\`\`

Do not enable server-side test-login variables in production.

### Future live configuration

For a production deployment with separate draft and live hosts:

\`\`\`env
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=preview.example.com,draft.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
\`\`\`

MCP access uses \`ALLOWED_MCP_TOKENS\` in both Convex and the Next.js environment. Use separate MCP client names for draft and live hosts, for example \`headcode-draft\` and \`headcode-live\`.`,
    },
  },
  {
    name: snippet.name,
    data: {
      title: 'Install with your coding agent',
      description:
        'Drop the install prompt into Claude Code, Cursor, or any MCP-aware agent. The agent reads your package manager, runs the install, and wires up the workspace.',
      icon: 'none',
      tabs: [
        {
          value: 'claude',
          label: 'Claude Code',
          command:
            'Install Headcode in this repo and wire up an empty workspace called "acme-marketing".',
        },
        {
          value: 'cursor',
          label: 'Cursor',
          command:
            '/headcode install - set up a new workspace called "acme-marketing".',
        },
        {
          value: 'codex',
          label: 'Codex',
          command:
            'Add Headcode to this project, create a workspace named "acme-marketing", and commit the config.',
        },
      ],
    },
  },
  {
    name: snippet.name,
    data: {
      title: 'Install a skill',
      description:
        'Skills extend Headcode with first-party recipes - image pipelines, redirects, sitemap generation. Install them with one command and the agent picks them up.',
      icon: 'none',
      tabs: [
        {
          value: 'claude',
          label: 'Claude Code',
          command: 'claude skill add @headcode/sitemap',
        },
        {
          value: 'cli',
          label: 'CLI',
          command: 'pnpm dlx headcode skill add @headcode/sitemap',
        },
      ],
    },
  },
  {
    name: snippet.name,
    data: {
      title: 'Manual installation',
      description:
        'Install Headcode from the shadcn registry, then run the Convex setup commands. This is the same path coding agents should use.',
      icon: 'none',
      tabs: [
        {
          value: 'pnpm',
          label: 'pnpm',
          command:
            'rm -f app/page.tsx app/layout.tsx && pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode && pnpm install',
        },
        {
          value: 'convex',
          label: 'Convex',
          command: 'pnpm convex dev # then run: pnpm dlx @convex-dev/auth',
        },
        {
          value: 'env',
          label: 'Env',
          command:
            'pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com" && pnpm convex env set AUTH_RESEND_KEY "re_..." && pnpm convex env set SITE_URL "http://localhost:3000"',
        },
      ],
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Architecture',
      title: 'Three layers, one source of truth',
      description:
        'A typed schema lives in your repo. The runtime exposes that schema as a typed API, an admin UI, and an MCP server. Every consumer reads the same model.',
      image: null,
      reversed: false,
      action: {
        title: 'Read more',
        url: '/docs',
        openInNewWindow: false,
      },
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Drafts and review',
      title: 'Agents draft, humans publish',
      description:
        'Writes land on a draft branch by default. Reviewers see the diff plus the rendered preview, then publish or reject. The same flow applies whether the author is human or agent.',
      image: null,
      reversed: true,
      action: {
        title: 'Open admin',
        url: '/admin',
        openInNewWindow: false,
      },
    },
  },
  {
    name: imageText.name,
    data: {
      eyebrow: 'Edge delivery',
      title: 'Cached at the edge, revalidated on publish',
      description:
        'Published content is cached at the edge. Publishing triggers tag-scoped revalidation so changes propagate in under a second without a full deploy.',
      image: null,
      reversed: false,
      action: {
        title: 'View pricing',
        url: '/pricing',
        openInNewWindow: false,
      },
    },
  },
  {
    name: code.name,
    data: {
      title: 'Configure your workspace',
      description:
        'config.ts is the entrypoint. Declare collections, globals, the preview URL, and any agent capabilities. Everything else is derived from this file.',
      files: [
        {
          value: 'config',
          filename: 'config.ts',
          language: 'typescript',
          code: `import { defineConfig } from 'headcode'

export default defineConfig({
  workspace: 'acme-marketing',
  globals: ['header', 'footer', 'homepage'],
})`,
        },
        {
          value: 'schema',
          filename: 'collections/blog.ts',
          language: 'typescript',
          code: `import { defineCollection, field } from 'headcode'

export const blog = defineCollection({
  name: 'blog',
  slug: field.slug({ from: 'title' }),
})`,
        },
      ],
    },
  },
  {
    name: snippet.name,
    data: {
      title: 'What you should run next',
      description:
        'A short checklist to confirm everything is wired correctly before you invite the rest of the team.',
      tabs: [
        {
          value: 'pnpm',
          label: 'pnpm',
          command: 'pnpm dlx headcode doctor',
        },
        {
          value: 'npm',
          label: 'npm',
          command: 'npx headcode doctor',
        },
      ],
    },
  },
  {
    name: text.name,
    data: {
      content: `## Where to go from here

[The blog](/blog) has deeper write-ups on the architecture decisions and the migration guides we hand to teams moving from a legacy CMS. [The admin](/admin) is where you spend your time once Headcode is running.

Stuck? [Open the contact page](/pages/contact).`,
    },
  },
]

export const defaultBlogMeta = {
  name: blogMeta.name,
  data: {
    title: 'Field notes from Headcode',
    description:
      'Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform.',
    summary:
      'Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform.',
    category: 'engineering',
    author: 'Headcode Team',
    publishedAt: Date.now(),
    featured: false,
    icon: 'newspaper',
  },
}

export const defaultBlogHero = {
  name: hero.name,
  data: {
    eyebrow: 'Blog',
    eyebrowIcon: 'newspaper',
    title: 'Field notes from Headcode',
    description:
      'Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform.',
    primaryButton: {
      title: 'Read article',
      url: '/blog',
      openInNewWindow: false,
    },
    secondaryButton: {
      title: 'View docs',
      url: '/docs',
      openInNewWindow: false,
    },
  },
}

export const defaultBlogText = {
  name: text.name,
  data: {
    content: `## Start writing

Use this space for the article body. Mix headings, paragraphs, lists, links, code, and quotes to match the public blog layout.`,
  },
}

export const defaultPageMeta = {
  name: 'meta',
  data: {
    title: 'General page - Headcode',
    description:
      'A general content page for about, legal, policy, and contact pages.',
  },
}

export const defaultPageHero = {
  name: hero.name,
  data: {
    eyebrow: '',
    eyebrowIcon: 'none',
    title: 'General page',
    description: 'A flexible page composed from reusable Headcode sections.',
    primaryButton: {
      title: 'Contact us',
      url: '/pages/contact',
      openInNewWindow: false,
    },
    secondaryButton: {
      title: 'Read docs',
      url: '/docs',
      openInNewWindow: false,
    },
  },
}

export const defaultPageText = {
  name: text.name,
  data: {
    content: `## Page content

Use rich text sections for about, legal, policy, and contact page copy.`,
  },
}
