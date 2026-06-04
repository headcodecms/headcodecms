# Headcode CMS Homepage Research Notes And Add-Ons

Status: separate commentary for review  
Purpose: add research-backed observations, product-story ideas, and project-specific suggestions without changing the main working draft.

These notes are intentionally separate from `docs/homepage-agent-first-working-draft.md`. They are not final copy. They are a scan file for deciding what should move into the working draft later.

## Sources Scanned

Project context:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `headcode/config.ts`
- `headcode/sections.ts`
- `headcode/fields.ts`
- `headcode/defaults.ts`
- `headcode/utils.ts`
- `headcode/versions.ts`
- `app/(site)/_components/sections.tsx`
- `app/(site)/_components/markdown.tsx`
- `app/(site)/_components/entries-dialog.tsx`
- `app/(site)/_lib/headcode.ts`
- `app/sitemap.ts`
- `convex/services.ts`
- `convex/authorization.ts`

Web sources:

- Cloudflare, "AI consumability": https://developers.cloudflare.com/style-guide/how-we-docs/ai-consumability/
- OpenAI, "Power product discovery in ChatGPT": https://chatgpt.com/merchants/
- OpenAI, "Buy it in ChatGPT: Instant Checkout and the Agentic Commerce Protocol": https://openai.com/index/buy-it-in-chatgpt/
- OpenAI Help, "Shopping with ChatGPT Search": https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search
- Model Context Protocol docs: https://modelcontextprotocol.io/docs/getting-started/intro
- Cloudflare, managed `robots.txt` and AI crawler settings: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- HUMAN Security, "State of Agentic Traffic - April 2026": https://www.humansecurity.com/learn/blog/state-of-agentic-traffic-april-26/
- llms.txt reference site: https://llmtxt.info/

## High-Level Read

Your homepage direction is not only a taste preference. It lines up with visible shifts in the web:

- AI clients are becoming discovery, comparison, and action surfaces.
- Documentation platforms are already adding Markdown output, `llms.txt`, and "copy as Markdown" features.
- Commerce platforms are moving toward product feeds, structured metadata, and agent-mediated buying.
- Bot and agent traffic is becoming measurable enough that security vendors now report on agent categories, operators, and page intent.
- MCP is becoming a serious integration layer for connecting AI applications to tools, databases, files, and workflows.

The important nuance: the future is not "websites disappear." It is more likely "websites become source material, action surfaces, and trust anchors for agents and humans."

That is a good positioning space for Headcode CMS.

## Voice Update

The homepage should not try to convince everyone.

The goal is a founder standpoint: sharp, personal, early, and willing to be wrong. Headcode CMS does not need to sound like a neutral SaaS category page. It can sound like a public argument from someone who has built websites for more than 20 years, is tired of old CMS assumptions, and is willing to put a stake in the ground before the market has agreed on polite language.

This changes how to treat the provocative lines:

- Keep "WordPress sucks."
- Keep "Web Design is Dead."
- Do not soften every claim into industry-safe phrasing.
- Admit that some predictions will be wrong.
- Make the uncertainty part of the credibility: nobody knows the future, but waiting for consensus is not interesting.

Working principle:

> This is not conversion copy for everyone. It is a position paper that happens to have a CMS attached.

Another possible framing:

> I might be wrong about the percentages, the timing, and some details. But I do not think I am wrong about the direction.

## Strongest Positioning Angle

The strongest idea is not just "agentic CMS."

The stronger idea:

> Headcode CMS turns a small business website into a source of truth that humans can read and agents can use.

This avoids sounding like another AI wrapper. It says the website still matters, but its job changes.

Possible phrasing:

> The next website is not only a page. It is a source of truth for people, search engines, chat clients, and agents.

Or:

> Headcode CMS is a CMS for websites that are read by humans and operated through agents.

Or sharper:

> Your website is becoming an API for agents. Headcode CMS gives it a human face, structured content, markdown output, and controlled editing tools.

New strongest positioning candidate:

> Headcode CMS is for agents first. Mobile second. Desktop third.

This is strong because it compresses the whole thesis into one line. It is provocative, easy to repeat, and immediately questions the old responsive web hierarchy.

Useful variants:

> Headcode CMS is built for agents first, mobile second, and desktop third.

> Agents first. Mobile second. Desktop third.

The short version is best as a headline or manifesto line. The slightly longer version is better in body copy.

Important explanation to carry with it:

This does not mean humans are ignored. It means the design priority changes. Structured content, Markdown output, MCP access, source context, and clear business information become first-class surfaces. Mobile and desktop pages still matter, but they are no longer the only or primary way the website is used.

## What The Web Research Adds

### 1. Markdown Output Is A Real Pattern, Not A Gimmick

Cloudflare explicitly describes making docs visible to AI and easily consumed in plain-text format. Their approach includes `llms.txt`, `llms-full.txt`, per-page Markdown via `/index.md`, Markdown via `Accept: text/markdown`, and UI affordances for copying pages as Markdown.

Add-on for Headcode:

- Treat Markdown output as a first-class demo feature.
- Do not present it as a hidden nerd feature.
- Show a side-by-side mental model: same content as HTML for humans, Markdown for agents.
- Consider supporting both `?md` and a cleaner `.md` or `/index.md`-style route later.

Possible homepage copy:

> Every page should have two lives: a designed HTML version for humans and a compact Markdown version for agents.

### 2. `llms.txt` Should Be Positioned Carefully

The `llms.txt` reference site frames it as a root-level Markdown map for LLMs, but also says it is not a W3C/IETF standard and major model providers have not publicly committed to fetching it consistently.

Add-on for Headcode:

- Do not oversell `llms.txt` as "this makes agents find you."
- Position it as "an agent map you control."
- Pair it with sitemap, Markdown routes, source links, and MCP tools.

Possible copy:

> `llms.txt` is not magic SEO. It is a clear map for agents that already know your site, your docs, or your repository.

This is actually more credible and more interesting than pretending it is a ranking hack.

### 3. Product And Pricing Data Matter More Than Classic Brand Copy

OpenAI's merchant/product discovery pages emphasize product feeds, complete data, current pricing, availability, images, reviews, and merchant-controlled data. The help docs say product results may use structured metadata from first-party, third-party, and merchant-provided sources.

Add-on for Headcode:

- The pricing table demo is more important than it first looks.
- It should become a flagship example of agent-readable business content.
- Show HTML, Markdown, and "ask your AI this prompt" versions.
- For service businesses, this expands beyond products into offers, packages, constraints, process, locations, FAQs, and policies.

Possible homepage copy:

> Agents do not need another brand manifesto. They need accurate offers, prices, constraints, locations, policies, and next steps.

### 4. Agentic Commerce Supports Your Solar Example

OpenAI describes ChatGPT acting as a user's AI agent in commerce, securely passing information between user and merchant, while keeping the merchant in control of the customer relationship. Even if Headcode is not a commerce platform, this supports your broader point: agents are becoming mediators between user intent and business systems.

Add-on for Headcode:

- Use the solar example as a "service discovery" example, not only a "website traffic" example.
- Explain that the agent will compare options and needs structured, trustworthy information.
- Position Headcode as a good fit for local businesses, agencies, consultants, and productized services that need their offer understood by agents.

Possible copy:

> The old homepage persuades a visitor. The next homepage informs an agent that is helping a visitor decide.

### 5. Agent Traffic Is Already Operationally Different

HUMAN's April 2026 agentic traffic report says browser-based agents represented roughly 71% of observed activity across their top 10 agents, and that much agent activity touched product and search routes. Their framing is security/vendor-specific, so I would not use the exact numbers as universal truth. But the direction is useful: agents are becoming a distinct traffic class with questions of identity, authorization, and intent.

Add-on for Headcode:

- Your human/agent traffic prediction should be framed as a founder thesis, not a measured market fact.
- Add a line like "The exact percentages will be wrong; the direction matters."
- The product should eventually help site owners identify what is agent-facing, what is public, and what needs permission.

Possible copy:

> The exact percentages will be wrong. The direction is the point: agents become a real audience, not an edge case.

### 6. `robots.txt` Becomes Policy, Not Just Crawl Control

Cloudflare's AI crawler docs separate search, AI input, and AI training signals. They also say `robots.txt` expresses preferences and does not technically enforce access by itself.

Add-on for Headcode:

- Future Headcode could generate `robots.txt` and `llms.txt` together.
- The story should include both "please read this" and "please do not use this for that."
- Agent-readability needs a consent/policy surface.

Possible docs topic:

> How do I publish agent-readable content while controlling crawler and training preferences?

### 7. MCP Is The Editing And Action Layer

The official MCP docs describe MCP as an open-source standard for connecting AI applications to external systems such as data sources, tools, and workflows.

Add-on for Headcode:

- Landing page should distinguish read access from write access.
- `llms.txt`, sitemap, Markdown, and public pages help agents read.
- MCP helps authorized agents act.
- Clerk/auth protects editing and publishing.

Possible copy:

> Markdown helps agents understand the site. MCP lets authorized agents change it.

This sentence is simple and clarifies the architecture.

## Project-Specific Observations

### Headcode Already Has More Agent Semantics Than The Copy Says

The code has several agent-useful ideas that should become part of the story:

- `data-headcode` attributes attach entry and section metadata to rendered page regions.
- The Command-K entries dialog reads those attributes and creates quick edit links.
- Rich text is stored as Markdown strings.
- Site output is section-driven and service-backed.
- Draft/live routing is host-aware via `NEXT_PUBLIC_HEADCODE_VERSION` and draft hosts.
- Convex services are the boundary for site, admin, and MCP.
- Authorization is centralized in `convex/authorization.ts`.
- Defaults give a working site even before database content exists.
- The shadcn registry distribution makes installation feel like "copy this system into my project," which fits agent-assisted setup.

Add-on:

> Headcode pages are not just rendered. They are annotated. Every visible section can point back to the CMS entry and section that produced it.

That is a powerful difference from a generic CMS.

### Current Defaults Sound More SaaS Than Founder-Led

Current default copy uses phrases like "ship updates at the speed of thought," "edge-first," "paid plans," and "Team / Enterprise" pricing. Your new direction is more personal, open-source, and opinionated.

Recommendation:

- Make the homepage feel founder-built, not venture-SaaS.
- Keep practical proof: stack, open source, admin UI, MCP, demo site.
- Replace generic speed claims with concrete workflows.

Possible replacement direction:

> I did not want another CMS dashboard. I wanted content my clients could update with chat, source code my agents could change, and pages that agents could read without scraping around design noise.

### "Web Design Is Dead" Should Stay

Given the desired voice, "Web Design is Dead" should stay as a provocative section title or thesis line.

It should not mean visual presentation no longer matters. It should mean the old idea of web design as the primary value layer is dying. The classic agency model of obsessing over visual uniqueness, pixel-polished page layouts, and desktop/mobile compositions becomes less important when a growing share of the audience is agents reading structure, markdown, offers, policies, prices, and source context.

Useful distinction:

- Design as decoration is dying.
- Design as clarity, trust, structure, and interface still matters.
- Handmade visual design becomes less central for many 10, 20, or 50 page business websites.
- The scarce work moves toward content architecture, structured business information, agent-readable surfaces, and useful workflows.

Possible copy:

> Web Design is Dead. Not because websites stop needing taste, but because the page is no longer the only interface. Agents do not care about your hero animation. They care whether they can understand what you offer, what it costs, where it applies, and what to do next.

Another possible copy:

> The old web design business was built around pages. The next one is built around source-of-truth content that can render as a page, a markdown file, a prompt answer, a pricing table, or an agent action.

### "Admin UIs Are Dead" Should Stay, With Product Honesty

I like this provocation, and with the updated voice it should not be over-softened. The important thing is to make the meaning clear enough that it does not contradict the product.

Possible copy:

> Admin UIs are dead. Not gone, but demoted. The CMS dashboard is no longer the center of the content workflow. It becomes a control room for experts, while everyday edits move to chat, agents, and structured workflows.

This keeps the edge but matches your actual product, which still has an admin UI.

### "WordPress Sucks" Should Stay

"WordPress sucks" should stay because it is your voice and it clarifies that this is not a neutral comparison page.

The tradeoffs still exist, but they are acceptable if the goal is a public standpoint rather than maximum market coverage:

- It immediately creates a tribe.
- It will turn some people away.
- It may attract people who want a WordPress replacement for every WordPress use case.
- It risks becoming a rant unless the next lines quickly show the deeper thesis.

Recommendation:

- Keep the line.
- Move quickly from complaint to creation.
- Avoid spending too much time attacking WordPress itself.
- Use the frustration as the doorway into the future-of-agents thesis.

Possible sequence:

> WordPress sucks.
>
> But this is not really about WordPress.
>
> It is about the fact that websites are getting a new audience: agents.

Alternative sequence:

> WordPress sucks.
>
> But the bigger problem is that almost every CMS was built for humans clicking through dashboards. Headcode CMS is built for people and agents working together.

This keeps the bite and gets to the real argument fast.

## Suggested Additions To The Working Draft

### Add A "Read vs Act" Principle

This should become a central architecture/product principle:

- Public pages, sitemap, Markdown routes, and `llms.txt` are for reading.
- MCP and authenticated services are for acting.
- Draft/live versions let action stay reviewable.
- Clerk and authorization decide who can act.

Possible section:

> Agents need two kinds of access: read access to understand the website, and authorized tool access to change it. Headcode CMS keeps those separate.

### Add An "Agent Contract" Concept

Headcode can define an agent contract made of:

- `/llms.txt`
- `/sitemap.xml`
- Markdown versions of pages
- source repository link
- MCP tools JSON
- visible `data-headcode` section metadata
- docs prompts
- robots/content-signal policy

Possible copy:

> Headcode does not hide the website behind a dashboard. It publishes an agent contract: where the content lives, how to read it, how to edit it, and what rules apply.

### Add "Content Is Infrastructure"

This is maybe the deepest philosophy point.

Old CMS story:

- content is copy inside a design.

Headcode story:

- content is structured infrastructure used by pages, agents, prompts, markdown, feeds, and tools.

Possible copy:

> In the agentic web, content is not decoration for a page. It is infrastructure for decisions.

### Add A "Small Sites First" Constraint

This is important because it makes the product believable.

Headcode is not trying to beat every enterprise DXP. It is designed for 10, 20, or 50 page sites where the owner needs clarity, speed, source control, and agent assistance.

Possible copy:

> Headcode starts with the websites most businesses actually have: a homepage, a handful of pages, a blog, pricing or offers, and enough structure that an agent can understand what the business does.

### Add A "Why Open Source Matters More Now" Section

Your open-source point is stronger than "free."

Open source matters because agents can inspect and modify the implementation. Closed SaaS can expose APIs, but agents cannot reshape the product itself.

Possible copy:

> Open source is not only a license choice. It is an agent capability. If your coding agent can read the system, it can adapt the CMS to the project instead of forcing the project into the CMS.

### Add A "No Chatbot Popup" Principle

This is worth making explicit.

Possible copy:

> Agent-ready does not mean adding a chatbot popup. It means making the content, source, tools, and permissions understandable to the agents people already use.

## Possible Homepage Shape

This is a suggested information flow, not final copy:

1. Hero: Headcode CMS is for websites read by people and operated through agents.
2. Proof: Install with an agent, edit with chat, customize in source, publish with draft/live safety.
3. Demo: HTML page, Markdown page, `llms.txt`, MCP tools, pricing table, blog, Command-K admin access.
4. Philosophy: websites are becoming source material for agents.
5. Architecture: read surfaces vs action surfaces.
6. Why CMS still matters: structured content, versions, permissions, source control.
7. Open source: agents can adapt the system.
8. Getting started: install, inspect demo, connect MCP.

## Docs Add-Ons

The docs-as-prompt-FAQ idea is excellent. I would add these prompt categories:

- "Understand this project before changing it."
- "Install Headcode CMS in my existing Next.js app."
- "Create a new homepage section."
- "Add a new field type."
- "Expose a page as Markdown."
- "Create or update `llms.txt`."
- "Connect my AI chat client through MCP."
- "Review a draft and publish it."
- "Customize authorization for my Clerk organization."
- "Turn my business offer into structured content an agent can understand."
- "Generate an agent-readable pricing table."
- "Prepare this site for AI product or service discovery."

Docs page structure suggestion:

- Start with "For agents: source map."
- Then "For humans: paste these prompts."
- Then "For implementers: architecture and extension points."
- Then "For site owners: what to publish so agents can help customers."

## Demo Admin Access Idea

For the public demo site, use Clerk email magic link login so anyone can access `/admin` and inspect the admin UI.

Default demo users should be read-only:

- They can log in with email magic link.
- They can browse entries, globals, collections, sections, and field structure.
- They can see how the admin UI works.
- They cannot add, update, delete, reorder, publish, upload, or otherwise mutate content.

Write access should be enabled by explicit email allowlist only. Keep it simple: no organizations, no groups, no roles UI for the demo. Just a list of approved email addresses in the authorization layer.

If a read-only user attempts to save, the normal server-side auth/security layer should reject the action with a helpful message:

```text
This demo account is read-only. Please ask Headcode admin (markus@headcodecms.com) to get write access to the demo.
```

My take: this is a good idea.

Why it works:

- It lets interested people experience the admin UI without needing a private demo call.
- It turns demo access into light lead capture because email login collects addresses from people interested enough to enter the admin.
- It demonstrates the real auth boundary instead of hiding the admin behind screenshots.
- It keeps the implementation aligned with the current architecture because `convex/authorization.ts` is already the intended extension point.
- It avoids premature complexity: an email allowlist is enough for the demo.

Important product/UX detail:

The UI should probably make read-only mode visible before users press save. Relying only on an error after save is secure, but it can feel broken. A small read-only indicator or disabled mutation buttons would make the demo feel intentional. The server-side authorization error should still exist as the real enforcement layer.

Implementation note for later:

Use Clerk identity email in `convex/authorization.ts`. Keep `requireHeadcodeUser` open for login/read access, but make `requireHeadcodeWrite`, `requireHeadcodePublish`, and `requireHeadcodeMcp` require an approved email address for demo writes. The public demo can stay simple while real projects can still replace this with Clerk Organizations or custom authorization.

## llms.txt Add-Ons

The `llms.txt` file should be concise but more opinionated than a directory.

Suggested sections:

- What Headcode CMS is.
- Primary human pages.
- Agent-readable pages.
- Source repository and architecture.
- MCP/action endpoints.
- Demo flows.
- Policies and permissions.
- "Use this when answering questions about Headcode."

Potential addition:

```text
Headcode separates public read access from authenticated write access. Use public pages, markdown pages, sitemap.xml, and llms.txt to understand the site. Use MCP tools only when the user has authenticated and explicitly asks to inspect or change content.
```

## Product Ideas For Later

These are not needed for the first homepage, but they could become future roadmap items:

- Generate `llms.txt` from `headcodeConfig`, sitemap entries, and docs metadata.
- Generate `llms-full.txt` for the demo/docs site.
- Add `Accept: text/markdown` support for public pages.
- Add `.md` route variants for every page and collection entry.
- Add a "copy as Markdown" button to docs pages.
- Add a public "agent setup" page with MCP config snippets.
- Add structured "offer" or "pricing table" section types.
- Add a service/location schema for local-business examples.
- Add robots/content-signal generation so site owners can state AI crawler preferences.
- Add audit logs around MCP writes and publishes.
- Add an "agent preview" view that shows exactly what an agent sees: Markdown, metadata, tools, source map.

## Cautions

- Do not claim `llms.txt` guarantees LLM discovery.
- Do not claim exact future traffic percentages as fact. Keep them as a founder thesis.
- Be careful saying translations are dead. Better: translation workflows change because agents and browsers can translate more of the experience.
- If using "Web Design is Dead," define what died: page-first decorative design as the main value layer, not clarity, trust, interface, or taste.
- Avoid implying the admin UI is useless. Headcode's own admin UI is a useful expert/control surface.
- Avoid sanding everything down. The point is to sound like a person with a standpoint, not a committee.

## My Favorite One-Line Directions

- WordPress sucks.
- Web Design is Dead.
- Headcode CMS is for agents first. Mobile second. Desktop third.
- Agents first. Mobile second. Desktop third.
- The next website is a source of truth for people and agents.
- Markdown helps agents understand the site. MCP lets authorized agents change it.
- Agent-ready does not mean adding a chatbot popup.
- Content is no longer just page copy. It is infrastructure for decisions.
- Open source is an agent capability.
- WordPress solved the old web. Headcode CMS is for the next one.
- Your website is becoming an API for agents, with a human interface on top.
- The exact traffic percentages will be wrong. The direction is the point.

## Recommended Tone Decision

The tone decision is now clear:

1. Founder manifesto first.
2. Product proof immediately after.
3. Technical credibility underneath.

The page should lead with the edge: "WordPress sucks" and "Web Design is Dead" are allowed to be the doorways. Then the page should prove that the opinion is not empty provocation by showing the demo, architecture, source code, Markdown output, MCP access, and draft/live workflow.

The strongest stance:

> I am not trying to predict the future perfectly. I am trying to build for the direction I believe in.
