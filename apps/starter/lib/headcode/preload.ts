import type { Fields, FieldProps } from './types'

/**
 * Type guard to check if a component is a React lazy component
 * Works with any component type
 */
export const isLazyComponent = (
  component: unknown,
): component is React.LazyExoticComponent<React.ComponentType<unknown>> => {
  return (
    component !== null &&
    component !== undefined &&
    typeof component === 'object' &&
    '_payload' in component &&
    typeof (component as { _payload?: unknown })._payload === 'object'
  )
}

/**
 * Preloads a lazy component by accessing its internal promise
 * Works with any lazy component type
 */
export const preloadLazyComponent = (
  component: React.LazyExoticComponent<React.ComponentType<unknown>>,
): void => {
  try {
    // Access the internal payload structure of React lazy components
    const lazyComponent = component as {
      _payload?: {
        _result?: Promise<{ default: React.ComponentType<unknown> }>
        _status?: number
      }
    }

    const payload = lazyComponent._payload
    if (!payload) return

    // Check if component is already loaded
    if (payload._status === 1) return // Already resolved

    // Get the promise that loads the component
    const promise = payload._result
    if (promise && typeof promise === 'object' && 'then' in promise) {
      // Preload by actually triggering the promise
      // This will start loading the component module
      promise
        .then(() => {
          // Component loaded successfully
        })
        .catch(() => {
          // Ignore errors during preload - component will handle errors when actually rendered
        })
    }
  } catch {
    // Ignore errors - component will load when actually rendered
  }
}

/**
 * Preloads lazy components from a ChildFields object
 * Returns a promise that resolves when all components are loaded
 * Uses a hidden render to actually trigger React's lazy loading mechanism
 */
export const preloadChildFieldComponents = async (
  childFields: Record<string, FieldProps<unknown, unknown>>,
): Promise<void> => {
  // Create a temporary container to render components
  // This actually triggers the import by rendering them in Suspense
  const preloadPromises: Promise<unknown>[] = []

  Object.values(childFields).forEach((childField) => {
    if (childField && childField.component) {
      if (isLazyComponent(childField.component)) {
        const lazyComponent = childField.component as {
          _payload?: {
            _result?: Promise<{ default: React.ComponentType<unknown> }>
            _status?: number
          }
        }

        const payload = lazyComponent._payload
        if (!payload) return

        // Check if already loaded
        if (payload._status === 1) return

        // Get the import promise and actually await it
        const promise = payload._result
        if (promise && typeof promise === 'object' && 'then' in promise) {
          // Actually await the promise to trigger the chunk load
          preloadPromises.push(
            promise.then((module) => {
              // Ensure the module is fully loaded
              return module
            }),
          )
        }
      }
    }
  })

  // Wait for all components to load
  if (preloadPromises.length > 0) {
    await Promise.allSettled(preloadPromises)
  }
}

/**
 * Preloads lazy components from fields recursively
 * This ensures all field components are loaded before they're needed
 */
export const preloadFieldComponents = (fields: Fields): void => {
  Object.values(fields).forEach((field) => {
    // Handle regular FieldProps
    if ('component' in field && field.component) {
      // Try to preload if it's a lazy component
      if (isLazyComponent(field.component)) {
        preloadLazyComponent(field.component)
      }
    }

    // Handle ChildFields (nested fields in arrays)
    if ('fields' in field && field.fields) {
      const childFields: Record<
        string,
        FieldProps<unknown, unknown>
      > = field.fields
      // Preload all child field components (fire and forget)
      preloadChildFieldComponents(childFields).catch(() => {
        // Ignore errors - components will load when rendered
      })
    }
  })
}


