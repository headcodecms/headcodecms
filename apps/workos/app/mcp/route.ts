import {
  type AuthInfo,
  createMcpHandler,
  McpServer,
  originValidationResponse,
} from '@modelcontextprotocol/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import type { FunctionArgs, FunctionReference } from 'convex/server'
import { ConvexError } from 'convex/values'
import sharp from 'sharp'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { headcodeTag } from '@/app/(site)/_lib/headcode'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getEntryConfig } from '@/convex/db'
import { headcodeConfig } from '@/headcode/config'
import { DEFAULT_IMAGE_ACCEPT, DEFAULT_IMAGE_MAX_SIZE } from '@/headcode/fields'
import type { HeadcodeFieldConfig, ServiceSection } from '@/headcode/types'
import { entryPath } from '@/headcode/utils'
import { getHeadcodeVersionForHost } from '@/headcode/versions'
import { authenticate, mcpUrl } from './auth'

// Stateless MCP server (spec 2026-07-28 only). Every request is authorized
// with an AuthKit OAuth token or a shared bearer token (see ./auth.ts);
// the request host selects live or draft content.

const publishGuard =
  'Do not call headcode_publish unless the user explicitly asks to publish, release, promote draft to live, or make the draft public.'
const acceptedTypes = Object.keys(DEFAULT_IMAGE_ACCEPT)

const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}
const write = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
}
const destructive = { ...write, destructiveHint: true }

const json = (value: unknown) => ({
  content: [
    {
      type: 'text' as const,
      text: JSON.stringify(
        value,
        (_key, item) => (typeof item === 'bigint' ? Number(item) : item),
        2,
      ),
    },
  ],
})

const nextActions = (ids: {
  entryId?: string
  sectionId?: string
  imageId?: string
}) =>
  [
    ids.entryId &&
      `Use headcode_get_entry with entryId "${ids.entryId}" to inspect the latest entry state.`,
    ids.sectionId &&
      `Use sectionId "${ids.sectionId}" for follow-up section edits.`,
    ids.imageId &&
      `Use { "imageId": "${ids.imageId}" } as the value for image fields in headcode_update_section or headcode_add_section.`,
    publishGuard,
  ].filter(Boolean)

// Field configs without validators, so agents can see the editable shape.
const describeFields = (fields: Record<string, HeadcodeFieldConfig>): unknown =>
  Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [
      key,
      Array.isArray(field)
        ? field.map(describeFields)
        : Object.fromEntries(
            Object.entries(field).filter(
              ([name, value]) =>
                name !== 'validator' && typeof value !== 'function',
            ),
          ),
    ]),
  )

// Site overview for agents: what each entry is, where it shows, which sections fit.
const contentTypes = [
  ...headcodeConfig.globals.map((config) => ({ kind: 'global', ...config })),
  ...headcodeConfig.collections.map((config) => ({
    kind: 'collection',
    path: `/${config.slug}/<slugified-entry-name>`,
    ...config,
  })),
].map(({ kind, slug, description, sections, ...config }) => ({
  kind,
  slug,
  path: 'path' in config ? config.path : null,
  description,
  sections: sections.map((section) => section.name),
}))

const describeEntry = <T extends { slug: string; name: string | null }>(
  entry: T,
) => {
  const config = getEntryConfig(entry)
  return {
    ...entry,
    path:
      config && 'path' in config
        ? config.path
        : entry.name === null
          ? null
          : entryPath(entry),
    description: config?.description,
  }
}

const readImage = async (url: URL, maxContentLength?: boolean) => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error('Image URL must use http or https.')
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Could not fetch image URL. HTTP ${response.status}.`)

  const type = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  if (!acceptedTypes.includes(type))
    throw new Error(
      `Image type "${type || 'unknown'}" is not allowed. Allowed types: ${acceptedTypes.join(', ')}.`,
    )
  const tooLarge = `Image must be ${DEFAULT_IMAGE_MAX_SIZE} bytes or smaller.`
  if (
    maxContentLength &&
    Number(response.headers.get('content-length') ?? 0) > DEFAULT_IMAGE_MAX_SIZE
  )
    throw new Error(tooLarge)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > DEFAULT_IMAGE_MAX_SIZE) throw new Error(tooLarge)
  return { buffer, type }
}

// Dimensions and ThumbHash blur placeholder, generated server-side.
const imageMetadata = async (buffer: Buffer) => {
  const { width, height } = await sharp(buffer).rotate().metadata()
  if (!width || !height) throw new Error('Could not read image dimensions.')
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: 100,
      height: 100,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const blurDataURL = thumbHashToDataURL(
    rgbaToThumbHash(info.width, info.height, data),
  )
  return { width: BigInt(width), height: BigInt(height), blurDataURL }
}

const createServer = ({ token, extra }: AuthInfo, host: string) => {
  const version = getHeadcodeVersionForHost(host)
  // Shared tokens go to Convex as `mcpToken`, OAuth tokens as the user JWT.
  const [auth, user] = extra?.shared
    ? [{ mcpToken: token }, {}]
    : [{}, { token }]
  const mutate = async <M extends FunctionReference<'mutation'>>(
    fn: M,
    args: Omit<FunctionArgs<M>, 'mcpToken'>,
  ) => {
    try {
      const result = await fetchMutation(
        fn,
        { ...args, ...auth } as FunctionArgs<M>,
        user,
      )
      // Expire the cached site so the change shows on the next request.
      revalidateTag(headcodeTag, { expire: 0 })
      return result
    } catch (error) {
      // ConvexError data (e.g. "account must be activated") is the tool error text.
      throw error instanceof ConvexError ? new Error(error.data) : error
    }
  }
  const versionStatus = () => fetchQuery(api.services.getVersionStatus, {})

  // Entries must belong to the version selected by the request host.
  const getBundle = async (entryId: string) => {
    const entry = await fetchQuery(api.services.getEntry, {
      id: entryId as Id<'entries'>,
    })
    if (!entry) throw new Error('Entry not found.')
    if (entry.version !== (await versionStatus())[version]?._id)
      throw new Error(
        `Entry does not belong to the selected ${version} version.`,
      )
    const sections = await fetchQuery(api.services.getSections, {
      id: entry._id,
    })
    return { entry, sections }
  }

  const findBundle = async ({
    entryId,
    slug,
    name,
  }: {
    entryId?: string
    slug?: string
    name?: string
  }) => {
    if (entryId) return getBundle(entryId)
    if (!slug) throw new Error('Provide either entryId or slug.')
    const bundle = name
      ? await fetchQuery(api.services.getCollectionWithSections, {
          slug,
          name,
          version,
        })
      : await fetchQuery(api.services.getGlobalWithSections, { slug, version })
    if (!bundle)
      throw new Error(
        name ? 'Collection entry not found.' : 'Global entry not found.',
      )
    return bundle
  }

  const getSection = async (sectionId: string) => {
    const section = await fetchQuery(api.services.getSection, {
      id: sectionId as Id<'sections'>,
    })
    if (!section) throw new Error('Section not found.')
    await getBundle(section.entry)
    return section
  }

  const entryResult = async (action: string, entryId: string) => {
    const { entry, sections } = await getBundle(entryId)
    return json({
      action,
      version,
      entry,
      sections,
      nextActions: nextActions({ entryId: entry._id }),
    })
  }

  const addImage = async (
    action: string,
    image: { buffer: Buffer; type: string },
    storageId: Id<'_storage'>,
    name: string,
    alt = '',
  ) => {
    const saved = await mutate(api.services.addUploadedImage, {
      storageId,
      name,
      alt,
      type: image.type,
      size: BigInt(image.buffer.byteLength),
      ...(await imageMetadata(image.buffer)),
    })
    return json({
      action,
      version,
      image: saved,
      fieldValue: { imageId: saved._id },
      nextActions: nextActions({ imageId: saved._id }),
    })
  }

  const server = new McpServer(
    { name: 'Headcode CMS', version: '0.2.0' },
    {
      instructions:
        'Headcode CMS tools edit content for the version selected by the request host. Normal editing workflows should only read entries and add, update, delete, or reorder sections. Publishing is a rare release action: never call headcode_publish automatically after edits. Call headcode_publish only when the user explicitly asks to publish, release, promote draft to live, or make the draft public.',
    },
  )

  const lookup = z.object({
    entryId: z.string().optional(),
    slug: z.string().optional(),
    name: z.string().optional(),
  })

  server.registerTool(
    'headcode_get_version',
    {
      title: 'Get Headcode version',
      description:
        'Returns the version selected for this MCP request host and the current publish status. This is read-only and never publishes content.',
      annotations: readOnly,
    },
    async () => json({ version, status: await versionStatus() }),
  )

  server.registerTool(
    'headcode_list_entries',
    {
      title: 'List Headcode entries',
      description:
        'Lists globals and collection entries for the draft or live version selected by the MCP request host, each with its site path and purpose. contentTypes explains the site structure: globals without a path (header, footer) show on every page, collections can get new entries, and sections lists the section types each one allows. This is read-only and never publishes content.',
      annotations: readOnly,
    },
    async () => {
      const { globals, collections } = await fetchQuery(api.services.getAll, {
        version,
      })
      return json({
        version,
        contentTypes,
        globals: globals.map(describeEntry),
        collections: collections.map(describeEntry),
      })
    },
  )

  server.registerTool(
    'headcode_get_entry',
    {
      title: 'Get Headcode entry',
      description:
        'Loads an entry and its validated sections by entryId, or by slug/name on the selected host version. This is read-only and never publishes content.',
      annotations: readOnly,
      inputSchema: lookup,
    },
    async (args) => {
      const { entry, sections } = await findBundle(args)
      return json({
        action: 'entry_loaded',
        version,
        entry,
        sections,
        nextActions: nextActions({ entryId: entry._id }),
      })
    },
  )

  server.registerTool(
    'headcode_list_section_types',
    {
      title: 'List section types',
      description:
        'Lists section types, their purpose, and editable fields for an entry, or for a collection by slug alone before its first entry exists (e.g. { slug: "blog" }). This is read-only and never publishes content.',
      annotations: readOnly,
      inputSchema: lookup,
    },
    async (args) => {
      const collection =
        !args.entryId &&
        !args.name &&
        headcodeConfig.collections.find(({ slug }) => slug === args.slug)
      const entry = collection ? null : (await findBundle(args)).entry
      const config = collection || (entry && getEntryConfig(entry))
      return json({
        entry,
        sections: (config ? config.sections : []).map((section) => ({
          name: section.name,
          label: section.label ?? section.name,
          description: section.description,
          fields: describeFields(section.fields),
        })),
      })
    },
  )

  server.registerTool(
    'headcode_add_entry',
    {
      title: 'Add collection entry',
      description:
        'Adds a collection entry on the selected live or draft version and returns the new entry with its default sections. Use this for repeatable collections such as pages or blog posts. This saves CMS content but does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
      annotations: write,
      inputSchema: z.object({ slug: z.string(), name: z.string() }),
    },
    async ({ slug, name }) =>
      entryResult(
        'entry_added',
        await mutate(api.services.addCollection, { slug, name, version }),
      ),
  )

  server.registerTool(
    'headcode_rename_entry',
    {
      title: 'Rename collection entry',
      description:
        'Renames an existing collection entry in the selected live or draft version. This changes the entry name used for generated collection URLs. Globals cannot be renamed. This saves CMS content but does not publish.',
      annotations: write,
      inputSchema: z.object({ entryId: z.string(), name: z.string() }),
    },
    async ({ entryId, name }) => {
      const { entry } = await getBundle(entryId)
      if (entry.name === null) throw new Error('Globals cannot be renamed.')
      await mutate(api.services.updateEntryName, { id: entry._id, name })
      return entryResult('entry_renamed', entry._id)
    },
  )

  server.registerTool(
    'headcode_delete_entry',
    {
      title: 'Delete collection entry',
      description:
        'Deletes an existing collection entry from the selected live or draft version. Globals cannot be deleted through this tool. This is destructive and does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
      annotations: destructive,
      inputSchema: z.object({ entryId: z.string() }),
    },
    async ({ entryId }) => {
      const { entry } = await getBundle(entryId)
      if (entry.name === null)
        throw new Error('Globals cannot be deleted through MCP.')
      await mutate(api.services.deleteEntry, { id: entry._id })
      return json({
        action: 'entry_deleted',
        version,
        deleted: true,
        entryId,
        nextActions: nextActions({}),
      })
    },
  )

  server.registerTool(
    'headcode_upload_image_from_url',
    {
      title: 'Upload image from URL',
      description:
        'Fetches an http(s) image URL, validates the default Headcode image limits, generates image dimensions and ThumbHash blur data, uploads the file to Convex storage, and creates an image library record. This does not update section content and never publishes. Use the returned imageId in image fields as { imageId } when calling headcode_update_section or headcode_add_section.',
      annotations: { ...write, openWorldHint: true },
      inputSchema: z.object({
        url: z.url(),
        alt: z.string().optional(),
        name: z.string().optional(),
      }),
    },
    async ({ url, alt, name }) => {
      const source = new URL(url)
      const image = await readImage(source, true)
      const uploadUrl = await mutate(api.services.generateImageUploadUrl, {})
      const upload = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': image.type },
        body: new Uint8Array(image.buffer),
      })
      if (!upload.ok)
        throw new Error('Could not upload image to Convex storage.')
      const { storageId } = (await upload.json()) as {
        storageId: Id<'_storage'>
      }
      const fileName =
        decodeURIComponent(source.pathname.split('/').pop() ?? '') ||
        `image${DEFAULT_IMAGE_ACCEPT[image.type as keyof typeof DEFAULT_IMAGE_ACCEPT]?.[0] ?? ''}`
      return addImage('image_uploaded', image, storageId, name ?? fileName, alt)
    },
  )

  server.registerTool(
    'headcode_create_image_upload_url',
    {
      title: 'Create image upload URL',
      description:
        'Creates a signed Convex upload URL for MCP clients that can upload binary image files themselves. Upload the file with HTTP POST, not PUT, using the file content as the request body and the image content type header. The Convex upload response returns { storageId }. Then call headcode_register_uploaded_image with that storageId; Headcode will read dimensions and generate blur data. Prefer headcode_upload_image_from_url when the image is already available at an http(s) URL.',
      annotations: write,
    },
    async () =>
      json({
        uploadUrl: await mutate(api.services.generateImageUploadUrl, {}),
        uploadMethod: 'POST',
        uploadHeaders: {
          'Content-Type': 'image/jpeg, image/png, image/webp, or image/avif',
        },
        curlExample:
          'curl -X POST "$uploadUrl" -H "Content-Type: image/jpeg" --data-binary "@/path/to/image.jpg"',
        nextStep:
          'Use the returned storageId with headcode_register_uploaded_image.',
        nextActions: [
          'Upload binary image data with HTTP POST to uploadUrl.',
          'Call headcode_register_uploaded_image with the returned storageId.',
          publishGuard,
        ],
        maxSize: DEFAULT_IMAGE_MAX_SIZE,
        acceptedTypes,
      }),
  )

  server.registerTool(
    'headcode_register_uploaded_image',
    {
      title: 'Register uploaded image',
      description:
        'Creates an image library record after a client uploads binary data to a signed Convex upload URL. Provide the storageId from the Convex upload response; Headcode fetches the uploaded image, validates type and size, reads dimensions, and generates ThumbHash blur data. This does not update section content and never publishes. Use the returned imageId in image fields as { imageId }.',
      annotations: write,
      inputSchema: z.object({
        storageId: z.string(),
        alt: z.string().optional(),
        name: z.string().optional(),
      }),
    },
    async ({ storageId, alt, name }) => {
      const id = storageId as Id<'_storage'>
      const src = await fetchQuery(
        api.services.getUploadedImageUrl,
        { storageId: id, ...auth },
        user,
      )
      if (!src) throw new Error('Uploaded image is not available.')
      return addImage(
        'image_registered',
        await readImage(new URL(src)),
        id,
        name ?? 'uploaded-image',
        alt,
      )
    },
  )

  server.registerTool(
    'headcode_list_images',
    {
      title: 'List images',
      description:
        'Lists uploaded images from the Headcode image library. Use filter to search by name, alt text, or MIME type. This is read-only and never publishes content.',
      annotations: readOnly,
      inputSchema: z.object({
        filter: z.string().optional(),
        cursor: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    },
    async ({ filter, cursor, limit }) => {
      const page = await fetchQuery(api.services.getImages, {
        filter,
        paginationOpts: { numItems: limit ?? 24, cursor: cursor ?? null },
      })
      return json({
        images: page.page,
        isDone: page.isDone,
        continueCursor: page.continueCursor,
        nextActions: [
          'Use an image _id as imageId for image fields, image metadata updates, usage checks, or deletion.',
        ],
      })
    },
  )

  server.registerTool(
    'headcode_get_image_usage',
    {
      title: 'Get image usage',
      description:
        'Returns how many section data records currently reference an image. This is read-only and never publishes content.',
      annotations: readOnly,
      inputSchema: z.object({ imageId: z.string() }),
    },
    async ({ imageId }) => {
      const usage = await fetchQuery(
        api.services.getImageUsage,
        { id: imageId as Id<'images'>, ...auth },
        user,
      )
      return json({
        imageId,
        usage,
        nextActions: [
          usage.count === 0
            ? 'This image is unused and can be deleted with headcode_delete_image if the user asks.'
            : 'This image is referenced by section content; do not delete it unless the user asks and references are updated first.',
        ],
      })
    },
  )

  server.registerTool(
    'headcode_update_image_metadata',
    {
      title: 'Update image metadata',
      description:
        'Updates image library metadata such as display name and alt text. This does not change section content and never publishes.',
      annotations: write,
      inputSchema: z.object({
        imageId: z.string(),
        name: z.string().optional(),
        alt: z.string().optional(),
      }),
    },
    async ({ imageId, name, alt }) => {
      const id = imageId as Id<'images'>
      const image = await fetchQuery(api.services.getImage, { id })
      if (!image) throw new Error('Image not found.')
      await mutate(api.services.updateImageMetadata, {
        id,
        name: name ?? image.name,
        alt: alt ?? image.alt,
      })
      return json({
        action: 'image_metadata_updated',
        image: await fetchQuery(api.services.getImage, { id }),
        nextActions: nextActions({ imageId }),
      })
    },
  )

  server.registerTool(
    'headcode_delete_image',
    {
      title: 'Delete image',
      description:
        'Deletes an unused image from Convex storage and the Headcode image library. This is destructive, but fails if the image is still referenced by section content. This does not publish.',
      annotations: destructive,
      inputSchema: z.object({ imageId: z.string() }),
    },
    async ({ imageId }) =>
      json({
        action: 'image_deleted',
        imageId,
        ...(await mutate(api.services.deleteImage, {
          id: imageId as Id<'images'>,
        })),
        nextActions: nextActions({}),
      }),
  )

  server.registerTool(
    'headcode_update_section',
    {
      title: 'Update section data',
      description:
        'Updates fields on an existing section only. This saves CMS content in the selected live or draft version but does not publish. Do not call headcode_publish after editing unless the user explicitly asks to publish or release the draft. Unknown fields are ignored by Headcode validation; invalid values fall back to configured defaults.',
      annotations: write,
      inputSchema: z.object({
        sectionId: z.string(),
        data: z.record(z.string(), z.unknown()),
      }),
    },
    async ({ sectionId, data }) => {
      const section = await getSection(sectionId)
      await mutate(api.services.updateSection, {
        id: section._id,
        name: section.name,
        pos: section.pos,
        entry: section.entry,
        data: JSON.stringify({ ...(section.data as object), ...data }),
      })
      return json({
        action: 'section_updated',
        version,
        section: await fetchQuery(api.services.getSection, { id: section._id }),
        nextActions: nextActions({
          entryId: section.entry,
          sectionId: section._id,
        }),
      })
    },
  )

  server.registerTool(
    'headcode_add_section',
    {
      title: 'Add section',
      description:
        'Adds a configured section to an entry on the version selected by this MCP request host. This saves CMS content but does not publish. Do not call headcode_publish after adding a section unless the user explicitly asks to publish or release the draft.',
      annotations: write,
      inputSchema: z.object({
        entryId: z.string(),
        sectionName: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
        position: z.number().int().optional(),
      }),
    },
    async ({ entryId, sectionName, data, position }) => {
      const { entry, sections } = await getBundle(entryId)
      if (
        !getEntryConfig(entry)?.sections.some(
          (section) => section.name === sectionName,
        )
      )
        throw new Error(
          `Section "${sectionName}" is not configured for this entry.`,
        )
      const lastPos = sections.reduce(
        (max, section) => Math.max(max, Number(section.pos)),
        0,
      )
      const sectionId = await mutate(api.services.addSection, {
        name: sectionName,
        pos: BigInt(position ?? lastPos + 100),
        data: JSON.stringify(data ?? {}),
        entry: entry._id,
      })
      return json({
        action: 'section_added',
        version,
        section: await fetchQuery(api.services.getSection, { id: sectionId }),
        nextActions: nextActions({ entryId: entry._id, sectionId }),
      })
    },
  )

  server.registerTool(
    'headcode_duplicate_section',
    {
      title: 'Duplicate section',
      description:
        'Duplicates an existing section in the selected live or draft version and places the copy after the original. This saves CMS content but does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
      annotations: write,
      inputSchema: z.object({ sectionId: z.string() }),
    },
    async ({ sectionId }) => {
      const section = await getSection(sectionId)
      const copyId = await mutate(api.services.duplicateSection, {
        id: section._id,
      })
      return json({
        action: 'section_duplicated',
        version,
        section: await fetchQuery(api.services.getSection, { id: copyId }),
        nextActions: nextActions({ entryId: section.entry, sectionId: copyId }),
      })
    },
  )

  server.registerTool(
    'headcode_delete_section',
    {
      title: 'Delete section',
      description:
        'Deletes a section from an entry in the selected live or draft version. This does not publish. Do not call headcode_publish after deleting a section unless the user explicitly asks to publish or release the draft.',
      annotations: destructive,
      inputSchema: z.object({ sectionId: z.string() }),
    },
    async ({ sectionId }) => {
      const section = await getSection(sectionId)
      await mutate(api.services.deleteSection, { id: section._id })
      return json({
        action: 'section_deleted',
        version,
        deleted: true,
        sectionId,
        nextActions: nextActions({ entryId: section.entry }),
      })
    },
  )

  server.registerTool(
    'headcode_reorder_sections',
    {
      title: 'Reorder sections',
      description:
        'Reorders the provided sections in the selected live or draft version. This saves CMS content but does not publish. Do not call headcode_publish after reordering unless the user explicitly asks to publish or release the draft. Any existing sections omitted from sectionIds stay after the provided list in their current order.',
      annotations: write,
      inputSchema: z.object({
        entryId: z.string(),
        sectionIds: z.array(z.string()),
      }),
    },
    async ({ entryId, sectionIds }) => {
      const { entry, sections } = await getBundle(entryId)
      const rank = (section: ServiceSection) => {
        const index = sectionIds.indexOf(section._id)
        return index < 0 ? sectionIds.length : index
      }
      const ordered = [...sections].sort((a, b) => rank(a) - rank(b))
      await mutate(api.services.reorderSections, {
        sections: ordered.map((section, index) => ({
          id: section._id,
          pos: BigInt((index + 1) * 100),
        })),
      })
      return json({
        action: 'sections_reordered',
        version,
        sections: (await getBundle(entry._id)).sections,
        nextActions: nextActions({ entryId }),
      })
    },
  )

  server.registerTool(
    'headcode_publish',
    {
      title: 'Publish draft',
      description:
        'Rare release action. Publishes the current draft version to live and creates a new draft. Never call this after edits by default. Only call this when the user explicitly says to publish, release, promote draft to live, or make the draft public.',
      annotations: destructive,
    },
    async () => {
      await mutate(api.services.publish, {})
      return json({ published: true, status: await versionStatus() })
    },
  )

  server.registerTool(
    'headcode_new_draft',
    {
      title: 'Create draft',
      description:
        'Creates a fresh draft from the current live version when live and draft are shared. This is version management, not normal content editing. Never call it unless the user explicitly asks for a new draft.',
      annotations: write,
    },
    async () => {
      await mutate(api.services.newDraft, {})
      return json({ created: true, status: await versionStatus() })
    },
  )

  return server
}

const handler = createMcpHandler(
  ({ authInfo, requestInfo }) =>
    createServer(
      authInfo!,
      requestInfo?.headers.get('x-forwarded-host') ??
        requestInfo?.headers.get('host') ??
        '',
    ),
  { legacy: 'reject' },
)

export const POST = async (req: Request) => {
  const rejected = originValidationResponse(req, [mcpUrl(req).hostname])
  if (rejected) return rejected

  const authInfo = await authenticate(req)
  if (authInfo instanceof Response) return authInfo

  return handler.fetch(req, { authInfo })
}
