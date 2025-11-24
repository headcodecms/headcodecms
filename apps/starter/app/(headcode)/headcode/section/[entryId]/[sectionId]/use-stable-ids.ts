/**
 * Manages stable IDs for array items using refs.
 * This ensures that array items maintain consistent IDs even when items are reordered or removed,
 * which is important for React key stability and sortable component functionality.
 */
export interface StableIdsState {
  stableIds: Map<number, string>
  nextId: number
  lastLength: number
}

/**
 * Creates initial state for stable IDs management.
 */
export function createStableIdsState(): StableIdsState {
  return {
    stableIds: new Map<number, string>(),
    nextId: 0,
    lastLength: 0,
  }
}

/**
 * Updates stable IDs based on the current array length.
 * Removes IDs for indices beyond the current length and adds new IDs for new indices.
 *
 * @param state - The stable IDs state object
 * @param currentLength - The current length of the array
 */
export function updateStableIds(
  state: StableIdsState,
  currentLength: number,
): void {
  const { stableIds } = state

  // Remove IDs for indices beyond the current length
  if (stableIds.size > currentLength) {
    const keysToRemove: number[] = []
    stableIds.forEach((_, key) => {
      if (key >= currentLength) {
        keysToRemove.push(key)
      }
    })
    keysToRemove.forEach((key) => stableIds.delete(key))
  }

  // Add new IDs for new indices
  for (let i = 0; i < currentLength; i++) {
    if (!stableIds.has(i)) {
      stableIds.set(i, `item-${state.nextId++}`)
    }
  }

  state.lastLength = currentLength
}

/**
 * Reorders stable IDs after array items are sorted.
 *
 * @param stableIds - The current map of indices to stable IDs
 * @param reorderedItems - The new order of items with their stable IDs
 * @returns A new map with reordered stable IDs
 */
export function reorderStableIds(
  stableIds: Map<number, string>,
  reorderedItems: Array<{ id: string }>,
): Map<number, string> {
  const newStableIds = new Map<number, string>()
  reorderedItems.forEach((item, newIndex) => {
    newStableIds.set(newIndex, item.id)
  })
  return newStableIds
}

