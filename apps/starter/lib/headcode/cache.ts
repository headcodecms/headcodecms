'use server'

import { getEntry } from '@/db'
import { updateTag } from 'next/cache'

/**
 * Invalidates cache tags for an entry.
 * Updates both the entry ID tag and namespace/key tag if entry data is available.
 *
 * @param entryId - The ID of the entry to invalidate
 * @param namespace - Optional namespace (will be fetched if not provided)
 * @param key - Optional key (will be fetched if not provided)
 */
export async function invalidateEntryCache(
  entryId: number,
  namespace?: string,
  key?: string,
): Promise<void> {
  // Always invalidate by entry ID
  updateTag(`/headcode/entries/${entryId}`)

  // If namespace/key not provided, fetch entry to get them
  if (!namespace || !key) {
    const entry = await getEntry(entryId)
    if (entry) {
      updateTag(`/headcode/entries/${entry.namespace}/${entry.key}`)
    }
  } else {
    updateTag(`/headcode/entries/${namespace}/${key}`)
  }
}

/**
 * Invalidates the general entries list cache.
 * Use this when entries are added, deleted, or when the list structure changes.
 */
export async function invalidateEntriesList(): Promise<void> {
  updateTag('/headcode/entries')
}

/**
 * Invalidates cache for a specific entry by namespace and key.
 *
 * @param namespace - The namespace of the entry
 * @param key - The key of the entry
 */
export async function invalidateEntryByNamespaceKey(
  namespace: string,
  key: string,
): Promise<void> {
  updateTag(`/headcode/entries/${namespace}/${key}`)
}

