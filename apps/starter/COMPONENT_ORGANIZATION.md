# Component Organization

This document describes the component organization structure and conventions used in this codebase.

## Component Directories

### `/components/ui/`
**Purpose**: Base UI components following shadcn/ui patterns

These are reusable, framework-agnostic UI components that follow the shadcn/ui design system. They should:
- Be composable and flexible
- Use Tailwind CSS for styling
- Follow accessibility best practices
- Use Radix UI primitives where applicable

**Examples**: `button.tsx`, `input.tsx`, `dialog.tsx`, `field.tsx`

### `/components/headcode/`
**Purpose**: Headcode CMS-specific components

These components are specific to the Headcode CMS functionality and are not meant to be reused outside this context.

#### `/components/headcode/admin/`
Admin interface components (headers, navigation, containers, etc.)

#### `/components/headcode/form/`
Form field components and form utilities specific to Headcode CMS

#### `/components/headcode/themes/`
Theme-specific components (e.g., Vienna theme components)

### `/components/kibo-ui/`
**Purpose**: Third-party UI components

Components from external UI libraries (e.g., Kibo UI). These are kept separate to maintain clear boundaries and make it easy to identify external dependencies.

## File Naming Conventions

- **Components**: Use kebab-case for file names (e.g., `text-field-component.tsx`)
- **Utilities**: Use kebab-case for file names (e.g., `use-stable-ids.ts`)
- **Types**: Use kebab-case for file names (e.g., `types.ts`)
- **Actions**: Use `actions.ts` for server actions in route directories

## Component Patterns

### Server Components (Default)
- Use async/await for data fetching
- Use `'use cache'` directive for cacheable components
- Call `cacheTag()` immediately after `'use cache'` directive

### Client Components
- Mark with `'use client'` directive
- Use for interactive components, forms, and components using hooks

### Server Actions
- Place in `actions.ts` files within route directories
- Use `'use server'` directive
- Return `{ success?, error? }` pattern for consistent error handling
- Use cache invalidation helpers from `@/lib/headcode/cache`

## When to Use Which Component Library

1. **Use `/components/ui/`** for:
   - Basic UI primitives (buttons, inputs, dialogs)
   - Layout components
   - Components that should be reusable across different contexts

2. **Use `/components/headcode/`** for:
   - CMS-specific functionality
   - Admin interface components
   - Form fields specific to Headcode CMS

3. **Use `/components/kibo-ui/`** for:
   - Third-party components that don't fit the shadcn/ui pattern
   - Components from external libraries

## Best Practices

1. **Keep components focused**: Each component should have a single responsibility
2. **Extract complex logic**: Use custom hooks or utility functions for complex logic
3. **Use TypeScript**: All components should be properly typed
4. **Follow Next.js 16 patterns**: Use Server Components by default, Client Components when needed
5. **Cache management**: Use the cache helper functions from `@/lib/headcode/cache` for consistency
6. **Error handling**: Use custom error classes from `@/lib/headcode/errors`

