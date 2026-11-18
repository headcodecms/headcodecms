'use client'

import * as React from 'react'

// The admin's data: the backend's MCP tools through POST /admin/api
// (app/(admin)/admin/api/route.ts). After every mutation all mounted queries
// refetch.

export type Section = { id?: string; name: string; data: unknown }

export type Entry = {
  slug: string
  sections: Section[]
  updated_at: string
  updated_by: string
}

export type EntrySummary = Omit<Entry, 'sections'>

export type Change = {
  slug: string
  status: 'new' | 'deleted' | 'changed' | 'live_newer'
  draft_updated_at: string | null
  live_updated_at: string | null
}

export type Snapshot = {
  id: number
  reason: 'publish' | 'rollback'
  created_at: string
  created_by: string
  entries: number
}

const invalidated = new EventTarget()

export const call = async <T>(name: string, args: object = {}) => {
  const res = await fetch('/admin/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, args }),
  })
  const body = (await res.json().catch(() => ({}))) as {
    result?: T
    error?: string
  }
  if (res.status === 401) {
    const login = new URL('/admin/login', window.location.origin)
    login.searchParams.set('returnTo', window.location.pathname)
    window.location.assign(login)
  }
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status}).`)
  return body.result as T
}

export const mutate = async <T>(name: string, args: object = {}) => {
  const result = await call<T>(name, args)
  invalidated.dispatchEvent(new Event('invalidate'))
  return result
}

export const useQuery = <T>(name: string, args: object = {}) => {
  const key = JSON.stringify([name, args])
  const [state, setState] = React.useState<{
    key: string
    data?: T
    error?: string
  }>()

  React.useEffect(() => {
    let active = true
    const load = () => {
      const [name, args] = JSON.parse(key) as [string, object]
      call<T>(name, args)
        .then((data) => active && setState({ key, data }))
        .catch(
          (error: Error) => active && setState({ key, error: error.message }),
        )
    }
    load()
    invalidated.addEventListener('invalidate', load)
    return () => {
      active = false
      invalidated.removeEventListener('invalidate', load)
    }
  }, [key])

  const current = state?.key === key ? state : undefined
  return {
    data: current?.data,
    error: current?.error,
    // Shows a mutation's result before the refetch.
    set: (data: T) => setState({ key, data }),
  }
}
