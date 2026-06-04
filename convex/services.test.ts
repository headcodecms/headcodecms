import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>
  }
).glob('./**/*.ts')

const createRawTest = () => convexTest({ schema, modules })

const createTest = () =>
  createRawTest().withIdentity({
    issuer: 'test',
    subject: 'test-user',
    tokenIdentifier: 'test|test-user',
  })

const stringify = (value: unknown) => JSON.stringify(value)
const waitForModificationTime = () =>
  new Promise((resolve) => setTimeout(resolve, 5))

describe('services', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  test('creates the initial draft/live version from the first write', async () => {
    const t = createTest()

    expect(await t.query(api.services.getVersionStatus, {})).toMatchObject({
      live: null,
      draft: null,
      shared: false,
      canPublish: false,
      canNewDraft: false,
    })

    expect(
      await t.query(api.services.getGlobals, { version: 'draft' }),
    ).toEqual([])

    await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    const draftGlobals = await t.query(api.services.getGlobals, {
      version: 'draft',
    })
    const liveGlobals = await t.query(api.services.getGlobals, {
      version: 'live',
    })

    expect(draftGlobals).toHaveLength(1)
    expect(liveGlobals).toHaveLength(1)
    expect(draftGlobals[0].slug).toBe('home')

    expect(await t.query(api.services.getVersionStatus, {})).toMatchObject({
      shared: true,
      canPublish: false,
      canNewDraft: true,
    })
  })

  test('creates, publishes, and replaces draft versions', async () => {
    const t = createTest()

    await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'live',
    })

    await t.mutation(api.services.newDraft, {})

    expect(await t.query(api.services.getVersionStatus, {})).toMatchObject({
      shared: false,
      canPublish: true,
      canNewDraft: false,
    })

    await t.mutation(api.services.publish, {})

    expect(await t.query(api.services.getVersionStatus, {})).toMatchObject({
      shared: false,
      canPublish: true,
      canNewDraft: false,
    })
  })

  test('requires authentication for write mutations', async () => {
    const t = createRawTest()

    await expect(
      t.mutation(api.services.ensureGlobal, {
        slug: 'home',
        version: 'draft',
      }),
    ).rejects.toThrow('Not authenticated.')
  })

  test('creates configured global default sections with validated data', async () => {
    const t = createTest()

    await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    const sections = await t.query(api.services.getGlobalSections, {
      slug: 'home',
      version: 'draft',
    })

    expect(sections?.map((section) => section?.name)).toEqual([
      'meta',
      'hero',
      'logos',
      'image-text',
      'image-text',
      'image-text',
      'image-text',
      'image-text',
      'image',
      'text',
    ])
    expect(sections?.[1]?.data).toMatchObject({
      eyebrow: 'Now in public beta',
      eyebrowIcon: 'zap',
      title: 'Agentic Web CMS',
    })
  })

  test('returns live site bundles with parsed sections', async () => {
    const t = createTest()

    await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'live',
    })
    await t.mutation(api.services.ensureGlobal, {
      slug: 'header',
      version: 'live',
    })
    await t.mutation(api.services.ensureGlobal, {
      slug: 'footer',
      version: 'live',
    })
    await t.mutation(api.services.addCollection, {
      slug: 'blog',
      name: 'Getting Started',
      version: 'live',
    })

    const home = await t.query(api.services.getGlobalWithSections, {
      slug: 'home',
      version: 'live',
    })
    const chrome = await t.query(api.services.getSiteChrome, {
      version: 'live',
    })
    const post = await t.query(api.services.getCollectionWithSections, {
      slug: 'blog',
      name: 'getting-started',
      version: 'live',
    })
    const posts = await t.query(api.services.getCollectionsWithSections, {
      slug: 'blog',
      version: 'live',
    })

    expect(home?.entry.slug).toBe('home')
    expect(home?.sections[0]?.data).toMatchObject({
      title: 'Headcode - Agentic Web CMS',
    })
    expect(chrome.header?.entry.slug).toBe('header')
    expect(chrome.footer?.entry.slug).toBe('footer')
    expect(post?.entry.name).toBe('Getting Started')
    expect(posts).toHaveLength(1)
  })

  test('adds valid section data and returns parsed data', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    const sectionId = await t.mutation(api.services.addSection, {
      name: 'hero',
      pos: BigInt(100),
      entry,
      data: stringify({
        eyebrow: 'Beta',
        eyebrowIcon: 'sparkles',
        title: 'Hello',
        description: 'World',
        primaryButton: {
          title: 'Start',
          url: '/admin',
          openInNewWindow: false,
        },
        secondaryButton: {
          title: 'Docs',
          url: '/docs',
          openInNewWindow: false,
        },
      }),
    })

    const section = await t.query(api.services.getSection, { id: sectionId })

    expect(section?.data).toEqual({
      eyebrow: 'Beta',
      eyebrowIcon: 'sparkles',
      title: 'Hello',
      description: 'World',
      primaryButton: {
        title: 'Start',
        url: '/admin',
        openInNewWindow: false,
      },
      secondaryButton: {
        title: 'Docs',
        url: '/docs',
        openInNewWindow: false,
      },
    })
  })

  test('fills missing fields and strips unknown fields', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    const sectionId = await t.mutation(api.services.addSection, {
      name: 'hero',
      pos: BigInt(100),
      entry,
      data: stringify({
        title: 'Only title',
        extra: 'skip me',
      }),
    })

    const section = await t.query(api.services.getSection, { id: sectionId })

    expect(section?.data).toEqual({
      eyebrow: '',
      eyebrowIcon: 'none',
      title: 'Only title',
      description: '',
      primaryButton: {
        title: 'Link',
        url: '',
        openInNewWindow: false,
      },
      secondaryButton: {
        title: 'Link',
        url: '',
        openInNewWindow: false,
      },
    })
  })

  test('logs invalid scalar and select values and falls back to defaults', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    const sectionId = await t.mutation(api.services.addSection, {
      name: 'hero',
      pos: BigInt(100),
      entry,
      data: stringify({
        title: 123,
        eyebrowIcon: 'missing-icon',
      }),
    })

    const section = await t.query(api.services.getSection, { id: sectionId })

    expect(section?.data).toMatchObject({
      title: '',
      eyebrowIcon: 'none',
    })
    expect(warn).toHaveBeenCalled()
  })

  test('rejects malformed JSON and unknown section names', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    await expect(
      t.mutation(api.services.addSection, {
        name: 'hero',
        pos: BigInt(100),
        entry,
        data: '{nope',
      }),
    ).rejects.toThrow('Section data must be valid JSON.')

    await expect(
      t.mutation(api.services.addSection, {
        name: 'unknown',
        pos: BigInt(100),
        entry,
        data: stringify({}),
      }),
    ).rejects.toThrow('Unknown section "unknown".')
  })

  test('rejects sections not configured for an entry', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })

    await expect(
      t.mutation(api.services.addSection, {
        name: 'header',
        pos: BigInt(100),
        entry,
        data: stringify({}),
      }),
    ).rejects.toThrow('Section "header" is not configured for entry "home".')
  })

  test('validates nested arrays and nested fallback values', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'header',
      version: 'draft',
    })

    const sectionId = await t.mutation(api.services.addSection, {
      name: 'header',
      pos: BigInt(100),
      entry,
      data: stringify({
        brand: 'Headcode',
        navigation: [
          {
            navItem: {
              title: 'Docs',
              url: '/docs',
              openInNewWindow: false,
              ignored: true,
            },
          },
          { navItem: { title: 123 } },
          'skip me',
        ],
        primaryLink: { title: 'Admin', url: '/admin' },
      }),
    })

    const section = await t.query(api.services.getSection, { id: sectionId })

    expect(section?.data).toEqual({
      brand: 'Headcode',
      navigation: [
        {
          navItem: {
            title: 'Docs',
            url: '/docs',
            openInNewWindow: false,
          },
        },
        {
          navItem: {
            title: 'Link',
            url: '',
            openInNewWindow: false,
          },
        },
      ],
      primaryLink: {
        title: 'Admin',
        url: '/admin',
        openInNewWindow: false,
      },
    })
    expect(warn).toHaveBeenCalled()
  })

  test('updates a section by revalidating stored data', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })
    const sectionId = await t.mutation(api.services.addSection, {
      name: 'text',
      pos: BigInt(100),
      entry,
      data: stringify({ content: 'Before' }),
    })

    await t.mutation(api.services.updateSection, {
      id: sectionId,
      name: 'text',
      pos: BigInt(100),
      entry,
      data: stringify({ content: 123, extra: true }),
    })

    const section = await t.query(api.services.getSection, { id: sectionId })

    expect(section?.data).toEqual({ content: '' })
    expect(warn).toHaveBeenCalled()
  })

  test('reorders sections without changing data', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })
    const first = await t.mutation(api.services.addSection, {
      name: 'text',
      pos: BigInt(1),
      entry,
      data: stringify({ content: 'First' }),
    })
    const second = await t.mutation(api.services.addSection, {
      name: 'text',
      pos: BigInt(2),
      entry,
      data: stringify({ content: 'Second' }),
    })

    await t.mutation(api.services.reorderSections, {
      sections: [
        { id: first, pos: BigInt(20) },
        { id: second, pos: BigInt(10) },
      ],
    })

    const sections = await t.query(api.services.getSections, { id: entry })

    expect(sections.slice(-2).map((section) => section?.data)).toEqual([
      { content: 'Second' },
      { content: 'First' },
    ])
  })

  test('duplicates a section directly after the source', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })
    const first = await t.mutation(api.services.addSection, {
      name: 'text',
      pos: BigInt(100),
      entry,
      data: stringify({ content: 'First' }),
    })
    await t.mutation(api.services.addSection, {
      name: 'text',
      pos: BigInt(200),
      entry,
      data: stringify({ content: 'Second' }),
    })

    const duplicate = await t.mutation(api.services.duplicateSection, {
      id: first,
    })
    const sections = await t.query(api.services.getSections, { id: entry })
    const duplicatedSection = await t.query(api.services.getSection, {
      id: duplicate,
    })
    const sourceIndex = sections.findIndex((section) => section?._id === first)

    expect(sourceIndex).toBeGreaterThanOrEqual(0)
    expect(sections[sourceIndex]?.data).toEqual({ content: 'First' })
    expect(sections[sourceIndex + 1]?._id).toBe(duplicate)
    expect(sections[sourceIndex + 1]?.data).toEqual({ content: 'First' })
    expect(sections[sourceIndex + 2]?.data).toEqual({ content: 'Second' })
    expect(duplicatedSection?.entry).toBe(entry)
  })

  test('updates entry modification time when sections change', async () => {
    const t = createTest()
    const entry = await t.mutation(api.services.ensureGlobal, {
      slug: 'home',
      version: 'draft',
    })
    const initialEntry = await t.query(api.services.getEntry, { id: entry })

    await waitForModificationTime()
    const sectionId = await t.mutation(api.services.addSection, {
      name: 'text',
      pos: BigInt(100),
      entry,
      data: stringify({ content: 'Initial content' }),
    })
    const afterAdd = await t.query(api.services.getEntry, { id: entry })

    expect(afterAdd?.modificationTime).toBeGreaterThan(
      initialEntry?.modificationTime ?? 0,
    )

    await waitForModificationTime()
    await t.mutation(api.services.updateSection, {
      id: sectionId,
      name: 'text',
      pos: BigInt(100),
      entry,
      data: stringify({ content: 'Updated content' }),
    })
    const afterUpdate = await t.query(api.services.getEntry, { id: entry })

    expect(afterUpdate?.modificationTime).toBeGreaterThan(
      afterAdd?.modificationTime ?? 0,
    )

    await waitForModificationTime()
    await t.mutation(api.services.reorderSections, {
      sections: [{ id: sectionId, pos: BigInt(1) }],
    })
    const afterReorder = await t.query(api.services.getEntry, { id: entry })

    expect(afterReorder?.modificationTime).toBeGreaterThan(
      afterUpdate?.modificationTime ?? 0,
    )

    await waitForModificationTime()
    await t.mutation(api.services.deleteSection, { id: sectionId })
    const afterDelete = await t.query(api.services.getEntry, { id: entry })

    expect(afterDelete?.modificationTime).toBeGreaterThan(
      afterReorder?.modificationTime ?? 0,
    )
  })

  test('rejects unknown collections and duplicate collection entries', async () => {
    const t = createTest()

    await expect(
      t.mutation(api.services.addCollection, {
        slug: 'unknown',
        name: 'Getting Started',
        version: 'draft',
      }),
    ).rejects.toThrow('Unknown collection "unknown".')

    await t.mutation(api.services.addCollection, {
      slug: 'blog',
      name: 'Getting Started',
      version: 'draft',
    })

    await expect(
      t.mutation(api.services.addCollection, {
        slug: 'blog',
        name: 'Getting Started',
        version: 'draft',
      }),
    ).rejects.toThrow('already exists')
  })
})
