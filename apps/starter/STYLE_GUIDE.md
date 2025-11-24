# Style Guide

This document outlines coding style and best practices for this codebase.

## TypeScript

### Type Safety
- Avoid `as` type assertions - use type guards or proper typing instead
- Use `satisfies` for type checking without widening types
- Prefer explicit return types for functions
- Use custom error classes instead of generic `Error` when possible

### Generics
- Use descriptive generic parameter names
- Avoid `unknown` when more specific types are available
- Document complex generic types with JSDoc comments

## React

### Component Structure
1. Imports (external libraries first, then internal)
2. Type definitions
3. Component function
4. Exports

### Hooks
- Extract complex hook logic to custom hooks
- Keep hooks focused on a single concern
- Document hook behavior with JSDoc comments

### State Management
- Use `useState` for local component state
- Use `useRef` for values that don't trigger re-renders
- Extract complex state logic to custom hooks

## Next.js 16 Patterns

### Cache Components
- Always call `cacheTag()` immediately after `'use cache'` directive
- Await params in parent components, pass values as props to cached components
- Use cache invalidation helpers from `@/lib/headcode/cache`

### Server Actions
- Place in `actions.ts` files
- Use `'use server'` directive
- Return `{ success?, error? }` pattern
- Use custom error classes for errors

### Error Handling
- Use custom error classes: `NotFoundError`, `UnauthorizedError`, `DatabaseError`, `ConfigurationError`
- Use `getErrorCode()` helper for error detection in UI components
- Standardize error messages

## Code Organization

### File Size
- Keep files under 300 lines when possible
- Extract complex components to separate files
- Extract utility functions to separate files

### Naming
- Use descriptive names that indicate purpose
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use kebab-case for file names

### Comments
- Use JSDoc for function documentation
- Add comments for complex logic
- Avoid obvious comments that just repeat the code

## Form Patterns

### Field Components
- Extract field components to separate files
- Use consistent prop patterns
- Extract complex form logic (e.g., stable IDs) to utilities

### Default Values
- Never use hardcoded magic values
- Derive default values from field configuration
- Use `getDefaultArrayValue()` helper for array fields

## Cache Management

### Cache Tags
- Use consistent naming: `/headcode/entries/${entryId}` or `/headcode/entries/${namespace}/${key}`
- Use helper functions: `invalidateEntryCache()`, `invalidateEntriesList()`
- Document cache tag strategy

## Error Handling

### Server Actions
```typescript
try {
  // operation
  return { success: true }
} catch (error) {
  console.error('Error description', error)
  return { error: 'User-friendly error message' }
}
```

### Throwing Errors
```typescript
// Use custom error classes
throw new NotFoundError('Entry', entryId)
throw new UnauthorizedError()
throw new ConfigurationError('Error message')
```

### Error Display
```typescript
// Use error code helpers
const errorCode = getErrorCode(error)
if (errorCode === 'NOT_FOUND') {
  // handle not found
}
```

## Code Review Checklist

- [ ] No unsafe type assertions (`as`)
- [ ] Proper error handling with custom error classes
- [ ] Cache tags called immediately after `'use cache'`
- [ ] No magic values
- [ ] Complex logic extracted to utilities/hooks
- [ ] Components properly typed
- [ ] No unused imports
- [ ] Consistent naming conventions
- [ ] JSDoc comments for complex functions

