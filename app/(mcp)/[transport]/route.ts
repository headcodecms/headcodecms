import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import sharp from 'sharp'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'
import { z } from 'zod'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { headcodeConfig } from '@/headcode/config'
import { DEFAULT_IMAGE_ACCEPT, DEFAULT_IMAGE_MAX_SIZE } from '@/headcode/fields'
import type {
  HeadcodeFieldConfig,
  HeadcodeVersion,
  ServiceEntry,
  ServiceEntryBundle,
  ServiceSection,
} from '@/headcode/types'
import { getHeadcodeVersionForHost } from '@/headcode/versions'

export const runtime = 'nodejs'

type ToolExtra = {
  authInfo?: {
    token?: string
  }
  requestInfo?: {
    headers: Record<string, string | string[] | undefined>
    url?: URL
  }
}

type EntryLookup = {
  entryId?: string
  slug?: string
  name?: string
}

const getHeader = (
  headers: Record<string, string | string[] | undefined>,
  name: string,
) => {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

const getRequestHost = (extra: ToolExtra) =>
  getHeader(extra.requestInfo?.headers ?? {}, 'x-forwarded-host') ??
  getHeader(extra.requestInfo?.headers ?? {}, 'host') ??
  extra.requestInfo?.url?.host ??
  ''

const getToolContext = (extra: ToolExtra) => ({
  token: extra.authInfo?.token,
  version: getHeadcodeVersionForHost(getRequestHost(extra)),
})

const convexOptions = (extra: ToolExtra) => {
  void extra
  return {}
}

const mcpAuthArgs = (extra: ToolExtra) => ({
  mcpToken: getToolContext(extra).token,
})

const safeCompare = (a: string, b: string) => {
  if (a.length !== b.length) return false

  let result = 0
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return result === 0
}

const isAllowedMcpToken = (token: string | undefined) => {
  if (!token) return false

  return (process.env.ALLOWED_MCP_TOKENS ?? '')
    .split(',')
    .map((allowedToken) => allowedToken.trim())
    .filter(Boolean)
    .some((allowedToken) => safeCompare(allowedToken, token))
}

const toEntryId = (id: string) => id as Id<'entries'>
const toSectionId = (id: string) => id as Id<'sections'>
const toImageId = (id: string) => id as Id<'images'>
const toStorageId = (id: string) => id as Id<'_storage'>

const serializeToolValue = (_key: string, value: unknown) => {
  if (typeof value !== 'bigint') return value

  const numberValue = Number(value)
  return Number.isSafeInteger(numberValue) ? numberValue : value.toString()
}

const textResponse = (value: unknown) => ({
  content: [
    {
      type: 'text' as const,
      text: JSON.stringify(value, serializeToolValue, 2),
    },
  ],
})

const publishGuard =
  'Do not call headcode_publish unless the user explicitly asks to publish, release, promote draft to live, or make the draft public.'

const nextActions = ({
  entryId,
  sectionId,
  imageId,
}: {
  entryId?: string
  sectionId?: string
  imageId?: string
}) =>
  [
    entryId
      ? `Use headcode_get_entry with entryId "${entryId}" to inspect the latest entry state.`
      : null,
    sectionId
      ? `Use sectionId "${sectionId}" for follow-up section edits.`
      : null,
    imageId
      ? `Use { "imageId": "${imageId}" } as the value for image fields in headcode_update_section or headcode_add_section.`
      : null,
    publishGuard,
  ].filter((item): item is string => Boolean(item))

const serializeSection = (section: ServiceSection) => ({
  ...section,
  pos: Number(section.pos),
})

const serializeBundle = (
  bundle: ServiceEntryBundle,
  version: HeadcodeVersion,
) => ({
  version,
  entry: bundle.entry,
  sections: bundle.sections.map(serializeSection),
})

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeSections = (sections: (ServiceSection | null)[]) =>
  sections
    .filter((section): section is ServiceSection => section !== null)
    .sort((a, b) => Number(a.pos) - Number(b.pos))

const getEntryConfig = (entry: ServiceEntry) =>
  (entry.name === null
    ? headcodeConfig.globals
    : headcodeConfig.collections
  ).find((config) => config.slug === entry.slug) ?? null

const assertEntryMatchesRequestVersion = async (
  entryId: Id<'entries'>,
  extra: ToolExtra,
) => {
  const { version } = getToolContext(extra)
  const entries = await fetchQuery(
    api.services.getAll,
    { version },
    convexOptions(extra),
  )
  const isInVersion = [...entries.globals, ...entries.collections].some(
    (entry) => entry._id === entryId,
  )

  if (!isInVersion) {
    throw new Error(`Entry does not belong to the selected ${version} version.`)
  }
}

const getSectionConfig = (entry: ServiceEntry, sectionName: string) =>
  getEntryConfig(entry)?.sections.find(
    (section) => section.name === sectionName,
  ) ?? null

const serializeFieldConfig = (field: HeadcodeFieldConfig): unknown => {
  if (Array.isArray(field)) {
    return field.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          serializeFieldConfig(value),
        ]),
      ),
    )
  }

  return Object.fromEntries(
    Object.entries(field).filter(([key, value]) => {
      if (key === 'validator' || key === 'validation') return false
      return typeof value !== 'function'
    }),
  )
}

const getStringProperty = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === 'string' ? value[key] : undefined

const serializeSectionConfig = (section: {
  name: string
  fields: Record<string, HeadcodeFieldConfig>
}) => {
  const sectionRecord = section as Record<string, unknown>

  return {
    name: section.name,
    label: getStringProperty(sectionRecord, 'label') ?? section.name,
    description: getStringProperty(sectionRecord, 'description'),
    fields: Object.fromEntries(
      Object.entries(section.fields).map(([key, value]) => [
        key,
        serializeFieldConfig(value),
      ]),
    ),
  }
}

const getEntryBundleById = async (entryId: string, extra: ToolExtra) => {
  const entry = await fetchQuery(
    api.services.getEntry,
    { id: toEntryId(entryId) },
    convexOptions(extra),
  )
  if (!entry) throw new Error('Entry not found.')

  await assertEntryMatchesRequestVersion(entry._id, extra)

  const sections = await fetchQuery(
    api.services.getSections,
    { id: entry._id },
    convexOptions(extra),
  )

  return {
    entry,
    sections: normalizeSections(sections),
  }
}

const getEntryBundleByLookup = async (
  lookup: EntryLookup,
  extra: ToolExtra,
) => {
  const { version } = getToolContext(extra)
  if (lookup.entryId) return getEntryBundleById(lookup.entryId, extra)
  if (!lookup.slug) {
    throw new Error('Provide either entryId or slug.')
  }

  if (lookup.name) {
    const bundle = await fetchQuery(
      api.services.getCollectionWithSections,
      { slug: lookup.slug, name: lookup.name, version },
      convexOptions(extra),
    )
    if (!bundle) throw new Error('Collection entry not found.')
    return bundle
  }

  const bundle = await fetchQuery(
    api.services.getGlobalWithSections,
    { slug: lookup.slug, version },
    convexOptions(extra),
  )
  if (!bundle) throw new Error('Global entry not found.')
  return bundle
}

const mergeSectionData = (
  section: ServiceSection,
  data: Record<string, unknown>,
) => ({
  ...(isObject(section.data) ? section.data : {}),
  ...data,
})

const getNextSectionPos = (sections: ServiceSection[]) => {
  const maxPos = sections.reduce(
    (max, section) => Math.max(max, Number(section.pos)),
    0,
  )
  return BigInt(maxPos + 100)
}

const getAcceptedImageTypes = () => Object.keys(DEFAULT_IMAGE_ACCEPT)

const getFilenameFromUrl = (url: URL, contentType: string) => {
  const pathnameName = decodeURIComponent(url.pathname.split('/').pop() ?? '')
  if (pathnameName) return pathnameName

  const extension =
    DEFAULT_IMAGE_ACCEPT[contentType as keyof typeof DEFAULT_IMAGE_ACCEPT]?.[0]

  return `image${extension ?? ''}`
}

const assertImageContentType = (contentType: string) => {
  if (!getAcceptedImageTypes().includes(contentType)) {
    throw new Error(
      `Image type "${contentType || 'unknown'}" is not allowed. Allowed types: ${getAcceptedImageTypes().join(', ')}.`,
    )
  }
}

const fetchImageBuffer = async (urlValue: string) => {
  const url = new URL(urlValue)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Image URL must use http or https.')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not fetch image URL. HTTP ${response.status}.`)
  }

  const contentType = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  assertImageContentType(contentType)

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > DEFAULT_IMAGE_MAX_SIZE) {
    throw new Error(`Image must be ${DEFAULT_IMAGE_MAX_SIZE} bytes or smaller.`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > DEFAULT_IMAGE_MAX_SIZE) {
    throw new Error(`Image must be ${DEFAULT_IMAGE_MAX_SIZE} bytes or smaller.`)
  }

  return {
    buffer,
    contentType,
    name: getFilenameFromUrl(url, contentType),
  }
}

const createImageBlurDataURL = async (buffer: Buffer) => {
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
  const thumbHash = rgbaToThumbHash(info.width, info.height, data)

  return thumbHashToDataURL(thumbHash)
}

const readImageMetadata = async (buffer: Buffer) => {
  const image = sharp(buffer).rotate()
  const metadata = await image.metadata()
  const width = metadata.width
  const height = metadata.height
  if (!width || !height) {
    throw new Error('Could not read image dimensions.')
  }

  return {
    width,
    height,
    blurDataURL: await createImageBlurDataURL(buffer),
  }
}

const uploadImageToConvex = async (
  buffer: Buffer,
  contentType: string,
  extra: ToolExtra,
) => {
  const uploadUrl = await fetchMutation(
    api.services.generateImageUploadUrl,
    mcpAuthArgs(extra),
    convexOptions(extra),
  )
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(buffer),
  })

  if (!response.ok) {
    throw new Error('Could not upload image to Convex storage.')
  }

  const { storageId } = (await response.json()) as { storageId: string }
  return toStorageId(storageId)
}

const fetchUploadedStorageImage = async (
  storageId: Id<'_storage'>,
  extra: ToolExtra,
) => {
  const src = await fetchQuery(
    api.services.getUploadedImageUrl,
    { storageId, ...mcpAuthArgs(extra) },
    convexOptions(extra),
  )
  if (!src) throw new Error('Uploaded image is not available.')

  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Could not fetch uploaded image. HTTP ${response.status}.`)
  }

  const contentType = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  assertImageContentType(contentType)

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > DEFAULT_IMAGE_MAX_SIZE) {
    throw new Error(`Image must be ${DEFAULT_IMAGE_MAX_SIZE} bytes or smaller.`)
  }

  return { buffer, contentType }
}

const updateSectionData = async (
  section: ServiceSection,
  data: Record<string, unknown>,
  extra: ToolExtra,
) => {
  await fetchMutation(
    api.services.updateSection,
    {
      id: section._id,
      name: section.name,
      pos: section.pos,
      data: JSON.stringify(data),
      entry: section.entry,
      ...mcpAuthArgs(extra),
    },
    convexOptions(extra),
  )

  const updatedSection = await fetchQuery(
    api.services.getSection,
    { id: section._id },
    convexOptions(extra),
  )

  return updatedSection ? serializeSection(updatedSection) : null
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      'headcode_get_version',
      {
        title: 'Get Headcode version',
        description:
          'Returns the version selected for this MCP request host and the current publish status. This is read-only and never publishes content.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (extra) => {
        const { version } = getToolContext(extra)
        const status = await fetchQuery(
          api.services.getVersionStatus,
          {},
          convexOptions(extra),
        )

        return textResponse({ version, status })
      },
    )

    server.registerTool(
      'headcode_list_entries',
      {
        title: 'List Headcode entries',
        description:
          'Lists globals and collection entries for the draft or live version selected by the MCP request host. This is read-only and never publishes content.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (extra) => {
        const { version } = getToolContext(extra)
        const entries = await fetchQuery(
          api.services.getAll,
          { version },
          convexOptions(extra),
        )

        return textResponse({ version, ...entries })
      },
    )

    server.registerTool(
      'headcode_get_entry',
      {
        title: 'Get Headcode entry',
        description:
          'Loads an entry and its validated sections by entryId, or by slug/name on the selected host version. This is read-only and never publishes content.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        inputSchema: {
          entryId: z.string().optional(),
          slug: z.string().optional(),
          name: z.string().optional(),
        },
      },
      async (args, extra) => {
        const { version } = getToolContext(extra)
        const bundle = await getEntryBundleByLookup(args, extra)

        return textResponse({
          action: 'global_ensured',
          ...serializeBundle(bundle, version),
          nextActions: nextActions({ entryId: bundle.entry._id }),
        })
      },
    )

    server.registerTool(
      'headcode_list_section_types',
      {
        title: 'List section types',
        description:
          'Lists section types and editable fields allowed by the Headcode configuration for an entry. This is read-only and never publishes content.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        inputSchema: {
          entryId: z.string().optional(),
          slug: z.string().optional(),
          name: z.string().optional(),
        },
      },
      async (args, extra) => {
        const bundle = await getEntryBundleByLookup(args, extra)
        const entryConfig = getEntryConfig(bundle.entry)

        return textResponse({
          entry: bundle.entry,
          sections:
            entryConfig?.sections.map((section) =>
              serializeSectionConfig(section),
            ) ?? [],
        })
      },
    )

    server.registerTool(
      'headcode_ensure_global',
      {
        title: 'Ensure global entry',
        description:
          'Creates a configured global entry on the selected live or draft version if it does not exist, then returns it with sections. This saves CMS content but does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        inputSchema: {
          slug: z.string(),
        },
      },
      async ({ slug }, extra) => {
        const { version } = getToolContext(extra)
        const entryId = await fetchMutation(
          api.services.ensureGlobal,
          { slug, version, ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )
        const bundle = await getEntryBundleById(entryId, extra)

        return textResponse({
          action: 'entry_added',
          ...serializeBundle(bundle, version),
          nextActions: nextActions({ entryId: bundle.entry._id }),
        })
      },
    )

    server.registerTool(
      'headcode_add_entry',
      {
        title: 'Add collection entry',
        description:
          'Adds a collection entry on the selected live or draft version and returns the new entry with its default sections. Use this for repeatable collections such as pages or blog posts. This saves CMS content but does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          slug: z.string(),
          name: z.string(),
        },
      },
      async ({ slug, name }, extra) => {
        const { version } = getToolContext(extra)
        const entryId = await fetchMutation(
          api.services.addCollection,
          { slug, name, version, ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )
        const bundle = await getEntryBundleById(entryId, extra)

        return textResponse(serializeBundle(bundle, version))
      },
    )

    server.registerTool(
      'headcode_rename_entry',
      {
        title: 'Rename collection entry',
        description:
          'Renames an existing collection entry in the selected live or draft version. This changes the entry name used for generated collection URLs. Globals cannot be renamed. This saves CMS content but does not publish.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          entryId: z.string(),
          name: z.string(),
        },
      },
      async ({ entryId, name }, extra) => {
        const { version } = getToolContext(extra)
        const bundle = await getEntryBundleById(entryId, extra)
        if (bundle.entry.name === null) {
          throw new Error('Globals cannot be renamed.')
        }

        await fetchMutation(
          api.services.updateEntryName,
          { id: bundle.entry._id, name, ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )
        const updated = await getEntryBundleById(entryId, extra)

        return textResponse({
          action: 'entry_renamed',
          ...serializeBundle(updated, version),
          nextActions: nextActions({ entryId: updated.entry._id }),
        })
      },
    )

    server.registerTool(
      'headcode_delete_entry',
      {
        title: 'Delete collection entry',
        description:
          'Deletes an existing collection entry from the selected live or draft version. Globals cannot be deleted through this tool. This is destructive and does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          entryId: z.string(),
        },
      },
      async ({ entryId }, extra) => {
        const bundle = await getEntryBundleById(entryId, extra)
        if (bundle.entry.name === null) {
          throw new Error('Globals cannot be deleted through MCP.')
        }

        await fetchMutation(
          api.services.deleteEntry,
          { id: bundle.entry._id, ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )

        return textResponse({
          action: 'entry_deleted',
          version: getToolContext(extra).version,
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
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
        inputSchema: {
          url: z.string().url(),
          alt: z.string().optional(),
          name: z.string().optional(),
        },
      },
      async ({ url, alt, name }, extra) => {
        const imageFile = await fetchImageBuffer(url)
        const metadata = await readImageMetadata(imageFile.buffer)
        const storageId = await uploadImageToConvex(
          imageFile.buffer,
          imageFile.contentType,
          extra,
        )
        const image = await fetchMutation(
          api.services.addUploadedImage,
          {
            ...mcpAuthArgs(extra),
            storageId,
            alt: alt ?? '',
            width: BigInt(metadata.width),
            height: BigInt(metadata.height),
            blurDataURL: metadata.blurDataURL,
            name: name ?? imageFile.name,
            type: imageFile.contentType,
            size: BigInt(imageFile.buffer.byteLength),
            filter: [name ?? imageFile.name, alt ?? '', imageFile.contentType]
              .filter(Boolean)
              .join(' ')
              .toLowerCase(),
          },
          convexOptions(extra),
        )

        return textResponse({
          action: 'image_uploaded',
          version: getToolContext(extra).version,
          image,
          fieldValue: { imageId: image._id },
          nextActions: nextActions({ imageId: image._id }),
        })
      },
    )

    server.registerTool(
      'headcode_create_image_upload_url',
      {
        title: 'Create image upload URL',
        description:
          'Creates a signed Convex upload URL for MCP clients that can upload binary image files themselves. Upload the file with HTTP POST, not PUT, using the file content as the request body and the image content type header. The Convex upload response returns { storageId }. Then call headcode_register_uploaded_image with that storageId; Headcode will read dimensions and generate blur data. Prefer headcode_upload_image_from_url when the image is already available at an http(s) URL.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (extra) => {
        const uploadUrl = await fetchMutation(
          api.services.generateImageUploadUrl,
          mcpAuthArgs(extra),
          convexOptions(extra),
        )

        return textResponse({
          uploadUrl,
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
          acceptedTypes: getAcceptedImageTypes(),
        })
      },
    )

    server.registerTool(
      'headcode_register_uploaded_image',
      {
        title: 'Register uploaded image',
        description:
          'Creates an image library record after a client uploads binary data to a signed Convex upload URL. Provide the storageId from the Convex upload response; Headcode fetches the uploaded image, validates type and size, reads dimensions, and generates ThumbHash blur data. This does not update section content and never publishes. Use the returned imageId in image fields as { imageId }.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          storageId: z.string(),
          alt: z.string().optional(),
          name: z.string().optional(),
        },
      },
      async ({ storageId, alt, name }, extra) => {
        const storage = toStorageId(storageId)
        const uploadedImage = await fetchUploadedStorageImage(storage, extra)
        const metadata = await readImageMetadata(uploadedImage.buffer)
        const imageName = name ?? 'uploaded-image'

        const image = await fetchMutation(
          api.services.addUploadedImage,
          {
            ...mcpAuthArgs(extra),
            storageId: storage,
            alt: alt ?? '',
            width: BigInt(metadata.width),
            height: BigInt(metadata.height),
            blurDataURL: metadata.blurDataURL,
            name: imageName,
            type: uploadedImage.contentType,
            size: BigInt(uploadedImage.buffer.byteLength),
            filter: [imageName, alt ?? '', uploadedImage.contentType]
              .filter(Boolean)
              .join(' ')
              .toLowerCase(),
          },
          convexOptions(extra),
        )

        return textResponse({
          action: 'image_registered',
          version: getToolContext(extra).version,
          image,
          fieldValue: { imageId: image._id },
          nextActions: nextActions({ imageId: image._id }),
        })
      },
    )

    server.registerTool(
      'headcode_list_images',
      {
        title: 'List images',
        description:
          'Lists uploaded images from the Headcode image library. Use filter to search by name, alt text, or MIME type. This is read-only and never publishes content.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        inputSchema: {
          filter: z.string().optional(),
          cursor: z.string().nullable().optional(),
          limit: z.number().int().min(1).max(100).optional(),
        },
      },
      async ({ filter, cursor, limit }, extra) => {
        const page = await fetchQuery(
          api.services.getImages,
          {
            filter,
            paginationOpts: {
              numItems: limit ?? 24,
              cursor: cursor ?? null,
            },
          },
          convexOptions(extra),
        )

        return textResponse({
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
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        inputSchema: {
          imageId: z.string(),
        },
      },
      async ({ imageId }, extra) => {
        const usage = await fetchQuery(
          api.services.getImageUsage,
          { id: toImageId(imageId), ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )

        return textResponse({
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
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          imageId: z.string(),
          name: z.string().optional(),
          alt: z.string().optional(),
        },
      },
      async ({ imageId, name, alt }, extra) => {
        const image = await fetchQuery(
          api.services.getImage,
          { id: toImageId(imageId) },
          convexOptions(extra),
        )
        if (!image) throw new Error('Image not found.')

        await fetchMutation(
          api.services.updateImageMetadata,
          {
            id: image._id,
            ...mcpAuthArgs(extra),
            name: name ?? image.name,
            alt: alt ?? image.alt,
          },
          convexOptions(extra),
        )

        const updatedImage = await fetchQuery(
          api.services.getImage,
          { id: image._id },
          convexOptions(extra),
        )

        return textResponse({
          action: 'image_metadata_updated',
          image: updatedImage,
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
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          imageId: z.string(),
        },
      },
      async ({ imageId }, extra) => {
        const result = await fetchMutation(
          api.services.deleteImage,
          { id: toImageId(imageId), ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )

        return textResponse({
          action: 'image_deleted',
          imageId,
          ...result,
          nextActions: nextActions({}),
        })
      },
    )

    server.registerTool(
      'headcode_update_section',
      {
        title: 'Update section data',
        description:
          'Updates fields on an existing section only. This saves CMS content in the selected live or draft version but does not publish. Do not call headcode_publish after editing unless the user explicitly asks to publish or release the draft. Unknown fields are ignored by Headcode validation; invalid values fall back to configured defaults.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          sectionId: z.string(),
          data: z.record(z.string(), z.unknown()),
        },
      },
      async ({ sectionId, data }, extra) => {
        const section = await fetchQuery(
          api.services.getSection,
          { id: toSectionId(sectionId) },
          convexOptions(extra),
        )
        if (!section) throw new Error('Section not found.')
        await assertEntryMatchesRequestVersion(section.entry, extra)

        const updatedSection = await updateSectionData(
          section,
          mergeSectionData(section, data),
          extra,
        )

        return textResponse({
          action: 'section_updated',
          version: getToolContext(extra).version,
          section: updatedSection,
          nextActions: nextActions({
            entryId: updatedSection?.entry,
            sectionId: updatedSection?._id,
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
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          entryId: z.string(),
          sectionName: z.string(),
          data: z.record(z.string(), z.unknown()).optional(),
          position: z.number().int().optional(),
        },
      },
      async ({ entryId, sectionName, data, position }, extra) => {
        const bundle = await getEntryBundleById(entryId, extra)
        const sectionConfig = getSectionConfig(bundle.entry, sectionName)
        if (!sectionConfig) {
          throw new Error(
            `Section "${sectionName}" is not configured for this entry.`,
          )
        }

        const sectionId = await fetchMutation(
          api.services.addSection,
          {
            name: sectionName,
            pos:
              typeof position === 'number'
                ? BigInt(position)
                : getNextSectionPos(bundle.sections),
            data: JSON.stringify(data ?? {}),
            entry: bundle.entry._id,
            ...mcpAuthArgs(extra),
          },
          convexOptions(extra),
        )

        const section = await fetchQuery(
          api.services.getSection,
          { id: sectionId },
          convexOptions(extra),
        )

        return textResponse({
          action: 'section_added',
          version: getToolContext(extra).version,
          section: section ? serializeSection(section) : null,
          nextActions: nextActions({
            entryId: bundle.entry._id,
            sectionId: section?._id,
          }),
        })
      },
    )

    server.registerTool(
      'headcode_duplicate_section',
      {
        title: 'Duplicate section',
        description:
          'Duplicates an existing section in the selected live or draft version and places the copy after the original. This saves CMS content but does not publish. Do not call headcode_publish unless the user explicitly asks to publish or release the draft.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          sectionId: z.string(),
        },
      },
      async ({ sectionId }, extra) => {
        const section = await fetchQuery(
          api.services.getSection,
          { id: toSectionId(sectionId) },
          convexOptions(extra),
        )
        if (!section) throw new Error('Section not found.')
        await assertEntryMatchesRequestVersion(section.entry, extra)

        const duplicatedId = await fetchMutation(
          api.services.duplicateSection,
          { id: section._id, ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )
        const duplicatedSection = await fetchQuery(
          api.services.getSection,
          { id: duplicatedId },
          convexOptions(extra),
        )

        return textResponse({
          action: 'section_duplicated',
          version: getToolContext(extra).version,
          section: duplicatedSection
            ? serializeSection(duplicatedSection)
            : null,
          nextActions: nextActions({
            entryId: section.entry,
            sectionId: duplicatedSection?._id,
          }),
        })
      },
    )

    server.registerTool(
      'headcode_delete_section',
      {
        title: 'Delete section',
        description:
          'Deletes a section from an entry in the selected live or draft version. This does not publish. Do not call headcode_publish after deleting a section unless the user explicitly asks to publish or release the draft.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          sectionId: z.string(),
        },
      },
      async ({ sectionId }, extra) => {
        const section = await fetchQuery(
          api.services.getSection,
          { id: toSectionId(sectionId) },
          convexOptions(extra),
        )
        if (!section) throw new Error('Section not found.')
        await assertEntryMatchesRequestVersion(section.entry, extra)

        await fetchMutation(
          api.services.deleteSection,
          { id: toSectionId(sectionId), ...mcpAuthArgs(extra) },
          convexOptions(extra),
        )

        return textResponse({
          action: 'section_deleted',
          version: getToolContext(extra).version,
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
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        inputSchema: {
          entryId: z.string(),
          sectionIds: z.array(z.string()),
        },
      },
      async ({ entryId, sectionIds }, extra) => {
        const bundle = await getEntryBundleById(entryId, extra)
        const requestedIds = new Set(sectionIds)
        const currentSectionsById = new Map(
          bundle.sections.map((section) => [section._id, section]),
        )
        const orderedSections = [
          ...sectionIds
            .map((sectionId) => currentSectionsById.get(toSectionId(sectionId)))
            .filter((section): section is ServiceSection => Boolean(section)),
          ...bundle.sections.filter(
            (section) => !requestedIds.has(section._id),
          ),
        ]

        await fetchMutation(
          api.services.reorderSections,
          {
            ...mcpAuthArgs(extra),
            sections: orderedSections.map((section, index) => ({
              id: section._id,
              pos: BigInt((index + 1) * 100),
            })),
          },
          convexOptions(extra),
        )

        const sections = await fetchQuery(
          api.services.getSections,
          { id: toEntryId(entryId) },
          convexOptions(extra),
        )

        return textResponse({
          action: 'sections_reordered',
          version: getToolContext(extra).version,
          sections: normalizeSections(sections).map(serializeSection),
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
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (extra) => {
        await fetchMutation(
          api.services.publish,
          mcpAuthArgs(extra),
          convexOptions(extra),
        )
        const status = await fetchQuery(
          api.services.getVersionStatus,
          {},
          convexOptions(extra),
        )

        return textResponse({ published: true, status })
      },
    )

    server.registerTool(
      'headcode_new_draft',
      {
        title: 'Create draft',
        description:
          'Creates a fresh draft from the current live version when live and draft are shared. This is version management, not normal content editing. Never call it unless the user explicitly asks for a new draft.',
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (extra) => {
        await fetchMutation(
          api.services.newDraft,
          mcpAuthArgs(extra),
          convexOptions(extra),
        )
        const status = await fetchQuery(
          api.services.getVersionStatus,
          {},
          convexOptions(extra),
        )

        return textResponse({ created: true, status })
      },
    )
  },
  {
    serverInfo: {
      name: 'Headcode CMS',
      version: '0.1.0',
    },
    instructions:
      'Headcode CMS tools edit content for the version selected by the request host. Normal editing workflows should only read entries and add, update, delete, or reorder sections. Publishing is a rare release action: never call headcode_publish automatically after edits. Call headcode_publish only when the user explicitly asks to publish, release, promote draft to live, or make the draft public.',
  },
  {
    basePath: '',
    disableSse: true,
    maxDuration: 60,
  },
)

const handler = withMcpAuth(
  mcpHandler,
  async (_request, bearerToken) => {
    if (!isAllowedMcpToken(bearerToken)) return undefined

    return {
      token: bearerToken!,
      clientId: 'headcode-shared-token',
      scopes: ['headcode:mcp'],
    }
  },
  { required: true },
)

export { handler as GET, handler as POST }
