# Headcode CMS

**Headcode CMS** is a minimal, open‑source content management system built for **Next.js**. It installs directly into your project through the **shadcn registry** and integrates neatly with modern React + TypeScript workflows.

## Features
- **Next.js 16 + Cache Components** for modern performance  
- **shadcn/ui**‑based admin and UI components  
- **TanStack Forms** for structured content editing  
- **Drizzle ORM** for clean database access  
- **Better Auth** for authentication and users  
- **Open architecture** — install directly into your codebase  
- **Themes, Fields & Sections** via shadcn‑style registry  
- Built‑in **Admin Interface** for managing content  

## Getting Started

Headcode CMS and its components (themes, sections, fields …) are published as a **shadcn registry**. Install pieces with the CLI:

### Install the Starter
```bash
pnpm dlx shadcn@latest add https://headcodecms/r/starter.json
```

The starter installs:
- **Next.js 16**
- **shadcn/ui**
- **Headcode CMS Admin**
- **Vienna theme** (demo site)

Default stack:
- **SQLite (file)** database  
- **Better Auth** authentication  
- **File storage**

Good for local development. For production, use providers like [Turso Cloud](https://turso.tech) and [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob).


```env
LIBSQL_URL=<your‑database‑url>
LIBSQL_AUTH_TOKEN=<your‑auth‑token>
FILE_STORAGE_FOLDER=public/storage
```

## Database Setup
```bash
pnpm drizzle-kit push
# or using migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Project Structure

| App | Path | Description |
|:----|:------|:-------------|
| Admin | `app/(headcode)` | Headcode Admin interface |
| Demo Site | `app/(site)` | Example Vienna theme |

Remove default files to avoid conflicts:
```
app/layout.tsx
app/page.tsx
```
Keep `globals.css` for shadcn/ui styles.

Start the server:
```bash
pnpm dev
```
- Website → http://localhost:3000  
- Admin   → http://localhost:3000/headcode  

On first run you’ll create an administrator account.

## Configuration

Project structure lives in `headcode.config.ts`:

```ts
export const headcodeConfig: HeadcodeConfig = {
 version: 'v02',
 entries: [
  { 
    namespace: 'global', 
    key: 'nav', 
    sections:[
      { section: navSection, pinned: true }
    ] 
  },
  { 
    namespace: 'blog', 
    sections: [
      {section: metaSection, pinned: true},
      {section: heroSection},
      {section: textSection}
    ] 
  }
 ]
};
```

- **Entries**: pages / content items  
- **Sections**: content blocks  
- **Fields**: inputs ( Text, Textarea, Image …)  
- **Pinned sections**: cannot be deleted (e.g., meta data)

## Themes

Themes define reusable layouts and sections (Hero, Text, Features, Image, Footer …).

Installed themes live in  
```
components/headcode/themes/[theme-name]
```

## Create a Custom Section

```ts
export const heroSection = {
  name: 'hero',
  label: 'Hero Section',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    subtitle: TextareaField({
      label: 'Subtitle',
    }),
    primaryButton: LinkField({
      label: 'Primary Button',
    }),
  } satisfies Fields,
}
export type HeroData = InferSectionData<typeof heroSection.fields>

export function Hero({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(heroSection.fields, sectionData)

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.subtitle}</p>
      <Button href={data.primaryButton.url}>
        {data.primaryButton.title}
      </Button>
    </div>
  )
}
```

## Users and Roles
- **Admin** → manage content + users/roles  
- **User** → edit content  

Auth and sessions: **Better Auth**.

## Versioning
Clone content to new versions for campaigns or releases.

## Admin Interface

The Headcode CMS Admin Interface  is built with **shadcn/ui** + **TanStack Forms**. It builds forms from your `headcode.config.ts` schema automatically, single fields and arrays alike.

## How It Works
1. Define fields and sections in `headcode.config.ts`  
2. Admin renders matching forms  
3. Each Entry contains Sections, each Section contains Fields  
4. All data stored via Drizzle ORM in SQLite / Turso  

## Thank You

Headcode CMS is built on **Next.js**, **shadcn/ui**, **Tailwind CSS**, **TanStack**, **Drizzle ORM**, and **Better Auth**.  
Thanks to everyone in the open‑source community whose work made this possible.

## Contact
- Email: **markus@headcodecms.com**  
- X/Twitter: **[@headcodecms](https://x.com/headcodecms)**  
- GitHub Sponsors for support  

## Contribute
- Try it and share feedback  
- Star the repo ❤️  
- PRs welcome — keep it simple and readable  

## License
MIT License
