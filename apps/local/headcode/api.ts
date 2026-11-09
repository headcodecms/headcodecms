import type { ServiceName, Services } from './services'

// Convex-style function references: `api.services.getAll` is just its name,
// so client code can reference services without importing server code.
export type ServiceRef<K extends ServiceName = ServiceName> = {
  readonly name: K
  readonly kind?: Services[K]['kind']
}

export type FunctionArgs<R> =
  R extends ServiceRef<infer K>
    ? Parameters<Services[K]['handler']>[1] & { mcpToken?: string }
    : never
export type FunctionReturnType<R> =
  R extends ServiceRef<infer K>
    ? Awaited<ReturnType<Services[K]['handler']>>
    : never

export const api = {
  services: new Proxy({} as Record<string, ServiceRef>, {
    get: (_, name) => ({ name: String(name) }),
  }),
} as unknown as { services: { [K in ServiceName]: ServiceRef<K> } }

export const getFunctionName = (ref: ServiceRef) => ref.name
export const makeFunctionReference = <K extends ServiceName>(name: K) =>
  ({ name }) as ServiceRef<K>

// BigInt values (positions, sizes) travel as numbers.
export const toJson = (value: unknown) =>
  JSON.stringify(value, (_, item) =>
    typeof item === 'bigint' ? Number(item) : item,
  )
