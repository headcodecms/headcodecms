/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authorization from "../authorization.js";
import type * as db_entries from "../db/entries.js";
import type * as db_sections from "../db/sections.js";
import type * as db_versions from "../db/versions.js";
import type * as http from "../http.js";
import type * as schema_validators from "../schema_validators.js";
import type * as section_validations from "../section_validations.js";
import type * as services from "../services.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authorization: typeof authorization;
  "db/entries": typeof db_entries;
  "db/sections": typeof db_sections;
  "db/versions": typeof db_versions;
  http: typeof http;
  schema_validators: typeof schema_validators;
  section_validations: typeof section_validations;
  services: typeof services;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
