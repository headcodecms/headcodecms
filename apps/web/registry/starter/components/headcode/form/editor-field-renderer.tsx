import { cn } from '@/lib/utils'
import { JSONContent } from '@tiptap/core'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Typography from '@tiptap/extension-typography'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { renderToReactElement } from '@tiptap/static-renderer'

export type { Editor, JSONContent } from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit'
import { createLowlight } from 'lowlight'
import { TextStyleKit } from '@tiptap/extension-text-style'

const defaultExtensions = [
  StarterKit.configure({
    codeBlock: false,
    bulletList: {
      HTMLAttributes: {
        class: cn('list-outside list-disc pl-4'),
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: cn('list-outside list-decimal pl-4'),
      },
    },
    listItem: {
      HTMLAttributes: {
        class: cn('leading-normal'),
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: cn('border-l border-l-2 pl-2'),
      },
    },
    code: {
      HTMLAttributes: {
        class: cn('rounded-md bg-muted px-1.5 py-1 font-medium font-mono'),
        spellCheck: 'false',
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: cn('mt-4 mb-6 border-muted-foreground border-t'),
      },
    },
    dropcursor: {
      color: 'var(--border)',
      width: 4,
    },
  }),
  Typography,
  Placeholder.configure({
    placeholder: 'Start typing...',
    emptyEditorClass:
      'before:text-muted-foreground before:content-[attr(data-placeholder)] before:float-left before:h-0 before:pointer-events-none',
  }),
  CharacterCount.configure({
    limit: 1000,
  }),
  CodeBlockLowlight.configure({
    lowlight: createLowlight(),
    HTMLAttributes: {
      class: cn(
        'rounded-md border p-4 text-sm',
        'bg-background text-foreground',
        '[&_.hljs-doctag]:text-[#d73a49] [&_.hljs-keyword]:text-[#d73a49] [&_.hljs-meta_.hljs-keyword]:text-[#d73a49] [&_.hljs-template-tag]:text-[#d73a49] [&_.hljs-template-variable]:text-[#d73a49] [&_.hljs-type]:text-[#d73a49] [&_.hljs-variable.language_]:text-[#d73a49]',
        '[&_.hljs-title.class_.inherited__]:text-[#6f42c1] [&_.hljs-title.class_]:text-[#6f42c1] [&_.hljs-title.function_]:text-[#6f42c1] [&_.hljs-title]:text-[#6f42c1]',
        '[&_.hljs-attr]:text-[#005cc5] [&_.hljs-attribute]:text-[#005cc5] [&_.hljs-literal]:text-[#005cc5] [&_.hljs-meta]:text-[#005cc5] [&_.hljs-number]:text-[#005cc5] [&_.hljs-operator]:text-[#005cc5] [&_.hljs-selector-attr]:text-[#005cc5] [&_.hljs-selector-class]:text-[#005cc5] [&_.hljs-selector-id]:text-[#005cc5] [&_.hljs-variable]:text-[#005cc5]',
        '[&_.hljs-meta_.hljs-string]:text-[#032f62] [&_.hljs-regexp]:text-[#032f62] [&_.hljs-string]:text-[#032f62]',
        '[&_.hljs-built_in]:text-[#e36209] [&_.hljs-symbol]:text-[#e36209]',
        '[&_.hljs-code]:text-[#6a737d] [&_.hljs-comment]:text-[#6a737d] [&_.hljs-formula]:text-[#6a737d]',
        '[&_.hljs-name]:text-[#22863a] [&_.hljs-quote]:text-[#22863a] [&_.hljs-selector-pseudo]:text-[#22863a] [&_.hljs-selector-tag]:text-[#22863a]',
        '[&_.hljs-subst]:text-[#24292e]',
        '[&_.hljs-section]:font-bold [&_.hljs-section]:text-[#005cc5]',
        '[&_.hljs-bullet]:text-[#735c0f]',
        '[&_.hljs-emphasis]:text-[#24292e] [&_.hljs-emphasis]:italic',
        '[&_.hljs-strong]:font-bold [&_.hljs-strong]:text-[#24292e]',
        '[&_.hljs-addition]:bg-[#f0fff4] [&_.hljs-addition]:text-[#22863a]',
        '[&_.hljs-deletion]:bg-[#ffeef0] [&_.hljs-deletion]:text-[#b31d28]',
      ),
    },
  }),
  Superscript,
  Subscript,
  TextStyleKit,
]

export function render(content: JSONContent) {
  try {
    return renderToReactElement({
      content,
      extensions: defaultExtensions,
    })
  } catch (error) {
    console.error('Error rendering content', error)
    return <div>Error rendering content {(error as Error).message}</div>
  }
}
