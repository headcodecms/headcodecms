# Service Layer Implementation Plan

## Goal

Implement the first stable Headcode CMS core service layer in Convex, with section data validated from `headcodeConfig` before storage and again before service responses return data.

Keep the first pass small: wire the existing skeleton, do not add dependencies, do not add application source files, and keep all clients behind `convex/services.ts`.

## Context Read

- `AGENTS.md`: service boundary lives in `convex/services.ts`; clients must not call `convex/db/*` directly.
- `ARCHITECTURE.md`: entries are globals or collections; sections are ordered blocks; draft/live versions drive reads and publishing.
- `convex/_generated/ai/guidelines.md`: Convex functions need validators, typed contexts, indexes instead of filters where practical, and bounded reads.
- `/Users/markus.tripp/Documents/next/test-ui/app/(admin)`: admin expects entry lists, collection/global filtering, entry editing, section editing, and version actions.
- `/Users/markus.tripp/Documents/next/test-ui/app/(site)`: site expects typed section data for meta, hero, logos, image-text, image, text, plans, snippet, code, and blog-meta sections.

## Success Criteria

- `addSection` and `updateSection` store `sections.data` as a JSON string that conforms to the configured section fields.
- `getSection`, `getSections`, `getGlobalSections`, and `getCollectionSections` return validated section data, not unchecked raw JSON strings.
- Unknown section names, malformed JSON, invalid field values, invalid array item shapes, missing fields, and extra fields have deterministic behavior covered by tests.
- Version creation, draft/live lookup, globals, collections, and default sections work enough for the admin and site prototypes to read stable data.
- `pnpm test:once` passes for the focused service tests.
- `pnpm lint` passes after TypeScript/Convex changes.

## Implementation Steps

1. Fix the shared Convex table and argument contracts.
   - Reuse one `sectionArgs` validator object or equivalent in `convex/services.ts` so `addSection` and `updateSection` stay aligned with `convex/schema.ts`.
   - Use `v.id('versions')`, not `v.id('version')`, for entry versions.
   - Fix `modifcationTime` to `modificationTime` everywhere.
   - Return inserted IDs from mutations that create entries, sections, images, or versions.

2. Implement section validation in `convex/section_validations.ts`.
   - Import `headcodeConfig` or the exported `sections` registry from `headcode/sections.ts`.
   - Build the section definition lookup from configured globals and collections so only configured sections are accepted.
   - Parse `section.data` from JSON when it is a string; accept object data only inside local validation helpers if it simplifies mutation flow.
   - Validate each field with its Zod validator.
   - Support nested array field definitions such as `navigation`, `items`, `plans.features`, `snippet.tabs`, and `code.files`.
   - Apply defaults for missing fields where the field validator defines a default.
   - Strip unknown keys by returning only configured fields.
   - When an attribute is not available in the section config, skip it.
   - When field validation fails, log the validation issue and return the configured field or section default instead of rejecting the whole section.
   - Throw a useful error only for failures that prevent field-level recovery, such as unknown section names or malformed top-level JSON.
   - Return the same section shape as the DB document, but with `data` serialized back to a JSON string for storage helpers or parsed object data for service responses. Pick one explicit helper per direction to avoid accidental double serialization.

3. Wire validation into section writes.
   - In `addDBSection`, validate `{ name, pos, data, entry }` before `ctx.db.insert`.
   - Store the validated data as `JSON.stringify(validatedData)`.
   - In `updateSection`, validate before `ctx.db.replace`.
   - Keep `reorderSections` limited to `pos` patching and leave data untouched.

4. Wire validation into section reads.
   - `getSection` should return `null` for missing sections.
   - Existing sections with invalid stored field data should log the issue and return configured defaults instead of silently returning corrupt content.
   - `getDBSections` should order by `pos` after reading by `entry`.
   - Service responses should include parsed, typed `data` objects for site/admin consumers.

5. Implement the minimal version helpers in `convex/db/versions.ts`.
   - `getCurrentVersion(ctx, live)` should find exactly one live or draft version.
   - On empty install, create one version with `live: true`, `draft: true`, `prepare: false`.
   - Throw if multiple current live/draft versions exist.
   - `newDBDraft(ctx)` should create a prepare version, copy live entries and sections, then mark it as the only draft.
   - Keep publishing minimal: move `live` to the current draft, then call the draft creation flow.

6. Implement the minimal entry helpers in `convex/db/entries.ts`.
   - Replace current filter-heavy global/collection lookups with simple indexed reads where possible.
   - Validate slugs against `headcodeConfig.globals` and `headcodeConfig.collections`.
   - `getDBGlobals` should ensure configured globals exist for the current version, adding missing globals from defaults.
   - `addDBGlobal` should create the entry and its configured default sections.
   - `addCollection` should create an entry for a configured collection slug and seed configured defaults if that is the intended first-step behavior.
   - Keep collection names unique per `{ slug, name, version }`.

7. Keep image services minimal.
   - Fill the `addImage` validator with the fields from `convex/schema.ts`.
   - Implement `getImages` with a bounded `.take()` result.
   - If filter search needs substring matching, defer it or document the limitation; Convex indexed equality is preferable for the first stable layer.

8. Add focused tests in `convex/services.test.ts`.
   - Initial install creates a current draft/live version.
   - Globals are created from config defaults and returned with valid default sections.
   - Adding a valid `hero` section stores JSON and returns parsed validated data.
   - Missing optional/defaulted fields are filled.
   - Extra fields are stripped.
   - Invalid select values log and fall back, for example unknown `eyebrowIcon`.
   - Wrong scalar types log and fall back, for example `title: 123`.
   - Malformed JSON fails.
   - Unknown section names fail.
   - Nested arrays validate correctly for `header.navigation`, `plans.plans[].features`, `snippet.tabs`, and `code.files`.
   - Updating a section revalidates and preserves only configured fields.
   - Reading corrupt stored field values logs and falls back to defaults.
   - Reordering sections changes order without changing data.
   - Collection entry creation rejects unknown collection slugs and duplicate names for the same version.

9. Add lightweight TypeScript inference in `headcode/types.ts`.
   - Use Convex generated types for DB documents: `Doc<'entries'>`, `Doc<'sections'>`, and `Id<'entries'>`.
   - Infer section field data from Zod validators where practical with `z.infer`.
   - Keep this simple in the first pass: expose reusable service response types, for example `HeadcodeEntry`, `HeadcodeSection<TData = unknown>`, and `HeadcodeData`.
   - Avoid trying to generate a perfect discriminated union for every configured section until the service behavior is stable.

10. Verify.
    - Run `pnpm test:once`.
    - Run `pnpm lint`.
    - Do not run the dev server; verify against `https://headcode.localhost` only after UI-facing changes.

## Suggested Order

1. Section validation helpers and tests first.
2. Section write/read services.
3. Version helpers.
4. Entry/default seeding helpers.
5. Image helper cleanup.
6. Type exports.
7. Final test/lint pass.

## Defined Decisions

- Service read shape: return parsed `data` objects to consumers, while DB stores JSON strings. This is the most ergonomic shape for admin/site code, but it should be explicit in the service tests.
- Invalid existing DB field values: log validation issues and return configured defaults on reads. This keeps the site renderable while making data problems visible during development and testing.
- Unknown keys: strip them. This keeps stored content aligned with the config and avoids accidental persistence of stale admin fields.
