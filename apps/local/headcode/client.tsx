'use client'

import * as React from 'react'

import {
  type FunctionArgs,
  type FunctionReturnType,
  type ServiceRef,
  toJson,
} from './api'
import { HeadcodeError } from './authorization'

export { api } from './api'
export { Authenticated, AuthLoading, Unauthenticated } from './auth-client'

// Admin data hooks in the style of convex/react, backed by POST
// /admin/services (app/(admin)/admin/services/route.ts). After every
// mutation all mounted queries refetch.

const invalidated = new EventTarget()

const callService = async (name: string, args: unknown) => {
  const response = await fetch('/admin/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: toJson({ name, args }),
  })
  const body = (await response.json().catch(() => ({}))) as {
    result?: unknown
    error?: string
    data?: string
  }
  if (!response.ok) {
    if (body.data) throw new HeadcodeError(body.data)
    throw new Error(body.error ?? `Request failed (${response.status}).`)
  }
  return body.result
}

export const useQuery = <R extends ServiceRef>(
  ref: R,
  args: FunctionArgs<R> | 'skip',
): FunctionReturnType<R> | undefined => {
  const key = args === 'skip' ? null : toJson([ref.name, args])
  const [state, setState] = React.useState<{ key: string; value: unknown }>()

  React.useEffect(() => {
    if (!key) return
    let active = true
    const load = () => {
      const [name, input] = JSON.parse(key) as [string, unknown]
      callService(name, input)
        .then((value) => active && setState({ key, value }))
        .catch((error) => console.error(`[headcode] ${name}`, error))
    }
    load()
    invalidated.addEventListener('invalidate', load)
    return () => {
      active = false
      invalidated.removeEventListener('invalidate', load)
    }
  }, [key])

  return (state && state.key === key ? state.value : undefined) as
    FunctionReturnType<R> | undefined
}

export const useMutation =
  <R extends ServiceRef>(ref: R) =>
  async (args: FunctionArgs<R>) => {
    const result = await callService(ref.name, args)
    invalidated.dispatchEvent(new Event('invalidate'))
    return result as FunctionReturnType<R>
  }

type Page<T> = { page: T[]; isDone: boolean; continueCursor: string }
type PaginatedStatus =
  'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted'

export const usePaginatedQuery = <R extends ServiceRef>(
  ref: R,
  args: Omit<FunctionArgs<R>, 'paginationOpts'> | 'skip',
  { initialNumItems }: { initialNumItems: number },
) => {
  type Item = FunctionReturnType<R> extends Page<infer T> ? T : never
  const key = args === 'skip' ? null : toJson([ref.name, args])
  // Extra items requested with loadMore, reset when the arguments change.
  const [more, setMore] = React.useState({ key, count: 0 })
  const numItems = initialNumItems + (more.key === key ? more.count : 0)
  const [state, setState] = React.useState<{
    key: string
    numItems: number
    page: Page<Item>
  }>()

  React.useEffect(() => {
    if (!key) return
    let active = true
    const load = () => {
      const [name, input] = JSON.parse(key) as [string, object]
      callService(name, {
        ...input,
        paginationOpts: { numItems, cursor: null },
      })
        .then(
          (page) =>
            active && setState({ key, numItems, page: page as Page<Item> }),
        )
        .catch((error) => console.error(`[headcode] ${name}`, error))
    }
    load()
    invalidated.addEventListener('invalidate', load)
    return () => {
      active = false
      invalidated.removeEventListener('invalidate', load)
    }
  }, [key, numItems])

  const current = state && state.key === key ? state : undefined
  const status: PaginatedStatus = !current
    ? 'LoadingFirstPage'
    : current.numItems !== numItems
      ? 'LoadingMore'
      : current.page.isDone
        ? 'Exhausted'
        : 'CanLoadMore'

  return {
    results: current?.page.page ?? [],
    status,
    isLoading: status === 'LoadingFirstPage' || status === 'LoadingMore',
    loadMore: (count: number) =>
      setMore((value) => ({
        key,
        count: (value.key === key ? value.count : 0) + count,
      })),
  }
}
