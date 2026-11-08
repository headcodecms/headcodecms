# Convert a website into a Headcode CMS site

You are a coding agent. Turn this website into a Headcode CMS site: the content moves into a database, people edit it in an admin, agents edit it over MCP, and the site looks exactly as before.

Work in the user's repo, on a new branch `headcode`. Follow the steps in order. The quality of the result depends on step 2, the section model. Spend most of your care there.

## 0. Rules

- **Same site.** Every page keeps its URL, its text, and its look. Change no design, no copy, no class names.
- **Content in the database, design in code.** Text, links, images, lists, and on/off choices are content. Layout, illustrations, animations, and colors are code; content picks them with a select.
- **Editors don't read code.** Every section and field has a label and a description a non-developer understands.
- **Ask the user only about the section model** (step 2) and accounts (step 3). Decide everything else with these rules.
- **Done means all checks in step 6 pass**, including the admin. Never report done with a failing check.

## 1. Inventory

1. Tag the current state: `git tag vibe-original`. Compare against this tag, never against your working copy.
2. List every route and what it is built from. Keep the table: in step 6 the sitemap must list every URL.

   | URL | Blocks |
   |---|---|
   | `/` | hero, problem (3 columns), story, how (3 steps), 3x image-text, deploy, cta |
   | `/blog/[slug]` | article header, rich text, read next |

3. For every block, mark what an editor would change: headline, button, a card in a list, a hidden on/off option. Everything else stays code.
4. Note repeated data in `lib/` or inline arrays (articles, docs, team, pricing). They become collections or lists.

## 2. Section model

Headcode content is built from **sections** (`headcode/sections.ts`) with **fields** (`headcode/fields.ts`). Pages are **entries**: a **global** (one page, for example `/`) or a **collection** entry (repeatable, for example `/blog/<slug>`; the entry `index` is the collection root `/blog`).

### Field rules

| In the design | Field | Not |
|---|---|---|
| Plain text, headline | `TextField` | |
| A paragraph | `TextareaField` | |
| Long formatted text (article body, docs) | `RichtextField` | |
| Text and a URL (button, nav item, text link) | `LinkField` | two text fields |
| An image | `ImageField` with the size in the description | a URL text field |
| Something that repeats (cards, logos, steps, footer columns) | `ListField({ label, description, fields })` | `card1Title`, `card2Title` |
| Groups of the same shape (cloud and self-hosted, monthly and yearly) | a list of that shape | prefixed fields `cloudTitle`, `selfTitle` |
| Grouped items (footer columns with links) | a nested `ListField` | a `group` text field and grouping by equal strings |
| A state (coming soon, recommended, numbered) | `CheckboxField` | comparing text: `status === 'Soon'` |
| A fixed choice (illustration, icon, logo, color theme, image side) | `SelectField` | free text |
| A format (number, percent, URL, phone) | `TextField` with a `validator`, the format in the description | a new field type |
| A date | `DateTimeField` | text |
| SEO title, description, share image | the section `meta`, on every page | own SEO fields per page type |

More rules:

- **Visible text is content.** A prefix like "Guide: " or "Read more" that the code adds belongs in the field value.
- **A checkbox never produces content.** `allFeatures: true` that renders a hardcoded `/features` link is a `LinkField`.
- **A name is a text field.** Name, role, and profile link are three fields, not a link whose title is the name.
- **One field, one thing.** A headline with one styled word keeps one field and a convention (see below), not three fields.
- **Values a computer can derive are not fields**, or are optional overrides: reading time, menu order fallback, excerpt.
- **No field that nobody will edit.** If a value never changes, it stays in code.
- **Reuse sections.** Three blocks with the same structure and different colors are one section with a `theme` select.
- **Every page section gets `theme` (if the design has color variants) and an optional `anchor`** when the site links to `#ids`.
- **Videos** are never stored. Use a text field for a Mux or YouTube URL.

### Conventions

- One accent word in a headline (italic, color): `*word*` in a `TextField`, rendered as `<em>`. Say it in the description:

  ```ts
  const accent = 'Wrap one word in *asterisks* to set it as the accent, for example "Give it a *real* CMS."'
  title: TextField({ label: 'Title', description: accent })
  ```

- Formats are a Zod validator on a text field. The message tells the editor what to type:

  ```ts
  const number = (message: string, pattern = /^\d*$/) => z.string().regex(pattern, message).default('')

  percent: TextField({
    label: 'Percent',
    description: 'Number from 0 to 100.',
    validator: number('A number from 0 to 100', /^(100|\d{1,2})$/),
  })
  ```

  Writes with invalid values are rejected with the field path, for example `Invalid scope section. data.legend.0.percent: A number from 0 to 100`.

- Selects get readable labels:

  ```ts
  const options = (values: Record<string, string>) =>
    Object.entries(values).map(([value, label]) => ({ value, label }))

  visual: SelectField({ label: 'Illustration', options: options({ agents: 'Agents read and edit', none: 'None' }), defaultValue: 'agents' })
  ```

### Descriptions

Agents choose sections by their description. Say what it looks like, what it is for, and when to use it.

```ts
// ❌
description: 'Hero section'
// ✅
description: 'First impression of the homepage: big headline, short lead, two buttons, and the live demo below. Use once, at the top.'
```

Field descriptions give the format or the size: `'16:9, for example 1200x675px.'`, `'About 140-160 characters.'`.

### Examples

From real conversions. Each one names the rule.

**Prefixed groups → list of one shape** (rule: groups of the same shape)

```ts
// ❌ 18 fields
hosting: { cloudLabel, cloudTitle, cloudText, cloudButton1, ..., selfLabel, selfTitle, selfText, ... }

// ✅ reorderable; the different look is a checkbox
hosting: {
  title, lead,
  options: ListField({
    label: 'Options',
    description: 'One card per hosting option. Reorder to change the order on the page.',
    fields: {
      recommended: CheckboxField({ label: 'Recommended', description: 'Wide card with icons.' }),
      label, title, text,
      items: ListField({ label: 'Benefits', fields: { icon: SelectField(...), title, text } }),
      buttons: ListField({ label: 'Buttons', fields: { logo: SelectField(...), link: LinkField(), soon: CheckboxField() } }),
    },
  }),
}
```

**Grouping by string → nested list** (rule: grouped items)

```ts
// ❌ renderer groups by equal strings
navigation: [{ group: TextField(), navItem: LinkField() }]

// ✅
columns: ListField({
  label: 'Columns',
  fields: {
    title: TextField({ label: 'Column' }),
    links: ListField({ label: 'Links', fields: { link: LinkField({ label: 'Link' }) } }),
  },
})
```

**Magic string → checkbox** (rule: a state)

```tsx
// ❌
{button.status === 'Soon' ? <Outline /> : <Solid />}
// ✅
soon: CheckboxField({ label: 'Coming soon', description: 'Outlined button.' })
```

**Checkbox that produces content → link** (rule: a checkbox never produces content)

```ts
// ❌ renders a hardcoded "All features" link to /features
allFeatures: CheckboxField({ label: 'Show all features link' })
// ✅
link: LinkField({ label: 'Text link', description: 'Optional link next to the button.' })
```

**Numbered fields → list** (rule: something that repeats)

```ts
// ❌
legendPercent1, legendLabel1, legendPercent2, legendLabel2
// ✅
legend: ListField({
  label: 'Legend',
  description: 'Usually two entries, for example 90% and 10%.',
  fields: { percent: TextField({ validator: ... }), label: TextField(), text: TextField() },
})
```

**Name hidden in a link → text fields** (rule: a name is a text field)

```ts
// ❌
person: LinkField({ label: 'Person' })   // title = name, url = profile
// ✅
name: TextField(), role: TextField(), profile: TextField({ validator: url })
```

**SEO per page type → one `meta`** (rule: SEO through `meta`)

```ts
// ❌ seoTitle in docs-meta, title in article-meta, meta on pages
// ✅ every entry may have `meta` { title, description, image }; article-meta and docs-meta keep only their own data and are the fallback
```

**Number as free text → validator** (rule: a format)

```ts
// ❌
order: TextField({ label: 'Order' })     // "first", "1.", " 2"
// ✅
order: TextField({ label: 'Order', description: 'Whole number, lower comes first.', validator: number('A whole number') })
```

**Hardcoded prefix → content** (rule: visible text is content)

```tsx
// ❌
<a>Guide: {link.title}</a>
// ✅ value "Guide: Vercel", renderer prints {link.title}
```

### Self-review

Before you write content or the seed, check the model against this list and fix what fails. Changing the model later costs a reseed.

- [ ] No field names with numbers or shared prefixes (`item1`, `cloudTitle`). They are lists.
- [ ] No renderer compares a text field to a fixed string.
- [ ] No text field holds a URL, number, or other format without a `validator`.
- [ ] No checkbox renders text or links that are not in a field.
- [ ] No visible text is hardcoded in a renderer (prefixes, "Read more", button text).
- [ ] Every section has a description that says what it looks like and when to use it.
- [ ] Every list is a `ListField` with a label; say in the description what one item is when the label alone is not clear.
- [ ] Every field with a format or size says it in the description.
- [ ] Sections with the same structure are one section.
- [ ] Every page can have `meta`; no other section has SEO fields.
- [ ] Every editor change you noted in step 1 is possible, and every list can be reordered.

Then show the user the model as a short table (entry, sections, the decisions you were unsure about) and ask for a go.

## 3. Install

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode -y --overwrite
```

Before:

- Move the site's routes out of `app/`, including `app/layout.tsx` and `app/page.tsx`. Headcode brings its own root layouts (`app/(site)/[version]/layout.tsx`, `app/(admin)/layout.tsx`); the routes come back as Headcode routes in step 4. Keep `app/globals.css`, components, and `public/`.
- With pnpm, allow builds in `pnpm-workspace.yaml` (`allowBuilds`): `esbuild`, `sharp`, `unrs-resolver`.

After:

- Without `--overwrite` the command waits for a prompt.
- Merge `next.config.ts` with the site's own config (React Compiler, Turbopack rules).
- Add `convex/_generated/**` to the ESLint `globalIgnores`.
- The admin has its own theme in `app/(admin)/admin.css`. Never import the site's `globals.css` there, and never change the admin theme to match the site.

Accounts: follow the Headcode `README.md` setup (Convex, WorkOS, `.env.local`). Without accounts, run Convex locally: `CONVEX_AGENT_MODE=anonymous pnpm convex dev`. It generates `convex/_generated`; typecheck and build need it.

## 4. Convert

1. `headcode/sections.ts`: the model from step 2.
2. `headcode/content.ts`: the current site's content as seed data, copied exactly (same text, same links). `headcode/config.ts`: globals and collections with descriptions and `seed`/`defaults`.
3. Renderers in `app/(site)/_sections`: reuse the site's markup and classes 1:1; only replace literals with field values. Keep illustrations as components, picked by the select value.
4. Markdown output (`?md`) for every section, from the same data.
5. Routes under `app/(site)/[version]/...`, same URLs as before. Read params inside `<Suspense>`.
6. `pnpm seed`. A seed with invalid values fails with the field path; fix the content, not the validator.

## 5. Copy the checks

Copy `scripts/parity.mts` and `scripts/mcp-smoke.mts` from Headcode `apps/vercel`, then:

```bash
pnpm add -D playwright-core @modelcontextprotocol/client
npm pkg set scripts.parity="node --env-file-if-exists=.env.local scripts/parity.mts" \
  scripts.mcp="node --env-file=.env.local scripts/mcp-smoke.mts" \
  scripts.seed="convex run seed:init"
echo /.parity/ >> .gitignore
```

The browser checks use the installed Google Chrome (`playwright-core`, channel `chrome`). If Chrome is missing, ask the user to install it; do not download browsers.

Run the original site on another port for the compare: `git worktree add ../original vibe-original`, install, and start it, for example on port 3456.

## 6. Checks

All must pass. Run them on the live host (`localhost:3000`) and the draft host (`draft.localhost:3000`).

| Check | How | Pass |
|---|---|---|
| Same site | `pnpm parity <url> --compare=http://localhost:3456`: text, title, and description of every page in the sitemap, and screenshots at 1440px and 390px | all pass (pixel diff < 0.1%) |
| CMS contract | `pnpm parity <url> --write` | all pass |
| Admin | `pnpm parity <url> --login` once (the user signs in), then `pnpm parity <url> --admin --write` | all pass |
| Code | `pnpm lint && pnpm typecheck && pnpm build` | pass |

A page missing in the sitemap is not compared: check that the sitemap lists every URL from step 1. Failed screenshots are saved in `.parity/compare/`; look at them before you change code. A difference the user asked for (a fixed link, a corrected typo) is fine; list it in the report.

The admin check is not optional. It proves the admin looks like stock Headcode (same theme, font, colors), lists all entries, and saves an edit that shows on the draft site. A user who installs Headcode and gets an ugly or broken admin never tries again.

When a check fails, fix the cause and run all checks again.

## 7. Retrospective

Write `headcode/convert-retro.md` before you report done:

```md
# Convert retro <date>

## Patterns not covered by convert.md
- <block>: <what you decided> → proposed rule: "<rule>"
  Example: <before/after, a few lines>

## Rules that were unclear or wrong
- <rule>: <what happened>

## Self-review fixes
- <what the checklist caught>

## User corrections
- <what the user changed in the model, and why>
```

Propose rules only, do not change this file. Each proposal needs an example from this site. Ask the user before you share the retro with the Headcode project.

## 8. Report

Tell the user, in short:

- the section model (entries and sections),
- the check results from step 6,
- what an editor can change now, with the admin and MCP URLs,
- the retro file.
