'use client'

import { useRouter } from 'next/navigation'
import { useRef, useCallback, useEffect, RefCallback, Ref } from 'react'

type PossibleRef<T> = Ref<T> | undefined

function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === 'function') {
    return ref(value)
  }

  if (ref !== null && ref !== undefined) {
    ref.current = value
  }
}

function composeRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  return (node) => {
    let hasCleanup = false
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node)
      if (!hasCleanup && typeof cleanup === 'function') {
        hasCleanup = true
      }
      return cleanup
    })

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i]
          if (typeof cleanup === 'function') {
            cleanup()
          } else {
            setRef(refs[i], null)
          }
        }
      }
    }
  }
}

function useComposedRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to memoize by all values
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refs is a rest parameter array, not a literal, but this is intentional
  return useCallback((node) => composeRefs(...refs)(node), refs)
}

function useDialogRedirect(open: boolean) {
  const router = useRouter()
  const redirectPathRef = useRef<string | null>(null)

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && redirectPathRef.current) {
        const path = redirectPathRef.current
        redirectPathRef.current = null
        router.push(path)
      }
    },
    [router],
  )

  useEffect(() => {
    if (!open && redirectPathRef.current) {
      const path = redirectPathRef.current
      redirectPathRef.current = null
      router.push(path)
    }
  }, [open, router])

  return { redirectPathRef, handleOpenChange }
}

export { composeRefs, useComposedRefs, useDialogRedirect }
