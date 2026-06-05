# Headcode CMS Homepage, Docs, and llms.txt Working Draft

Status: working document  
Purpose: shape the public story for Headcode CMS before turning it into CMS content, page sections, docs, and `llms.txt`.

This document is intentionally not final marketing copy. It is a place to keep the thinking visible in source control while the homepage, docs, and agent-facing entry points evolve.

## North Star

Headcode CMS is an open-source CMS for small and medium websites that should be editable by both people and agents.

The core bet:

- The web is moving from human-only access to mixed human and agent access.
- Websites will still matter, but their audience will change.
- A CMS should expose structured content, source context, and simple editing surfaces for AI chat clients, coding agents, and humans.
- The best default is open source, agent-readable, easy to customize, and still pleasant for human visitors.

## Audience

### Primary

People who build and maintain websites for clients, products, agencies, studios, and small businesses.

They are tired of traditional CMS complexity, but still need structured content, publishing, image handling, and an ownership model that survives real projects.

### Secondary

Business owners, content editors, and small teams who want to update text and images through their preferred AI chat client or a simple admin UI.

### Tertiary

Agents that need to understand the project, inspect the site, find source files, edit content, and answer questions for users.

## Working Thesis

WordPress became the default because it solved a real problem. But the shape of the problem is changing.

The next CMS is not only an admin UI for humans. It is a content system with:

- a public website for humans,
- markdown and structured content for agents,
- an MCP interface for AI chat clients,
- source code that coding agents can inspect and modify,
- and a simple admin UI for cases where clicking is still the fastest path.

Headcode CMS is built for that transition.

## Access Model Shift

Today, many teams still think in desktop and mobile traffic:

- 30% desktop
- 70% mobile

The exact percentages will be wrong. The direction is the point: agents become a real audience, not an edge case.

Working prediction:

| Phase | Agents | Mobile Humans | Desktop Humans | Total Human Access |
| --- | ---: | ---: | ---: | ---: |
| Today | 0% | 70% | 30% | 100% |
| 2026 | 40% | 40% | 20% | 60% |
| Soon after | 50% | 30% | 20% | 50% |
| Later | 70% | 20% | 10% | 30% |

This prediction changes homepage priorities. The homepage still needs to explain the product to a person, but it also needs to expose enough structure for an agent to answer:

- What is this?
- Who is it for?
- How do I install it?
- Where is the source?
- How do I edit content?
- How do I customize the theme?
- Where are examples, pricing tables, markdown versions, and MCP tools?

## Landing Page Structure

### 1. Hero

Goal: explain why Headcode CMS exists, what it is, and what the visitor can expect.

The hero should question old CMS conventions. It does not need to look like a classic SaaS hero with a generic headline, paragraph, and button row. It should feel direct, opinionated, and honest.

#### Hero Direction A

WordPress sucks.

But what do you recommend instead? Sanity, Payload, Webflow?

I did not know what I wanted to use either, so I created Headcode CMS.

- Install it with an AI coding agent.
- Create themes with an AI coding agent.
- Update content with an AI chat client.
- Manual installation and a simple admin UI are also available.

Open source. Your data. Customize it to your needs.

CTA:

- Getting started
- Watch video

#### Hero Direction B

Agentic Web CMS

Vibe coding is how websites start. Headcode CMS is how they survive.

Install it with a simple prompt and manage your site through agents: structured content, MCP access, Markdown output, draft/live publishing, and content updates from your AI chat app.

CTA:

- Install with an agent
- Read the docs

#### Hero Direction C

Agentic Web CMS

Turn your vibe coded website into a full CMS project with one prompt.

Manage your site through agents: structured content, MCP access, Markdown output, draft/live publishing, and AI chat updates.

CTA:

- Install with an agent
- Read the docs

#### Hero Notes To Carry Forward

- Mention the practical stack somewhere close to the hero: TypeScript, Zod, Convex, Clerk, MCP, Next.js, and Vercel.
- Keep the founder angle: built from more than 20 years of website project experience and created together with Codex.
- Make it clear that clients can update text and images through their preferred AI chat client.
- Make it clear that creators can build and change themes with their preferred AI design or coding agent.
- Reinforce the target use case: small business websites with 10, 20, or 50 pages, not bloated enterprise CMS workflows.
- Keep the open-source point practical: the owner and their agent can inspect, fork, and customize the system.

#### Hero Questions To Resolve

- How sharp should the "WordPress sucks" opening be?
- Should the hero mention competing products by name?
- Should the hero lead with the philosophy or the practical product?
- Should the first viewport include the agent/human access prediction?
- Should the hero show a live demo surface instead of a traditional visual?

### 2. Demo

Goal: show what users get immediately after installing Headcode CMS.

Working intro:

This is what you get by default when installing Headcode CMS: a public demo website that is useful for humans, readable for agents, and ready to customize.

Demo building blocks:

- Blog: blog overview and post pages.
- Markdown support: every page can expose a markdown version for agents, or support `?md` on the URL.
- Quick admin access: `Command+K` on every page shows entries, globals, collections, and sections.
- Full MCP support: connect an AI chat client to the website and edit content.
- `llms.txt`: jump points for agents and LLM tool calls.
- Pricing table: important structured information available for humans and agents.
- Feature examples: short demos that show what can be inspected, edited, or reused.

Example link plan:

- Blog overview: demo blog URL
- Blog post: demo blog post URL
- Markdown page: demo page markdown URL
- MCP tools JSON: tools URL
- `llms.txt`: demo `llms.txt` URL
- Pricing table HTML: demo pricing URL
- Pricing table markdown: demo pricing markdown URL
- Pricing table prompt: prompt example for a chat client

### 3. Why Headcode CMS

Goal: explain the philosophy behind the project and the expected future of websites, CMSs, software development, and hosting.

This section can be longer and more essay-like than the hero. It should not hide the opinion. The point is not only "use this CMS"; the point is "the interface to websites is changing."

#### Future Of Web CMS Systems

Traditional admin UIs are becoming less central.

AI agents will increasingly use systems through chat clients, MCP tools, structured data, source code, and APIs. Humans clicking through a large admin UI will become less common. Admin UIs may still exist, but more like expert tools: somewhere between a raw database browser and a traditional CMS interface.

Headcode CMS keeps the admin UI simple and optional because the important future surface is not only the UI. It is the combination of structured content, source code, service boundaries, markdown output, and agent access.

#### New User Agent: Agent

The old split was desktop vs. mobile.

The new split includes agents.

The exact percentages will be wrong. The direction is the point: agents become a real audience, not an edge case.

Working prediction:

| Phase | Agents | Mobile Humans | Desktop Humans | Total Human Access |
| --- | ---: | ---: | ---: | ---: |
| Today | 0% | 70% | 30% | 100% |
| 2026 | 40% | 40% | 20% | 60% |
| Soon after | 50% | 30% | 20% | 50% |
| Later | 70% | 20% | 10% | 30% |

This means websites should be readable by people and actionable by agents.

#### Agents Do Not Need Translated Websites

Agents do not need the same translation model humans used.

If an agent can read the source language, understand the product, and answer in the user language, many translation workflows become less important. If a human visits the page directly, browser translation will keep improving.

The priority shifts from maintaining many language versions toward maintaining accurate, structured, source-of-truth content.

#### Websites Need More Business Information

Agent access changes what websites should publish.

A website should expose more useful business information:

- pricing tables,
- product offerings,
- service constraints,
- availability,
- location data,
- comparison information,
- policies,
- and other decision-making details.

This does not mean adding another chatbot popup. It means making the website itself more useful for agents that are helping customers make decisions.

#### Handmade Web Design Will Matter Differently

Designers may argue that every business needs a handmade website to stand out.

The counterargument: for many small and medium sites, AI-generated design that respects the brand and CI is enough. The greater value will be in content quality, structured business information, useful integrations, and agent-readable access.

The goal is not generic design. The goal is to spend more energy on what the website knows and can do.

#### Why Still Use A CMS?

Why not just let AI generate the website? Why not vibe code the site or vibe code a custom CMS?

Reasons:

- Every content change should not require a source-code change.
- Multiple editors need a controlled place to update content.
- Structured data, such as pricing tables, should stay structured.
- Different renderings of the same content matter, including HTML and markdown for agents.
- Draft and live versions matter. A team should prepare, verify, and publish intentionally.
- The system should be understandable enough for coding agents to customize safely.

Headcode CMS exists between static website generation and large CMS platforms.

#### Purpose Of Websites And Ads Will Change

Example: a homeowner wants solar energy.

Old model:

- Solar panel producers publish websites, SEO pages, Google Ads, and social ads to explain their technology and advantages.
- Local businesses publish websites, Google Business profiles, SEO pages, and ads to find local customers.

New model:

A person asks an AI chat client: "I want to add solar energy to my house. Here is an image and my basic requirements. What are the best options, what does it cost, and where can I get it?"

The agent then needs to inspect businesses, products, pricing, local availability, and trustworthy sources. Websites that are agent-readable and structured will be easier to recommend, compare, and act on.

#### Software Development And Hosting

The future of software development also changes.

Agents need native access to source code. Open source becomes a strong default because agents can inspect, modify, and explain the system. PaaS platforms that can run software modifications written by agents will become more important.

Development may move away from two-week feature cycles toward a continuous development stream on `main`, where agents and humans collaborate on small, inspectable changes.

Headcode CMS should reflect that future: source-available, forkable, easy to host, and designed for agent-assisted customization.

#### Conclusion

Headcode CMS was created primarily for my own projects.

I wanted a CMS for small websites with 10, 20, or 50 pages. I wanted clients to update content through AI chat clients or a simple admin UI. I wanted themes to be created and adjusted with coding agents. I wanted the source to stay understandable and open.

But I think it can be useful for others too.

Use it, fork it, extend it, and customize it. A forked version may stay small and focused. Another fork may become a multilingual website with 5,000+ pages. The point is that the system should be open enough for both paths.

## Docs Direction

The docs should not be traditional documentation only.

They should guide people into asking better questions in their AI chat client. The docs page can become a FAQ where the answers are prompts the user can paste into ChatGPT, Claude, Codex, or another AI tool.

### Agent Context At The Top

The docs should include a direct link to the GitHub source repository and a short map for agents.

Working structure:

- Source repository: GitHub URL
- Main CMS config: `headcode/config.ts`
- Sections: `headcode/sections.ts`
- Fields: `headcode/fields.ts`
- Defaults: `headcode/defaults.ts`
- Public site: `app/(site)/`
- Admin UI: `app/(admin)/`
- Convex services: `convex/services.ts`
- Schema validators: `convex/schema_validators.ts`
- Section data validation: `convex/section_validations.ts`
- MCP server and tools: source location to confirm
- Registry output: `registry.json` and public registry files

### FAQ As Prompt Library

Each FAQ item should answer the human briefly, then give a prompt they can paste into an AI chat client.

Example questions:

- How do I install Headcode CMS?
- How do I connect my AI chat client through MCP?
- How do I edit homepage content?
- How do I add a new section type?
- How do I customize the theme?
- How do I add a pricing table?
- How do I add a blog?
- How do I publish draft content to live?
- How do I inspect the markdown version of a page?
- How do I deploy this to Vercel?
- How do I extend authorization for Clerk organizations?
- How do I let an agent understand the project before changing it?

Example prompt pattern:

```text
I am working with Headcode CMS. Use the GitHub source repository and the project structure below to help me [task].

Repository: [GitHub URL]

Important files:
- headcode/config.ts
- headcode/sections.ts
- headcode/fields.ts
- headcode/defaults.ts
- convex/services.ts
- app/(site)/
- app/(admin)/

Please explain the change first, then propose the smallest safe implementation.
```

### Docs Tone

The docs should train users to collaborate with agents.

They should be:

- practical,
- prompt-first,
- source-aware,
- short enough to paste,
- and explicit about where the agent should look.

## llms.txt Direction

`llms.txt` should be the compressed agent entry point.

It should not replace the docs or homepage. It should point agents to the most important context and actions.

Working contents:

- What Headcode CMS is.
- Who it is for.
- Link to homepage.
- Link to docs.
- Link to GitHub source repository.
- Link to demo site.
- Link to markdown examples.
- Link to MCP tools JSON.
- Link to pricing table example.
- Short project map.
- Short instruction: prefer source and docs over assumptions.

Working draft:

```text
# Headcode CMS

Headcode CMS is an open-source, agent-readable CMS for small and medium websites. It combines a public Next.js site, Convex-backed content services, an optional admin UI, markdown output, and MCP access for AI chat clients and coding agents.

Start here:
- Homepage: [URL]
- Docs and prompt FAQ: [URL]
- Source repository: [GitHub URL]
- Demo site: [URL]
- MCP tools JSON: [URL]

Important source locations:
- headcode/config.ts: CMS configuration
- headcode/sections.ts: section definitions
- headcode/fields.ts: field definitions
- app/(site)/: public website
- app/(admin)/: admin UI
- convex/services.ts: service boundary
- convex/schema_validators.ts: shared Convex validators
- convex/section_validations.ts: section data validation

For agents:
- Prefer the docs, source repository, and service boundaries over assumptions.
- Use markdown page variants when available.
- Treat Headcode CMS as open-source software designed for customization by humans and agents.
```

## Open Questions

- What is the public GitHub repository URL?
- What is the public demo website URL?
- Which demo examples should exist before the new homepage launches?
- Should the homepage say "WordPress sucks" directly, or use a softer formulation?
- Should the homepage mention competitors by name?
- What video should the CTA point to?
- Should `llms.txt` live only at `/llms.txt`, or should there also be a visible human page explaining it?
- Should markdown variants use `?md`, `.md`, or both?
- Which docs prompts should be shipped first?

## Next Content Pass

1. Choose the hero direction and tone.
2. Fill in real URLs for demo, GitHub, video, and examples.
3. Convert the demo section into final homepage cards or rows.
4. Turn the docs direction into a prompt FAQ outline.
5. Turn the `llms.txt` direction into the actual public file.
6. Decide which parts should live in CMS content and which parts should stay in source.
